import { useState } from "react"
import { getIdToken } from "../auth/cognito"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const GARMENT_TYPES = [
  "cargo-shorts",
  "tactical-hoodie",
  "utility-vest",
  "track-pants",
  "bomber-jacket",
]

export default function SubmitScreen({ onSubmitted, onDismiss }) {
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0])
  const [color, setColor] = useState("")
  const [material, setMaterial] = useState("")
  const [fit, setFit] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)

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

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {btnLabel}
        </button>

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}
