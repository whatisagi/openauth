import { PropsWithChildren } from "hono/jsx";
import { render } from "./css.js";

export function Layout(props: PropsWithChildren) {
  return (
    <html>
      <head>
        <title>OpenAuthJS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style src="https://cdnjs.cloudflare.com/ajax/libs/modern-normalize/3.0.1/modern-normalize.min.css" />
        <style dangerouslySetInnerHTML={{ __html: render() }} />
      </head>
      <body>
        <div data-component="root">{props.children}</div>
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
