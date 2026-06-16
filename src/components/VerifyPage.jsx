import { useState, useEffect } from "react"
import { confirmSignUp } from "../auth/cognito"
import { track } from "../utils/track"

export default function VerifyPage() {
  const params = new URLSearchParams(window.location.search)
  const [email, setEmail] = useState(params.get("email") || "")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { track("page_view", { page: "verify" }) }, [])

  const handleConfirm = async () => {
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email address")
      return
    }
    if (!code.trim()) {
      setError("Enter the confirmation code")
      return
    }
    track("verify_attempt")
    setLoading(true)
    try {
      await confirmSignUp(trimmed, code.trim())
      track("verify_success")
      window.location.assign("/login")
    } catch (err) {
      track("verify_error", { message: err.message })
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

          <h2 className="auth-title">Verify Email</h2>
          <p className="auth-sub">Enter the code we sent to your email.</p>

          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
          <input
            className="auth-input auth-code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
          <button className="auth-btn" onClick={handleConfirm} disabled={loading}>
            {loading ? "VERIFYING..." : "VERIFY"}
          </button>

          {error && <p className="auth-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
