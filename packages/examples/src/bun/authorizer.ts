import { authorizer } from "@openauthjs/core";
import { MemoryStorage } from "@openauthjs/core/storage/memory";
import { TwitchAdapter } from "@openauthjs/core/adapter/twitch";
import { GoogleOidcAdapter } from "@openauthjs/core/adapter/google";
import { subjects } from "../subjects.js";

export default authorizer({
  subjects,
  storage: MemoryStorage(),
  providers: {
    twitch: TwitchAdapter({
      clientID: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      scopes: ["user_read", "user:read:email"],
    }),
    google: GoogleOidcAdapter({
      clientID:
        "43908644348-ficcruqi5btsf2kgt3bjgvqveemh103m.apps.googleusercontent.com",
    }),
  },
  allow: async () => true,
  success: async (ctx, value) => {
    if (value.provider === "twitch") {
      const response = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${value.tokenset.access}`,
          "Client-Id": value.clientID,
          "Content-Type": "application/json",
        },
      }).then((r) => r.json() as any);
      console.log(response);
      return ctx.session("user", {
        email: response.data[0].email,
      });
    }

    if (value.provider === "google" && value.id.email_verified) {
      return ctx.session("user", {
        email: value.id.email as string,
      });
    }
    return Response.json(value);
  },
});
