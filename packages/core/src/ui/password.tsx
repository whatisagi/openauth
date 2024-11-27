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

const DEFAULT_COPY = {
  error_email_taken: "There is already an account with this email.",
  error_invalid_code: "Code is incorrect.",
  error_invalid_email: "Email is not valid.",
  error_invalid_password: "Password is incorrect.",
  error_password_mismatch: "Passwords do not match.",
  register_title: "Welcome to the app",
  register_description: "Sign in with your email",
  login_title: "Welcome to the app",
  login_description: "Sign in with your email",
} satisfies {
  [key in `error_${
    | PasswordLoginError["type"]
    | PasswordRegisterError["type"]
    | PasswordChangeError["type"]}`]: string;
} & Record<string, string>;

export type PasswordUICopy = typeof DEFAULT_COPY;

export function PasswordLogin(props: {
  error?: PasswordLoginError;
  form?: FormData;
  copy: PasswordUICopy;
}) {
  return (
    <Layout>
      <Header
        title={props.copy.login_title}
        description={props.copy.login_description}
        logo={"A"}
      />

      {/* Form */}
      <form data-component="form" method="post">
        {props.error?.type !== undefined && (
          <FormError error={props.copy[`error_${props.error.type}`]} />
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
  copy: PasswordUICopy;
}) {
  const emailError = ["invalid_email", "email_taken"].includes(
    props.error?.type || "",
  );
  const passwordError = ["invalid_password", "password_mismatch"].includes(
    props.error?.type || "",
  );
  return (
    <Layout>
      <Header title={props.copy.register_title} logo={"A"} />
      <form data-component="form" method="post">
        {props.error?.type !== undefined && (
          <FormError error={props.copy[`error_${props.error.type}`]} />
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
  copy: PasswordUICopy;
}) {
  const passwordError = ["invalid_password", "password_mismatch"].includes(
    props.error?.type || "",
  );
  return (
    <Layout>
      <Header
        title={"Change your password"}
        logo={"A"}
        description={props.copy.error_password_mismatch}
      />

      {/* Form */}
      <form data-component="form" method="post" replace>
        {props.error?.type !== undefined && (
          <FormError error={props.copy[`error_${props.error.type}`]} />
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
  sendCode: PasswordConfig["sendCode"];
  copy?: Partial<PasswordUICopy>;
}

export function PasswordUI(input: PasswordUIOptions) {
  const copy = {
    ...DEFAULT_COPY,
    ...input.copy,
  };
  return {
    sendCode: input.sendCode,
    login: async (_req, error, form) =>
      new Response(
        PasswordLogin({
          error,
          form,
          copy,
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
          copy,
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
          copy,
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
