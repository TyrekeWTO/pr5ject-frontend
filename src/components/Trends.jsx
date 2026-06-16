import { useState, useEffect } from "react"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export default function Trends() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/leaderboard`)
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setDesigns(data.leaderboard || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="app">
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">TRENDS</span>
          <h2 className="arena-title">Top Designs</h2>
          <p className="arena-sub">
            See what's leading the Arena right now.
          </p>
        </div>

        {loading && <p className="arena-sub">Loading...</p>}

        {error && (
          <div className="error-state">
            <span className="error-icon">⚠</span>
            <p>API offline — {error}</p>
          </div>
        )}

        {!loading && !error && designs.length === 0 && (
          <div className="empty-state">
            <p>No designs in the Arena yet.</p>
          </div>
        )}

        {!loading && !error && designs.length > 0 && (
          <div className="designs-grid">
            {designs.map((design) => (
              <div key={design.designId} className="trends-card">
                <div className="trends-card-label">
                  {design.garmentType ? design.garmentType.replace(/-/g, " ") : "Design"}
                </div>
                <div className="trends-card-value">
                  {design.voteCount ?? 0} votes
                </div>
                <div className="card-creator">
                  by <span>{design.creatorId || "unknown"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <a href="/" className="order-result-link">← Back to the Arena</a>
      </main>
    </div>
  )
}
