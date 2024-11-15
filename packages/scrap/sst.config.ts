/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "scrap",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
      providers: { random: "4.16.7", tls: "5.0.9" },
    };
  },
  async run() {
    const kv = new sst.cloudflare.Kv("AuthKV");

    const auth = new sst.cloudflare.Worker("Auth", {
      handler: "./cloudflare/authorizer.ts",
      domain: "auth.sst.cheap",
      link: [kv],
      url: true,
    });

    const api = new sst.cloudflare.Worker("Api", {
      handler: "./cloudflare/api.ts",
      url: true,
      link: [auth],
      domain: "api.sst.cheap",
      environment: {
        OPENAUTH_ISSUER: auth.url.apply((v) => v!),
      },
    });

    return {
      api: api.url,
      url: auth.url,
    };
  },
});
