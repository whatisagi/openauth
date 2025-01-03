---
"@openauthjs/openauth": minor
---

renamed authorizer -> issuer and adapter -> provider

this should be a superficial change, but it's a breaking change

previously you imported adapters like this:

```js
import { PasswordAdapter } from "@openauth/openauth/adapter/password"
```

update it to this:

```js
import { PasswordProvider } from "@openauth/openauth/provider/password"
```

for the authorizer, you import it like this:

```js
import { authorizer } from "@openauth/openauth"
```

update it to this:

```js
import { issuer } from "@openauth/openauth"
```

also subjects should be imported deeply like this:

```js
import { createSubjects } from "@openauth/openauth"
```

update it to this:

```js
import { createSubjects } from "@openauth/openauth/subject"
```
