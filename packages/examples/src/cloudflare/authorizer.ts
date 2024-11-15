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
      providers: {
        code: CodeAdapter<{ email: string }>(CodeUI({})),
      },
      allow: async () => true,
      success: async (ctx, value) => {
        return ctx.session("user", {
          email: value.claims.email,
        });
      },
    }).fetch(request, env, ctx);
  },
};
