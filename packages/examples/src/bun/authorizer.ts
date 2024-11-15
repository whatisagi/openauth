import { authorizer } from "../../../core/src/index.js";
import { CodeAdapter } from "../../../core/src/adapter/code.js";
import { CodeUI } from "../../../core/src/ui/code.js";
import { subjects } from "../subjects.js";
import { MemoryStorage } from "../../../core/src/storage/memory.js";

export default authorizer({
  subjects,
  storage: MemoryStorage(),
  providers: {
    code: CodeAdapter<{ email: string }>(CodeUI({})),
  },
  allow: async () => true,
  success: async (ctx, value) => {
    return ctx.session("user", {
      email: value.claims.email,
    });
  },
});
