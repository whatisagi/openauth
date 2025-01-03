import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function TwitchProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    type: "twitch",
    ...config,
    endpoint: {
      authorization: "https://id.twitch.tv/oauth2/authorize",
      token: "https://id.twitch.tv/oauth2/token",
    },
  })
}
