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
import { Theme } from "@openauthjs/core/ui/theme";

// 1. use drop in UI as is
// 2. configure theme (colors, fonts, etc)
// 3. add custom css
// 4. copy pastes the ui (structure changes, copy changes)
// 5. ejecting not using ui

const terminal: Theme = {
  title: "terminal",
  radius: "none",
  favicon: "https://www.terminal.shop/favicon.svg",
  logo: {
    dark: "https://www.terminal.shop/images/logo-white.svg",
    light: "https://www.terminal.shop/images/logo-black.svg",
  },
  brand: "#ff5e00",
  background: {
    dark: "rgb(0, 0, 0)",
    light: "rgb(255, 255, 255)",
  },
  font: {
    family: "Geist Mono, monospace",
  },
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap');
  `,
};

const sst: Theme = {
  title: "SST",
  logo: {
    dark: "https://sst.dev/favicon.svg",
    light: "https://sst.dev/favicon.svg",
  },
  background: {
    dark: "#1a1a2d",
    light: "rgb(255, 255, 255)",
  },
  brand: "#f3663f",
  font: {
    family: "Rubik, sans-serif",
  },
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@100;200;300;400;500;600;700;800;900&display=swap');
  `,
};

// const theme = sst;
const theme = terminal;

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
