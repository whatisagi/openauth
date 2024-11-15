import { authorizer } from "../../core/src/index.js";
import { CodeAdapter } from "../../core/src/adapter/code.js";
import { CodeEnter, CodeStart } from "../../core/src/ui/code.js";
import { CloudflareStorage } from "../../core/src/storage/cloudflare.js";
import {
  type ExecutionContext,
  type KVNamespace,
} from "@cloudflare/workers-types";
import { subjects } from "../subjects.js";

interface Env {
  AuthKV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return authorizer({
      subjects,
      storage: CloudflareStorage({
        namespace: env.AuthKV,
      }),
      ttl: {
        access: 60 * 5,
      },
      providers: {
        code: CodeAdapter({
          length: 6,
          onStart: async (req) => {
            return new Response(
              CodeStart({
                mode: "email",
              }),
              {
                headers: {
                  "Content-Type": "text/html",
                },
              },
            );
          },
          onCodeRequest: async (code, claims, req) =>
            new Response(
              CodeEnter({ mode: "email", debugCode: code, claims }),
              {
                headers: {
                  "Content-Type": "text/html",
                },
              },
            ),
          onCodeInvalid: async (_, claims) => {
            return new Response(
              CodeEnter({
                mode: "email",
                error: "Invalid code, try again",
                claims,
              }),
              {
                headers: {
                  "Content-Type": "text/html",
                },
              },
            );
          },
        }),
      },
      callbacks: {
        auth: {
          allowClient: async () => true,
          success: async (ctx, value) => {
            console.log("value", value);
            return ctx.session("user", {
              email: value.claims.email,
            });
          },
        },
      },
    }).fetch(request, env, ctx);
  },
};
