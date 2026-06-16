import { useState } from "react"
import { signUp } from "../auth/cognito"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSignup = async () => {
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email address")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      await signUp(trimmed, password)
      window.location.assign(`/verify?email=${encodeURIComponent(trimmed)}`)
    } catch (err) {
      setError(err.message || "Couldn't create account")
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

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-sub">Sign up with your email and a password.</p>

          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          />
          <button className="auth-btn" onClick={handleSignup} disabled={loading}>
            {loading ? "SIGNING UP..." : "SIGN UP"}
          </button>

          {error && <p className="auth-error">{error}</p>}

          <a href="/login" className="auth-back">Already have an account? Log in →</a>
        </div>
      </main>
    </div>
  )
}
