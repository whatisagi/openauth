import { authorizer } from "@openauthjs/openauth";
import { handle } from "hono/aws-lambda";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { subjects } from "../../subjects.js";
import { Resource } from "sst";
import { PasswordAdapter } from "@openauthjs/openauth/adapter/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";

const app = authorizer({
  storage: DynamoStorage({
    table: Resource.LambdaAuthTable.name,
  }),
  subjects,
  providers: {
    password: PasswordAdapter(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
      })
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", {
        email: value.email,
      });
    }
    throw new Error("Invalid provider");
  },
});

// @ts-ignore
export const handler = handle(app);
