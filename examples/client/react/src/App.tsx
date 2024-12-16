import { useRef, useState, useEffect } from "react"
import { createClient } from "@openauthjs/openauth/client"

const client = createClient({
  clientID: "react",
  issuer: "http://localhost:3000",
})

function App() {
  const initializing = useRef(true)
  const accessToken = useRef<string | undefined>(undefined)
  const [userId, setUserId] = useState<string | undefined>()
  const [isAuthenticating, setIsAuthenticating] = useState(true)

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

    setIsAuthenticating(false)

    if (token) {
      accessToken.current = token
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
        {
          pkce: true,
        },
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

  return isAuthenticating ? (
    <div>Loading...</div>
  ) : (
    <div>
      {accessToken.current ? (
        <div>
          <p>
            <span>Logged in</span>
            {userId && <span> as {userId}</span>}
          </p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Login with OAuth</button>
      )}
    </div>
  )
}

export default App
