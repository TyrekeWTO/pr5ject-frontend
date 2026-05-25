import { useState, useEffect } from "react"
import DesignCard from "./components/DesignCard"
import Header from "./components/Header"
import LoadingArena from "./components/LoadingArena"

const API_BASE = import.meta.env.VITE_API_BASE || "https://uunez5c7jf.execute-api.us-east-1.amazonaws.com/prod"
export default function App() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const handleVote = async (designId) => {
    try {
      const res = await fetch(`${API_BASE}/designs/${designId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: `anon_${Math.random().toString(36).slice(2, 8)}` }),
      })
      if (!res.ok) throw new Error("Vote failed")
      await fetchLeaderboard()
    } catch (err) {
      console.error("Vote error:", err)
    }
  }

  const handleOrder = async (designId, size) => {
    try {
      const res = await fetch(`${API_BASE}/designs/${designId}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: `anon_${Math.random().toString(36).slice(2, 8)}`,
          size,
        }),
      })
      const data = await res.json()
      await fetchLeaderboard()
      return data
    } catch (err) {
      console.error("Order error:", err)
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">THE ARENA</span>
          <h2 className="arena-title">Live Designs</h2>
          <p className="arena-sub">
            50 pre-orders funds a design. Creator gets theirs free.
          </p>
        </div>

        {loading && <LoadingArena />}

        {error && (
          <div className="error-state">
            <span className="error-icon">⚠</span>
            <p>API offline — {error}</p>
            <button onClick={fetchLeaderboard} className="retry-btn">
              Retry
            </button>
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
              <DesignCard
                key={design.designId}
                design={design}
                onVote={handleVote}
                onOrder={handleOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}