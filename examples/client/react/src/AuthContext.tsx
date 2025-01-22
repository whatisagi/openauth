import {
  useRef,
  useState,
  ReactNode,
  useEffect,
  useContext,
  createContext,
} from "react";
import { createClient } from "@openauthjs/openauth/client"

const client = createClient({
  clientID: "react",
  issuer: "http://localhost:3000",
})

interface AuthContextType {
  userId?: string;
  accessToken?: string;
  authenticating: boolean;
  login: () => Promise<void>;
  logout: () => void;
  callback: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initializing = useRef(true)
  const accessToken = useRef<string | undefined>(undefined)
  const [userId, setUserId] = useState<string | undefined>()
  const [authenticating, setAuthenticating] = useState(true)

  useEffect(() => {
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
      access: accessToken.current,
    })
    if (next.err) return
    if (!next.tokens) return accessToken.current

    localStorage.setItem("refresh", next.tokens.refresh)
    accessToken.current = next.tokens.access

    return next.tokens.access
  }

  async function login() {
    const token = await getToken()
    if (!token) {
      const { challenge, url } = await client.authorize(
        location.origin,
        "code",
        { pkce: true }
      )
      sessionStorage.setItem("challenge", JSON.stringify(challenge))
      location.href = url
    }
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
          accessToken.current = exchanged.tokens?.access
          localStorage.setItem("refresh", exchanged.tokens.refresh)
        }
      }
      window.location.replace("/")
    }
  }

  async function user() {
    const res = await fetch("http://localhost:3001/", {
      headers: {
        Authorization: `Bearer ${accessToken.current}`,
      },
    })

    res.ok && setUserId(await res.text())
  }

  function logout() {
    localStorage.removeItem("refresh")
    accessToken.current = undefined

    window.location.replace("/")
  }

  return (
    <AuthContext.Provider value={{
      login,
      logout,
      userId,
      callback,
      authenticating,
      accessToken: accessToken.current,
    }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  return useContext(AuthContext);
}
