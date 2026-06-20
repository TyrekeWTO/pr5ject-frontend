import { useState } from "react"
import { getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const GARMENT_TYPES = [
  "cargo-shorts",
  "tactical-hoodie",
  "utility-vest",
  "track-pants",
  "bomber-jacket",
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SubmitScreen({ onSubmitted, onDismiss }) {
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0])
  const [color, setColor] = useState("")
  const [material, setMaterial] = useState("")
  const [fit, setFit] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)

  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReasoning, setAiReasoning] = useState(null)

  const [feasibility, setFeasibility] = useState(null)
  const [feasibilityLoading, setFeasibilityLoading] = useState(false)

  const handleAiAssist = async () => {
    if (!aiPrompt.trim() || aiLoading) return
    track("ai_assist_used")
    setAiLoading(true)
    setAiReasoning(null)
    try {
      const token = await getIdToken()
      console.log("[AI] token present:", !!token)
      if (!token) throw new Error("Not logged in")
      const body = { feature: "assistant", prompt: aiPrompt.trim() }
      if (imageFile) {
        const imageBase64 = await fileToBase64(imageFile)
        body.imageBase64 = imageBase64
        body.imageType = imageFile.type
      }
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("AI call failed")
      const data = await res.json()
      if (data.garmentType && GARMENT_TYPES.includes(data.garmentType)) {
        setGarmentType(data.garmentType)
      }
      const cfg = data.configuration
      if (Array.isArray(cfg)) {
        if (cfg[0] !== undefined) setColor(cfg[0])
        if (cfg[1] !== undefined) setMaterial(cfg[1])
        if (cfg[2] !== undefined) setFit(cfg[2])
      } else if (cfg && typeof cfg === "object") {
        if (cfg.color !== undefined) setColor(cfg.color)
        if (cfg.material !== undefined) setMaterial(cfg.material)
        if (cfg.fit !== undefined) setFit(cfg.fit)
      }
      if (data.reasoning) setAiReasoning(data.reasoning)
    } catch (err) {
      console.warn("AI assist failed:", err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleFeasibility = async () => {
    if (feasibilityLoading) return
    track("feasibility_checked")
    setFeasibilityLoading(true)
    setFeasibility(null)
    try {
      const token = await getIdToken()
      console.log("[AI] token present:", !!token)
      if (!token) throw new Error("Not logged in")
      const configuration = {}
      if (color.trim()) configuration.color = color.trim()
      if (material.trim()) configuration.material = material.trim()
      if (fit.trim()) configuration.fit = fit.trim()
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature: "feasibility",
          design: { garmentType, configuration },
        }),
      })
      if (!res.ok) throw new Error("Feasibility check failed")
      const data = await res.json()
      setFeasibility(data)
    } catch (err) {
      console.warn("Feasibility check failed:", err)
    } finally {
      setFeasibilityLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const token = await getIdToken()

      const configuration = {}
      if (color.trim()) configuration.color = color.trim()
      if (material.trim()) configuration.material = material.trim()
      if (fit.trim()) configuration.fit = fit.trim()

      const res = await fetch(`${API_BASE}/designs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ garmentType, configuration }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Submission failed")
      }

      const { designId } = await res.json()
      track("design_submitted", { garmentType })

      if (imageFile && designId) {
        setUploadingImage(true)
        try {
          const urlRes = await fetch(`${API_BASE}/designs/${designId}/upload-url`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ designId, contentType: imageFile.type }),
          })
          if (urlRes.ok) {
            const { uploadUrl } = await urlRes.json()
            await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": imageFile.type },
              body: imageFile,
            })
          }
        } catch (imgErr) {
          console.warn("Image upload failed:", imgErr)
        } finally {
          setUploadingImage(false)
        }
      }

      onSubmitted()
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const btnLabel = loading
    ? uploadingImage ? "UPLOADING IMAGE..." : "SUBMITTING..."
    : "SUBMIT DESIGN"

  const feasibilityClass = feasibility?.level
    ? { HIGH: "high", MEDIUM: "medium", LOW: "low", IMPOSSIBLE: "impossible" }[feasibility.level] || ""
    : ""

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div className="auth-box submit-box">
        {onDismiss && (
          <button className="auth-close" onClick={onDismiss} aria-label="Close">✕</button>
        )}
        <div className="auth-brand">
          <span className="auth-logo">PR5JECT</span>
          <span className="auth-tagline">SUBMIT A DESIGN</span>
        </div>

        <h2 className="auth-title">Drop a Design</h2>
        <p className="auth-sub">50 pre-orders funds it. Creator gets theirs free.</p>

        <div className="ai-section">
          <span className="ai-section-label">AI ASSISTANT</span>
          <div className="ai-input-row">
            <input
              className="auth-input ai-text-input"
              type="text"
              placeholder="Describe your vision..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiAssist()}
            />
            <button
              className="ai-gen-btn"
              onClick={handleAiAssist}
              disabled={aiLoading || !aiPrompt.trim()}
            >
              {aiLoading ? "..." : "GENERATE"}
            </button>
          </div>
          {aiReasoning && (
            <p className="ai-reasoning">AI suggestion: {aiReasoning}</p>
          )}
        </div>

        <label className="submit-label">Garment type</label>
        <select
          className="auth-input submit-select"
          value={garmentType}
          onChange={(e) => setGarmentType(e.target.value)}
        >
          {GARMENT_TYPES.map((g) => (
            <option key={g} value={g}>{g.replace(/-/g, " ")}</option>
          ))}
        </select>

        <label className="submit-label">Color</label>
        <input
          className="auth-input"
          type="text"
          placeholder="e.g. black, olive, sand"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <label className="submit-label">Material</label>
        <input
          className="auth-input"
          type="text"
          placeholder="e.g. ripstop, fleece, cotton"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
        />

        <label className="submit-label">Fit</label>
        <input
          className="auth-input"
          type="text"
          placeholder="e.g. relaxed, slim, oversized"
          value={fit}
          onChange={(e) => setFit(e.target.value)}
        />

        <label className="submit-label">
          Design image <span className="submit-optional">(optional)</span>
        </label>
        <div className="file-picker-wrap">
          <input
            id="design-image-input"
            type="file"
            accept="image/jpeg,image/png"
            className="file-input-hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="design-image-input" className="file-picker-btn">
            {imageFile ? imageFile.name : "Choose JPG or PNG"}
          </label>
          {imageFile && (
            <button className="file-clear" onClick={() => setImageFile(null)}>✕</button>
          )}
        </div>

        {feasibility && (
          <div className={`feasibility-wrap ${feasibilityClass}`}>
            <span className="feasibility-level-badge">{feasibility.level}</span>
            {feasibility.suggestion && (
              <p className="feasibility-note">{feasibility.suggestion}</p>
            )}
          </div>
        )}

        <div className="submit-actions">
          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {btnLabel}
          </button>
          <button
            className="feasibility-btn"
            onClick={handleFeasibility}
            disabled={loading || feasibilityLoading}
          >
            {feasibilityLoading ? "CHECKING..." : "FEASIBILITY"}
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}
