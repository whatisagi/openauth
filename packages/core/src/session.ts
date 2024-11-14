import { v1 } from "@standard-schema/spec";
import { jwtVerify, JSONWebKeySet, createLocalJWKSet } from "jose";
import process from "node:process";

export type SessionSchemas = {
  [key: string]: v1.StandardSchema;
};

export type SessionValues<T extends SessionSchemas> = {
  [type in keyof T]: {
    type: type;
    properties: v1.InferOutput<T[type]>;
  };
}[keyof T];

export function defineSessions<SessionTypes extends SessionSchemas = {}>(
  types: SessionTypes,
) {
  return {
    ...types,
    public: {
      "~standard": {
        vendor: "sst",
        version: 1,
        validate() {
          return {
            value: {},
            issues: [],
          };
        },
      },
    },
  } as SessionTypes & {
    public: v1.StandardSchema<{}, {}>;
  };
}

const issuerCache = new Map<string, ReturnType<typeof createLocalJWKSet>>();

async function getJWKS(issuer: string, f?: typeof fetch) {
  const cached = issuerCache.get(issuer);
  if (cached) return cached;
  const wellKnown = await (f || fetch)(
    `${issuer}/.well-known/openid-configuration`,
  ).then((r) => r.json() as any);
  const keyset = (await (f || fetch)(wellKnown.jwks_uri).then((r) =>
    r.json(),
  )) as JSONWebKeySet;
  const result = createLocalJWKSet(keyset);
  issuerCache.set(issuer, result);
  return result;
}

export async function verify<T extends SessionSchemas>(
  sessions: T,
  token: string,
  options?: {
    issuer?: string;
    audience?: string;
    fetch?: typeof fetch;
  },
): Promise<
  {
    [type in keyof T]: {
      type: type;
      properties: v1.InferOutput<T[type]>;
    };
  }[keyof T]
> {
  const issuer = options?.issuer || process.env.OPENAUTH_ISSUER;
  if (!issuer) throw new Error("No issuer");
  const jwks = await getJWKS(issuer, options?.fetch);
  const result = await jwtVerify<{
    mode: "access";
    type: keyof T;
    properties: v1.InferInput<T[keyof T]>;
  }>(token, jwks, {
    issuer,
  });
  const validated = await sessions[result.payload.type]["~standard"].validate(
    result.payload.properties,
  );
  if (!validated.issues && result.payload.mode === "access")
    return {
      type: result.payload.type,
      properties: validated.value,
    } as any;

  throw new Error("Invalid session");
}
