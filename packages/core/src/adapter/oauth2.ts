import { MissingParameterError, UnknownStateError } from "../error.js";
import { Adapter } from "./adapter.js";

export interface Oauth2Config {
  clientID: string;
  clientSecret: string;
  endpoint: {
    authorization: string;
    token: string;
  };
  scopes: string[];
  query?: Record<string, string>;
}

export type Oauth2WrappedConfig = Omit<Oauth2Config, "endpoint">;

export interface Oauth2Token {
  access: string;
  refresh: string;
  expiry: number;
  raw: Record<string, any>;
}

interface AdapterState {
  state: string;
}

export function Oauth2Adapter(config: Oauth2Config) {
  const query = config.query || {};
  return function (routes, ctx) {
    routes.get("/authorize", async (c) => {
      const redirect = new URL(c.req.url);
      redirect.pathname = redirect.pathname.replace(/authorize.*$/, "callback");
      redirect.search = "";
      redirect.host = c.req.header("x-forwarded-host") || redirect.host;

      const state = crypto.randomUUID();
      await ctx.set(c, "adapter", 60 * 10, {
        state,
      });

      const authorization = new URL(config.endpoint.authorization);
      authorization.searchParams.set("client_id", config.clientID);
      authorization.searchParams.set("redirect_uri", redirect.toString());
      authorization.searchParams.set("response_type", "code");
      authorization.searchParams.set("state", state);
      authorization.searchParams.set("scope", config.scopes.join(" "));
      for (const [key, value] of Object.entries(query)) {
        authorization.searchParams.set(key, value);
      }

      return c.redirect(authorization.toString());
    });

    routes.get("/callback", async (c) => {
      const adapter = (await ctx.get(c, "adapter")) as AdapterState;
      if (!adapter) throw new UnknownStateError();
      const code = c.req.query("code");
      const state = c.req.query("state");
      if (!code) throw new MissingParameterError("code");
      if (state !== adapter.state) throw new UnknownStateError();
      const redirect = new URL(c.req.url);
      redirect.search = "";
      const body = new URLSearchParams({
        client_id: config.clientID,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect.toString(),
      });
      const response = await fetch(config.endpoint.token, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json: any = await response.json();
      return ctx.success(c, {
        clientID: config.clientID,
        tokenset: {
          get access() {
            return json.access_token;
          },
          get refresh() {
            return json.refresh_token;
          },
          get expiry() {
            return json.expires_in;
          },
          get raw() {
            return json;
          },
        },
      });
    });
  } satisfies Adapter<{ tokenset: Oauth2Token; clientID: string }>;
}
