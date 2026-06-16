import { useState } from "react"
import { signUp, confirmSignUp, signIn } from "../auth/cognito"

export default function AuthScreen({ onAuthed, onDismiss }) {
  const [step, setStep] = useState("email") // "email" | "code"
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSendCode = async () => {
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email address")
      return
    }
    setLoading(true)
    try {
      await signUp(trimmed)
      setEmail(trimmed)
      setStep("code")
    } catch (err) {
      setError(err.message || "Couldn't send code")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      await confirmSignUp(email, code.trim())
      await signIn(email)
      onAuthed()
    } catch (err) {
      setError(err.message || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div className="auth-box">
        {onDismiss && (
          <button className="auth-close" onClick={onDismiss} aria-label="Close">✕</button>
        )}
        <div className="auth-brand">
          <span className="auth-logo">PR5JECT</span>
          <span className="auth-tagline">THE CLOTHING CLOUD</span>
        </div>

        {step === "email" && (
          <>
            <h2 className="auth-title">Enter the Arena</h2>
            <p className="auth-sub">Verify your email to vote and pre-order.</p>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
            />
            <button
              className="auth-btn"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? "SENDING..." : "SEND CODE"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <h2 className="auth-title">Enter Code</h2>
            <p className="auth-sub">Sent to {email}</p>
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
            <button
              className="auth-btn"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "VERIFYING..." : "VERIFY"}
            </button>
            <button
              className="auth-back"
              onClick={() => { setStep("email"); setCode(""); setError(null) }}
            >
              ← Use a different email
            </button>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}
