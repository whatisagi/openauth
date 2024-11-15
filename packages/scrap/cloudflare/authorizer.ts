import { authorizer } from "../../core/src/index.js";
import { CodeAdapter } from "../../core/src/adapter/code.js";
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
          onCodeRequest: async (code, _claims, req) => {
            // TODO: send over email
            console.log("code", code);
            const resp = new Response(
              '<a href="' +
                new URL(req.url).origin +
                "/code/callback?code=" +
                code +
                '">Link</a>',
              {
                headers: {
                  "Content-Type": "text/html",
                },
              },
            );
            return resp;
          },
          onCodeInvalid: async () => {
            return new Response("Code invalid");
          },
        }),
      },
      callbacks: {
        auth: {
          allowClient: async () => true,
          success: async (ctx) => {
            return ctx.session("user", {
              userID: "123",
              workspaceID: "123",
            });
          },
        },
      },
    }).fetch(request, env, ctx);
  },
};
