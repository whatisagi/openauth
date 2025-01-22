import { useEffect } from "react"
import { useAuth } from "./AuthContext"

function App() {
  const auth = useAuth()

  useEffect(() => {
    const hash = new URLSearchParams(location.search.slice(1))
    const code = hash.get("code")
    const state = hash.get("state")

    if (code && state) {
      auth.callback(code, state)
    }
  }, [])

  return auth.authenticating ? (
    <div>Loading...</div>
  ) : (
    <div>
      {auth.userId ? (
        <div>
          <p>
            <span>Logged in</span>
            {auth.userId && <span> as {auth.userId}</span>}
          </p>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={auth.login}>Login with OAuth</button>
      )}
    </div>
  )
}

export default App
