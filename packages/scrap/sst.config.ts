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
    const key = new tls.PrivateKey(`Keypair`, {
      algorithm: "RSA",
    });

    const kv = new sst.cloudflare.Kv("AuthKV");

    const auth = new sst.cloudflare.Worker("Auth", {
      handler: "./cloudflare/authorizer.ts",
      link: [kv],
      url: true,
      environment: {
        OPENAUTH_PUBLIC_KEY: $util.secret(key.publicKeyPem),
        OPENAUTH_PRIVATE_KEY: $util.secret(key.privateKeyPemPkcs8),
      },
    });

    const api = new sst.cloudflare.Worker("Api", {
      handler: "./cloudflare/api.ts",
      url: true,
      link: [auth],
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
