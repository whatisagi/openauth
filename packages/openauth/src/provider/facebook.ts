import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"
import { OidcProvider, OidcWrappedConfig } from "./oidc.js"

export function FacebookProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "facebook",
    endpoint: {
      authorization: "https://www.facebook.com/v12.0/dialog/oauth",
      token: "https://graph.facebook.com/v12.0/oauth/access_token",
    },
  })
}

export function FacebookOidcProvider(config: OidcWrappedConfig) {
  return OidcProvider({
    ...config,
    type: "facebook",
    issuer: "https://graph.facebook.com",
  })
}
