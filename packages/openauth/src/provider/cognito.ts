import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export interface CognitoConfig extends Oauth2WrappedConfig {
  domain: string
  region: string
}

export function CognitoProvider(config: CognitoConfig) {
  const domain = `${config.domain}.auth.${config.region}.amazoncognito.com`

  return Oauth2Provider({
    type: "cognito",
    ...config,
    endpoint: {
      authorization: `https://${domain}/oauth2/authorize`,
      token: `https://${domain}/oauth2/token`,
    },
  })
}
