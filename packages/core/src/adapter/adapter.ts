import type { Context, Hono } from "hono";

export type Adapter<Properties = any> = (
  route: AdapterRoute,
  options: AdapterOptions<Properties>,
) => void;

export type AdapterReturn = ReturnType<Adapter>;

export type AdapterRoute = Hono;
export interface AdapterOptions<Properties> {
  name: string;
  success: (ctx: Context, properties: Properties) => Promise<Response>;
  forward: (ctx: Context, response: Response) => Response;
  set: <T>(
    ctx: Context,
    key: string,
    maxAge: number,
    value: T,
  ) => Promise<void>;
  get: <T>(ctx: Context, key: string) => Promise<T>;
  unset: (ctx: Context, key: string) => Promise<void>;
}
export class AdapterError extends Error {}
export class AdapterUnknownError extends AdapterError {}
