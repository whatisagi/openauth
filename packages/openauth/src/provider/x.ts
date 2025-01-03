import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function XProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "x",
    endpoint: {
      authorization: "https://twitter.com/i/oauth2/authorize",
      token: "https://api.x.com/2/oauth2/token",
    },
  })
}
