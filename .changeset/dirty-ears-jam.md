---
"@openauthjs/openauth": patch
---

do not import createClient from root - it causes some bundlers to include too much code
