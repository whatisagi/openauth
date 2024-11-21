import { createLocalJWKSet, JSONWebKeySet, jwtVerify } from "jose";
import { WellKnown } from "../client.js";
import { MissingParameterError, UnknownStateError } from "../error.js";
import { Adapter } from "./adapter.js";
import { JWTPayload } from "hono/utils/jwt/types";

export interface OidcConfig {
  clientID: string;
  issuer: string;
  scopes?: string[];
  query?: Record<string, string>;
}

export type OidcWrappedConfig = Omit<OidcConfig, "issuer">;

interface AdapterState {
  state: string;
  nonce: string;
  redirect: string;
}

export interface IdTokenResponse {
  idToken: string;
  claims: Record<string, any>;
  raw: Record<string, any>;
}

export function OidcAdapter(config: OidcConfig) {
  const query = config.query || {};
  const scopes = config.scopes || [];

  const wk = fetch(config.issuer + "/.well-known/openid-configuration").then(
    async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<WellKnown>;
    },
  );

  const jwks = wk
    .then((r) => r.jwks_uri)
    .then(async (uri) => {
      const r = await fetch(uri);
      if (!r.ok) throw new Error(await r.text());
      return createLocalJWKSet((await r.json()) as JSONWebKeySet);
    });

  return function (routes, ctx) {
    routes.get("/authorize", async (c) => {
      const redirect = new URL(c.req.url);
      redirect.pathname = redirect.pathname.replace(/authorize.*$/, "callback");
      redirect.search = "";
      redirect.host = c.req.header("x-forwarded-host") || redirect.host;

      const adapter: AdapterState = {
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
        redirect: redirect.toString(),
      };
      await ctx.set(c, "adapter", 60 * 10, adapter);

      const authorization = new URL(
        await wk.then((r) => r.authorization_endpoint),
      );
      authorization.searchParams.set("client_id", config.clientID);
      authorization.searchParams.set("response_type", "id_token");
      authorization.searchParams.set("response_mode", "form_post");
      authorization.searchParams.set("state", adapter.state);
      authorization.searchParams.set("nonce", adapter.nonce);
      authorization.searchParams.set("redirect_uri", adapter.redirect);
      authorization.searchParams.set("scope", ["openid", ...scopes].join(" "));
      for (const [key, value] of Object.entries(query)) {
        authorization.searchParams.set(key, value);
      }
      return c.redirect(authorization.toString());
    });

    routes.post("/callback", async (c) => {
      const adapter = (await ctx.get(c, "adapter")) as AdapterState;
      if (!adapter) throw new UnknownStateError();
      const body = await c.req.formData();
      const idToken = body.get("id_token");
      if (!idToken) throw new MissingParameterError("id_token");
      const result = await jwtVerify(idToken.toString(), await jwks, {
        audience: config.clientID,
      });
      if (result.payload.nonce !== adapter.nonce) {
        throw new Error("Invalid nonce");
      }
      return ctx.success(c, {
        id: result.payload,
        clientID: config.clientID,
      });
    });
  } satisfies Adapter<{ id: JWTPayload; clientID: string }>;
}
