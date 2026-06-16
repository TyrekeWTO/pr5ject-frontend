import { useState, useEffect } from "react"
import { signUp } from "../auth/cognito"
import { track } from "../utils/track"

const US_PHONE_RE = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return null
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    track("page_view", { page: "signup" })
    const ref = new URLSearchParams(window.location.search).get("ref")
    if (ref) sessionStorage.setItem("pr5ject_ref_code", ref.toUpperCase())
  }, [])

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

    let normalizedPhone = null
    if (phone.trim()) {
      normalizedPhone = normalizePhone(phone.trim())
      if (!normalizedPhone) {
        setError("Enter a valid US phone number (e.g. 555-123-4567)")
        return
      }
    }

    track("signup_attempt")
    setLoading(true)
    try {
      await signUp(trimmed, password, normalizedPhone)
      track("signup_success")
      window.location.assign(`/verify?email=${encodeURIComponent(trimmed)}`)
    } catch (err) {
      track("signup_error", { message: err.message })
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

          <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
            Phone (optional) — get VIP early access alerts
          </label>
          <input
            className="auth-input"
            type="tel"
            placeholder="555-123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#444", marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
            Max 2 texts/month. Never spam.
          </p>

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
