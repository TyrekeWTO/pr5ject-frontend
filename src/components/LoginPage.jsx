import { useState, useEffect } from "react"
import { signIn } from "../auth/cognito"
import { track } from "../utils/track"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { track("page_view", { page: "login" }) }, [])

  const handleLogin = async () => {
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email address")
      return
    }
    if (!password) {
      setError("Enter your password")
      return
    }
    track("login_attempt")
    setLoading(true)
    try {
      const session = await signIn(trimmed, password)
      if (session && session.challengeName === "NEW_PASSWORD_REQUIRED") {
        window.location.assign(`/new-password?email=${encodeURIComponent(trimmed)}`)
        return
      }
      track("login_success")
      window.location.assign("/ai")
    } catch (err) {
      track("login_error", { message: err.message })
      setError(err.message || "Couldn't log in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <main className="main auth-page">
        <div className="auth-box">
          <div className="auth-brand">
            <span className="auth-logo">PR5JECT</span>
            <span className="auth-tagline">THE CLOTHING CLOUD</span>
          </div>

          <h2 className="auth-title">Log In</h2>
          <p className="auth-sub">Welcome back.</p>

          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="auth-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>

          {error && <p className="auth-error">{error}</p>}

          <a href="/signup" className="auth-back">Need an account? Sign up →</a>
        </div>
      </main>
    </div>
  )
}
