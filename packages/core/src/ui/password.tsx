/** @jsxImportSource hono/jsx */

import {
  PasswordChangeError,
  PasswordChangeState,
  PasswordConfig,
  PasswordLoginError,
  PasswordRegisterError,
} from "../adapter/password.js";
import { Header, Layout } from "./base.js";
import "./form.js";
import { FormError } from "./form.js";

export function PasswordLogin(props: {
  error?: PasswordLoginError;
  form?: FormData;
  copy?: {
    [key in PasswordLoginError["type"]]: string;
  };
}) {
  const copy: typeof props.copy = {
    invalid_password: "Password is incorrect.",
    invalid_email: "Email is not valid.",
    ...props.copy,
  };
  return (
    <Layout>
      <Header
        title={"Welcome to the app"}
        description="Sign in with your email"
        logo={"A"}
      />

      {/* Form */}
      <form data-component="form" method="post">
        {props.error?.type !== undefined && (
          <FormError error={copy[props.error.type]} />
        )}
        <input
          data-component="input"
          type="email"
          name="email"
          required
          placeholder="Email"
          autofocus={!props.error}
          value={props.form?.get("email")?.toString()}
        />
        <input
          data-component="input"
          autofocus={props.error?.type === "invalid_password"}
          required
          type="password"
          name="password"
          placeholder="Password"
        />
        <button data-component="button">Continue</button>
        <div data-component="form-footer">
          <span>
            Don't have an account?{" "}
            <a data-component="link" href="register">
              Register
            </a>
          </span>
          <a data-component="link" href="change">
            Forgot password?
          </a>
        </div>
      </form>
    </Layout>
  ) as string;
}

export function PasswordRegister(props: {
  error?: PasswordRegisterError;
  form?: FormData;
  copy?: {
    [key in PasswordRegisterError["type"]]: string;
  };
}) {
  const copy: typeof props.copy = {
    invalid_email: "Email is not valid.",
    invalid_password: "Password is not valid.",
    email_taken: "There is already an account with that email.",
    password_mismatch: "Passwords do not match.",
    ...props.copy,
  };

  const emailError = ["invalid_email", "email_taken"].includes(
    props.error?.type || "",
  );
  const passwordError = ["invalid_password", "password_mismatch"].includes(
    props.error?.type || "",
  );
  return (
    <Layout>
      <Header title={"Welcome to the app"} logo={"A"} />
      <form data-component="form" method="post">
        {props.error?.type !== undefined && (
          <FormError error={copy[props.error.type]} />
        )}
        <input
          data-component="input"
          autofocus={!props.error || emailError}
          type="email"
          name="email"
          value={!emailError ? props.form?.get("email")?.toString() : ""}
          required
          placeholder="Email"
        />
        <input
          data-component="input"
          autofocus={passwordError}
          type="password"
          name="password"
          placeholder="Password"
          required
          value={!passwordError ? props.form?.get("password")?.toString() : ""}
        />
        <input
          data-component="input"
          type="password"
          name="repeat"
          required
          autofocus={passwordError}
          value={!passwordError ? props.form?.get("password")?.toString() : ""}
          placeholder="Repeat password"
        />
        <button data-component="button">Continue</button>
        <div data-component="form-footer">
          <span>
            Already have an account?{" "}
            <a data-component="link" href="authorize">
              Login
            </a>
          </span>
        </div>
      </form>
    </Layout>
  ) as string;
}

export function PasswordChange(props: {
  state: PasswordChangeState;
  error?: PasswordChangeError;
  form?: FormData;
  copy?: {
    [key in PasswordChangeError["type"]]: string;
  } & {
    description?: {
      [key in PasswordChangeState["type"]]: string;
    };
  };
}) {
  const copy: typeof props.copy = {
    invalid_email: "Email is not valid.",
    invalid_code: "Code is not valid.",
    invalid_password: "Password is not valid.",
    password_mismatch: "Passwords do not match.",
    description: {
      start: "Confirm your email to change your password.",
      code: "Enter the code sent to your email",
      update: "Enter a new password.",
      ...props.copy?.description,
    },
    ...props.copy,
  };
  const passwordError = ["invalid_password", "password_mismatch"].includes(
    props.error?.type || "",
  );
  return (
    <Layout>
      <Header
        title={"Change your password"}
        logo={"A"}
        description={copy.description?.[props.state.type]}
      />

      {/* Form */}
      <form data-component="form" method="post">
        {props.error?.type !== undefined && (
          <FormError error={copy[props.error.type]} />
        )}
        {props.state.type === "start" && (
          <>
            <input type="hidden" name="action" value="code" />
            <input
              data-component="input"
              autofocus
              type="email"
              name="email"
              required
              value={props.form?.get("email")?.toString()}
              placeholder="Email"
            />
          </>
        )}
        {props.state.type === "code" && (
          <>
            <input type="hidden" name="action" value="verify" />
            <input
              data-component="input"
              autofocus
              name="code"
              minLength={6}
              maxLength={6}
              required
              value={props.state.code}
              placeholder="Code"
            />
          </>
        )}
        {props.state.type === "update" && (
          <>
            <input type="hidden" name="action" value="update" />
            <input
              data-component="input"
              autofocus
              type="password"
              name="password"
              placeholder="Password"
              required
              value={
                !passwordError ? props.form?.get("password")?.toString() : ""
              }
            />
            <input
              data-component="input"
              type="password"
              name="repeat"
              required
              value={
                !passwordError ? props.form?.get("password")?.toString() : ""
              }
              placeholder="Repeat password"
            />
          </>
        )}
        <button data-component="button">Continue</button>
      </form>
      {props.state.type === "code" && (
        <form method="post">
          <input type="hidden" name="action" value="code" />
          <input type="hidden" name="email" value={props.state.email} />
          {props.state.type === "code" && (
            <div data-component="form-footer">
              <span>
                Back to{" "}
                <a data-component="link" href="authorize">
                  login
                </a>
              </span>
              <button data-component="link">Resend code</button>
            </div>
          )}
        </form>
      )}
    </Layout>
  ) as string;
}

export interface PasswordUIOptions {
  sendCode: (email: string, code: string) => Promise<void>;
}
export function PasswordUI(input: PasswordUIOptions) {
  return {
    sendCode: input.sendCode,
    login: async (_req, error, form) =>
      new Response(
        PasswordLogin({
          error,
          form,
        }),
        {
          status: error ? 401 : 200,
          headers: {
            "Content-Type": "text/html",
          },
        },
      ),
    register: async (_req, error, form) =>
      new Response(
        PasswordRegister({
          error,
          form,
        }),
        {
          headers: {
            "Content-Type": "text/html",
          },
        },
      ),
    change: async (_req, state, error, form) => {
      return new Response(
        PasswordChange({
          state,
          error,
          form,
        }),
        {
          status: error ? 400 : 200,
          headers: {
            "Content-Type": "text/html",
          },
        },
      );
    },
  } satisfies PasswordConfig;
}
