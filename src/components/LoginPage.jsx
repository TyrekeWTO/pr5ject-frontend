import { useState, useEffect } from "react"
import { signIn, respondToTotpChallenge } from "../auth/cognito"
import { track } from "../utils/track"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [step, setStep] = useState("credentials") // "credentials" | "totp"
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
      if (session && session.challengeName === "SOFTWARE_TOKEN_MFA") {
        setStep("totp")
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

  const handleTotp = async () => {
    setError(null)
    if (!totpCode.trim()) { setError("Enter your 6-digit code"); return }
    setLoading(true)
    try {
      await respondToTotpChallenge(totpCode.trim())
      track("login_success")
      window.location.assign("/ai")
    } catch (err) {
      setError(err.message || "Invalid code")
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

          {step === "credentials" && (
            <>
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
              <a href="/signup" className="auth-back">Need an account? Sign up →</a>
            </>
          )}

          {step === "totp" && (
            <>
              <h2 className="auth-title">Two-Factor Auth</h2>
              <p className="auth-sub">Enter the 6-digit code from your authenticator app.</p>
              <input
                className="auth-input"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleTotp()}
                autoFocus
              />
              <button className="auth-btn" onClick={handleTotp} disabled={loading}>
                {loading ? "VERIFYING..." : "VERIFY"}
              </button>
              <button
                onClick={() => { setStep("credentials"); setError(null); setTotpCode("") }}
                style={{ background: "none", border: "none", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", cursor: "pointer", marginTop: "0.5rem" }}
              >
                ← Back
              </button>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
