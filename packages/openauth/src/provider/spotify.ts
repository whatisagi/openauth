import { Oauth2Provider, type Oauth2WrappedConfig } from "./oauth2.js"

export function SpotifyProvider(config: Oauth2WrappedConfig) {
  return Oauth2Provider({
    ...config,
    type: "spotify",
    endpoint: {
      authorization: "https://accounts.spotify.com/authorize",
      token: "https://accounts.spotify.com/api/token",
    },
  })
}
