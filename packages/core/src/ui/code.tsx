/** @jsxImportSource hono/jsx */

import {
  CodeAdapterError,
  CodeAdapterOptions,
  CodeAdapterState,
} from "../adapter/code.js";
import { Header, Layout } from "./base.js";
import { FormAlert } from "./form.js";

export function CodeStart(props: {
  error?: CodeAdapterError;
  state: CodeAdapterState;
  form?: FormData;
}) {
  return (
    <Layout>
      <Header
        title={"Welcome to the app"}
        description={"Sign in to get started"}
        logo={"A"}
      />

      {/* Form */}
      <form data-component="form" method="post">
        {props.error?.type === "invalid_claim" && (
          <FormAlert message={"Email address is not valid"} />
        )}
        <input type="hidden" name="action" value="request" />
        <input
          data-component="input"
          autofocus
          type="email"
          name="email"
          required
          placeholder="Email"
        />
        <button data-component="button">Continue</button>
      </form>
      <p data-component="form-footer">
        We&apos;ll send a pin code to your email
      </p>
    </Layout>
  ) as string;
}

export function CodeEnter(props: {
  error?: CodeAdapterError;
  state: CodeAdapterState;
  form?: FormData;
}) {
  return (
    <Layout>
      <Header
        title="Let's verify your email"
        description="Check your inbox for the code we sent you"
        logo={"A"}
      />

      <form data-component="form" class="form" method="post">
        {props.error?.type === "invalid_code" && (
          <FormAlert message={"Invalid code"} />
        )}
        {props.state.type === "code" && props.state.resend && (
          <FormAlert
            message={"Code resent to " + props.state.claims.email}
            color="success"
          />
        )}
        <input type="hidden" name="action" value="verify" />
        <input
          data-component="input"
          autofocus
          minLength={6}
          maxLength={6}
          type="text"
          name="code"
          required
          placeholder="Code"
        />
        <button data-component="button">Continue</button>
      </form>
      {props.state.type == "code" && (
        <form method="post">
          {Object.entries(props.state.claims).map(([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={value}
              className="hidden"
            />
          ))}
          <input type="hidden" name="action" value="resend" />
          <div data-component="form-footer">
            <span>
              Didn't get code? <button data-component="link">Resend</button>
            </span>
          </div>
        </form>
      )}
    </Layout>
  ) as string;
}

export function CodeUI(props: {
  title?: string;
  description?: string;
  logo?: string;
  sendCode: (claims: Record<string, string>, code: string) => Promise<void>;
}) {
  return {
    sendCode: props.sendCode,
    length: 6,
    request: async (req, state, form, error) =>
      new Response(
        state.type === "start"
          ? CodeStart({
              state,
              form,
              error,
            })
          : CodeEnter({
              state,
              form,
              error,
            }),
        {
          headers: {
            "Content-Type": "text/html",
          },
        },
      ),
  } satisfies CodeAdapterOptions;
}
