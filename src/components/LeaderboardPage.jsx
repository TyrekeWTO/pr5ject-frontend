import { useState, useEffect } from "react"
import { getCurrentUser, getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const RANK_COLORS = {
  LEGEND:   { bg: "rgba(232,255,0,0.15)",  text: "#e8ff00",  border: "#e8ff00" },
  ELITE:    { bg: "rgba(0,255,136,0.12)",  text: "#00ff88",  border: "#00ff88" },
  CREATOR:  { bg: "rgba(100,180,255,0.12)", text: "#64b4ff", border: "#64b4ff" },
  MEMBER:   { bg: "rgba(200,200,200,0.08)", text: "#aaa",    border: "#444"    },
  NEWCOMER: { bg: "rgba(255,255,255,0.04)", text: "#555",    border: "#333"    },
}

function RankBadge({ rank }) {
  const c = RANK_COLORS[rank] || RANK_COLORS.NEWCOMER
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "'DM Mono', monospace",
      fontSize: "0.55rem",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}33`,
      padding: "0.2rem 0.45rem",
    }}>
      {rank}
    </span>
  )
}

function XpBar({ xp, xpToNextRank, rank }) {
  if (rank === "LEGEND") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ flex: 1, height: "2px", background: "#e8ff00" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#e8ff00" }}>MAX</span>
      </div>
    )
  }
  const thresholds = { NEWCOMER: 500, MEMBER: 1500, CREATOR: 4000, ELITE: 10000 }
  const max = thresholds[rank] || 500
  const start = { NEWCOMER: 0, MEMBER: 500, CREATOR: 1500, ELITE: 4000 }[rank] || 0
  const pct = Math.min(100, Math.round(((xp - start) / (max - start)) * 100))
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: "2px", background: "#1a1a1a", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#e8ff00" }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#444", minWidth: "3.5rem", textAlign: "right" }}>
        {xpToNextRank} to {nextRankName(rank)}
      </span>
    </div>
  )
}

function nextRankName(rank) {
  const next = { NEWCOMER: "MEMBER", MEMBER: "CREATOR", CREATOR: "ELITE", ELITE: "LEGEND" }
  return next[rank] || ""
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    track("page_view", { page: "leaderboard" })
    getCurrentUser().then(u => { if (u) setCurrentUserId(u.userId) })

    fetch(`${API_BASE}/users/leaderboard`)
      .then(r => r.json())
      .then(data => setLeaderboard(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app">
      <main className="main" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#555", textDecoration: "none", letterSpacing: "0.1em" }}>
            ← BACK TO ARENA
          </a>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#e8ff00", display: "block", marginBottom: "0.4rem" }}>
            COMMUNITY
          </span>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: "0.05em", color: "#f0f0f0", margin: 0 }}>
            LEADERBOARD
          </h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555", marginTop: "0.5rem" }}>
            Top creators ranked by XP
          </p>
        </div>

        {loading && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#444", padding: "2rem 0" }}>
            Loading...
          </div>
        )}

        {!loading && leaderboard.length === 0 && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#444", padding: "2rem 0" }}>
            No users yet. Be the first to sign up.
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <div style={{ border: "1px solid #262626" }}>
            {leaderboard.map((entry, i) => {
              const isMe = entry.userId === currentUserId
              return (
                <div
                  key={entry.userId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr auto",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderBottom: i < leaderboard.length - 1 ? "1px solid #1a1a1a" : "none",
                    background: isMe ? "rgba(232,255,0,0.04)" : "transparent",
                  }}
                >
                  {/* Position */}
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    color: i < 3 ? "#e8ff00" : "#333",
                    letterSpacing: "0.05em",
                    textAlign: "center",
                  }}>
                    {entry.position}
                  </div>

                  {/* Username + rank + XP bar */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.8rem",
                        color: isMe ? "#e8ff00" : "#f0f0f0",
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        {entry.username || "anonymous"}
                        {isMe && <span style={{ color: "#555", fontSize: "0.6rem" }}> (you)</span>}
                      </span>
                      <RankBadge rank={entry.rank} />
                    </div>
                    <XpBar xp={entry.xp} xpToNextRank={entry.xpToNextRank} rank={entry.rank} />
                  </div>

                  {/* XP total */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#f0f0f0", letterSpacing: "0.05em" }}>
                      {entry.xp.toLocaleString()}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "#444", letterSpacing: "0.2em" }}>
                      XP
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: "3rem", padding: "1.5rem", border: "1px solid #262626", background: "#0d0d0d" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.25em", color: "#555", display: "block", marginBottom: "0.75rem" }}>
            HOW TO EARN XP
          </span>
          {[
            ["Sign up", "+100 XP"],
            ["Submit first design", "+200 XP"],
            ["Place an order", "+150 XP"],
            ["Daily login", "+10 XP"],
            ["Referral places order", "+250 XP"],
            ["Solve a puzzle", "Varies"],
          ].map(([action, reward]) => (
            <div key={action} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #141414" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#888" }}>{action}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#e8ff00" }}>{reward}</span>
            </div>
          ))}
          <div style={{ marginTop: "1rem", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#333" }}>
            Leaderboard refreshes hourly
          </div>
        </div>
      </main>
    </div>
  )
}
