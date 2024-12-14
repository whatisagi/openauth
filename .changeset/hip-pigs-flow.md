---
"@openauthjs/openauth": minor
---

BREAKING CHANGE: `client.exchange` and `client.authorize` signatures have changed.

`client.exchange` will now return an `{ err, tokens }` object. check `if (result.err)` for errors.
`client.authorize` now accepts `pkce: true` as an option. it is now async and returns a promise with `{ challenge, url}`. the `challenge` contains the `state` and `verifier` if using `pkce`

all exchanges have been updated to reflect this if you would like to reference
