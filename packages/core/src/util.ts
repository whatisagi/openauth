import { Context } from "hono";

export type Prettify<T> = {
  [K in keyof T]: T[K];
};

export function getRelativeUrl(ctx: Context, path: string) {
  const result = new URL(path, ctx.req.url);
  result.host = ctx.req.header("x-forwarded-host") || result.host;
  return result.toString();
}
