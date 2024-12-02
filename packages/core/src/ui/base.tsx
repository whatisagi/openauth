import { PropsWithChildren } from "hono/jsx";
import css from "./ui.css" assert { type: "text" };
import { Theme } from "./theme.js";

export function Layout(
  props: PropsWithChildren<{
    size?: "small";
    theme: Theme | undefined;
  }>,
) {
  return (
    <html
      style={{
        "--color-background-light": props.theme?.background?.light,
        "--color-background-dark": props.theme?.background?.dark,
        "--color-primary-dark": props.theme?.primary?.dark,
        "--color-primary-light": props.theme?.primary?.light,
        "--logo-dark": props.theme?.logo?.dark
          ? `url(${props.theme?.logo?.dark})`
          : "",
        "--logo-light": props.theme?.logo?.light
          ? `url(${props.theme?.logo?.light})`
          : "",
      }}
    >
      <head>
        <title>OpenAuthJS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {props.theme?.css && (
          <style dangerouslySetInnerHTML={{ __html: props.theme.css }} />
        )}
      </head>
      <body>
        <div data-component="root">
          <div data-component="center" data-size={props.size}>
            {props.children}
          </div>
        </div>
      </body>
    </html>
  );
}

export function Header(
  props: PropsWithChildren<{
    theme: Theme | undefined;
    title?: string;
    description?: string;
  }>,
) {
  return (
    <div data-component="header">
      <div data-slot="logo" />
      {(props.title || props.description) && (
        <div>
          <h1 data-slot="title">{props.title}</h1>
          {props.description && (
            <p data-slot="description">{props.description}</p>
          )}
        </div>
      )}
      {props.children}
    </div>
  );
}
