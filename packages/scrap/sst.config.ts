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
    const worker = new sst.cloudflare.Worker("Worker", {
      handler: "index.ts",
      url: true,
      environment: {
        OPENAUTH_PUBLIC_KEY: $util.secret(key.publicKeyPem),
        OPENAUTH_PRIVATE_KEY: $util.secret(key.privateKeyPemPkcs8),
      },
    });

    return {
      url: worker.url,
    };
  },
});
