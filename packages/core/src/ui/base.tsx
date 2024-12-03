import { PropsWithChildren } from "hono/jsx";
import css from "./ui.css" assert { type: "text" };
import { Theme } from "./theme.js";

export function Layout(
  props: PropsWithChildren<{
    size?: "small";
    theme: Theme | undefined;
  }>,
) {
  const radius = (() => {
    if (props.theme?.radius === "none") return "0";
    if (props.theme?.radius === "sm") return "1";
    if (props.theme?.radius === "md") return "1.25";
    if (props.theme?.radius === "lg") return "1.5";
    if (props.theme?.radius === "full") return "1000000000001";
    return "1";
  })();
  return (
    <html
      style={{
        "--color-background-light": props.theme?.background?.light,
        "--color-background-dark": props.theme?.background?.dark,
        "--color-brand": props.theme?.brand,
        "--font-family": props.theme?.font?.family,
        "--font-scale": props.theme?.font?.scale,
        "--border-radius": radius,
      }}
    >
      <head>
        <title>{props.theme?.title || "OpenAuthJS"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={props.theme?.favicon} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {props.theme?.css && (
          <style dangerouslySetInnerHTML={{ __html: props.theme.css }} />
        )}
      </head>
      <body>
        <div data-component="root">
          <div data-component="center" data-size={props.size}>
            <img
              data-component="logo"
              src={props.theme?.logo?.light}
              data-mode="light"
            />
            <img
              data-component="logo"
              src={props.theme?.logo?.dark}
              data-mode="dark"
            />
            {props.children}
          </div>
        </div>
      </body>
    </html>
  );
}
