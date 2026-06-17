import { useState, useRef } from "react"
import { track } from "../utils/track"

const API = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const S = {
  page:  { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" },
  header:{ padding: "1.5rem 2rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:  { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.1em", color: "#e8ff00", textDecoration: "none" },
  body:  { maxWidth: "640px", margin: "0 auto", padding: "3rem 2rem" },
  label: { fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" },
  input: { background: "#0d0d0d", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", padding: "0.65rem 0.75rem", width: "100%", boxSizing: "border-box", marginBottom: "1.25rem", outline: "none" },
  btn:   { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "#e8ff00", color: "#000", border: "none", padding: "0.75rem 1.8rem", cursor: "pointer" },
}

export default function DmcaPage() {
  const [form, setForm] = useState({ reporterName: "", reporterEmail: "", designId: "", description: "", originalWork: "", goodFaithStatement: "", signature: "" })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [reportId, setReportId] = useState("")
  const [error, setError] = useState("")
  const [showHomeBtn, setShowHomeBtn] = useState(false)
  const homeBtnTimer = useRef(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.reporterName || !form.reporterEmail || !form.designId || !form.signature) {
      setError("Please fill in all required fields.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      track("dmca_report")
      const r = await fetch(`${API}/dmca/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (r.ok) {
        setReportId(data.reportId)
        setDone(true)
        setShowHomeBtn(true)
        clearTimeout(homeBtnTimer.current)
        homeBtnTimer.current = setTimeout(() => setShowHomeBtn(false), 10000)
      } else {
        setError(data.error || "Submission failed. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
      </header>
      <div style={{ ...S.body, textAlign: "center", paddingTop: "5rem" }}>
        <div style={{ color: "#e8ff00", fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1rem" }}>Report Filed</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "2rem", color: "#f0f0f0", marginBottom: "1rem" }}>We've received your DMCA report.</h1>
        <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Report ID: <span style={{ color: "#e8ff00" }}>{reportId?.slice(0, 8).toUpperCase()}</span></p>
        <p style={{ color: "#555", fontSize: "0.78rem" }}>We will respond within 10 business days.</p>
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

  return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
        <a href="/" style={{ color: "#555", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>← HOME</a>
      </header>

      <div style={S.body}>
        <span style={{ ...S.label, color: "#e8ff00", marginBottom: "0.5rem" }}>Intellectual Property</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "2rem", color: "#f0f0f0", margin: "0 0 0.5rem" }}>DMCA Takedown Notice</h1>
        <p style={{ color: "#555", fontSize: "0.78rem", marginBottom: "2.5rem" }}>
          Use this form to report copyright infringement. We take IP rights seriously and will respond within 10 business days.
        </p>

        <label style={S.label}>Your Name *</label>
        <input style={S.input} value={form.reporterName} onChange={set("reporterName")} placeholder="Full legal name" />

        <label style={S.label}>Your Email *</label>
        <input style={S.input} type="email" value={form.reporterEmail} onChange={set("reporterEmail")} placeholder="email@example.com" />

        <label style={S.label}>Design ID or URL *</label>
        <input style={S.input} value={form.designId} onChange={set("designId")} placeholder="Design ID (e.g. abc123) or pr5ject.com/design/..." />

        <label style={S.label}>Description of Infringement</label>
        <textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Describe how this design infringes your copyright..." />

        <label style={S.label}>Description of Your Original Work</label>
        <textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.originalWork} onChange={set("originalWork")} placeholder="Describe your original copyrighted work..." />

        <label style={S.label}>Good Faith Statement</label>
        <textarea style={{ ...S.input, minHeight: "60px", resize: "vertical" }} value={form.goodFaithStatement} onChange={set("goodFaithStatement")} placeholder="I have a good faith belief that the use of the copyrighted material is not authorized..." />

        <label style={S.label}>Digital Signature *</label>
        <input style={S.input} value={form.signature} onChange={set("signature")} placeholder="Type your full legal name as signature" />

        {error && <p style={{ color: "#ff6666", fontSize: "0.75rem", marginBottom: "1rem" }}>{error}</p>}

        <button style={S.btn} onClick={submit} disabled={submitting}>
          {submitting ? "SUBMITTING..." : "SUBMIT DMCA REPORT"}
        </button>

        <p style={{ color: "#444", fontSize: "0.65rem", marginTop: "1.5rem" }}>
          False DMCA reports may result in legal liability. By submitting this form, you certify under penalty of perjury that the information is accurate.
        </p>
      </div>
    </div>
  )
}
