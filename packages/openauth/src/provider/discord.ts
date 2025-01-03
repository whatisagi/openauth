import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"

export function DiscordProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    type: "discord",
    ...config,
    endpoint: {
      authorization: "https://discord.com/oauth2/authorize",
      token: "https://discord.com/api/oauth2/token",
    },
  })
}
