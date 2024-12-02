/** @jsxImportSource hono/jsx */

import { CodeAdapterOptions } from "../adapter/code.js";
import { UnknownStateError } from "../error.js";
import { Header, Layout } from "./base.js";
import { FormAlert } from "./form.js";
import { Theme } from "./theme.js";

export function CodeUI(props: {
  theme?: Theme;
  sendCode: (claims: Record<string, string>, code: string) => Promise<void>;
}) {
  return {
    sendCode: props.sendCode,
    length: 6,
    request: async (req, state, form, error) => {
      if (state.type === "start") {
        const jsx = (
          <Layout theme={props.theme}>
            <Header
              title={"Welcome to the app"}
              description={"Sign in to get started"}
              theme={props.theme}
            />

            {/* Form */}
            <form data-component="form" method="post">
              {error?.type === "invalid_claim" && (
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
        );
        return new Response(jsx.toString(), {
          headers: {
            "Content-Type": "text/html",
          },
        });
      }

      if (state.type === "code") {
        const jsx = (
          <Layout theme={props.theme}>
            <Header
              title={"Welcome to the app"}
              description={"Sign in to get started"}
              theme={props.theme}
            />

            {/* Form */}
            <form data-component="form" method="post">
              {error?.type === "invalid_claim" && (
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
        );
        return new Response(jsx.toString(), {
          headers: {
            "Content-Type": "text/html",
          },
        });
      }

      throw new UnknownStateError();
    },
  } satisfies CodeAdapterOptions;
}
