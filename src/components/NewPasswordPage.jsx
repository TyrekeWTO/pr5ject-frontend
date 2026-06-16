import { useState } from "react"
import { completeNewPasswordChallenge } from "../auth/cognito"

export default function NewPasswordPage() {
  const params = new URLSearchParams(window.location.search)
  const [email] = useState(params.get("email") || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setError(null)
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      await completeNewPasswordChallenge(email, password)
      window.location.assign("/ai")
    } catch (err) {
      setError(err.message || "Couldn't set new password")
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

          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-sub">Choose a new password for your account.</p>

          <input
            className="auth-input"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "SAVING..." : "SAVE PASSWORD"}
          </button>

          {error && <p className="auth-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
