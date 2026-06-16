import { useState, useEffect } from "react"
import { getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export default function StylingAssistant() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { track("page_view", { page: "ai_stylist" }) }, [])

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return
    track("ai_assistant_used")
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getIdToken()
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ feature: "assistant", prompt: prompt.trim() }),
      })
      if (!res.ok) throw new Error("AI request failed")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">AI STYLIST</span>
          <h2 className="arena-title">Styling Assistant</h2>
          <p className="arena-sub">
            Describe what you're looking for and get styling suggestions.
          </p>
        </div>

        <div className="ai-section">
          <div className="ai-input-row">
            <input
              className="auth-input ai-text-input"
              type="text"
              placeholder="Describe your vision..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              className="ai-gen-btn"
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "..." : "ASK"}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          {result && (
            <div className="trends-card">
              {result.reasoning && <p className="ai-reasoning">{result.reasoning}</p>}
              {result.garmentType && (
                <p className="ai-reasoning">Garment: {result.garmentType}</p>
              )}
              {!result.reasoning && !result.garmentType && (
                <pre className="ai-reasoning">{JSON.stringify(result, null, 2)}</pre>
              )}
            </div>
          )}
        </div>

        <a href="/" className="order-result-link">← Back to the Arena</a>
      </main>
    </div>
  )
}
