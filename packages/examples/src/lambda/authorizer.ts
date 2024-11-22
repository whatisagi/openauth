import { authorizer } from "@openauthjs/core";
import { CodeAdapter } from "@openauthjs/core/adapter/code";
import { CodeUI } from "@openauthjs/core/ui/code";
import { handle } from "hono/aws-lambda";
import { DynamoStorage } from "@openauthjs/core/storage/dynamo";
import { subjects } from "../subjects.js";
import { Resource } from "sst";

export const handler = handle(
  authorizer({
    subjects,
    storage: DynamoStorage({
      table: Resource.LambdaAuthTable.name,
    }),
    providers: {
      code: CodeAdapter<{ email: string }>(CodeUI({})),
    },
    ttl: {
      access: 60,
    },
    allow: async () => true,
    success: async (ctx, value) => {
      return ctx.session("user", {
        email: value.claims.email,
      });
    },
  }),
);
