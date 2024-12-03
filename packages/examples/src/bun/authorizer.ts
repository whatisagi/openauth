import { authorizer } from "@openauthjs/core";
import { MemoryStorage } from "@openauthjs/core/storage/memory";
import { PasswordAdapter } from "@openauthjs/core/adapter/password";
import { PasswordUI } from "@openauthjs/core/ui/password";
import { CodeAdapter } from "@openauthjs/core/adapter/code";
import { CodeUI } from "@openauthjs/core/ui/code";
import { Select } from "@openauthjs/core/ui/select";
import { TwitchAdapter } from "@openauthjs/core/adapter/twitch";
import { GithubAdapter } from "@openauthjs/core/adapter/github";
import { GoogleAdapter } from "@openauthjs/core/adapter/google";
import { subjects } from "../subjects.js";
import { Theme, THEME_VERCEL } from "@openauthjs/core/ui/theme";

const theme = THEME_VERCEL;

export default authorizer({
  subjects,
  select: Select({
    theme,
  }),
  storage: MemoryStorage({
    persist: "./persist.json",
  }),
  providers: {
    password: PasswordAdapter(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
        theme,
      }),
    ),
    code: CodeAdapter<{ email: string }>(
      CodeUI({
        sendCode: async (code, claims) => {
          console.log(code, claims);
        },
        theme,
      }),
    ),
    twitch: TwitchAdapter({
      clientID: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      scopes: ["user:read:email"],
    }),
    google: GoogleAdapter({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ["openid", "email"],
    }),
    github: GithubAdapter({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ["user:email"],
    }),
  },
  allow: async () => true,
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.session("user", {
        email: value.email,
      });
    }

    return Response.json(value);
  },
});
