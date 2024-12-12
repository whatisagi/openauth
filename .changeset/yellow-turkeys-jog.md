---
"@openauthjs/openauth": minor
---

BREAKING CHANGE:

The api for `client` has changed. It no longer throws errors and instead returns an `err` field that you must check or ignore.

All the examples have been updated to reflect this change.
