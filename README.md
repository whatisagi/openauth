# OpenAuthJS

OpenAuthJS provides a centralized auth server that can be deployed both as a standalone service or embedded into an existing application. It works on nodejs, bun, aws lambda or cloudflare workers and is configured entirely through typescript.

## Approach

While there are many open source solutions for auth, almost all of them are libraries that are meant to be embedded into a single application. Centralized auth servers typically are delivered as SaaS services - eg Auth0 or Clerk.

OpenAuthJS instead is a centralized auth server that runs on your own infrastructure and has been designed for ease of self hosting. It can be used to authenticate all of your applications - web apps, mobile apps, internal admin tools, etc.

It adheres mostly to OAuth 2.0 specifications - which means anything that can speak oauth can use it to receive access and refresh tokens. When a client initiates an authorization flow, OpenAuthJS will hand off to one of the configured adapters - this can be third party identity providers like Google, Github, etc or built in flows like email/password or pin code.

Because it follows these specifications it can even be used to issue credentials for third party applications - allowing you to implement "login with myapp" flows.

OpenAuthJS very intentionally does not attempt to solve user management. We've found that this is a very difficult problem given the wide range of databases and drivers that are used in the JS ecosystem. Additionally it's quite hard to build data abstractions that work for every use case. Instead, once a user has identified themselves OpenAuthJS will invoke a callback where you can implement your own user lookup/creation logic. 

While OpenAuthJS tries to be mostly stateless, it does need to store a minimal amount of data (refresh tokens, password hashes, etc). However this has been reduced to a simple KV store with various implementations for zero overhead systems like Cloudflare KV and DynamoDB. You should never need to directly access any data that is stored in there.

There is also a themeable UI that you can use to get going without implementing any designs yourself. This is built on top of a lower level system so you can copy paste the default UI and tweak it or opt out entirely and implement your own.

Finally, OpenAuthJS is created by the maintainers of [SST](https://sst.dev) which is a tool to manage all the infrastructure for your app. It contains components for OpenAuthJS that make deploying it to AWS or Cloudflare as simple as it can get.

## Getting started

We'll show how to deploy the auth server and then a sample app that uses it. You can also checkout the [examples](https://github.com/openauthjs/openauthjs/tree/main/packages/examples) folder if you just want to look at code that you can copy paste.

### Auth server

Start by importing the `authorizer` function from the `@openauthjs/core` package.

```ts
import { authorizer } from "@openauthjs/core";
```

OpenAuthJS is built on top of [Hono](https://github.com/honojs/hono) which is a minimal web framework that can run anywhere. The `authorizer` function creates a Hono app with all of the auth server implemented that you can then deploy to AWS Lambda, Cloudflare Workers, or in a container running under nodejs or bun.

The `authorizer` function requires a few things:

```ts
const app = authorizer({
  providers: {
    ...
  },
  storage,
  subjects,
  select: async () => {
    ...
  },
  allow: async () => true,
  success: async (ctx, value) => {
    ...
  }
})
```

First we need to define some providers that are enabled - these are either third party identity providers like Google, Github, etc or built in flows like email/password or pin code. You can also implement you own. Let's try the github provider.

```ts
import { GithubAdapter } from "@openauthjs/core/adapter/github";

const app = authorizer({
  providers: {
    github: GithubAdapter({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ["user:email"],
    }),
  },
  ...
})
```

Adapters take some configuration - since this is a third party identity provider there is no UI to worry about and all it needs is a client ID, secret and some scopes. Let's add the password provider which is a bit more complicated.

```ts
import { PasswordAdapter } from "@openauthjs/core/adapter/password";

```ts
const app = authorizer({
  providers: {
    github: ...,
    password: PasswordAdapter(...),
  },
  ...
})
```

The password adapter is quite complicated as username/password involve a lot of flows. There are a lot of callbacks to implement however you can opt into the default UI which has all of this already implemented for you. The only thing you have to specify is how to send a code for forgot password/email verification.

```ts
import { PasswordAdapter } from "@openauthjs/core/adapter/password";
import { PasswordUI } from "@openauthjs/core/ui/password";

const app = authorizer({
  providers: {
    github: ...,
    password: PasswordAdapter(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
      }),
    ),
  },
  ...
})
```

In this case we are just going to log the code but you would send it over email. Now let's look at the `success` callback - this is what gets triggered when a user has successfully authenticated.

