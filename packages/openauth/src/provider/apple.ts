/**
 * This is the Apple provider.
 *
 * Use this provider to authenticate with Apple.
 *
 * #### Using OAuth
 *
 * ```ts
 * import { AppleProvider } from "@openauthjs/openauth/provider/apple";
 *
 * AppleProvider({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 *
 * #### Using OIDC
 *
 * ```ts
 * import { AppleOidcProvider } from "@openauthjs/openauth/provider/apple";
 *
 * AppleOidcProvider({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 *
 * @packageDocumentation
 */

import { Oauth2Provider, Oauth2WrappedConfig } from "./oauth2.js"
import { OidcProvider, OidcWrappedConfig } from "./oidc.js"

export interface AppleConfig extends Oauth2WrappedConfig {}
export interface AppleOidcConfig extends OidcWrappedConfig {}

/**
 * This function creates an Apple OAuth2 provider.
 * @param config - The configuration for the provider.
 * @example
 * ```ts
 * AppleProvider({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 */
export function AppleProvider(config: AppleConfig) {
  return Oauth2Provider({
    ...config,
    type: "apple" as const,
    endpoint: {
      authorization: "https://appleid.apple.com/auth/authorize",
      token: "https://appleid.apple.com/auth/token",
    },
  })
}

/**
 * This function creates an Apple OIDC provider.
 * @example
 * ```ts
 * AppleOidcProvider({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 */
export function AppleOidcProvider(config: AppleOidcConfig) {
  return OidcProvider({
    ...config,
    type: "apple" as const,
    issuer: "https://appleid.apple.com",
  })
}
