/**
 * Use the OpenAuth client kick off your OAuth flows, exchange tokens, refresh tokens,
 * and verify tokens.
 *
 * First, create a client.
 *
 * ```ts
 * import { createClient } from "@openauthjs/openauth/client"
 *
 * const client = createClient({
 *   clientID: "my-client",
 *   issuer: "https://auth.myserver.com"
 * })
 * ```
 *
 * Kick off the OAuth flow by calling `authorize`.
 *
 * ```ts
 * const redirect_uri = "https://myserver.com/callback"
 *
 * const { url } = await client.authorize(
 *   redirect_uri,
 *   "code"
 * )
 * ```
 *
 * When the user completes the flow, `exchange` the code for tokens.
 *
 * ```ts
 * const tokens = await client.exchange(query.get("code"), redirect_uri)
 * ```
 *
 * And `verify` the tokens.
 *
 * ```ts
 * const verified = await client.verify(subjects, tokens.access)
 * ```
 *
 * @packageDocumentation
 */
import {
  createLocalJWKSet,
  errors,
  JSONWebKeySet,
  jwtVerify,
  decodeJwt,
} from "jose"
import { SubjectSchema } from "./session.js"
import type { v1 } from "@standard-schema/spec"
import {
  InvalidAccessTokenError,
  InvalidAuthorizationCodeError,
  InvalidRefreshTokenError,
  InvalidSubjectError,
} from "./error.js"
import { generatePKCE } from "./pkce.js"

/**
 * The well-known information for an OAuth 2.0 authorization server.
 */
export interface WellKnown {
  /**
   * The URI to the JWKS endpoint.
   */
  jwks_uri: string
  /**
   * The URI to the token endpoint.
   */
  token_endpoint: string
  /**
   * The URI to the authorization endpoint.
   */
  authorization_endpoint: string
}

/**
 * The tokens returned by the authorization server.
 */
export interface Tokens {
  /**
   * The access token.
   */
  access: string
  /**
   * The refresh token.
   */
  refresh: string
}

interface ResponseLike {
  json(): Promise<unknown>
  ok: Response["ok"]
}
type FetchLike = (...args: any[]) => Promise<ResponseLike>

/**
 * The challenge that you can use to verify the code.
 */
export type Challenge = {
  /**
   * The state that was sent to the redirect URI.
   */
  state: string
  /**
   * The verifier that was sent to the redirect URI.
   */
  verifier?: string
}

/**
 * Configure the client.
 */
export interface ClientInput {
  /**
   * The client ID. This is just a string to identify your app.
   *
   * If you have a web app and a mobile app, you want to use different client IDs both.
   *
   * @example
   * ```ts
   * {
   *   clientID: "my-client"
   * }
   * ```
   */
  clientID: string
  /**
   * The URL of your authorization server.
   *
   * @example
   * ```ts
   * {
   *   issuer: "https://auth.myserver.com"
   * }
   * ```
   */
  issuer?: string
  /**
   * Optionally, override the internally used fetch function.
   *
   * This is useful if you are using a polyfilled fetch function in your application and you
   * want the client to use it too.
   */
  fetch?: FetchLike
}

export interface AuthorizeOptions {
  /**
   * Enable the PKCE flow. This is for SPA apps.
   *
   * ```ts
   * {
   *   pkce: true
   * }
   * ```
   *
   * @default false
   */
  pkce?: boolean
  /**
   * The provider you want to use for the OAuth flow.
   *
   * ```ts
   * {
   *   provider: "google"
   * }
   * ```
   *
   * If no provider is specified, the user is directed to a page where they can select from the
   * list of configured providers.
   *
   * If there's only one provider configured, the user will be redirected to that.
   */
  provider?: string
}

export interface AuthorizeResult {
  /**
   * The challenge that you can use to verify the code. This is for the PKCE flow for SPA apps.
   *
   * This is an object that you _stringify_ and store it in session storage.
   *
   * ```ts
   * sessionStorage.setItem("challenge", JSON.stringify(challenge))
   * ```
   */
  challenge: Challenge
  /**
   * The URL to redirect the user to. This starts the OAuth flow.
   *
   * For example, for SPA apps.
   *
   * ```ts
   * location.href = url
   * ```
   */
  url: string
}

export interface ExchangeSuccess {
  err: false
  tokens: Tokens
}

export interface ExchangeError {
  err: InvalidAuthorizationCodeError
}

export interface RefreshOptions {
  access?: string
}

export interface RefreshSuccess {
  err: false
  tokens?: Tokens
}

export interface RefreshError {
  err: InvalidRefreshTokenError | InvalidAccessTokenError
}

export interface VerifyOptions {
  refresh?: string
  issuer?: string
  audience?: string
  fetch?: typeof fetch
}

export interface VerifyResult<T extends SubjectSchema> {
  err?: undefined
  tokens?: Tokens
  aud: string
  subject: {
    [type in keyof T]: { type: type; properties: v1.InferOutput<T[type]> }
  }[keyof T]
}

export interface VerifyError {
  err: InvalidRefreshTokenError | InvalidAccessTokenError
}

export interface Client {
  /**
   * Start the autorization flow. For example, in SSR sites you do.
   *
   * ```ts
   * const { url } = await client.authorize(<redirect_uri>, "code")
   * ```
   *
   * This takes a redirect URI and the type of flow you want to use. The redirect URI is the
   * location where the user will be redirected to after the flow is complete.
   *
   * Supports both the _code_ and _token_ flows. We recommend using the _code_ flow as it's more
   *
   * :::tip
   * This returns a URL to the auth server that you redirect to. This starts the flow.
   * :::
   *
   * This returns a URL that you can redirect the user to. And this starts the OAuth flow.
   * secure.
   *
   * For SPA apps, we recommend using the PKCE flow.
   *
   * ```ts {4}
   * const { challenge, url } = await client.authorize(
   *   <redirect_uri>,
   *   "code",
   *   { pkce: true }
   * )
   * ```
   *
   * This returns the URL that you redirect to, to start the flow. It also returns a challenge
   * that you can use to later verify the code.
   *
   * @param redirectURI - The redirect URI.
   * @param response - The response type.
   * @param opts - Authorization options.
   */
  authorize(
    redirectURI: string,
    response: "code" | "token",
    opts?: AuthorizeOptions,
  ): Promise<AuthorizeResult>
  /**
   * Exchange the code that's passed in for the access and refresh tokens.
   *
   * ```ts
   * const exchanged = await client.exchange(<code>, <redirect_uri>)
   * ```
   *
   * You call this after the user has been redirected back to your app after the OAuth flow.
   *
   * :::tip
   * For SSR sites, the code is passed in as a query parameter.
   * :::
   *
   * So the code comes from the query parameter in the redirect URI. The redirect URI that you
   * pass in is the one that you passed in to `authorize` when starting the flow.
   *
   * :::tip
   * For SPA sites, the code is passed in through the URL hash.
   * :::
   *
   * This returns the access and refresh tokens. Or if it fails it returns an error that you can
   * handle depending on the error.
   *
   * ```ts
   * import { InvalidAuthorizationCodeError } from "@openauthjs/openauth/error"
   *
   * if (exchanged.err) {
   *   if (exchanged.err instanceof InvalidAuthorizationCodeError) {
   *     // handle invalid code error
   *   }
   *   else {
   *     // handle other errors
   *   }
   * }
   *
   * const { access, refresh } = exchanged.tokens
   * ```
   *
   * If you used the PKCE flow for an SPA app, the code is returned as a part of the redirect URL
   * hash.
   *
   * ```ts
   * const exchanged = await client.exchange(
   *   <code>,
   *   <redirect_uri>,
   *   <verifier>
   * )
   * ```
   *
   * You also need to pass in the previously stored challenge verifier.
   *
   * @param code - The authorization code.
   * @param redirectURI - The redirect URI that was passed in to `authorize`.
   * @param verifier - The challenge verifier for PKCE flows.
   */
  exchange(
    code: string,
    redirectURI: string,
    verifier?: string,
  ): Promise<ExchangeSuccess | ExchangeError>
  /**
   * Refresh the tokens.
   * @param refresh - The refresh token.
   * @param opts - Refresh options.
   */
  refresh(
    refresh: string,
    opts?: RefreshOptions,
  ): Promise<RefreshSuccess | RefreshError>
  /**
   * Verify the token.
   * @param subjects - The subjects.
   * @param token - The token.
   * @param options - Verification options.
   */
  verify<T extends SubjectSchema>(
    subjects: T,
    token: string,
    options?: VerifyOptions,
  ): Promise<VerifyResult<T> | VerifyError>
}

/**
 * Create an OpenAuth client.
 *
 * @param input - Configure the client.
 */
export function createClient(input: ClientInput): Client {
  const jwksCache = new Map<string, ReturnType<typeof createLocalJWKSet>>()
  const issuerCache = new Map<string, WellKnown>()
  const issuer = input.issuer || process.env.OPENAUTH_ISSUER
  if (!issuer) throw new Error("No issuer")
  const f = input.fetch ?? fetch

  async function getIssuer() {
    const cached = issuerCache.get(issuer!)
    if (cached) return cached
    const wellKnown = (await (f || fetch)(
      `${issuer}/.well-known/oauth-authorization-server`,
    ).then((r) => r.json())) as WellKnown
    issuerCache.set(issuer!, wellKnown)
    return wellKnown
  }

  async function getJWKS() {
    const wk = await getIssuer()
    const cached = jwksCache.get(issuer!)
    if (cached) return cached
    const keyset = (await (f || fetch)(wk.jwks_uri).then((r) =>
      r.json(),
    )) as JSONWebKeySet
    const result = createLocalJWKSet(keyset)
    jwksCache.set(issuer!, result)
    return result
  }

  const result = {
    async authorize(
      redirectURI: string,
      response: "code" | "token",
      opts?: AuthorizeOptions,
    ) {
      const result = new URL(issuer + "/authorize")
      const challenge: Challenge = {
        state: crypto.randomUUID(),
      }
      result.searchParams.set("client_id", input.clientID)
      result.searchParams.set("redirect_uri", redirectURI)
      result.searchParams.set("response_type", response)
      result.searchParams.set("state", challenge.state)
      if (opts?.provider) result.searchParams.set("provider", opts.provider)
      if (opts?.pkce && response === "code") {
        const pkce = await generatePKCE()
        result.searchParams.set("code_challenge_method", "S256")
        result.searchParams.set("code_challenge", pkce.challenge)
        challenge.verifier = pkce.verifier
      }
      return {
        challenge,
        url: result.toString(),
      }
    },
    /**
     * @deprecated use `authorize` instead, it will do pkce by default unless disabled with `opts.pkce = false`
     */
    async pkce(
      redirectURI: string,
      opts?: {
        provider?: string
      },
    ) {
      const result = new URL(issuer + "/authorize")
      if (opts?.provider) result.searchParams.set("provider", opts.provider)
      result.searchParams.set("client_id", input.clientID)
      result.searchParams.set("redirect_uri", redirectURI)
      result.searchParams.set("response_type", "code")
      const pkce = await generatePKCE()
      result.searchParams.set("code_challenge_method", "S256")
      result.searchParams.set("code_challenge", pkce.challenge)
      return [pkce.verifier, result.toString()]
    },
    async exchange(
      code: string,
      redirectURI: string,
      verifier?: string,
    ): Promise<ExchangeSuccess | ExchangeError> {
      const tokens = await f(issuer + "/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectURI,
          grant_type: "authorization_code",
          client_id: input.clientID,
          code_verifier: verifier || "",
        }).toString(),
      })
      const json = (await tokens.json()) as any
      if (!tokens.ok) {
        return {
          err: new InvalidAuthorizationCodeError(),
        }
      }
      return {
        err: false,
        tokens: {
          access: json.access_token as string,
          refresh: json.refresh_token as string,
        },
      }
    },
    async refresh(
      refresh: string,
      opts?: RefreshOptions,
    ): Promise<RefreshSuccess | RefreshError> {
      if (opts && opts.access) {
        const decoded = decodeJwt(opts.access)
        if (!decoded) {
          return {
            err: new InvalidAccessTokenError(),
          }
        }
        // allow 30s window for expiration
        if ((decoded.exp || 0) > Date.now() / 1000 + 30) {
          return {
            err: false,
          }
        }
      }
      const tokens = await f(issuer + "/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh,
        }).toString(),
      })
      const json = (await tokens.json()) as any
      if (!tokens.ok) {
        return {
          err: new InvalidRefreshTokenError(),
        }
      }
      return {
        err: false,
        tokens: {
          access: json.access_token as string,
          refresh: json.refresh_token as string,
        },
      }
    },
    async verify<T extends SubjectSchema>(
      subjects: T,
      token: string,
      options?: VerifyOptions,
    ): Promise<VerifyResult<T> | VerifyError> {
      const jwks = await getJWKS()
      try {
        const result = await jwtVerify<{
          mode: "access"
          type: keyof T
          properties: v1.InferInput<T[keyof T]>
        }>(token, jwks, {
          issuer,
        })
        const validated = await subjects[result.payload.type][
          "~standard"
        ].validate(result.payload.properties)
        if (!validated.issues && result.payload.mode === "access")
          return {
            aud: result.payload.aud as string,
            subject: {
              type: result.payload.type,
              properties: validated.value,
            } as any,
          }
        return {
          err: new InvalidSubjectError(),
        }
      } catch (e) {
        if (e instanceof errors.JWTExpired && options?.refresh) {
          const refreshed = await this.refresh(options.refresh)
          if (refreshed.err) return refreshed
          const verified = await result.verify(
            subjects,
            refreshed.tokens!.access,
            {
              refresh: refreshed.tokens!.refresh,
              issuer,
              fetch: options?.fetch,
            },
          )
          if (verified.err) return verified
          verified.tokens = refreshed.tokens
          return verified
        }
        return {
          err: new InvalidAccessTokenError(),
        }
      }
    },
  }
  return result
}
