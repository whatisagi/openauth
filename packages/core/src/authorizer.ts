import { Adapter, AdapterOptions } from "./adapter/adapter.js";
import * as jose from "jose";
import { SessionBuilder, defineSession, SessionValues } from "./session.js";
import { Hono } from "hono/tiny";
import { handle as awsHandle } from "hono/aws-lambda";
import { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export interface OnSuccessResponder<
  T extends { type: string; properties: any },
> {
  session<Type extends T["type"]>(
    type: Type,
    properties: Extract<T, { type: Type }>["properties"],
    options?: {
      accessExpiry?: number | string | Date;
      refreshExpiry?: number | string | Date;
    },
  ): Promise<Response>;
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

import process from "node:process";
import {
  MissingParameterError,
  UnauthorizedClientError,
  UnknownProviderError,
  UnknownStateError,
} from "./error.js";

export const aws = awsHandle;

export function authorizer<
  Providers extends Record<string, Adapter<any>>,
  Sessions extends SessionBuilder,
  Result = {
    [key in keyof Providers]: Prettify<
      {
        provider: key;
      } & (Providers[key] extends Adapter<infer T> ? T : {})
    >;
  }[keyof Providers],
>(input: {
  session: Sessions;
  providers: Providers;
  publicKey?: string;
  privateKey?: string;
  callbacks: {
    index?(req: Request): Promise<Response>;
    auth: {
      error?(
        error:
          | MissingParameterError
          | UnauthorizedClientError
          | UnknownProviderError,
        req: Request,
      ): Promise<Response>;
      start?(event: Request): Promise<void>;
      allowClient(
        clientID: string,
        audience: string | undefined,
        redirect: string,
        req: Request,
      ): Promise<boolean>;
      success(
        response: OnSuccessResponder<SessionValues<Sessions["types"]>>,
        input: Result,
        req: Request,
      ): Promise<Response>;
    };
    /*
    connect?: {
      error?(
        error: InvalidSessionError | UnknownProviderError,
        req: Request,
      ): Promise<Response | undefined>;
      start?(
        session: SessionValues<Sessions["types"]>,
        req: Request,
      ): Promise<void>;
      success?(
        session: SessionValues<Sessions["types"]>,
        input: {},
      ): Promise<Response>;
    };
    */
  };
}) {
  if (!input.callbacks.auth.error) {
    input.callbacks.auth.error = async (err) => {
      return new Response(err.message, {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    };
  }

  const publicKey = input.publicKey ?? process.env.OPENAUTH_PUBLIC_KEY;
  if (!publicKey) throw new Error("No public key");
  const privateKey = input.privateKey ?? process.env.OPENAUTH_PRIVATE_KEY;
  if (!privateKey) throw new Error("No private key");

  const session = defineSession(input.session.types, {
    publicKey,
    privateKey,
  });

  const key = {
    algorithm: "RS512",
    signing: {
      privateKey: jose.importPKCS8(privateKey, "RS512"),
      publicKey: jose.importSPKI(publicKey, "RS512", {
        extractable: true,
      }),
    },
    encryption: {
      privateKey: jose.importPKCS8(privateKey, "RSA-OAEP-512"),
      publicKey: jose.importSPKI(publicKey, "RSA-OAEP-512"),
    },
  };
  const auth: Omit<AdapterOptions<any>, "name"> = {
    async success(ctx: Context, properties: any) {
      const authorization = await auth.get(ctx, "authorization");
      if (!authorization.redirect_uri) {
        return auth.forward(
          ctx,
          await input.callbacks.auth.error!(
            new UnknownStateError(),
            ctx.req.raw,
          ),
        );
      }
      return await input.callbacks.auth.success(
        {
          async session(type, properties, options) {
            const authorization = await auth.get(ctx, "authorization");
            auth.unset(ctx, "authorization");

            if (authorization.response_type === "token") {
              const accessToken = await session.create(
                type as string,
                properties,
                {
                  mode: "access",
                  audience: authorization.audience,
                  expiresIn: options?.accessExpiry,
                },
              );
              const refreshToken = await session.create(
                type as string,
                properties,
                {
                  mode: "refresh",
                  expiresIn: options?.refreshExpiry,
                },
              );
              const location = new URL(authorization.redirect_uri);
              location.hash = new URLSearchParams({
                access_token: accessToken,
                refresh_token: refreshToken,
                state: authorization.state || "",
              }).toString();
              return ctx.redirect(location.toString(), 302);
            }

            if (authorization.response_type === "code") {
              // This allows the code to be reused within a 30 second window
              // The code should be single use but we're making this tradeoff to remain stateless
              // In the future can store this in a dynamo table to ensure single use
              const code = await encrypt({
                type,
                properties,
                options,
                client_id: authorization.client_id,
                redirect_uri: authorization.redirect_uri,
                expiry: new Date(Date.now() + 30 * 1000),
              });
              const location = new URL(authorization.redirect_uri);
              location.searchParams.set("code", code);
              location.searchParams.set("state", authorization.state || "");
              return ctx.redirect(location.toString(), 302);
            }
            return ctx.text(
              `Unsupported response_type: ${authorization.response_type}`,
              400,
            );
          },
        },
        {
          provider: ctx.get("provider"),
          ...properties,
        },
        ctx.req.raw,
      );
    },
    forward(ctx, response) {
      return ctx.newResponse(
        response.body,
        response.status as any,
        Object.fromEntries(response.headers.entries()),
      );
    },
    async set(ctx, key, maxAge, value) {
      setCookie(ctx, key, await encrypt(value), {
        maxAge,
        httpOnly: true,
        ...(ctx.req.url.startsWith("https://")
          ? { secure: true, sameSite: "None" }
          : {}),
      });
    },

    async get(ctx: Context, key: string) {
      const raw = getCookie(ctx, key);
      if (!raw) return;
      return decrypt(raw);
    },

    async unset(ctx: Context, key: string) {
      deleteCookie(ctx, key);
    },
  };

  async function encrypt(value: any) {
    return await new jose.CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(value)),
    )
      .setProtectedHeader({ alg: "RSA-OAEP-512", enc: "A256GCM" })
      .encrypt(await key.encryption.publicKey);
  }

  async function decrypt(value: string) {
    return JSON.parse(
      new TextDecoder().decode(
        await jose
          .compactDecrypt(value, await key.encryption.privateKey)
          .then((value) => value.plaintext),
      ),
    );
  }

  const app = new Hono();

  app.get("/.well-known/jwks.json", async (c) => {
    const jwk = await jose.exportJWK(await key.signing.publicKey);
    return c.json({
      keys: [
        {
          ...jwk,
          kid: "sst",
        },
      ],
    });
  });

  app.get("/.well-known/oauth-authorization-server", async (c) => {
    const issuer =
      `https://` +
      (c.req.header("x-forwarded-host") || new URL(c.req.url).host);
    return c.json({
      issuer: issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      response_types_supported: ["code", "token"],
    });
  });

  app.post("/token", async (c) => {
    const form = await c.req.formData();
    if (form.get("grant_type") !== "authorization_code") {
      return c.text("Invalid grant_type", 400);
    }
    const code = form.get("code");
    if (!code) {
      return c.text("Missing code", 400);
    }
    const payload = await decrypt(code.toString());
    if (!payload) {
      return c.text("Invalid code", 400);
    }
    if (payload.redirect_uri !== form.get("redirect_uri")) {
      return c.text("redirect_uri mismatch", 400);
    }
    if (payload.client_id !== form.get("client_id")) {
      c.status(400);
      return c.text("client_id mismatch");
    }

    return c.json({
      access_token: session.create(payload.type, payload.properties, {
        mode: "access",
        expiresIn: payload.options?.accessExpiry,
      }),
      refresh_token: session.create(payload.type, payload.properties, {
        mode: "refresh",
        expiresIn: payload.options?.refreshExpiry,
      }),
    });
  });

  app.use("/:provider/authorize", async (c, next) => {
    const provider = c.req.param("provider");
    console.log("authorize request for", provider);
    const response_type =
      c.req.query("response_type") || getCookie(c, "response_type");
    const redirect_uri =
      c.req.query("redirect_uri") || getCookie(c, "redirect_uri");
    const state = c.req.query("state") || getCookie(c, "state");
    const client_id = c.req.query("client_id") || getCookie(c, "client_id");

    if (!provider) {
      c.status(400);
      return c.text("Missing provider");
    }

    if (!redirect_uri) {
      c.status(400);
      return c.text("Missing redirect_uri");
    }

    if (!response_type) {
      c.status(400);
      return c.text("Missing response_type");
    }

    if (!client_id) {
      c.status(400);
      return c.text("Missing client_id");
    }

    await auth.set(c, "authorization", 60 * 10, {
      provider,
      response_type,
      redirect_uri,
      state,
      client_id,
      audience: c.req.query("audience"),
    });

    if (input.callbacks.auth.start) {
      await input.callbacks.auth.start(c.req.raw);
    }
    await next();
  });

  for (const [name, value] of Object.entries(input.providers)) {
    const route = new Hono<any>();
    route.use(async (c, next) => {
      c.set("provider", name);
      await next();
    });
    value(route, {
      name,
      ...auth,
    });
    app.route(`/${name}`, route);
  }

  app.all("/*", async (c) => {
    return c.notFound();
  });

  return app;
}
