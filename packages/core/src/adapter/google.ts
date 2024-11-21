import { Oauth2Adapter, Oauth2WrappedConfig } from "./oauth2.js";
import { OidcAdapter, OidcWrappedConfig } from "./oidc.js";

export function GoogleAdapter(config: Oauth2WrappedConfig) {
  return Oauth2Adapter({
    ...config,
    endpoint: {
      authorization: "https://id.twitch.tv/oauth2/authorize",
      token: "https://id.twitch.tv/oauth2/token",
    },
  });
}

export function GoogleOidcAdapter(config: OidcWrappedConfig) {
  return OidcAdapter({
    ...config,
    issuer: "https://accounts.google.com",
  });
}
