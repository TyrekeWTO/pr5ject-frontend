import { useState, useEffect } from "react"
import { getCurrentUser, getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export default function PuzzlePage() {
  const [puzzles, setPuzzles] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState({})
  const [submitting, setSubmitting] = useState({})

  useEffect(() => {
    track("page_view", { page: "puzzles" })

    fetch(`${API_BASE}/puzzles`)
      .then(r => r.json())
      .then(data => setPuzzles(data.puzzles || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    getCurrentUser().then(async u => {
      if (!u) return setUser(null)
      setUser(u)
      try {
        const token = await getIdToken()
        const r = await fetch(`${API_BASE}/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) setProfile(await r.json())
      } catch {}
    })
  }, [])

  const handleSubmit = async (puzzleId) => {
    if (!user) { window.location.assign("/login"); return }
    const answer = (answers[puzzleId] || "").trim()
    if (!answer) return

    setSubmitting(s => ({ ...s, [puzzleId]: true }))
    try {
      const token = await getIdToken()
      const r = await fetch(`${API_BASE}/puzzles/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ puzzleId, answer }),
      })
      const data = await r.json()
      setResults(prev => ({ ...prev, [puzzleId]: data }))

      if (data.correct && !data.alreadySolved && data.reward > 0) {
        // Refresh profile to show updated XP
        const pr = await fetch(`${API_BASE}/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (pr.ok) setProfile(await pr.json())
      }
    } catch {
      setResults(prev => ({ ...prev, [puzzleId]: { correct: false, hint: "Error submitting. Try again." } }))
    } finally {
      setSubmitting(s => ({ ...s, [puzzleId]: false }))
    }
  }

  const solvedIds = new Set(profile?.puzzlesSolved || [])

  return (
    <div className="app">
      <main className="main" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#555", textDecoration: "none", letterSpacing: "0.1em" }}>
            ← BACK TO ARENA
          </a>
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#e8ff00", display: "block", marginBottom: "0.4rem" }}>
            CHALLENGES
          </span>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: "0.05em", color: "#f0f0f0", margin: 0 }}>
            PUZZLES
          </h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555", marginTop: "0.5rem" }}>
            Solve puzzles to earn XP. Correct answer required — no hints until you try.
          </p>
        </div>

        {profile && (
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.75rem 1rem",
            border: "1px solid #262626",
            marginBottom: "2rem",
            background: "#0d0d0d",
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#555" }}>Your XP</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#e8ff00", letterSpacing: "0.05em" }}>
              {profile.xp.toLocaleString()}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#444" }}>
              {solvedIds.size} puzzle{solvedIds.size !== 1 ? "s" : ""} solved
            </span>
          </div>
        )}

        {loading && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#444", padding: "2rem 0" }}>
            Loading puzzles...
          </div>
        )}

        {!loading && puzzles.length === 0 && (
          <div style={{
            padding: "2rem",
            border: "1px solid #262626",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#555" }}>
              No active puzzles right now. Check back soon.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {puzzles.map(puzzle => {
            const alreadySolved = solvedIds.has(puzzle.puzzleId)
            const result = results[puzzle.puzzleId]
            const isSub = submitting[puzzle.puzzleId]

            return (
              <div
                key={puzzle.puzzleId}
                style={{
                  border: `1px solid ${alreadySolved ? "#00ff8844" : "#262626"}`,
                  background: alreadySolved ? "rgba(0,255,136,0.03)" : "#0d0d0d",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.55rem",
                    letterSpacing: "0.2em",
                    color: "#444",
                  }}>
                    REWARD: <span style={{ color: "#e8ff00" }}>+{puzzle.reward} XP</span>
                    {"  ·  "}
                    {puzzle.solvedCount} solved
                  </div>
                  {alreadySolved && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#00ff88", letterSpacing: "0.15em" }}>
                      SOLVED ✓
                    </span>
                  )}
                </div>

                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1rem",
                  color: "#f0f0f0",
                  margin: "0 0 1.25rem",
                  lineHeight: 1.5,
                }}>
                  {puzzle.clue}
                </p>

                {!alreadySolved && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={answers[puzzle.puzzleId] || ""}
                      onChange={e => setAnswers(a => ({ ...a, [puzzle.puzzleId]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleSubmit(puzzle.puzzleId)}
                      style={{
                        flex: 1,
                        background: "#141414",
                        border: "1px solid #333",
                        color: "#f0f0f0",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.8rem",
                        padding: "0.6rem 0.75rem",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handleSubmit(puzzle.puzzleId)}
                      disabled={isSub}
                      style={{
                        background: "#e8ff00",
                        border: "none",
                        color: "#000",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.65rem",
                        letterSpacing: "0.15em",
                        fontWeight: 700,
                        padding: "0.6rem 1.2rem",
                        cursor: isSub ? "not-allowed" : "pointer",
                        opacity: isSub ? 0.6 : 1,
                      }}
                    >
                      {isSub ? "..." : "SUBMIT"}
                    </button>
                  </div>
                )}

                {result && (
                  <div style={{
                    marginTop: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    background: result.correct ? "rgba(0,255,136,0.08)" : "rgba(255,68,68,0.06)",
                    border: `1px solid ${result.correct ? "#00ff8833" : "#ff444422"}`,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.7rem",
                    color: result.correct ? "#00ff88" : "#ff6666",
                  }}>
                    {result.correct
                      ? result.alreadySolved
                        ? "Already solved — no XP awarded again."
                        : `Correct! +${result.reward} XP awarded.`
                      : `Wrong. ${result.hint || ""}`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
