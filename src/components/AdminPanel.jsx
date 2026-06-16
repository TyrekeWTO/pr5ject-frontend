import { useState, useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const CF_BASE  = "https://d1wxtx6tyeb7i0.cloudfront.net"
const ADMIN_KEY = "437918"

const GARMENT_OPTS = [
  { key: "star-shorts", label: "Star Shorts", colors: ["black", "pink", "sand", "olive"] },
  { key: "five-hoodie", label: "Five Hoodie", colors: ["black", "sand", "olive", "crimson"] },
]

export default function AdminPanel() {
  const [open, setOpen]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Garment photo upload state
  const [gpGarment, setGpGarment] = useState(GARMENT_OPTS[0].key)
  const [gpColor, setGpColor]     = useState(GARMENT_OPTS[0].colors[0])
  const [gpView, setGpView]       = useState("front")
  const [gpFile, setGpFile]       = useState(null)
  const [gpUploading, setGpUploading] = useState(false)
  const [gpResult, setGpResult]   = useState(null)
  const [gpError, setGpError]     = useState(null)
  const gpInputRef = useRef(null)

  const gpGarmentObj = GARMENT_OPTS.find((g) => g.key === gpGarment)

  useEffect(() => {
    fetch(`${API_BASE}/status`)
      .then((r) => r.json())
      .then((data) => setOpen(!!data.open))
      .catch(() => setError("Couldn't load site status"))
  }, [])

  // Reset color when garment changes
  useEffect(() => {
    setGpColor(GARMENT_OPTS.find((g) => g.key === gpGarment)?.colors[0] || "black")
    setGpResult(null)
  }, [gpGarment])

  const handleToggle = async () => {
    if (open === null || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !open, key: ADMIN_KEY }),
      })
      if (!res.ok) throw new Error("Update failed")
      const data = await res.json()
      setOpen(!!data.open)
    } catch (err) {
      setError(err.message || "Couldn't update site status")
    } finally {
      setLoading(false)
    }
  }

  const handleGarmentUpload = async () => {
    if (!gpFile || gpUploading) return
    setGpUploading(true)
    setGpError(null)
    setGpResult(null)
    try {
      // Use a garment-keyed designId so the S3 path is predictable
      const designId = `garment-${gpGarment}-${gpView}-${gpColor}`
      const urlRes = await fetch(`${API_BASE}/designs/${designId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, contentType: gpFile.type }),
      })
      if (!urlRes.ok) throw new Error(`Upload URL failed: ${urlRes.status}`)
      const { uploadUrl } = await urlRes.json()
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": gpFile.type },
        body: gpFile,
      })
      if (!putRes.ok) throw new Error("S3 upload failed")
      const ext = gpFile.type.includes("png") ? "png" : "jpg"
      const cfUrl = `${CF_BASE}/designs/${designId}/image.${ext}`
      setGpResult(cfUrl)
      setGpFile(null)
      if (gpInputRef.current) gpInputRef.current.value = ""
    } catch (err) {
      setGpError(err.message || "Upload failed")
    } finally {
      setGpUploading(false)
    }
  }

  return (
    <div className="app">
      <main className="main auth-page" style={{ flexDirection: "column", justifyContent: "flex-start", gap: "2rem", alignItems: "stretch", maxWidth: 520, margin: "0 auto", padding: "3rem 1rem" }}>

        {/* ── Site Status ── */}
        <div className="auth-box" style={{ position: "static" }}>
          <div className="auth-brand">
            <span className="auth-logo">PR5JECT</span>
            <span className="auth-tagline">ADMIN</span>
          </div>
          <h2 className="auth-title">Site Status</h2>
          <p className="auth-sub">
            {open === null ? "Loading..." : "Toggle whether pr5ject.com is live."}
          </p>
          {open !== null && (
            <button
              className={`admin-toggle ${open ? "is-open" : "is-closed"}`}
              onClick={handleToggle}
              disabled={loading}
            >
              {open ? "OPEN" : "CLOSED"}
            </button>
          )}
          {error && <p className="auth-error">{error}</p>}
        </div>

        {/* ── Garment Photos ── */}
        <div className="auth-box" style={{ position: "static" }}>
          <div className="auth-brand">
            <span className="auth-logo">PR5JECT</span>
            <span className="auth-tagline">GARMENT PHOTOS</span>
          </div>
          <h2 className="auth-title">Upload Garment Photo</h2>
          <p className="auth-sub">
            Upload a garment photo to S3. Copy the CloudFront URL and update the GARMENTS config in DesignStudio.jsx, or use a backend endpoint to store it dynamically.
          </p>

          <label className="submit-label">Garment</label>
          <select
            className="auth-input submit-select"
            value={gpGarment}
            onChange={(e) => setGpGarment(e.target.value)}
          >
            {GARMENT_OPTS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>

          <label className="submit-label">Colorway</label>
          <select
            className="auth-input submit-select"
            value={gpColor}
            onChange={(e) => setGpColor(e.target.value)}
          >
            {(gpGarmentObj?.colors || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="submit-label">View</label>
          <select
            className="auth-input submit-select"
            value={gpView}
            onChange={(e) => setGpView(e.target.value)}
          >
            <option value="front">Front</option>
            <option value="back">Back</option>
          </select>

          <label className="submit-label">Photo file (JPG or PNG)</label>
          <div className="file-picker-wrap">
            <input
              ref={gpInputRef}
              id="gp-file-input"
              type="file"
              accept="image/jpeg,image/png"
              className="file-input-hidden"
              onChange={(e) => setGpFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="gp-file-input" className="file-picker-btn">
              {gpFile ? gpFile.name : "Choose JPG or PNG"}
            </label>
            {gpFile && (
              <button className="file-clear" onClick={() => { setGpFile(null); if (gpInputRef.current) gpInputRef.current.value = "" }}>✕</button>
            )}
          </div>

          <button
            className="auth-btn"
            onClick={handleGarmentUpload}
            disabled={!gpFile || gpUploading}
          >
            {gpUploading ? "UPLOADING..." : "UPLOAD PHOTO"}
          </button>

          {gpResult && (
            <div style={{ marginTop: "1rem" }}>
              <p className="submit-label" style={{ color: "#00ff88" }}>UPLOADED — CLOUDFRONT URL:</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#00ff88", wordBreak: "break-all", marginTop: "0.4rem", padding: "0.5rem", background: "#0d0d0d", border: "1px solid #00ff88" }}>
                {gpResult}
              </p>
            </div>
          )}
          {gpError && <p className="auth-error">{gpError}</p>}
        </div>

      </main>
    </div>
  )
}
