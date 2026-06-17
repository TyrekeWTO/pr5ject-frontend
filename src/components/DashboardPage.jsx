import { useState, useEffect } from "react"
import { getCurrentUser, getIdToken, signOut } from "../auth/cognito"
import { track } from "../utils/track"

const API = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const RANK_COLORS = {
  LEGEND:   "#e8ff00",
  ELITE:    "#00ff88",
  CREATOR:  "#64b4ff",
  MEMBER:   "#aaa",
  NEWCOMER: "#555",
}
const TIER_COLORS = {
  LEGEND: "#e8ff00",
  ELITE:  "#00ff88",
  RISING: "#64b4ff",
  STARTER:"#aaa",
}

const S = {
  page:    { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" },
  header:  { padding: "1.5rem 2rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.1em", color: "#e8ff00", textDecoration: "none" },
  nav:     { display: "flex", gap: "1.5rem", alignItems: "center" },
  navBtn:  { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 },
  body:    { maxWidth: "1100px", margin: "0 auto", padding: "2rem" },
  section: { background: "#141414", border: "1px solid #222", padding: "1.75rem 2rem", marginBottom: "1.5rem" },
  label:   { fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#e8ff00", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" },
  title:   { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#f0f0f0", margin: "0 0 1.25rem" },
  stat:    { background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.25rem", flex: 1 },
  statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#f0f0f0", letterSpacing: "0.05em", lineHeight: 1 },
  statLbl: { fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginTop: "0.3rem" },
  tab:     (active) => ({ background: active ? "#1a1a1a" : "none", border: "none", borderBottom: active ? "2px solid #e8ff00" : "2px solid transparent", color: active ? "#f0f0f0" : "#555", padding: "0.6rem 1.2rem", cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase" }),
  th:      { fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "1px solid #1a1a1a" },
  td:      { fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#aaa", padding: "0.75rem 0.75rem", borderBottom: "1px solid #111" },
  btn:     { fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "#e8ff00", color: "#000", border: "none", padding: "0.65rem 1.4rem", cursor: "pointer" },
  btnGhost:{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "none", color: "#e8ff00", border: "1px solid #e8ff00", padding: "0.65rem 1.4rem", cursor: "pointer" },
  input:   { background: "#0d0d0d", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", padding: "0.6rem 0.75rem", width: "100%", boxSizing: "border-box", marginBottom: "0.75rem" },
  badge:   (rank) => ({ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: RANK_COLORS[rank] || "#555", border: `1px solid ${(RANK_COLORS[rank] || "#555")}44`, padding: "0.2rem 0.55rem", background: `${(RANK_COLORS[rank] || "#555")}11`, display: "inline-block" }),
}

function StatRow({ profile, earnings, rank, ambassador }) {
  const xp = profile?.xp || 0
  const rankThresholds = { NEWCOMER: [0, 500], MEMBER: [500, 1500], CREATOR: [1500, 4000], ELITE: [4000, 10000], LEGEND: [10000, 10000] }
  const [lo, hi] = rankThresholds[profile?.rank || "NEWCOMER"] || [0, 500]
  const pct = hi > lo ? Math.min(100, ((xp - lo) / (hi - lo)) * 100) : 100

  return (
    <div style={S.section}>
      <span style={S.label}>Creator Stats</span>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={S.stat}>
          <div style={S.statVal}>{profile?.totalOrders ?? 0}</div>
          <div style={S.statLbl}>Total Sales</div>
        </div>
        <div style={S.stat}>
          <div style={S.statVal}>{rank?.totalDesigns ?? 0}</div>
          <div style={S.statLbl}>Designs</div>
        </div>
        <div style={S.stat}>
          <div style={S.statVal}>${(earnings?.totalEarned || 0).toFixed(2)}</div>
          <div style={S.statLbl}>Total Earned</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statVal, fontSize: "1.2rem" }}>
            <span style={S.badge(profile?.rank)}>{profile?.rank || "NEWCOMER"}</span>
          </div>
          <div style={S.statLbl}>Rank</div>
        </div>
        <div style={S.stat}>
          <div style={S.statVal}>{xp}</div>
          <div style={S.statLbl}>XP</div>
          <div style={{ height: "3px", background: "#1a1a1a", marginTop: "0.5rem" }}>
            <div style={{ height: "100%", background: "#e8ff00", width: `${pct}%`, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: "0.55rem", color: "#555", marginTop: "0.25rem" }}>
            {profile?.xpToNextRank ? `${profile.xpToNextRank} XP to next rank` : "MAX RANK"}
          </div>
        </div>
      </div>
    </div>
  )
}

function EarningsTab({ earnings }) {
  if (!earnings) return <div style={{ color: "#555", padding: "1rem" }}>Loading earnings...</div>
  const txns = earnings.transactions || []
  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={S.stat}>
          <div style={{ ...S.statVal, color: "#e8ff00" }}>${earnings.pendingPayout?.toFixed(2) || "0.00"}</div>
          <div style={S.statLbl}>Pending Payout</div>
          <div style={{ fontSize: "0.6rem", color: "#555", marginTop: "0.3rem" }}>Next: {earnings.nextPayoutDate}</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statVal, color: "#00ff88" }}>${earnings.paidOut?.toFixed(2) || "0.00"}</div>
          <div style={S.statLbl}>Paid Out</div>
        </div>
        <div style={S.stat}>
          <div style={S.statVal}>${earnings.totalEarned?.toFixed(2) || "0.00"}</div>
          <div style={S.statLbl}>Total Earned</div>
        </div>
      </div>
      {txns.length === 0 ? (
        <p style={{ color: "#555", fontSize: "0.8rem" }}>No transactions yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Date","Order ID","Amount","Rate","Earned","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.orderId}>
                  <td style={S.td}>{t.createdAt?.slice(0, 10)}</td>
                  <td style={S.td}>{t.orderId?.slice(0, 8)}...</td>
                  <td style={S.td}>${t.amount?.toFixed(2)}</td>
                  <td style={S.td}>{(t.royaltyRate * 100).toFixed(0)}%</td>
                  <td style={S.td}>${t.royaltyEarned?.toFixed(2)}</td>
                  <td style={S.td}>
                    <span style={{ color: t.status === "paid" ? "#00ff88" : "#e8ff00", fontSize: "0.6rem", textTransform: "uppercase" }}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReferralTab({ profile }) {
  const [copied, setCopied] = useState(false)
  const username = profile?.username || ""
  const link = `https://pr5ject.com/join?ref=${username}`

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  const shareTwitter = () => { window.open(`https://twitter.com/intent/tweet?text=Check out @pr5ject — crowd-funded streetwear. Use my link: ${encodeURIComponent(link)}`, "_blank") }

  return (
    <div>
      <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "1.25rem" }}>
        Share your referral link and earn $5 credit for every order from a friend you refer.
      </p>
      <div style={{ background: "#0d0d0d", border: "1px solid #333", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span style={{ color: "#e8ff00", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", flex: 1, wordBreak: "break-all" }}>{link}</span>
        <button style={S.btn} onClick={copy}>{copied ? "COPIED!" : "COPY LINK"}</button>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button style={S.btnGhost} onClick={shareTwitter}>SHARE ON TWITTER</button>
      </div>
    </div>
  )
}

function AffiliateTab({ token }) {
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({ followersEstimate: "", platforms: [], reason: "" })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!token) return
    fetch(`${API}/affiliate/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStatus).catch(() => {})
  }, [token])

  const platforms = ["Instagram","TikTok","Twitter","YouTube","Other"]

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p]
    }))
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const r = await fetch(`${API}/affiliate/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        setMsg("Application submitted! We'll review within 48 hours.")
        setStatus({ applied: true, status: "PENDING" })
      } else {
        setMsg("Something went wrong. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!status) return <div style={{ color: "#555" }}>Loading...</div>

  if (status.applied) {
    return (
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ color: status.status === "APPROVED" ? "#00ff88" : "#e8ff00", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", border: "1px solid currentColor", padding: "0.2rem 0.6rem" }}>
            {status.status}
          </span>
        </div>
        {status.approved && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#aaa" }}>Commission Rate: <span style={{ color: "#e8ff00" }}>{((status.commissionRate || 0) * 100).toFixed(0)}%</span></div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.4rem" }}>Total Earned: <span style={{ color: "#00ff88" }}>${(status.totalEarned || 0).toFixed(2)}</span></div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.4rem" }}>Referral Code: <span style={{ color: "#e8ff00" }}>{status.referralCode}</span></div>
          </div>
        )}
        {status.status === "PENDING" && !msg && <p style={{ color: "#555", fontSize: "0.78rem" }}>Your application is under review.</p>}
        {msg && <p style={{ color: "#00ff88", fontSize: "0.78rem" }}>{msg}</p>}
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "1.25rem" }}>
        Earn commission for driving sales to PR5JECT. Affiliates earn up to 20% commission on referred orders.
      </p>
      <div>
        <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Estimated Following</div>
        <input style={S.input} placeholder="e.g. 5000" value={form.followersEstimate} onChange={e => setForm(f => ({ ...f, followersEstimate: e.target.value }))} />
        <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Platforms</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {platforms.map(p => (
            <button key={p} onClick={() => togglePlatform(p)} style={{ ...S.btnGhost, padding: "0.35rem 0.75rem", fontSize: "0.6rem", ...(form.platforms.includes(p) ? { background: "#e8ff00", color: "#000" } : {}) }}>{p}</button>
          ))}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Why do you want to be an affiliate?</div>
        <textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
        {msg && <p style={{ color: "#00ff88", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{msg}</p>}
        <button style={S.btn} onClick={submit} disabled={submitting}>{submitting ? "SUBMITTING..." : "APPLY NOW"}</button>
      </div>
    </div>
  )
}

function AmbassadorTab({ token, profile }) {
  const [amb, setAmb] = useState(null)
  const [applying, setApplying] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!token) return
    fetch(`${API}/ambassador/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setAmb).catch(() => {})
  }, [token])

  const apply = async () => {
    setApplying(true)
    try {
      const r = await fetch(`${API}/ambassador/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: "{}",
      })
      const data = await r.json()
      if (r.ok) {
        setMsg(data.message || "You're in!")
        setAmb({ isAmbassador: true, tier: "STARTER", totalReferrals: 0, referralCode: data.referralCode, creditPerReferral: 5, nextTierAt: 5 })
      } else {
        setMsg(data.error || "Already an ambassador")
      }
    } finally {
      setApplying(false)
    }
  }

  if (!amb) return <div style={{ color: "#555" }}>Loading...</div>

  const TIERS = [
    { name: "STARTER", min: 0,  credit: 5,  commission: 0 },
    { name: "RISING",  min: 5,  credit: 8,  commission: 5 },
    { name: "ELITE",   min: 15, credit: 10, commission: 8 },
    { name: "LEGEND",  min: 30, credit: 15, commission: 10 },
  ]

  if (!amb.isAmbassador) {
    return (
      <div>
        <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "1.5rem" }}>Join the Ambassador Program and earn credits + cash for every referral.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {TIERS.map(t => (
            <div key={t.name} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1rem" }}>
              <div style={{ color: TIER_COLORS[t.name] || "#555", fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>{t.name}</div>
              <div style={{ fontSize: "0.72rem", color: "#aaa" }}>${t.credit} credit/referral</div>
              {t.commission > 0 && <div style={{ fontSize: "0.72rem", color: "#aaa" }}>+{t.commission}% commission</div>}
              <div style={{ fontSize: "0.6rem", color: "#555", marginTop: "0.3rem" }}>{t.min}+ referrals</div>
            </div>
          ))}
        </div>
        {msg && <p style={{ color: "#00ff88", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{msg}</p>}
        <button style={S.btn} onClick={apply} disabled={applying}>{applying ? "JOINING..." : "JOIN NOW — IT'S FREE"}</button>
      </div>
    )
  }

  const referrals = amb.totalReferrals || 0
  const nextAt = amb.nextTierAt
  const pct = nextAt ? Math.min(100, (referrals / nextAt) * 100) : 100
  const link = `https://pr5ject.com/join?ref=${profile?.username || ""}`
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={S.stat}>
          <div style={{ ...S.statVal, color: TIER_COLORS[amb.tier] || "#555", fontSize: "1.3rem" }}>{amb.tier}</div>
          <div style={S.statLbl}>Ambassador Tier</div>
        </div>
        <div style={S.stat}>
          <div style={S.statVal}>{referrals}</div>
          <div style={S.statLbl}>Total Referrals</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statVal, color: "#00ff88" }}>${amb.earnedCredits?.toFixed(2) || "0.00"}</div>
          <div style={S.statLbl}>Credits Earned</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statVal, color: "#e8ff00" }}>${amb.earnedCash?.toFixed(2) || "0.00"}</div>
          <div style={S.statLbl}>Cash Commission</div>
        </div>
      </div>

      {nextAt && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.6rem", color: "#555", marginBottom: "0.4rem" }}>{referrals}/{nextAt} referrals to next tier</div>
          <div style={{ height: "3px", background: "#1a1a1a" }}>
            <div style={{ height: "100%", background: "#e8ff00", width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div style={{ background: "#0d0d0d", border: "1px solid #333", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ color: "#e8ff00", fontSize: "0.8rem", flex: 1, wordBreak: "break-all" }}>{link}</span>
        <button style={S.btn} onClick={copy}>{copied ? "COPIED!" : "COPY LINK"}</button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [rank, setRank] = useState(null)
  const [tab, setTab] = useState("earnings")
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    track("page_view", { page: "dashboard" })
    getCurrentUser().then(async u => {
      setUser(u)
      setChecked(true)
      if (!u) return
      try {
        const tok = await getIdToken()
        setToken(tok)
        const headers = { Authorization: `Bearer ${tok}` }

        Promise.all([
          fetch(`${API}/users/profile`, { headers }).then(r => r.json()),
          fetch(`${API}/creators/earnings`, { headers }).then(r => r.json()),
          fetch(`${API}/creators/rankings`).then(r => r.json()),
        ]).then(([prof, earn, ranks]) => {
          setProfile(prof)
          setEarnings(earn)
          if (prof?.userId) {
            const myRank = (ranks.rankings || []).find(r => r.creatorId === prof.userId)
            setRank(myRank || null)
          }
        })
      } catch (e) {
        console.error(e)
      }
    })
  }, [])

  if (!checked) return null
  if (!user) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#888", marginBottom: "1rem" }}>Sign in to view your dashboard</p>
        <a href="/login" style={{ ...S.btn, textDecoration: "none", display: "inline-block" }}>SIGN IN</a>
      </div>
    </div>
  )

  const tabs = [
    { key: "earnings",   label: "Earnings" },
    { key: "referral",   label: "Referrals" },
    { key: "ambassador", label: "Ambassador" },
    { key: "affiliate",  label: "Affiliate" },
  ]

  return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.logo}>PR5JECT</a>
        <nav style={S.nav}>
          <a href="/" style={{ ...S.navBtn, color: "#555", textDecoration: "none", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Back to Arena</a>
          <a href="/profile" style={{ ...S.navBtn, color: "#e8ff00", textDecoration: "none", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Profile</a>
          <button style={S.navBtn} onClick={() => { signOut(); window.location.href = "/" }}>Sign Out</button>
        </nav>
      </header>

      <div style={S.body}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={S.label}>Creator Dashboard</span>
          <h1 style={{ ...S.title, fontSize: "2rem", margin: 0 }}>Welcome back, {profile?.username || user?.username || "creator"}</h1>
        </div>

        <StatRow profile={profile} earnings={earnings} rank={rank} />

        <div style={S.section}>
          <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", borderBottom: "1px solid #1a1a1a" }}>
            {tabs.map(t => (
              <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>

          {tab === "earnings" && <EarningsTab earnings={earnings} />}
          {tab === "referral" && <ReferralTab profile={profile} />}
          {tab === "ambassador" && <AmbassadorTab token={token} profile={profile} />}
          {tab === "affiliate" && <AffiliateTab token={token} />}
        </div>
      </div>
    </div>
  )
}
