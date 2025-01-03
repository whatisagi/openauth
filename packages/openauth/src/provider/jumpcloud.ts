import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function JumpCloudProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    type: "jumpcloud",
    ...config,
    endpoint: {
      authorization: "https://oauth.id.jumpcloud.com/oauth2/auth",
      token: "https://oauth.id.jumpcloud.com/oauth2/token",
    },
  })
}
