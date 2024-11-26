import { authorizer } from "@openauthjs/core";
import { CloudflareStorage } from "@openauthjs/core/storage/cloudflare";
import {
  type ExecutionContext,
  type KVNamespace,
} from "@cloudflare/workers-types";
import { subjects } from "../subjects.js";
import { PasswordAdapter } from "@openauthjs/core/adapter/password";
import { PasswordUI } from "@openauthjs/core/ui/password";

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
      providers: {
        password: PasswordAdapter(
          PasswordUI({
            sendCode: async (email, code) => {
              console.log(email, code);
            },
          }),
        ),
      },
      allow: async () => true,
      success: async (ctx, value) => {
        return ctx.session("user", {
          email: value.email,
        });
      },
    }).fetch(request, env, ctx);
  },
};
