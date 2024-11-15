import { Adapter } from "./adapter.js";
import { getCookie } from "hono/cookie";
import { MissingParameterError, UnknownStateError } from "../error.js";

interface AdapterState {
  claims: Record<string, string>;
  code: string;
}

export function CodeAdapter(config: {
  length?: number;
  onStart: (req: Request) => Promise<Response>;
  onCodeRequest: (
    code: string,
    claims: Record<string, any>,
    req: Request,
  ) => Promise<Response>;
  onCodeInvalid: (
    code: string,
    claims: Record<string, any>,
    req: Request,
  ) => Promise<Response>;
}) {
  const length = config.length || 6;
  function generate() {
    const buffer = crypto.getRandomValues(new Uint8Array(length));
    const otp = Array.from(buffer)
      .map((byte) => byte % 10)
      .join("");
    return otp;
  }

  return function (routes, ctx) {
    routes.get("/authorize", async (c) =>
      ctx.forward(c, await config.onStart(c.req.raw)),
    );

    routes.post("/submit", async (c) => {
      const code = generate();
      const claims = await c.req.formData();
      await ctx.set(c, "adapter", 60 * 10, {
        claims: Object.fromEntries(claims.entries()),
        code,
      });
      return ctx.forward(
        c,
        await config.onCodeRequest(code, claims, c.req.raw),
      );
    });

    routes.post("/verify", async (c) => {
      const authorization = getCookie(c, "authorization");
      if (!authorization) throw new UnknownStateError();
      const state = await ctx.get(c, "adapter");
      if (!state) throw new UnknownStateError();
      console.log("state", state);
      if (!state.code || !state.claims) {
        return ctx.forward(
          c,
          await config.onCodeInvalid(state.code, state.claims, c.req.raw),
        );
      }
      const form = await c.req.formData();
      const compare = form.get("code")?.toString();
      if (!compare) throw new MissingParameterError("code");
      console.log("comparing", state.code, "to", compare);
      if (state.code !== compare) {
        return ctx.forward(
          c,
          await config.onCodeInvalid(compare, state.claims, c.req.raw),
        );
      }
      await ctx.unset(c, "adapter");
      return ctx.forward(c, await ctx.success(c, { claims: state.claims }));
    });
  } satisfies Adapter<{ claims: Record<string, string> }>;
}
