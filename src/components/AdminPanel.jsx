import { useState, useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const CF_BASE  = "https://d1wxtx6tyeb7i0.cloudfront.net"
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "437918"

const GARMENT_OPTS = [
  { key: "star-shorts", label: "Star Shorts", colors: ["black", "pink", "sand", "olive"] },
  { key: "five-hoodie", label: "Five Hoodie", colors: ["black", "sand", "olive", "crimson"] },
]

// ── MOCK DATA ──────────────────────────────────────────────────────

const SNAPSHOT_CARDS = [
  { label: "Orders Today",    value: "14",     sub: "+3 vs yesterday",  up: true  },
  { label: "Revenue Today",   value: "$1,260", sub: "+$340 vs yesterday", up: true },
  { label: "Active Designs",  value: "8",      sub: "live in the Arena", up: null  },
  { label: "Total Pre-orders",value: "187",    sub: "+14 today",         up: true  },
  { label: "Active Creators", value: "23",     sub: "+2 this week",      up: true  },
  { label: "Funded Designs",  value: "3",      sub: "1 funded today",    up: true  },
]

const CASH_FLOW_DATA = [
  { date: "May 17", revenue: 320  },
  { date: "May 18", revenue: 480  },
  { date: "May 19", revenue: 210  },
  { date: "May 20", revenue: 590  },
  { date: "May 21", revenue: 780  },
  { date: "May 22", revenue: 430  },
  { date: "May 23", revenue: 290  },
  { date: "May 24", revenue: 640  },
  { date: "May 25", revenue: 920  },
  { date: "May 26", revenue: 1100 },
  { date: "May 27", revenue: 870  },
  { date: "May 28", revenue: 560  },
  { date: "May 29", revenue: 340  },
  { date: "May 30", revenue: 720  },
  { date: "May 31", revenue: 850  },
  { date: "Jun 01", revenue: 1200 },
  { date: "Jun 02", revenue: 980  },
  { date: "Jun 03", revenue: 450  },
  { date: "Jun 04", revenue: 380  },
  { date: "Jun 05", revenue: 760  },
  { date: "Jun 06", revenue: 890  },
  { date: "Jun 07", revenue: 1050 },
  { date: "Jun 08", revenue: 730  },
  { date: "Jun 09", revenue: 620  },
  { date: "Jun 10", revenue: 940  },
  { date: "Jun 11", revenue: 1180 },
  { date: "Jun 12", revenue: 820  },
  { date: "Jun 13", revenue: 670  },
  { date: "Jun 14", revenue: 990  },
  { date: "Jun 15", revenue: 1260 },
]

const FUNDING_DATA = [
  { id: "D-001", name: "Solar Flare Hoodie", creator: "jordan_m",  garment: "Five Hoodie",  colorway: "Crimson", orders: 42, goal: 50 },
  { id: "D-002", name: "Void Shorts",        creator: "kylez99",   garment: "Star Shorts",  colorway: "Black",   orders: 28, goal: 50 },
  { id: "D-003", name: "Desert Run",         creator: "amara_x",   garment: "Star Shorts",  colorway: "Sand",    orders: 50, goal: 50 },
  { id: "D-004", name: "Midnight Olive",     creator: "ty_creates", garment: "Five Hoodie", colorway: "Olive",   orders: 12, goal: 50 },
  { id: "D-005", name: "Pink Static",        creator: "nadia_d",   garment: "Star Shorts",  colorway: "Pink",    orders: 50, goal: 50 },
  { id: "D-006", name: "Crimson Code",       creator: "marcus_w",  garment: "Five Hoodie",  colorway: "Black",   orders: 7,  goal: 50 },
  { id: "D-007", name: "Sand Dune Drop",     creator: "priya_v",   garment: "Star Shorts",  colorway: "Olive",   orders: 34, goal: 50 },
  { id: "D-008", name: "Nocturne",           creator: "lev_art",   garment: "Five Hoodie",  colorway: "Sand",    orders: 19, goal: 50 },
]

const ORDERS_DATA = [
  { id: "ORD-1091", email: "alex.k@gmail.com",    design: "Solar Flare Hoodie", item: "Five Hoodie / Crimson / L",  amount: "$89", date: "Jun 16", status: "pending"   },
  { id: "ORD-1090", email: "mia.r@outlook.com",   design: "Void Shorts",        item: "Star Shorts / Black / M",    amount: "$65", date: "Jun 16", status: "pending"   },
  { id: "ORD-1089", email: "dean.t@yahoo.com",    design: "Solar Flare Hoodie", item: "Five Hoodie / Crimson / XL", amount: "$89", date: "Jun 16", status: "pending"   },
  { id: "ORD-1088", email: "priya.v@gmail.com",   design: "Sand Dune Drop",     item: "Star Shorts / Olive / S",    amount: "$65", date: "Jun 15", status: "paid"      },
  { id: "ORD-1087", email: "jordy_m@icloud.com",  design: "Desert Run",         item: "Star Shorts / Sand / M",     amount: "$65", date: "Jun 15", status: "fulfilled" },
  { id: "ORD-1086", email: "cam.b@gmail.com",     design: "Pink Static",        item: "Star Shorts / Pink / XS",    amount: "$65", date: "Jun 15", status: "paid"      },
  { id: "ORD-1085", email: "rens.d@gmail.com",    design: "Midnight Olive",     item: "Five Hoodie / Olive / M",    amount: "$89", date: "Jun 14", status: "refunded"  },
  { id: "ORD-1084", email: "talia_x@proton.me",   design: "Nocturne",           item: "Five Hoodie / Sand / L",     amount: "$89", date: "Jun 14", status: "paid"      },
  { id: "ORD-1083", email: "luca.m@gmail.com",    design: "Desert Run",         item: "Star Shorts / Sand / L",     amount: "$65", date: "Jun 13", status: "fulfilled" },
  { id: "ORD-1082", email: "amy.w@email.com",     design: "Void Shorts",        item: "Star Shorts / Black / S",    amount: "$65", date: "Jun 13", status: "fulfilled" },
]

const CREATORS_DATA = [
  { name: "Jordan Mitchell", handle: "jordan_m",   submissions: 3, funded: 2, earnings: "$180", orders: 42, joined: "Mar 2026", status: "active"   },
  { name: "Kyle Zavros",     handle: "kylez99",    submissions: 2, funded: 1, earnings: "$90",  orders: 28, joined: "Apr 2026", status: "active"   },
  { name: "Amara Osei",      handle: "amara_x",   submissions: 5, funded: 3, earnings: "$270", orders: 50, joined: "Feb 2026", status: "active"   },
  { name: "Ty Williams",     handle: "ty_creates", submissions: 1, funded: 0, earnings: "$0",   orders: 12, joined: "Jun 2026", status: "active"   },
  { name: "Nadia Dahl",      handle: "nadia_d",   submissions: 4, funded: 2, earnings: "$180", orders: 50, joined: "Mar 2026", status: "active"   },
  { name: "Marcus Webb",     handle: "marcus_w",  submissions: 2, funded: 1, earnings: "$90",  orders: 7,  joined: "May 2026", status: "inactive" },
  { name: "Priya Venkat",    handle: "priya_v",   submissions: 3, funded: 2, earnings: "$180", orders: 34, joined: "Apr 2026", status: "active"   },
  { name: "Lev Artmann",     handle: "lev_art",   submissions: 2, funded: 1, earnings: "$90",  orders: 19, joined: "May 2026", status: "active"   },
]

// ── STYLE HELPERS ──────────────────────────────────────────────────

const S = {
  section: {
    background: "#141414",
    border: "1px solid #262626",
    padding: "1.75rem 2rem",
    marginBottom: "1.5rem",
  },
  sectionLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.3em",
    color: "#e8ff00",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.4rem",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "1.25rem",
    color: "#f0f0f0",
    margin: "0 0 1.5rem",
  },
  th: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#555",
    padding: "0.6rem 0.75rem",
    textAlign: "left",
    borderBottom: "1px solid #262626",
    whiteSpace: "nowrap",
  },
  td: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.75rem",
    color: "#aaa",
    padding: "0.75rem 0.75rem",
    borderBottom: "1px solid #1a1a1a",
    whiteSpace: "nowrap",
  },
}

const STATUS_COLORS = {
  pending:   { bg: "rgba(232,255,0,0.08)",  text: "#e8ff00" },
  paid:      { bg: "rgba(0,255,136,0.08)", text: "#00ff88" },
  fulfilled: { bg: "rgba(0,255,136,0.12)", text: "#00cc6a" },
  refunded:  { bg: "rgba(255,68,68,0.08)", text: "#ff6666" },
  inactive:  { bg: "rgba(255,255,255,0.04)", text: "#555" },
  active:    { bg: "rgba(0,255,136,0.08)", text: "#00ff88" },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "rgba(255,255,255,0.05)", text: "#888" }
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: "0.6rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      background: c.bg,
      color: c.text,
      padding: "0.25rem 0.55rem",
      border: `1px solid ${c.text}22`,
    }}>
      {status}
    </span>
  )
}

// ── SECTION 1: DAILY SNAPSHOT CARDS ───────────────────────────────

function SnapshotSection() {
  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>OPS DASHBOARD</span>
      <p style={S.sectionTitle}>Daily Snapshot</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
      }}>
        {SNAPSHOT_CARDS.map((card) => (
          <div key={card.label} style={{
            background: "#0d0d0d",
            border: "1px solid #262626",
            padding: "1.25rem 1.5rem",
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: "0.5rem",
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.2rem",
              letterSpacing: "0.05em",
              color: "#f0f0f0",
              lineHeight: 1,
              marginBottom: "0.4rem",
            }}>
              {card.value}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              color: card.up === true ? "#00ff88" : card.up === false ? "#ff6666" : "#555",
            }}>
              {card.up === true && "↑ "}{card.up === false && "↓ "}{card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SECTION 2: CASH FLOW BAR CHART ────────────────────────────────

function CashFlowSection() {
  const [hovered, setHovered] = useState(null)
  const maxRev = Math.max(...CASH_FLOW_DATA.map(d => d.revenue))
  const totalRev = CASH_FLOW_DATA.reduce((s, d) => s + d.revenue, 0)

  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>REVENUE</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
        <p style={{ ...S.sectionTitle, margin: 0 }}>30-Day Cash Flow</p>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
          Total{" "}
          <span style={{ color: "#e8ff00", fontSize: "1rem" }}>
            ${totalRev.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Hover tooltip */}
      <div style={{ height: "1.4rem", marginBottom: "0.5rem" }}>
        {hovered !== null && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#f0f0f0" }}>
            <span style={{ color: "#555" }}>{CASH_FLOW_DATA[hovered].date}</span>
            {"  "}
            <span style={{ color: "#e8ff00" }}>${CASH_FLOW_DATA[hovered].revenue.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Bars */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        height: "160px",
        marginBottom: "6px",
      }}>
        {CASH_FLOW_DATA.map((d, i) => {
          const isLast = i === CASH_FLOW_DATA.length - 1
          const pct = (d.revenue / maxRev) * 100
          const isHov = hovered === i
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${pct}%`,
                background: isLast ? "#00ff88" : "#e8ff00",
                opacity: isHov ? 1 : 0.65,
                cursor: "default",
                minWidth: 0,
                transition: "opacity 0.1s, height 0.15s",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </div>

      {/* X-axis labels: every 5th day */}
      <div style={{ display: "flex", gap: "3px" }}>
        {CASH_FLOW_DATA.map((d, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.5rem",
            color: "#444",
            overflow: "hidden",
          }}>
            {i % 5 === 0 ? d.date.replace(" ", " ") : ""}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SECTION 3: FUNDING DASHBOARD TABLE ────────────────────────────

function FundingSection() {
  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>DESIGNS</span>
      <p style={S.sectionTitle}>Funding Dashboard</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%"  }} />
            <col style={{ width: "8%"  }} />
            <col />
          </colgroup>
          <thead>
            <tr>
              {["Design", "Creator", "Garment", "Colorway", "Orders", "Goal", "Progress"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNDING_DATA.map((d) => {
              const pct = Math.min(100, Math.round((d.orders / d.goal) * 100))
              const funded = d.orders >= d.goal
              return (
                <tr key={d.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...S.td, color: "#f0f0f0", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ ...S.td, color: "#e8ff00" }}>{d.creator}</td>
                  <td style={S.td}>{d.garment}</td>
                  <td style={S.td}>{d.colorway}</td>
                  <td style={{ ...S.td, color: "#f0f0f0" }}>{d.orders}</td>
                  <td style={S.td}>{d.goal}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "3px", background: "#222", position: "relative" }}>
                        <div style={{
                          position: "absolute",
                          left: 0, top: 0, bottom: 0,
                          width: `${pct}%`,
                          background: funded ? "#00ff88" : "#e8ff00",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.65rem",
                        color: funded ? "#00ff88" : "#888",
                        minWidth: "2.5rem",
                        textAlign: "right",
                      }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── CHARGEBACK PACKAGER ────────────────────────────────────────────

function ChargebackButton({ orderId }) {
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)

  const generate = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/chargeback?orderId=${encodeURIComponent(orderId)}&key=${ADMIN_KEY}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        style={{
          background: "none",
          border: "1px solid #333",
          color: loading ? "#444" : "#e8ff00",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "0.3rem 0.6rem",
          cursor: loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "..." : "Chargeback Package"}
      </button>
      {error && (
        <span style={{ color: "#ff6666", fontSize: "0.6rem", marginLeft: "0.5rem" }}>Error: {error}</span>
      )}
      {result && (
        <div style={{
          marginTop: "0.75rem",
          background: "#0d0d0d",
          border: "1px solid #262626",
          padding: "1rem",
          fontSize: "0.65rem",
          fontFamily: "'DM Mono', monospace",
          color: "#aaa",
          lineHeight: 1.8,
        }}>
          <div style={{ color: "#e8ff00", marginBottom: "0.5rem", fontSize: "0.6rem", letterSpacing: "0.2em" }}>EVIDENCE PACKAGE</div>
          {[
            ["Order ID",        result.orderId],
            ["Customer Email",  result.customerEmail],
            ["Signup Date",     result.customerSignupDate],
            ["Order Date",      result.orderDate],
            ["Amount",          result.orderAmount],
            ["Design",          result.designName],
            ["Garment",         result.garmentType],
            ["Terms Accepted",  result.termsAccepted],
            ["Terms IP",        result.termsAcceptedIP],
            ["Fraud Score",     result.fraudScore],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", gap: "1rem" }}>
              <span style={{ color: "#555", minWidth: 120 }}>{label}</span>
              <span style={{ color: "#f0f0f0" }}>{String(val ?? "—")}</span>
            </div>
          ))}
          <div style={{ marginTop: "0.75rem", borderTop: "1px solid #1a1a1a", paddingTop: "0.75rem", color: "#ccc" }}>
            {result.evidenceSummary}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SECTION 4: ORDERS TABLE ────────────────────────────────────────

function OrdersSection() {
  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>TRANSACTIONS</span>
      <p style={S.sectionTitle}>Orders</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Order ID", "Customer", "Design", "Item", "Amount", "Date", "Status", "Actions"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDERS_DATA.map((o) => (
              <tr key={o.id}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.1s", verticalAlign: "top" }}
              >
                <td style={{ ...S.td, color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>{o.id}</td>
                <td style={{ ...S.td, color: "#f0f0f0" }}>{o.email}</td>
                <td style={S.td}>{o.design}</td>
                <td style={{ ...S.td, color: "#666" }}>{o.item}</td>
                <td style={{ ...S.td, color: "#f0f0f0" }}>{o.amount}</td>
                <td style={S.td}>{o.date}</td>
                <td style={S.td}><StatusBadge status={o.status} /></td>
                <td style={S.td}>
                  <ChargebackButton orderId={o.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── SECTION 5: CREATOR TABLE ───────────────────────────────────────

function CreatorsSection() {
  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>COMMUNITY</span>
      <p style={S.sectionTitle}>Creators</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Handle", "Submissions", "Funded", "Total Orders", "Earnings", "Joined", "Status"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CREATORS_DATA.map((c) => (
              <tr key={c.handle}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.1s" }}
              >
                <td style={{ ...S.td, color: "#f0f0f0" }}>{c.name}</td>
                <td style={{ ...S.td, color: "#e8ff00" }}>{c.handle}</td>
                <td style={{ ...S.td, textAlign: "center" }}>{c.submissions}</td>
                <td style={{ ...S.td, textAlign: "center", color: c.funded > 0 ? "#00ff88" : "#555" }}>{c.funded}</td>
                <td style={{ ...S.td, textAlign: "center" }}>{c.orders}</td>
                <td style={{ ...S.td, color: c.earnings === "$0" ? "#555" : "#f0f0f0" }}>{c.earnings}</td>
                <td style={S.td}>{c.joined}</td>
                <td style={S.td}><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── MAIN ADMIN PANEL ───────────────────────────────────────────────

export default function AdminPanel() {
  const [activeTab, setActiveTab]     = useState("dashboard")
  const [open, setOpen]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  // Garment photo upload state
  const [gpGarment, setGpGarment]     = useState(GARMENT_OPTS[0].key)
  const [gpColor, setGpColor]         = useState(GARMENT_OPTS[0].colors[0])
  const [gpView, setGpView]           = useState("front")
  const [gpFile, setGpFile]           = useState(null)
  const [gpUploading, setGpUploading] = useState(false)
  const [gpResult, setGpResult]       = useState(null)
  const [gpError, setGpError]         = useState(null)
  const gpInputRef                    = useRef(null)

  const gpGarmentObj = GARMENT_OPTS.find((g) => g.key === gpGarment)

  useEffect(() => {
    fetch(`${API_BASE}/status`)
      .then((r) => r.json())
      .then((data) => setOpen(!!data.open))
      .catch(() => setError("Couldn't load site status"))
  }, [])

  useEffect(() => {
    setGpColor(GARMENT_OPTS.find((g) => g.key === gpGarment)?.colors[0] || "black")
    setGpResult(null)
  }, [gpGarment])

  const handleToggle = async () => {
    if (open === null || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !open, key: ADMIN_KEY }),
      })
      if (!res.ok) throw new Error("Update failed")
      const data = await res.json()
      setOpen(!!data.open)
    } catch (err) {
      setError(err.message || "Couldn't update site status")
    } finally {
      setLoading(false)
    }
  }

  const handleGarmentUpload = async () => {
    if (!gpFile || gpUploading) return
    setGpUploading(true)
    setGpError(null)
    setGpResult(null)
    try {
      const designId = `garment-${gpGarment}-${gpView}-${gpColor}`
      const urlRes = await fetch(`${API_BASE}/designs/${designId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, contentType: gpFile.type }),
      })
      if (!urlRes.ok) throw new Error(`Upload URL failed: ${urlRes.status}`)
      const { uploadUrl } = await urlRes.json()
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": gpFile.type },
        body: gpFile,
      })
      if (!putRes.ok) throw new Error("S3 upload failed")
      const ext = gpFile.type.includes("png") ? "png" : "jpg"
      const cfUrl = `${CF_BASE}/designs/${designId}/image.${ext}`
      setGpResult(cfUrl)
      setGpFile(null)
      if (gpInputRef.current) gpInputRef.current.value = ""
    } catch (err) {
      setGpError(err.message || "Upload failed")
    } finally {
      setGpUploading(false)
    }
  }

  const TABS = [
    { id: "dashboard", label: "OPS DASHBOARD" },
    { id: "tools",     label: "TOOLS"         },
  ]

  return (
    <div className="app">
      {/* Admin header */}
      <div style={{
        borderBottom: "1px solid #262626",
        background: "#0d0d0d",
        padding: "0 2rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: "2rem", height: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: "0.1em", color: "#e8ff00" }}>
              PR5JECT
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.25em", color: "#444", textTransform: "uppercase" }}>
              ADMIN
            </span>
          </div>

          <div style={{ display: "flex", gap: "0" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === t.id ? "2px solid #e8ff00" : "2px solid transparent",
                  color: activeTab === t.id ? "#e8ff00" : "#555",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "0 1rem",
                  height: 56,
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Live site status dot */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: open === null ? "#444" : open ? "#00ff88" : "#ff4444",
            }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#555" }}>
              {open === null ? "..." : open ? "SITE LIVE" : "SITE CLOSED"}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard tab */}
      {activeTab === "dashboard" && (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
          <SnapshotSection />
          <CashFlowSection />
          <FundingSection />
          <OrdersSection />
          <CreatorsSection />
        </main>
      )}

      {/* Tools tab (existing functionality) */}
      {activeTab === "tools" && (
        <main className="main auth-page" style={{ flexDirection: "column", justifyContent: "flex-start", gap: "2rem", alignItems: "stretch", maxWidth: 520, margin: "0 auto", padding: "3rem 1rem" }}>

          {/* ── Site Status ── */}
          <div className="auth-box" style={{ position: "static" }}>
            <div className="auth-brand">
              <span className="auth-logo">PR5JECT</span>
              <span className="auth-tagline">ADMIN</span>
            </div>
            <h2 className="auth-title">Site Status</h2>
            <p className="auth-sub">
              {open === null ? "Loading..." : "Toggle whether pr5ject.com is live."}
            </p>
            {open !== null && (
              <button
                className={`admin-toggle ${open ? "is-open" : "is-closed"}`}
                onClick={handleToggle}
                disabled={loading}
              >
                {open ? "OPEN" : "CLOSED"}
              </button>
            )}
            {error && <p className="auth-error">{error}</p>}
          </div>

          {/* ── Garment Photos ── */}
          <div className="auth-box" style={{ position: "static" }}>
            <div className="auth-brand">
              <span className="auth-logo">PR5JECT</span>
              <span className="auth-tagline">GARMENT PHOTOS</span>
            </div>
            <h2 className="auth-title">Upload Garment Photo</h2>
            <p className="auth-sub">
              Upload a garment photo to S3. Copy the CloudFront URL and update the GARMENTS config in DesignStudio.jsx, or use a backend endpoint to store it dynamically.
            </p>

            <label className="submit-label">Garment</label>
            <select
              className="auth-input submit-select"
              value={gpGarment}
              onChange={(e) => setGpGarment(e.target.value)}
            >
              {GARMENT_OPTS.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>

            <label className="submit-label">Colorway</label>
            <select
              className="auth-input submit-select"
              value={gpColor}
              onChange={(e) => setGpColor(e.target.value)}
            >
              {(gpGarmentObj?.colors || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label className="submit-label">View</label>
            <select
              className="auth-input submit-select"
              value={gpView}
              onChange={(e) => setGpView(e.target.value)}
            >
              <option value="front">Front</option>
              <option value="back">Back</option>
            </select>

            <label className="submit-label">Photo file (JPG or PNG)</label>
            <div className="file-picker-wrap">
              <input
                ref={gpInputRef}
                id="gp-file-input"
                type="file"
                accept="image/jpeg,image/png"
                className="file-input-hidden"
                onChange={(e) => setGpFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="gp-file-input" className="file-picker-btn">
                {gpFile ? gpFile.name : "Choose JPG or PNG"}
              </label>
              {gpFile && (
                <button className="file-clear" onClick={() => { setGpFile(null); if (gpInputRef.current) gpInputRef.current.value = "" }}>✕</button>
              )}
            </div>

            <button
              className="auth-btn"
              onClick={handleGarmentUpload}
              disabled={!gpFile || gpUploading}
            >
              {gpUploading ? "UPLOADING..." : "UPLOAD PHOTO"}
            </button>

            {gpResult && (
              <div style={{ marginTop: "1rem" }}>
                <p className="submit-label" style={{ color: "#00ff88" }}>UPLOADED — CLOUDFRONT URL:</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#00ff88", wordBreak: "break-all", marginTop: "0.4rem", padding: "0.5rem", background: "#0d0d0d", border: "1px solid #00ff88" }}>
                  {gpResult}
                </p>
              </div>
            )}
            {gpError && <p className="auth-error">{gpError}</p>}
          </div>

        </main>
      )}
    </div>
  )
}
