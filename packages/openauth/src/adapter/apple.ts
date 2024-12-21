/**
 * This is the Apple adapter.
 *
 * Use this adapter to authenticate with Apple.
 *
 * #### Using OAuth
 *
 * ```ts
 * import { AppleAdapter } from "@openauthjs/openauth/adapter/apple";
 *
 * AppleAdapter({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 *
 * #### Using OIDC
 *
 * ```ts
 * import { AppleOidcAdapter } from "@openauthjs/openauth/adapter/apple";
 *
 * AppleOidcAdapter({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 *
 * @packageDocumentation
 */

import { Oauth2Adapter, Oauth2WrappedConfig } from "./oauth2.js"
import { OidcAdapter, OidcWrappedConfig } from "./oidc.js"

export interface AppleConfig extends Oauth2WrappedConfig {}
export interface AppleOidcConfig extends OidcWrappedConfig {}

/**
 * This function creates an Apple OAuth2 adapter.
 * @param config - The configuration for the adapter.
 * @example
 * ```ts
 * AppleAdapter({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 */
export function AppleAdapter(config: AppleConfig) {
  return Oauth2Adapter({
    ...config,
    type: "apple" as const,
    endpoint: {
      authorization: "https://appleid.apple.com/auth/authorize",
      token: "https://appleid.apple.com/auth/token",
    },
  })
}

/**
 * This function creates an Apple OIDC adapter.
 * @example
 * ```ts
 * AppleOidcAdapter({
 *   clientId: "1234567890",
 *   clientSecret: "0987654321",
 * });
 * ```
 */
export function AppleOidcAdapter(config: AppleOidcConfig) {
  return OidcAdapter({
    ...config,
    type: "apple" as const,
    issuer: "https://appleid.apple.com",
  })
}
