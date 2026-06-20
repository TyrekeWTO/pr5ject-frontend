import { useState, useEffect } from "react"
import { getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const AI_GENERATE_URL = import.meta.env.VITE_AI_GENERATE_URL || `${API_BASE}/ai/generate`

export default function DesignGenerator() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { track("page_view", { page: "generate" }) }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getIdToken()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)
      const res = await fetch(AI_GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: prompt.trim(), styleContext: "" }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error("AI request failed")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const configuration = result?.configuration
  const configEntries = configuration && typeof configuration === "object" && !Array.isArray(configuration)
    ? Object.entries(configuration)
    : []

  return (
    <div className="app">
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">AI DESIGN</span>
          <h2 className="arena-title">Design Generator</h2>
          <p className="arena-sub">
            Describe a garment and get a generated configuration.
          </p>
        </div>

        <div className="ai-section">
          <div className="ai-input-row">
            <input
              className="auth-input ai-text-input"
              type="text"
              placeholder="e.g. a black ripstop tactical hoodie, oversized fit"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              className="ai-gen-btn"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "..." : "GENERATE"}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          {result && (
            <div className="trends-card">
              <div className="card-img-wrap loaded">
                <div className="card-img placeholder-img">No preview yet</div>
              </div>

              {result.garmentType && (
                <div className="trends-card-label">Garment: {result.garmentType}</div>
              )}

              {configEntries.length > 0 && (
                <div className="config-chips">
                  {configEntries.map(([key, val]) => (
                    <span key={key} className="chip">{key}: {val}</span>
                  ))}
                </div>
              )}

              {result.reasoning && <p className="ai-reasoning">{result.reasoning}</p>}
            </div>
          )}
        </div>

        <a href="/" className="order-result-link">← Back to the Arena</a>
      </main>
    </div>
  )
}

