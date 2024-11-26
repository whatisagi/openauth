import { PropsWithChildren } from "hono/jsx";
import css from "./ui.css" assert { type: "text" };

export function Layout(props: PropsWithChildren) {
  return (
    <html>
      <head>
        <title>OpenAuthJS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div data-component="root">
          <div data-component="center">{props.children}</div>
        </div>
      </body>
    </html>
  );
}

export function Header(
  props: PropsWithChildren<{
    logo: string;
    title: string;
    description?: string;
  }>,
) {
  return (
    <div data-component="header">
      <div data-slot="logo">{props.logo}</div>
      <div>
        <h1 data-slot="title">{props.title}</h1>
        {props.description && (
          <p data-slot="description">{props.description}</p>
        )}
      </div>
      {props.children}
    </div>
  );
}
