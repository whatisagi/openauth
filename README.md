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

We'll show how to deploy the auth server and then a sample app that uses it. You can also checkout the [examples](https://github.com/openauthjs/openauthjs/tree/main/packages/examples) folder if you just want to look at code.

### Auth server
