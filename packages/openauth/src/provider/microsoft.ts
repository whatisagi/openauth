import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"
import { OidcProvider, OidcWrappedConfig } from "./oidc.js"

export interface MicrosoftConfig extends Oauth2WrappedConfig {
  tenant: string
}

export function MicrosoftProvider(config: MicrosoftConfig) {
  return Oauth2Provider({
    ...config,
    type: "microsoft",
    endpoint: {
      authorization: `https://login.microsoftonline.com/${config?.tenant}/oauth2/v2.0/authorize`,
      token: `https://login.microsoftonline.com/${config?.tenant}/oauth2/v2.0/token`,
    },
  })
}

export function MicrosoftOidcProvider(config: OidcWrappedConfig) {
  return OidcProvider({
    ...config,
    type: "microsoft",
    issuer: "https://graph.microsoft.com/oidc/userinfo",
  })
}
