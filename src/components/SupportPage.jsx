import { useState, useEffect, useRef } from "react"
import { getCurrentUser, getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const S = {
  page:  { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" },
  header:{ padding: "1.5rem 2rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:  { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.1em", color: "#e8ff00", textDecoration: "none" },
  body:  { maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem" },
  label: { fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" },
  input: { background: "#0d0d0d", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", padding: "0.65rem 0.75rem", width: "100%", boxSizing: "border-box", marginBottom: "1.25rem", outline: "none" },
  btn:   { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "#e8ff00", color: "#000", border: "none", padding: "0.75rem 1.8rem", cursor: "pointer" },
  th:    { fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "1px solid #1a1a1a" },
  td:    { fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#aaa", padding: "0.75rem 0.75rem", borderBottom: "1px solid #111" },
}

const PRIORITY_COLORS = { LOW: "#555", MEDIUM: "#888", HIGH: "#e8ff00", URGENT: "#ff4444" }
const STATUS_COLORS   = { OPEN: "#e8ff00", IN_PROGRESS: "#64b4ff", RESOLVED: "#00ff88" }

export default function SupportPage() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [form, setForm] = useState({ email: "", subject: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [ticketId, setTicketId] = useState("")
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState("")
  const [showHomeBtn, setShowHomeBtn] = useState(false)
  const homeBtnTimer = useRef(null)

  useEffect(() => {
    track("page_view", { page: "support" })
    getCurrentUser().then(async u => {
      setUser(u)
      if (!u) return
      try {
        const tok = await getIdToken()
        setToken(tok)
        setForm(f => ({ ...f, email: u.email || u.username || "" }))
        const r = await fetch(`${API}/support/tickets`, { headers: { Authorization: `Bearer ${tok}` } })
        if (r.ok) {
          const data = await r.json()
          setTickets(data.tickets || [])
        }
      } catch {}
    })
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.subject || !form.message || (!user && !form.email)) {
      setError("Please fill in all fields.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      track("support_ticket_submit")
      const headers = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      const r = await fetch(`${API}/support/ticket`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (r.ok) {
        setTicketId(data.ticketId)
        setDone(true)
        setShowHomeBtn(true)
        clearTimeout(homeBtnTimer.current)
        homeBtnTimer.current = setTimeout(() => setShowHomeBtn(false), 10000)
      } else {
        setError(data.error || "Submission failed.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
        <a href="/" style={{ color: "#555", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>← HOME</a>
      </header>

      <div style={S.body}>
        <span style={{ ...S.label, color: "#e8ff00", marginBottom: "0.5rem" }}>Help Center</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "2rem", color: "#f0f0f0", margin: "0 0 0.5rem" }}>Support</h1>
        <p style={{ color: "#555", fontSize: "0.78rem", marginBottom: "2.5rem" }}>We respond within 24 hours, Monday–Friday.</p>

        {done ? (
          <div style={{ background: "#141414", border: "1px solid #1a1a1a", padding: "2rem", textAlign: "center" }}>
            <div style={{ color: "#00ff88", fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Ticket Received</div>
            <p style={{ color: "#f0f0f0", fontSize: "0.9rem", margin: "0 0 0.5rem" }}>We'll respond within 24 hours.</p>
            <p style={{ color: "#555", fontSize: "0.72rem" }}>Ticket ID: {ticketId?.slice(0, 8).toUpperCase()}</p>
            <button style={{ ...S.btn, marginTop: "1.25rem" }} onClick={() => { setDone(false); setForm(f => ({ ...f, subject: "", message: "" })) }}>NEW TICKET</button>
          </div>
        ) : (
          <div style={{ background: "#141414", border: "1px solid #1a1a1a", padding: "2rem", marginBottom: "2rem" }}>
            {!user && (
              <>
                <label style={S.label}>Your Email *</label>
                <input style={S.input} type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
              </>
            )}
            <label style={S.label}>Subject *</label>
            <input style={S.input} value={form.subject} onChange={set("subject")} placeholder="What do you need help with?" />
            <label style={S.label}>Message *</label>
            <textarea style={{ ...S.input, minHeight: "120px", resize: "vertical" }} value={form.message} onChange={set("message")} placeholder="Describe your issue in detail..." />
            {error && <p style={{ color: "#ff6666", fontSize: "0.75rem", marginBottom: "1rem" }}>{error}</p>}
            <button style={S.btn} onClick={submit} disabled={submitting}>{submitting ? "SUBMITTING..." : "SUBMIT"}</button>
          </div>
        )}

        {tickets.length > 0 && (
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#e8ff00", textTransform: "uppercase", marginBottom: "1rem" }}>Your Tickets</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date","ID","Subject","Priority","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.ticketId}>
                      <td style={S.td}>{t.createdAt?.slice(0, 10)}</td>
                      <td style={S.td}>{t.ticketId?.slice(0, 8).toUpperCase()}</td>
                      <td style={S.td}>{t.subject}</td>
                      <td style={S.td}><span style={{ color: PRIORITY_COLORS[t.priority] || "#555", fontSize: "0.6rem" }}>{t.priority}</span></td>
                      <td style={S.td}><span style={{ color: STATUS_COLORS[t.status] || "#555", fontSize: "0.6rem" }}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showHomeBtn && (
        <a href="/" style={{
          position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 200,
          fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em",
          textTransform: "uppercase", background: "#e8ff00", color: "#000",
          padding: "0.6rem 1.2rem", textDecoration: "none",
        }}>⌂ HOME</a>
      )}
    </div>
  )
}
