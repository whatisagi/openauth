import {
  useRef,
  useState,
  ReactNode,
  useEffect,
  useContext,
  createContext,
} from "react"
import { createClient } from "@openauthjs/openauth/client"

const client = createClient({
  clientID: "react",
  issuer: "http://localhost:3000",
})

interface AuthContextType {
  userId?: string
  authenticating: boolean
  logout: () => void
  login: () => Promise<void>
  accessToken: () => Promise<string | undefined>
}

const AuthContext = createContext({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const initializing = useRef(true)
  const token = useRef<string | undefined>(undefined)
  const [userId, setUserId] = useState<string | undefined>()
  const [authenticating, setAuthenticating] = useState(true)

  useEffect(() => {
    const hash = new URLSearchParams(location.search.slice(1))
    const code = hash.get("code")
    const state = hash.get("state")

    if (code && state) {
      callback(code, state)
    }

    if (initializing.current) {
      initializing.current = false
      auth()
    }
  }, [])

  async function auth() {
    const token = await getToken()

    setAuthenticating(false)

    if (token) {
      await user()
    }
  }

  async function getToken() {
    const refresh = localStorage.getItem("refresh")
    if (!refresh) return
    const next = await client.refresh(refresh, {
      access: token.current,
    })
    if (next.err) return
    if (!next.tokens) return token.current

    localStorage.setItem("refresh", next.tokens.refresh)
    token.current = next.tokens.access

    return next.tokens.access
  }

  async function accessToken() {
    const token = await getToken()

    if (!token) {
      await login()
      return
    }

    return token
  }

  async function login() {
    const { challenge, url } = await client.authorize(location.origin, "code", {
      pkce: true,
    })
    sessionStorage.setItem("challenge", JSON.stringify(challenge))
    location.href = url
  }

  async function callback(code: string, state: string) {
    const challenge = JSON.parse(sessionStorage.getItem("challenge")!)
    if (code) {
      if (state === challenge.state && challenge.verifier) {
        const exchanged = await client.exchange(
          code!,
          location.origin,
          challenge.verifier,
        )
        if (!exchanged.err) {
          token.current = exchanged.tokens?.access
          localStorage.setItem("refresh", exchanged.tokens.refresh)
        }
      }
      window.location.replace("/")
    }
  }

  async function user() {
    const res = await fetch("http://localhost:3001/", {
      headers: {
        Authorization: `Bearer ${token.current}`,
      },
    })

    res.ok && setUserId(await res.text())
  }

  function logout() {
    localStorage.removeItem("refresh")
    token.current = undefined

    window.location.replace("/")
  }

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        userId,
        accessToken,
        authenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
