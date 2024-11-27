import { MissingParameterError, UnknownStateError } from "../error.js";
import { Storage } from "../storage/storage.js";
import { Adapter } from "./adapter.js";

export interface PasswordConfig {
  length?: number;
  login: (
    req: Request,
    error?: PasswordLoginError,
    form?: FormData,
  ) => Promise<Response>;
  register: (
    req: Request,
    error?: PasswordRegisterError,
    form?: FormData,
  ) => Promise<Response>;
  change: (
    req: Request,
    state: PasswordChangeState,
    error?: PasswordChangeError,
    form?: FormData,
  ) => Promise<Response>;
  sendCode: (email: string, code: string) => Promise<void>;
}

export type PasswordChangeState =
  | {
      type: "start";
      redirect: string;
    }
  | {
      type: "code";
      code: string;
      email: string;
      redirect: string;
    }
  | {
      type: "update";
      redirect: string;
      email: string;
    };

export type PasswordChangeError =
  | {
      type: "invalid_email";
    }
  | {
      type: "invalid_code";
    }
  | {
      type: "invalid_password";
    }
  | {
      type: "password_mismatch";
    };

export type PasswordLoginError =
  | {
      type: "invalid_password";
    }
  | {
      type: "invalid_email";
    };

export type PasswordRegisterError =
  | {
      type: "email_taken";
    }
  | {
      type: "invalid_email";
    }
  | {
      type: "invalid_password";
    }
  | {
      type: "password_mismatch";
    };

export function PasswordAdapter(config: PasswordConfig) {
  function generate() {
    const buffer = crypto.getRandomValues(new Uint8Array(6));
    const otp = Array.from(buffer)
      .map((byte) => byte % 10)
      .join("");
    return otp;
  }
  return function (routes, ctx) {
    routes.get("/authorize", async (c) =>
      ctx.forward(c, await config.login(c.req.raw)),
    );

    routes.post("/authorize", async (c) => {
      const fd = await c.req.formData();
      async function error(err: PasswordLoginError) {
        return ctx.forward(c, await config.login(c.req.raw, err, fd));
      }
      const email = fd.get("email")?.toString();
      if (!email) return error({ type: "invalid_email" });
      const hash = await Storage.get<HashedPassword>(ctx.storage, [
        "email",
        email,
        "password",
      ]);
      const password = fd.get("password")?.toString();
      if (
        !password ||
        !hash ||
        !(await verifyPassword({ password, compare: hash }))
      )
        return error({ type: "invalid_password" });
      return ctx.success(c, {
        email: email,
      });
    });

    routes.get("/register", async (c) => {
      return ctx.forward(c, await config.register(c.req.raw));
    });

    routes.post("/register", async (c) => {
      const fd = await c.req.formData();
      const email = fd.get("email")?.toString();
      const password = fd.get("password")?.toString();
      const repeat = fd.get("repeat")?.toString();

      async function error(err: PasswordRegisterError) {
        return ctx.forward(c, await config.register(c.req.raw, err, fd));
      }
      if (!email) return error({ type: "invalid_email" });
      if (!password) return error({ type: "invalid_password" });
      if (password !== repeat) return error({ type: "password_mismatch" });
      const existing = await Storage.get(ctx.storage, [
        "email",
        email,
        "password",
      ]);
      if (existing) return error({ type: "email_taken" });
      await Storage.set(
        ctx.storage,
        ["email", email, "password"],
        await hashPassword(password),
      );

      return ctx.success(c, {
        email: email,
      });
    });

    routes.get("/change", async (c) => {
      const redirect =
        c.req.query("redirect_uri") ||
        c.req.url.replace(/change.*/, "authorize");
      const state: PasswordChangeState = {
        type: "start",
        redirect,
      };
      await ctx.set(c, "adapter", 60 * 60 * 24, state);
      return ctx.forward(c, await config.change(c.req.raw, state));
    });

    routes.post("/change", async (c) => {
      const fd = await c.req.formData();
      const action = fd.get("action")?.toString();
      const adapter = await ctx.get<PasswordChangeState>(c, "adapter");
      if (!adapter) throw new UnknownStateError();
      console.log(adapter);

      async function transition(
        next: PasswordChangeState,
        err?: PasswordChangeError,
      ) {
        await ctx.set<PasswordChangeState>(c, "adapter", 60 * 60 * 24, next);
        return ctx.forward(c, await config.change(c.req.raw, next, err, fd));
      }

      if (action === "code") {
        const email = fd.get("email")?.toString();
        if (!email)
          return transition(
            { type: "start", redirect: adapter.redirect },
            { type: "invalid_email" },
          );
        const code = generate();
        await config.sendCode(email, code);

        return transition({
          type: "code",
          code,
          email,
          redirect: adapter.redirect,
        });
      }

      if (action === "verify" && adapter.type === "code") {
        const code = fd.get("code")?.toString();
        if (!code || code !== adapter.code)
          return transition(adapter, { type: "invalid_code" });
        return transition({
          type: "update",
          email: adapter.email,
          redirect: adapter.redirect,
        });
      }

      if (action === "update" && adapter.type === "update") {
        const existing = await Storage.get(ctx.storage, [
          "email",
          adapter.email,
          "password",
        ]);
        if (!existing) return c.redirect(adapter.redirect, 302);

        const password = fd.get("password")?.toString();
        const repeat = fd.get("repeat")?.toString();
        if (!password) return transition(adapter, { type: "invalid_password" });
        if (password !== repeat)
          return transition(adapter, { type: "password_mismatch" });

        await Storage.set(
          ctx.storage,
          ["email", adapter.email, "password"],
          await hashPassword(password),
        );

        return c.redirect(adapter.redirect, 302);
      }

      return transition({ type: "start", redirect: adapter.redirect });
    });
  } satisfies Adapter<{ email: string }>;
}

import * as jose from "jose";
import { TextEncoder } from "util";

interface HashedPassword {
  hash: string;
  salt: string;
  iterations: number;
}

async function hashPassword(password: string): Promise<HashedPassword> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const params = {
    name: "PBKDF2",
    hash: "SHA-256",
    salt: salt,
    iterations: 600000, // High iteration count for security
  };
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    bytes,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(params, keyMaterial, 256);
  const hashBase64 = jose.base64url.encode(new Uint8Array(hash));
  const saltBase64 = jose.base64url.encode(salt);
  return {
    hash: hashBase64,
    salt: saltBase64,
    iterations: params.iterations,
  };
}

async function verifyPassword(input: {
  password: string;
  compare: HashedPassword;
}): Promise<boolean> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(input.password);
  const salt = jose.base64url.decode(input.compare.salt);
  const params = {
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations: input.compare.iterations,
  };
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(params, keyMaterial, 256);
  const hashBase64 = jose.base64url.encode(new Uint8Array(hash));
  return hashBase64 === input.compare.hash;
}
