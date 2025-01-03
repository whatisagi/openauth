import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function YahooProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "yahoo",
    endpoint: {
      authorization: "https://api.login.yahoo.com/oauth2/request_auth",
      token: "https://api.login.yahoo.com/oauth2/get_token",
    },
  })
}
