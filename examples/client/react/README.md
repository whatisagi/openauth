# React SPA Auth

This uses the token + pkce flow to authenticate a user.
Start it using.

```bash
bun run dev
```

Then visit `http://localhost:5173` in your browser.

It needs the OpenAuth server running at `http://localhost:3000`. Start it from the `examples/` dir using.

```bash
bun run --hot athorizer/bun/authorizer.ts
```

And optionally a JWT API running to get the user subject on `http://localhost:3001`. Start it using.

```bash
bun run --hot client/jwt-api/index.ts
```
