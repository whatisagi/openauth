import { authorizer } from "../../../core/src/index.js";
import { CodeAdapter } from "../../../core/src/adapter/code.js";
import { CodeUI } from "../../../core/src/ui/code.js";
import { CloudflareStorage } from "../../../core/src/storage/cloudflare.js";
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
        code: CodeAdapter<{ email: string }>(CodeUI({})),
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
