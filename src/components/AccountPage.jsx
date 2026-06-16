import { useState, useEffect } from "react"
import { getCurrentUser, associateSoftwareToken, verifySoftwareToken } from "../auth/cognito"
import { track } from "../utils/track"

const S = {
  page: { minHeight: "100vh", background: "#0a0a0a", padding: "4rem 1rem 6rem" },
  box: { maxWidth: 480, margin: "0 auto" },
  brand: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.1em", color: "#e8ff00", marginBottom: "0.25rem" },
  tag: { fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.3em", color: "#444", textTransform: "uppercase" },
  heading: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", margin: "2rem 0 0.5rem" },
  sub: { fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#666", marginBottom: "1.5rem", lineHeight: 1.7 },
  label: { fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#555", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" },
  input: { width: "100%", background: "#141414", border: "1px solid #2a2a2a", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "1.1rem", padding: "0.75rem 1rem", outline: "none", letterSpacing: "0.3em", textAlign: "center", boxSizing: "border-box", marginBottom: "0.75rem" },
  btn: { width: "100%", background: "#e8ff00", border: "none", color: "#000", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.2em", padding: "0.875rem", cursor: "pointer", fontWeight: 700, marginBottom: "0.5rem" },
  btnGhost: { width: "100%", background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.15em", padding: "0.75rem", cursor: "pointer", marginBottom: "0.5rem" },
  err: { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#ff4444", marginTop: "0.5rem" },
  ok: { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#00ff88", marginTop: "0.5rem" },
  section: { border: "1px solid #1e1e1e", padding: "1.5rem", marginBottom: "1.25rem" },
  secret: { fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", letterSpacing: "0.15em", color: "#e8ff00", background: "#111", border: "1px solid #2a2a2a", padding: "0.75rem 1rem", wordBreak: "break-all", textAlign: "center", marginBottom: "1rem" },
}

export default function AccountPage() {
  const [user, setUser] = useState(null)

  // TOTP setup state
  const [totpSecret, setTotpSecret] = useState(null)
  const [totpCode, setTotpCode] = useState("")
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpError, setTotpError] = useState(null)
  const [totpDone, setTotpDone] = useState(false)
  const [startingSetup, setStartingSetup] = useState(false)

  useEffect(() => {
    track("page_view", { page: "account" })
    getCurrentUser().then(u => {
      if (!u) { window.location.assign("/login"); return }
      setUser(u)
    })
  }, [])

  const startSetup = async () => {
    setTotpError(null)
    setStartingSetup(true)
    track("2fa_setup_started")
    try {
      const secret = await associateSoftwareToken()
      setTotpSecret(secret)
    } catch (e) {
      setTotpError(e.message || "Failed to start 2FA setup")
    } finally {
      setStartingSetup(false)
    }
  }

  const verifyTotp = async () => {
    setTotpError(null)
    if (!totpCode.trim() || totpCode.length < 6) {
      setTotpError("Enter the 6-digit code from your authenticator app")
      return
    }
    setTotpLoading(true)
    try {
      await verifySoftwareToken(totpCode.trim())
      track("2fa_enabled")
      setTotpDone(true)
      setTotpSecret(null)
    } catch (e) {
      setTotpError(e.message || "Invalid code — check your authenticator and try again")
    } finally {
      setTotpLoading(false)
    }
  }

  const otpauthUrl = totpSecret && user
    ? `otpauth://totp/PR5JECT:${encodeURIComponent(user.email)}?secret=${totpSecret}&issuer=PR5JECT`
    : null

  const qrUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : null

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.brand}>PR5JECT</div>
        <div style={S.tag}>Account Security</div>

        <h2 style={S.heading}>Two-Factor Authentication</h2>
        <p style={S.sub}>
          Add an extra layer of security with a TOTP authenticator app
          (Google Authenticator, Authy, 1Password, etc.).
          Once enabled, you&apos;ll need a code from the app each time you log in.
        </p>

        <div style={S.section}>
          {totpDone ? (
            <div style={S.ok}>
              2FA enabled. Your account is now protected with TOTP.
            </div>
          ) : !totpSecret ? (
            <>
              <button
                style={S.btn}
                onClick={startSetup}
                disabled={startingSetup}
              >
                {startingSetup ? "GENERATING..." : "SET UP 2FA"}
              </button>
              {totpError && <div style={S.err}>{totpError}</div>}
            </>
          ) : (
            <>
              <span style={S.label}>Step 1 — Scan this QR code</span>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <img
                  src={qrUrl}
                  alt="TOTP QR code"
                  width={200}
                  height={200}
                  style={{ border: "4px solid #fff", display: "inline-block" }}
                />
              </div>

              <span style={S.label}>Or enter key manually</span>
              <div style={S.secret}>{totpSecret}</div>

              <span style={S.label}>Step 2 — Enter the 6-digit code from your app</span>
              <input
                style={S.input}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && verifyTotp()}
                autoFocus
              />
              <button style={S.btn} onClick={verifyTotp} disabled={totpLoading}>
                {totpLoading ? "VERIFYING..." : "ENABLE 2FA"}
              </button>
              <button style={S.btnGhost} onClick={() => { setTotpSecret(null); setTotpCode(""); setTotpError(null) }}>
                Cancel
              </button>
              {totpError && <div style={S.err}>{totpError}</div>}

              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#444", marginTop: "1rem", lineHeight: 1.7 }}>
                Save your secret key in a secure place. If you lose access to your
                authenticator app, you&apos;ll need this key to recover your account.
              </p>
            </>
          )}
        </div>

        <a href="/profile" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#555", textDecoration: "none" }}>
          ← Back to profile
        </a>
      </div>
    </div>
  )
}
