import { object, string } from "valibot";
import { authorizer, defineSession } from "../core/src/index.js";
import { CodeAdapter } from "../core/src/adapter/code.js";
import { type ExecutionContext } from "@cloudflare/workers-types";

interface Env {
  OPENAUTH_PUBLIC_KEY: string;
  OPENAUTH_PRIVATE_KEY: string;
}

function session(env: Env) {
  return defineSession(
    {
      foo: object({
        bar: string(),
      }),
    },
    {
      privateKey: env.OPENAUTH_PRIVATE_KEY,
      publicKey: env.OPENAUTH_PUBLIC_KEY,
    },
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return authorizer({
      session: session(env),
      publicKey: env.OPENAUTH_PUBLIC_KEY,
      privateKey: env.OPENAUTH_PRIVATE_KEY,
      providers: {
        code: CodeAdapter({
          length: 6,
          onCodeRequest: async (code, claims, req) => {
            return new Response(
              "Code request: " +
                new URL(req.url).origin +
                "/code/callback?code=" +
                code,
            );
          },
          onCodeInvalid: async (code, claims, req) => {
            return new Response("Code invalid");
          },
        }),
      },
      callbacks: {
        auth: {
          allowClient: async () => true,
          success: async (ctx, value) => {
            return ctx.session("foo", {
              bar: "hello",
            });
          },
        },
      },
    }).fetch(request, env, ctx);
  },
};
