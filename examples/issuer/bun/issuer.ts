import { issuer } from "@openauthjs/openauth"
import { MemoryStorage } from "@openauthjs/openauth/storage/memory"
import { PasswordProvider } from "@openauthjs/openauth/provider/password"
import { PasswordUI } from "@openauthjs/openauth/ui/password"
import { subjects } from "../../subjects.js"

async function getUser(email: string) {
  // Get user from database
  // Return user ID
  return "123"
}

export default issuer({
  subjects,
  storage: MemoryStorage({
    persist: "./persist.json",
  }),
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code)
        },
      }),
    ),
  },
  async allow() {
    return true
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", {
        id: await getUser(value.email),
      })
    }
    throw new Error("Invalid provider")
  },
})
