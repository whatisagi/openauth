import { createClient } from "@openauthjs/openauth/client"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const client = createClient({
  clientID: "react",
  issuer: "https://auth.thdxr.dev.terminal.shop",
})

let _access: string | undefined
async function getToken() {
  const refresh = localStorage.getItem("refresh")
  if (!refresh) return
  const next = await client.refresh(refresh, {
    access: _access,
  })
  if (next.err) return
  if (!next.tokens) return _access
  localStorage.setItem("refresh", next.tokens.refresh)
  _access = next.tokens.access
  return _access
}

// handle callback
const hash = new URLSearchParams(location.search.slice(1))
const code = hash.get("code")
const state = hash.get("state")
const challenge = JSON.parse(sessionStorage.getItem("challenge")!)
if (code) {
  if (state === challenge.state && challenge.verifier) {
    const exchanged = await client.exchange(code!, location.origin, challenge.verifier)
    if (!exchanged.err) {
      _access = exchanged.tokens?.access
      localStorage.setItem("refresh", exchanged.tokens.refresh)
    }
  }
  window.history.replaceState({}, '', '/');
}

// check for token or redirect to authorize
const token = await getToken()
if (!token) {
  const { challenge, url } = await client.authorize(location.origin, "code", {
    pkce: true,
  })
  sessionStorage.setItem("challenge", JSON.stringify(challenge))
  location.href = url
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function App() {
  return (
    <button
      onClick={async () => {
        alert(await getToken())
      }}
    >
      See Token
    </button>
  )
}
