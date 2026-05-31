import { useState } from "react"
import { signUp, confirmSignUp, signIn } from "../auth/cognito"

export default function AuthScreen({ onAuthed, onDismiss }) {
  const [step, setStep] = useState("phone") // "phone" | "code"
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Normalize to E.164 (+1 for US). Strips everything but digits.
  const normalizePhone = (raw) => {
    const digits = raw.replace(/\D/g, "")
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
    return `+${digits}`
  }

  const handleSendCode = async () => {
    setError(null)
    const e164 = normalizePhone(phone)
    if (e164.length < 11) {
      setError("Enter a valid phone number")
      return
    }
    setLoading(true)
    try {
      await signUp(e164)
      setPhone(e164)
      setStep("code")
    } catch (err) {
      // If user already exists, Cognito throws — handle gracefully later
      setError(err.message || "Couldn't send code")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      await confirmSignUp(phone, code.trim())
      await signIn(phone)
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

        {step === "phone" && (
          <>
            <h2 className="auth-title">Enter the Arena</h2>
            <p className="auth-sub">Verify your number to vote and pre-order.</p>
            <input
              className="auth-input"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            <p className="auth-sub">Sent to {phone}</p>
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
              onClick={() => { setStep("phone"); setCode(""); setError(null) }}
            >
              ← Use a different number
            </button>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}
