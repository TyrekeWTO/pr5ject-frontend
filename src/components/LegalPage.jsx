import { useState, useRef, useEffect } from "react"
import { getIdToken, getCurrentUser } from "../auth/cognito"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const S = {
  wrap: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontFamily: "'DM Mono', monospace",
  },
  header: {
    borderBottom: "1px solid #262626",
    background: "#0d0d0d",
    padding: "0 2rem",
    display: "flex",
    alignItems: "center",
    height: 56,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "1.4rem",
    letterSpacing: "0.1em",
    color: "#e8ff00",
    textDecoration: "none",
  },
  main: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "3rem 2rem 6rem",
  },
  label: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.3em",
    color: "#e8ff00",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.5rem",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "2rem",
    color: "#f0f0f0",
    margin: "0 0 0.25rem",
  },
  meta: {
    fontSize: "0.65rem",
    color: "#555",
    marginBottom: "2.5rem",
  },
  contentBox: {
    background: "#111",
    border: "1px solid #222",
    padding: "2rem",
    height: 420,
    overflowY: "auto",
    marginBottom: "2rem",
    lineHeight: 1.8,
    fontSize: "0.8rem",
    color: "#ccc",
  },
  h2: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "#f0f0f0",
    marginTop: "1.5rem",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  p: {
    margin: "0 0 1rem",
  },
  scrollHint: {
    fontSize: "0.6rem",
    color: "#444",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#e8ff00",
    cursor: "pointer",
    flexShrink: 0,
  },
  checkLabel: {
    fontSize: "0.75rem",
    color: "#aaa",
    cursor: "pointer",
  },
  btn: {
    width: "100%",
    padding: "0.9rem",
    background: "#e8ff00",
    color: "#0a0a0a",
    border: "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.75rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnDisabled: {
    background: "#1e1e1e",
    color: "#333",
    cursor: "not-allowed",
  },
  success: {
    background: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.2)",
    padding: "1.25rem",
    textAlign: "center",
    marginTop: "1.5rem",
  },
  successText: {
    color: "#00ff88",
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: "0.5rem",
  },
  backLink: {
    color: "#555",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textDecoration: "none",
    display: "inline-block",
    marginTop: "0.75rem",
  },
  error: {
    color: "#ff6666",
    fontSize: "0.7rem",
    marginTop: "1rem",
  },
  footer: {
    borderTop: "1px solid #1a1a1a",
    padding: "2rem",
    textAlign: "center",
    marginTop: "4rem",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    marginBottom: "0.75rem",
  },
  footerLink: {
    color: "#444",
    textDecoration: "none",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  footerCopy: {
    color: "#2a2a2a",
    fontSize: "0.6rem",
  },
}

export default function LegalPage({ documentId, title, sectionLabel, version = "1.0", lastUpdated, children, nextPath = "/" }) {
  const [scrolled,  setScrolled]  = useState(false)
  const [checked,   setChecked]   = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [accepted,  setAccepted]  = useState(false)
  const [error,     setError]     = useState(null)
  const contentRef = useRef(null)

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
    if (atBottom) setScrolled(true)
  }

  const handleAccept = async () => {
    if (!checked || !scrolled || accepting) return
    setError(null)
    setAccepting(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      const token = await getIdToken()
      const res = await fetch(`${API_BASE}/legal/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          document:  documentId,
          version,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      setAccepted(true)
    } catch (err) {
      setError("Failed to record acceptance. Please try again.")
    } finally {
      setAccepting(false)
    }
  }

  const canAccept = scrolled && checked

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
      </div>

      <main style={S.main}>
        <span style={S.label}>{sectionLabel}</span>
        <h1 style={S.title}>{title}</h1>
        <p style={S.meta}>Version {version} &nbsp;·&nbsp; Last updated {lastUpdated}</p>

        {/* Scrollable content */}
        <div ref={contentRef} style={S.contentBox} onScroll={handleScroll}>
          {children}
        </div>

        {!scrolled && (
          <p style={S.scrollHint}>↓ Scroll to the bottom to enable acceptance</p>
        )}

        {!accepted ? (
          <>
            {/* Checkbox */}
            <label style={S.checkRow}>
              <input
                type="checkbox"
                style={S.checkbox}
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span style={S.checkLabel}>I have read and agree to these terms</span>
            </label>

            {/* Accept button */}
            <button
              style={{ ...S.btn, ...(canAccept ? {} : S.btnDisabled) }}
              onClick={handleAccept}
              disabled={!canAccept || accepting}
            >
              {accepting ? "RECORDING..." : "ACCEPT"}
            </button>

            {error && <p style={S.error}>{error}</p>}
          </>
        ) : (
          <div style={S.success}>
            <span style={S.successText}>✓ ACCEPTED — {title.toUpperCase()}</span>
            <a href={nextPath} style={S.backLink}>← Continue</a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerLinks}>
          <a href="/terms"              style={S.footerLink}>Terms</a>
          <a href="/privacy"            style={S.footerLink}>Privacy</a>
          <a href="/creator-agreement"  style={S.footerLink}>Creator Agreement</a>
        </div>
        <p style={S.footerCopy}>© {new Date().getFullYear()} PR5JECT. All rights reserved.</p>
      </footer>
    </div>
  )
}
