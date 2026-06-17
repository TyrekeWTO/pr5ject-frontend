import { useState, useEffect } from "react"
import { getCurrentUser, getIdToken } from "../auth/cognito"
import { track } from "../utils/track"

const API = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const CF  = "https://d1wxtx6tyeb7i0.cloudfront.net"

const RANK_COLORS = {
  LEGEND:   "#e8ff00",
  ELITE:    "#00ff88",
  CREATOR:  "#64b4ff",
  MEMBER:   "#aaa",
  NEWCOMER: "#555",
}

const S = {
  page:    { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" },
  header:  { padding: "1.5rem 2rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.1em", color: "#e8ff00", textDecoration: "none" },
  body:    { maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem" },
  avatar:  { width: 80, height: 80, background: "#1a1a1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#555", flexShrink: 0 },
  badge:   (rank) => ({ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: RANK_COLORS[rank] || "#555", border: `1px solid ${(RANK_COLORS[rank] || "#555")}44`, padding: "0.2rem 0.55rem", background: `${(RANK_COLORS[rank] || "#555")}11`, display: "inline-block" }),
  stat:    { textAlign: "center", flex: 1 },
  statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#f0f0f0" },
  statLbl: { fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" },
  btn:     { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "#e8ff00", color: "#000", border: "none", padding: "0.65rem 1.4rem", cursor: "pointer" },
  btnGhost:{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "none", color: "#e8ff00", border: "1px solid #e8ff00", padding: "0.65rem 1.4rem", cursor: "pointer" },
  designCard: { background: "#141414", border: "1px solid #1a1a1a", padding: "0.75rem" },
}

export default function CreatorProfilePage() {
  const username = window.location.pathname.split("/creator/")[1]?.split("?")[0]
  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    track("page_view", { page: "creator_profile", username })
    getCurrentUser().then(setUser)

    if (!username) { setLoading(false); return }
    fetch(`${API}/creators/${username}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setCreator)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [username])

  const handleFollow = async () => {
    if (!user) { window.location.href = `/login?next=/creator/${username}`; return }
    try {
      const token = await getIdToken()
      await fetch(`${API}/creators/${username}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      setFollowing(true)
    } catch {}
  }

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Loading...</div>
  )
  if (!creator) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#555" }}>Creator not found</p>
        <a href="/" style={{ color: "#e8ff00", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>← BACK TO ARENA</a>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
        <a href="/" style={{ color: "#555", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>← ARENA</a>
      </header>

      <div style={S.body}>
        {/* Profile Header */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div style={S.avatar}>{creator.username?.[0]?.toUpperCase() || "?"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "#f0f0f0", margin: 0 }}>{creator.username}</h1>
              <span style={S.badge(creator.rank)}>{creator.rank}</span>
            </div>
            {creator.bio && <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 1rem", maxWidth: 500 }}>{creator.bio}</p>}
            <div style={{ fontSize: "0.6rem", color: "#555" }}>Joined {creator.joinDate?.slice(0, 10)} · {creator.followerCount} followers</div>
          </div>
          <button style={following ? S.btnGhost : S.btn} onClick={handleFollow} disabled={following}>
            {following ? "FOLLOWING" : "FOLLOW"}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "0.5rem", background: "#141414", border: "1px solid #1a1a1a", padding: "1.25rem", marginBottom: "2rem" }}>
          {[
            { val: creator.totalDesigns, lbl: "Designs" },
            { val: creator.totalSales, lbl: "Sales" },
            { val: creator.xp, lbl: "XP" },
          ].map(s => (
            <div key={s.lbl} style={S.stat}>
              <div style={S.statVal}>{s.val || 0}</div>
              <div style={S.statLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Designs gallery */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#e8ff00", textTransform: "uppercase", marginBottom: "1rem" }}>Designs</div>
        {(!creator.designs || creator.designs.length === 0) ? (
          <p style={{ color: "#555", fontSize: "0.78rem" }}>No public designs yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {creator.designs.map(d => (
              <a key={d.designId} href={`/?design=${d.designId}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={S.designCard}>
                  {d.imageUrl ? (
                    <img src={d.imageUrl} alt={d.garmentType} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", marginBottom: "0.5rem", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1", background: "#0d0d0d", marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "0.65rem" }}>NO IMAGE</div>
                  )}
                  <div style={{ fontSize: "0.65rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>{d.garmentType}</div>
                  <div style={{ fontSize: "0.6rem", color: "#555" }}>{d.orderCount || 0} orders · {d.voteCount || 0} votes</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
