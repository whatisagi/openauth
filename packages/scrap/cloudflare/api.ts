import type { Service } from "@cloudflare/workers-types";
import { verify } from "../../core/src/session";
import { sessions } from "../sessions";

interface Env {
  OPENAUTH_ISSUER: string;
  Auth: Service;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/callback":
        const code = url.searchParams.get("code")!;
        const response = await env.Auth.fetch(env.OPENAUTH_ISSUER + "/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            redirect_uri: url.origin + "/callback",
            client_id: "123",
            grant_type: "authorization_code",
          }).toString(),
        });
        // token
        // callback#access_token=xx
        // code
        // /callback?code=xxx
        // --> POST /token -> access_token, refresh_token

        return response;

        console.log(response);
        const session = await verify(sessions, response.access_token, {
          issuer: env.OPENAUTH_ISSUER,
          // @ts-ignore
          fetch: env.Auth.fetch,
        });

        async function getToken() {
          const token = localStorage.get("access_token");
          if (isExpired(token)) {
            const nextToken = fetch(authserver + "/refresh", {
              body: JSON.stringify({
                refresh_token: localStorage.get("refresh_token"),
              }),
            });
            localStorage.set("access_token", nextToken);
            return nextToken;
          }
          return token;
        }

        console.log(session);
        return Response.json(session);
      case "/authorize":
        const redir = new URL(env.OPENAUTH_ISSUER + "/code/authorize");
        redir.searchParams.set("client_id", "123");
        redir.searchParams.set("redirect_uri", url.origin + "/callback");
        redir.searchParams.set("response_type", "code");
        return Response.redirect(redir);
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};
