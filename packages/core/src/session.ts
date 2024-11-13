import { v1 } from "@standard-schema/spec";
import { SignJWT, importPKCS8, importSPKI, jwtVerify } from "jose";
import process from "node:process";

export type SessionBuilder = ReturnType<typeof defineSession>;

export type SessionSchemas = {
  [key: string]: v1.StandardSchema;
};

export type SessionValues<T extends SessionSchemas> = {
  [type in keyof T]: {
    type: type;
    properties: v1.InferOutput<T[type]>;
  };
}[keyof T];

export function defineSession<SessionTypes extends SessionSchemas = {}>(
  types: SessionTypes,
  options?: { publicKey?: string; privateKey?: string; issuer?: string },
) {
  type WithPublic = SessionTypes & {
    public: v1.StandardSchema<{}, {}>;
  };

  const publicKey = options?.publicKey ?? process.env.AUTH_PUBLIC_KEY;
  const privateKey = options?.privateKey ?? process.env.AUTH_PRIVATE_KEY;
  const spki = publicKey ? importSPKI(publicKey, "RS512") : undefined;
  const pkcs8 = privateKey ? importPKCS8(privateKey, "RS512") : undefined;
  const issuer = options?.issuer ?? "todo-issuer";

  return {
    async verify(
      token: string,
      mode: "access" | "refresh" = "access",
    ): Promise<
      {
        [type in keyof WithPublic]: {
          type: type;
          properties: v1.InferOutput<WithPublic[type]>;
        };
      }[keyof WithPublic]
    > {
      if (!spki) throw new Error("No public key");
      const result = await jwtVerify<{
        mode: "access";
        type: keyof WithPublic;
        properties: v1.InferInput<WithPublic[keyof WithPublic]>;
      }>(token, await spki);
      const validated = await types[result.payload.type]["~standard"].validate(
        result.payload.properties,
      );
      if (!validated.issues && result.payload.mode === mode)
        return {
          type: result.payload.type,
          properties: validated.value,
        } as any;

      throw new Error("Invalid session");
    },
    async create<Type extends keyof WithPublic>(
      type: Type,
      properties: v1.InferInput<WithPublic[Type]>,
      options?: (
        | {
            mode: "access";
            audience?: string;
          }
        | {
            mode: "refresh";
          }
      ) & {
        expiresIn?: number | string | Date;
      },
    ) {
      options ??= {
        mode: "access",
      };
      options.mode ??= "access";
      if (!pkcs8) throw new Error("No private key");
      const parsed = await types[type]["~standard"].validate(properties);
      if (parsed.issues)
        throw new Error(
          "Invalid session properties: " + parsed.issues.map((i) => i.message),
        );
      const token = await new SignJWT({
        mode: options.mode,
        type,
        properties: parsed.value,
        aud: options.mode === "access" ? options?.audience : issuer,
        iss: issuer,
      })
        .setExpirationTime(options?.expiresIn ?? "1yr")
        .setProtectedHeader({ alg: "RS512", typ: "JWT", kid: "sst" })
        .sign(await pkcs8);
      return token;
    },
    types,
  };
}
