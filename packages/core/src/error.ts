export class OauthError extends Error {
  constructor(
    public error:
      | "invalid_request"
      | "invalid_grant"
      | "unauthorized_client"
      | "access_denied"
      | "unsupported_grant_type"
      | "server_error"
      | "temporarily_unavailable",
    public description: string,
  ) {
    super(error + " - " + description);
  }
}

export class MissingParameterError extends OauthError {
  constructor(public parameter: string) {
    super("invalid_request", "Missing parameter: " + parameter);
  }
}

export class UnknownStateError extends Error {
  constructor() {
    super(
      "The browser was in an unknown state. This could be because certain cookies expired or the browser was switched in the middle of an authentication flow",
    );
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super("Invalid session");
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
  }
}

export class InvalidAuthorizationCodeError extends Error {
  constructor() {
    super("Invalid authorization code");
  }
}
