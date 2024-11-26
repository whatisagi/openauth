import { authorizer } from "@openauthjs/core";
import { CodeAdapter } from "@openauthjs/core/adapter/code";
import { CodeUI } from "@openauthjs/core/ui/code";
import { handle } from "hono/aws-lambda";
import { DynamoStorage } from "@openauthjs/core/storage/dynamo";
import { subjects } from "../subjects.js";
import { Resource } from "sst";
import { GoogleOidcAdapter } from "@openauthjs/core/adapter/google";
import { PasswordAdapter } from "@openauthjs/core/adapter/password";
import { PasswordUI } from "@openauthjs/core/ui/password";

export const handler = handle(
  authorizer({
    subjects,
    storage: DynamoStorage({
      table: Resource.LambdaAuthTable.name,
    }),
    providers: {
      code: CodeAdapter<{ email: string }>(CodeUI({})),
      google: GoogleOidcAdapter({
        clientID:
          "43908644348-ficcruqi5btsf2kgt3bjgvqveemh103m.apps.googleusercontent.com",
      }),
      password: PasswordAdapter(
        PasswordUI({
          sendCode: async (email, code) => {
            console.log(email, code);
          },
        }),
      ),
    },
    ttl: {
      access: 60,
    },
    allow: async () => true,
    success: async (ctx, value) => {
      if (value.provider === "password") {
        return ctx.session("user", {
          email: value.email,
        });
      }
      if (value.provider === "code")
        return ctx.session("user", {
          email: value.claims.email,
        });
      if (value.provider === "google" && value.id.email_verified) {
        return ctx.session("user", {
          email: value.id.email as string,
        });
      }
      throw new Error("Unknown provider");
    },
  }),
);
