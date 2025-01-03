import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"
import { OidcProvider, OidcWrappedConfig } from "./oidc.js"

export function GoogleProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "google",
    endpoint: {
      authorization: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
    },
  })
}

export function GoogleOidcProvider(config: OidcWrappedConfig) {
  return OidcProvider({
    ...config,
    type: "google",
    issuer: "https://accounts.google.com",
  })
}
