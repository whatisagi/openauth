import { authorizer } from "@openauthjs/core";
import { CodeAdapter } from "@openauthjs/core/adapter/code";
import { CodeUI } from "@openauthjs/core/ui/code";
import { CloudflareStorage } from "@openauthjs/core/storage/cloudflare";
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
