import { OauthError } from "../error.js"
import { getRelativeUrl } from "../util.js"
import { Provider } from "./provider.js"

export interface Oauth2Config {
  type?: string
  clientID: string
  clientSecret: string
  endpoint: {
    authorization: string
    token: string
  }
  scopes: string[]
  query?: Record<string, string>
}

export type Oauth2WrappedConfig = Omit<Oauth2Config, "endpoint" | "name">

export interface Oauth2Token {
  access: string
  refresh: string
  expiry: number
  raw: Record<string, any>
}

interface ProviderState {
  state: string
  redirect: string
}

export function Oauth2Provider(
  config: Oauth2Config,
): Provider<{ tokenset: Oauth2Token; clientID: string }> {
  const query = config.query || {}
  return {
    type: config.type || "oauth2",
    init(routes, ctx) {
      routes.get("/authorize", async (c) => {
        const state = crypto.randomUUID()
        await ctx.set<ProviderState>(c, "provider", 60 * 10, {
          state,
          redirect: getRelativeUrl(c, "./callback"),
        })
        const authorization = new URL(config.endpoint.authorization)
        authorization.searchParams.set("client_id", config.clientID)
        authorization.searchParams.set(
          "redirect_uri",
          getRelativeUrl(c, "./callback"),
        )
        authorization.searchParams.set("response_type", "code")
        authorization.searchParams.set("state", state)
        authorization.searchParams.set("scope", config.scopes.join(" "))
        for (const [key, value] of Object.entries(query)) {
          authorization.searchParams.set(key, value)
        }
        return c.redirect(authorization.toString())
      })

      routes.get("/callback", async (c) => {
        const provider = (await ctx.get(c, "provider")) as ProviderState
        const code = c.req.query("code")
        const state = c.req.query("state")
        const error = c.req.query("error")
        if (error)
          throw new OauthError(
            error.toString() as any,
            c.req.query("error_description")?.toString() || "",
          )
        if (!provider || !code || (provider.state && state !== provider.state))
          return c.redirect(getRelativeUrl(c, "./authorize"))
        const body = new URLSearchParams({
          client_id: config.clientID,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: provider.redirect,
        })
        const json: any = await fetch(config.endpoint.token, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: body.toString(),
        }).then((r) => r.json())
        if ("error" in json)
          throw new OauthError(json.error, json.error_description)
        return ctx.success(c, {
          clientID: config.clientID,
          tokenset: {
            get access() {
              return json.access_token
            },
            get refresh() {
              return json.refresh_token
            },
            get expiry() {
              return json.expires_in
            },
            get raw() {
              return json
            },
          },
        })
      })
    },
  }
}
