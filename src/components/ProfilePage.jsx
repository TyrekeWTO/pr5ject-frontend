import { useState, useEffect } from "react"
import { getCurrentUser, signOut, getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const RANK_COLORS = {
  LEGEND:   { text: "#e8ff00", border: "#e8ff00" },
  ELITE:    { text: "#00ff88", border: "#00ff88" },
  CREATOR:  { text: "#64b4ff", border: "#64b4ff" },
  MEMBER:   { text: "#aaa",    border: "#444"    },
  NEWCOMER: { text: "#555",    border: "#333"    },
}

const RANK_NEXT = { NEWCOMER: 500, MEMBER: 1500, CREATOR: 4000, ELITE: 10000 }
const RANK_START = { NEWCOMER: 0, MEMBER: 500, CREATOR: 1500, ELITE: 4000 }

function RankBadge({ rank }) {
  const c = RANK_COLORS[rank] || RANK_COLORS.NEWCOMER
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: "0.6rem",
      letterSpacing: "0.25em",
      textTransform: "uppercase",
      color: c.text,
      border: `1px solid ${c.border}55`,
      padding: "0.25rem 0.6rem",
      background: `${c.border}11`,
    }}>
      {rank}
    </span>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [checked, setChecked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    track("page_view", { page: "profile" })
    getCurrentUser().then(async (u) => {
      setUser(u)
      setChecked(true)
      if (!u) return

      try {
        const token = await getIdToken()

        // Daily checkin on profile load (silent)
        fetch(`${API_BASE}/users/checkin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})

        const r = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (r.ok) setProfile(await r.json())
      } catch {}
    })
  }, [])

  const handleSignOut = () => {
    track("sign_out")
    signOut()
    window.location.assign("/")
  }

  const copyReferral = () => {
    if (!profile?.referralCode) return
    const link = `${window.location.origin}/signup?ref=${profile.referralCode}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const xp = profile?.xp || 0
  const rank = profile?.rank || "NEWCOMER"
  const xpToNext = profile?.xpToNextRank || 0
  const nextThreshold = RANK_NEXT[rank]
  const startXp = RANK_START[rank] || 0
  const pct = rank === "LEGEND" ? 100 : Math.min(100, Math.round(((xp - startXp) / (nextThreshold - startXp)) * 100))

  return (
    <div className="app">
      <main className="main auth-page">
        <div className="auth-box">
          <div className="auth-brand">
            <span className="auth-logo">PR5JECT</span>
            <span className="auth-tagline">THE CLOTHING CLOUD</span>
          </div>

          <h2 className="auth-title">Profile</h2>

          {!checked && <p className="auth-sub">Loading...</p>}

          {checked && !user && (
            <>
              <p className="auth-sub">You&apos;re not signed in.</p>
              <a href="/login" className="auth-btn" style={{ textAlign: "center", textDecoration: "none" }}>
                LOG IN
              </a>
            </>
          )}

          {checked && user && (
            <>
              <p className="auth-sub">Signed in as</p>
              <p className="nav-user" style={{ marginBottom: "1.5rem", fontSize: "16px" }}>{user.email}</p>

              {profile && (
                <>
                  {/* XP + Rank */}
                  <div style={{
                    border: "1px solid #262626",
                    padding: "1.25rem",
                    marginBottom: "1.25rem",
                    background: "#0d0d0d",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "#f0f0f0", letterSpacing: "0.05em", lineHeight: 1 }}>
                          {xp.toLocaleString()} <span style={{ fontSize: "1rem", color: "#444" }}>XP</span>
                        </div>
                      </div>
                      <RankBadge rank={rank} />
                    </div>

                    {/* XP progress bar */}
                    {rank !== "LEGEND" && (
                      <div>
                        <div style={{ height: "3px", background: "#1a1a1a", position: "relative", marginBottom: "0.4rem" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#e8ff00", transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#444" }}>
                          {xpToNext} XP to next rank
                        </div>
                      </div>
                    )}

                    {rank === "LEGEND" && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#e8ff00" }}>
                        Maximum rank achieved
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {[
                      ["Orders", profile.totalOrders || 0],
                      ["Puzzles Solved", (profile.puzzlesSolved || []).length],
                    ].map(([label, val]) => (
                      <div key={label} style={{ border: "1px solid #262626", padding: "0.75rem", background: "#0d0d0d", textAlign: "center" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{label}</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#f0f0f0", letterSpacing: "0.05em" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Referral link */}
                  {profile.referralCode && (
                    <div style={{ border: "1px solid #262626", padding: "1rem", marginBottom: "1.25rem", background: "#0d0d0d" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "#555", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                        Your Referral Link
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#888", marginBottom: "0.5rem", wordBreak: "break-all" }}>
                        pr5ject.com/signup?ref={profile.referralCode}
                      </div>
                      <button
                        onClick={copyReferral}
                        style={{
                          background: "none",
                          border: "1px solid #333",
                          color: copied ? "#00ff88" : "#e8ff00",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.55rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          padding: "0.3rem 0.7rem",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {copied ? "COPIED!" : "COPY LINK"}
                      </button>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#444", marginTop: "0.4rem" }}>
                        Earn +250 XP + $5 credit when a referral places their first order
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <a href="/leaderboard" style={{
                      flex: 1,
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#555",
                      border: "1px solid #333",
                      padding: "0.6rem",
                    }}>
                      LEADERBOARD
                    </a>
                    <a href="/puzzles" style={{
                      flex: 1,
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#555",
                      border: "1px solid #333",
                      padding: "0.6rem",
                    }}>
                      PUZZLES
                    </a>
                  </div>
                </>
              )}

              <button className="auth-btn" onClick={handleSignOut}>SIGN OUT</button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
