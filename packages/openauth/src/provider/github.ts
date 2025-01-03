import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function GithubProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "github",
    endpoint: {
      authorization: "https://github.com/login/oauth/authorize",
      token: "https://github.com/login/oauth/access_token",
    },
  })
}
