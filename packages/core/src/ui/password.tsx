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
import { FormAlert } from "./form.js";

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
  register: "Register",
  register_prompt: "Don't have an account?",
  login_prompt: "Already have an account?",
  login: "Login",
  change_prompt: "Forgot password?",
  code_resend: "Resend code",
  code_return: "Back to",
  logo: "A",
  input_email: "Email",
  input_password: "Password",
  input_code: "Code",
  input_repeat: "Repeat password",
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
        logo={props.copy.logo}
      />
      {/* Form */}
      <form data-component="form" method="post">
        <FormAlert
          message={
            props.error?.type && props.copy?.[`error_${props.error.type}`]
          }
        />
        <input
          data-component="input"
          type="email"
          name="email"
          required
          placeholder={props.copy.input_email}
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
            {props.copy.register_prompt}{" "}
            <a data-component="link" href="register">
              {props.copy.register}
            </a>
          </span>
          <a data-component="link" href="change">
            {props.copy.change_prompt}
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
        <FormAlert
          message={
            props.error?.type && props.copy?.[`error_${props.error.type}`]
          }
        />
        <input
          data-component="input"
          autofocus={!props.error || emailError}
          type="email"
          name="email"
          value={!emailError ? props.form?.get("email")?.toString() : ""}
          required
          placeholder={props.copy.input_email}
        />
        <input
          data-component="input"
          autofocus={passwordError}
          type="password"
          name="password"
          placeholder={props.copy.input_password}
          required
          value={!passwordError ? props.form?.get("password")?.toString() : ""}
        />
        <input
          data-component="input"
          type="password"
          name="repeat"
          required
          autofocus={passwordError}
          placeholder={props.copy.input_repeat}
        />
        <button data-component="button">Continue</button>
        <div data-component="form-footer">
          <span>
            {props.copy.login_prompt}{" "}
            <a data-component="link" href="authorize">
              {props.copy.login}
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
      <Header title={"Change your password"} logo={"A"} />

      {/* Form */}
      <form data-component="form" method="post" replace>
        <FormAlert
          message={
            props.error?.type && props.copy?.[`error_${props.error.type}`]
          }
        />
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
              placeholder={props.copy.input_email}
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
              placeholder={props.copy.input_code}
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
              placeholder={props.copy.input_password}
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
              placeholder={props.copy.input_repeat}
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
                {props.copy.code_return}{" "}
                <a data-component="link" href="authorize">
                  {props.copy.login.toLowerCase()}
                </a>
              </span>
              <button data-component="link">{props.copy.code_resend}</button>
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
    login: async (_req, form, error) =>
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
    register: async (_req, form, error) =>
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
    change: async (_req, state, form, error) => {
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
