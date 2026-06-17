import { useState, useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const CF_BASE  = "https://d1wxtx6tyeb7i0.cloudfront.net"
const ADMIN_KEY = "437918"

const GARMENT_OPTS = [
  { key: "star-shorts", label: "Star Shorts", colors: ["black", "pink", "sand", "olive"] },
  { key: "five-hoodie", label: "Five Hoodie", colors: ["black", "sand", "olive", "crimson"] },
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
  pending:       { bg: "rgba(232,255,0,0.08)",  text: "#e8ff00" },
  pending_charge:{ bg: "rgba(232,255,0,0.08)",  text: "#e8ff00" },
  card_saved:    { bg: "rgba(232,255,0,0.08)",  text: "#e8ff00" },
  paid:          { bg: "rgba(0,255,136,0.08)",  text: "#00ff88" },
  charged:       { bg: "rgba(0,255,136,0.08)",  text: "#00ff88" },
  fulfilled:     { bg: "rgba(0,255,136,0.12)",  text: "#00cc6a" },
  refunded:      { bg: "rgba(255,68,68,0.08)",  text: "#ff6666" },
  charge_failed: { bg: "rgba(255,68,68,0.08)",  text: "#ff6666" },
  inactive:      { bg: "rgba(255,255,255,0.04)", text: "#555"   },
  active:        { bg: "rgba(0,255,136,0.08)",  text: "#00ff88" },
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

function SnapshotSection({ snapshot }) {
  if (!snapshot) return null

  const cards = [
    {
      label: "Orders Today",
      value: String(snapshot.ordersToday ?? 0),
      sub: snapshot.ordersDelta >= 0
        ? `+${snapshot.ordersDelta} vs yesterday`
        : `${snapshot.ordersDelta} vs yesterday`,
      up: snapshot.ordersDelta > 0 ? true : snapshot.ordersDelta < 0 ? false : null,
    },
    {
      label: "Revenue Today",
      value: `$${(snapshot.revenueToday ?? 0).toLocaleString()}`,
      sub: snapshot.revenueDelta >= 0
        ? `+$${snapshot.revenueDelta} vs yesterday`
        : `-$${Math.abs(snapshot.revenueDelta)} vs yesterday`,
      up: snapshot.revenueDelta > 0 ? true : snapshot.revenueDelta < 0 ? false : null,
    },
    {
      label: "Active Designs",
      value: String(snapshot.activeDesigns ?? 0),
      sub: "live in the Arena",
      up: null,
    },
    {
      label: "Total Pre-orders",
      value: String(snapshot.totalPreorders ?? 0),
      sub: `+${snapshot.ordersToday ?? 0} today`,
      up: (snapshot.ordersToday ?? 0) > 0 ? true : null,
    },
    {
      label: "Active Creators",
      value: String(snapshot.activeCreators ?? 0),
      sub: "unique designers",
      up: null,
    },
    {
      label: "Funded Designs",
      value: String(snapshot.fundedDesigns ?? 0),
      sub: "hit threshold",
      up: (snapshot.fundedDesigns ?? 0) > 0 ? true : null,
    },
  ]

  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>OPS DASHBOARD</span>
      <p style={S.sectionTitle}>Daily Snapshot</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
      }}>
        {cards.map((card) => (
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

function CashFlowSection({ cashFlow }) {
  const [hovered, setHovered] = useState(null)
  if (!cashFlow?.length) return null

  const maxRev = Math.max(...cashFlow.map(d => d.revenue), 1)
  const totalRev = cashFlow.reduce((s, d) => s + d.revenue, 0)

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

      <div style={{ height: "1.4rem", marginBottom: "0.5rem" }}>
        {hovered !== null && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#f0f0f0" }}>
            <span style={{ color: "#555" }}>{cashFlow[hovered].date}</span>
            {"  "}
            <span style={{ color: "#e8ff00" }}>${cashFlow[hovered].revenue.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        height: "160px",
        marginBottom: "6px",
      }}>
        {cashFlow.map((d, i) => {
          const isLast = i === cashFlow.length - 1
          const pct = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0
          const isHov = hovered === i
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(pct, 1)}%`,
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

      <div style={{ display: "flex", gap: "3px" }}>
        {cashFlow.map((d, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.5rem",
            color: "#444",
            overflow: "hidden",
          }}>
            {i % 5 === 0 ? d.date : ""}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SECTION 3: FUNDING DASHBOARD TABLE ────────────────────────────

function FundingSection({ funding }) {
  if (!funding?.length) return null

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
            {funding.map((d) => {
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

function OrdersSection({ orders }) {
  if (!orders?.length) return null

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
            {orders.map((o) => (
              <tr key={o.id}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.1s", verticalAlign: "top" }}
              >
                <td style={{ ...S.td, color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>{o.id}</td>
                <td style={{ ...S.td, color: "#f0f0f0" }}>{o.customer}</td>
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

function CreatorsSection({ creators }) {
  if (!creators?.length) return null

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
            {creators.map((c) => (
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

// ── FUNNEL SECTION ────────────────────────────────────────────────

function FunnelBar({ label, count, pct, color = "#e8ff00" }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#aaa" }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color }}>
          {count.toLocaleString()} <span style={{ color: "#444" }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: "3px", background: "#1a1a1a", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color, transition: "width 0.5s ease" }} />
      </div>
    </div>
  )
}

function FunnelSection({ apiBase, adminKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const load = (d) => {
    setLoading(true)
    fetch(`${apiBase}/admin/funnel?key=${adminKey}&days=${d}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(days) }, [])

  const handleDays = (d) => { setDays(d); load(d) }

  const purchase = data?.funnel?.purchase
  const reg = data?.funnel?.registration
  const daily = data?.daily || []
  const maxDailyTotal = Math.max(1, ...daily.map(d =>
    (d.preorder_click || 0) + (d.order_success || 0) + (d.signup_attempt || 0)
  ))

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      {/* Period selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => handleDays(d)} style={{
            background: days === d ? "#e8ff00" : "none",
            border: "1px solid " + (days === d ? "#e8ff00" : "#333"),
            color: days === d ? "#000" : "#555",
            fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em",
            padding: "0.3rem 0.75rem", cursor: "pointer",
          }}>
            {d}D
          </button>
        ))}
        {loading && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#444", lineHeight: "1.8rem" }}>Loading…</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Purchase funnel */}
        <div style={S.section}>
          <span style={S.sectionLabel}>PURCHASE</span>
          <p style={{ ...S.sectionTitle, margin: "0 0 1.25rem" }}>Conversion Funnel</p>
          {purchase ? (
            <>
              {purchase.stages.map(s => (
                <FunnelBar key={s.event} label={s.label} count={s.count} pct={s.pct}
                  color={s.event === 'order_success' ? "#00ff88" : "#e8ff00"} />
              ))}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#444", marginTop: "1rem", lineHeight: 2 }}>
                <div>Click → Start: <span style={{ color: "#888" }}>{purchase.click_to_start}%</span></div>
                <div>Click → Complete: <span style={{ color: "#00ff88" }}>{purchase.click_to_success}%</span></div>
                <div>Start → Complete: <span style={{ color: "#888" }}>{purchase.start_to_success}%</span></div>
              </div>
            </>
          ) : <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#333" }}>No data yet.</div>}
        </div>

        {/* Registration funnel */}
        <div style={S.section}>
          <span style={S.sectionLabel}>REGISTRATION</span>
          <p style={{ ...S.sectionTitle, margin: "0 0 1.25rem" }}>Sign-up Funnel</p>
          {reg ? (
            <>
              {reg.stages.map(s => (
                <FunnelBar key={s.event} label={s.label} count={s.count} pct={s.pct}
                  color={s.event === 'login_success' ? "#00ff88" : "#e8ff00"} />
              ))}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#444", marginTop: "1rem", lineHeight: 2 }}>
                <div>Signup → Verify: <span style={{ color: "#888" }}>{reg.signup_to_verify}%</span></div>
                <div>Verify → Login: <span style={{ color: "#00ff88" }}>{reg.verify_to_login}%</span></div>
              </div>
            </>
          ) : <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#333" }}>No data yet.</div>}
        </div>
      </div>

      {/* Daily activity chart */}
      {daily.length > 0 && (
        <div style={S.section}>
          <span style={S.sectionLabel}>ACTIVITY</span>
          <p style={{ ...S.sectionTitle, margin: "0 0 1.25rem" }}>Daily Event Volume</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", marginBottom: "6px" }}>
            {daily.map((d, i) => {
              const total = (d.preorder_click || 0) + (d.order_success || 0) + (d.signup_attempt || 0)
              const pct = total / maxDailyTotal * 100
              return (
                <div key={i} title={`${d.date}: ${total} events`} style={{
                  flex: 1, height: `${Math.max(pct, 2)}%`,
                  background: i === daily.length - 1 ? "#00ff88" : "#e8ff00",
                  opacity: 0.7, cursor: "default", minWidth: 0,
                }} />
              )
            })}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {daily.map((d, i) => (
              <div key={i} style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: "0.45rem", color: "#333", textAlign: "center", overflow: "hidden" }}>
                {i % 3 === 0 ? d.date.slice(5) : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event count table */}
      {data?.counts && (
        <div style={S.section}>
          <span style={S.sectionLabel}>ALL EVENTS</span>
          <p style={{ ...S.sectionTitle, margin: "0 0 1rem" }}>Event Counts ({data.period})</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Event</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([ev, count]) => (
                    <tr key={ev}>
                      <td style={{ ...S.td, color: "#aaa" }}>{ev}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#f0f0f0" }}>{count.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

// ── FRAUD SECTION ─────────────────────────────────────────────────

function FraudSection({ apiBase, adminKey }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [decisions, setDecisions] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`${apiBase}/admin/fraud?key=${adminKey}`)
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const review = async (orderId, decision) => {
    setDecisions(prev => ({ ...prev, [orderId]: "..." }))
    try {
      const r = await fetch(`${apiBase}/admin/fraud/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, orderId, decision }),
      })
      const d = await r.json()
      setDecisions(prev => ({ ...prev, [orderId]: d.newStatus || decision }))
    } catch {
      setDecisions(prev => ({ ...prev, [orderId]: "ERROR" }))
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <span style={S.sectionLabel}>RISK</span>
            <p style={{ ...S.sectionTitle, margin: 0 }}>Fraud Queue</p>
          </div>
          <button onClick={load} style={{ background: "none", border: "1px solid #333", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.3rem 0.75rem", cursor: "pointer" }}>
            REFRESH
          </button>
        </div>
        {loading && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#444" }}>Loading...</div>}
        {!loading && orders.length === 0 && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555", padding: "1rem 0" }}>
            No high-risk orders. Queue is clear.
          </div>
        )}
        {!loading && orders.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Order", "User", "Item", "Amount", "Score", "Flags", "Date", "Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const dec = decisions[o.orderId]
                  const done = dec && dec !== "..."
                  return (
                    <tr key={o.orderId} style={{ background: done ? "#0a0a0a" : "transparent", opacity: done ? 0.5 : 1, transition: "opacity 0.2s" }}>
                      <td style={{ ...S.td, color: "#555", fontSize: "0.6rem" }}>{o.orderId.slice(0, 8)}</td>
                      <td style={S.td}>{o.userId.slice(0, 8)}</td>
                      <td style={S.td}>{o.garmentType}</td>
                      <td style={{ ...S.td, color: "#f0f0f0" }}>{o.amount}</td>
                      <td style={{ ...S.td, color: o.fraudScore > 80 ? "#ff4444" : "#e8ff00" }}>{o.fraudScore}</td>
                      <td style={{ ...S.td, fontSize: "0.6rem" }}>{(o.fraudFlags || []).join(", ")}</td>
                      <td style={S.td}>{o.createdAt}</td>
                      <td style={S.td}>
                        {done ? (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#00ff88" }}>{dec}</span>
                        ) : (
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {[["APPROVE","#00ff88"], ["REJECT","#ff4444"], ["ESCALATE","#e8ff00"]].map(([action, color]) => (
                              <button
                                key={action}
                                onClick={() => review(o.orderId, action)}
                                style={{ background: "none", border: `1px solid ${color}44`, color, fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", padding: "0.2rem 0.4rem", cursor: "pointer" }}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

// ── SMS ADMIN SECTION ─────────────────────────────────────────────

const SMS_TRIGGERS = [
  { id: "campaign_launch", label: "New campaign launch" },
  { id: "campaign_50pct",  label: "Campaign hits 50% funded" },
  { id: "campaign_24h",    label: "24 hours left on campaign" },
  { id: "puzzle_drop",     label: "Puzzle clue drop" },
]

function SmsAdminSection({ apiBase, adminKey }) {
  const [testPhone, setTestPhone] = useState("")
  const [testStatus, setTestStatus] = useState(null)
  const [smsCount, setSmsCount] = useState(null)
  const [toggles, setToggles] = useState({})

  const fetchStats = async () => {
    try {
      const r = await fetch(`${apiBase}/admin/sms/stats?key=${adminKey}`)
      if (r.ok) { const d = await r.json(); setSmsCount(d.sentThisMonth) }
    } catch {}
  }

  const sendTest = async () => {
    if (!testPhone.trim()) return
    setTestStatus("sending...")
    try {
      const r = await fetch(`${apiBase}/admin/sms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, phone: testPhone.trim() }),
      })
      const d = await r.json()
      setTestStatus(r.ok ? "Sent!" : `Error: ${d.error}`)
    } catch (e) {
      setTestStatus(`Error: ${e.message}`)
    }
  }

  const toggleTrigger = async (triggerId, enabled) => {
    setToggles(t => ({ ...t, [triggerId]: enabled }))
    try {
      await fetch(`${apiBase}/admin/sms/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, trigger: triggerId, enabled }),
      })
    } catch {}
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      <div style={S.section}>
        <span style={S.sectionLabel}>SMS CONTROLS</span>
        <p style={S.sectionTitle}>VIP SMS Triggers</p>
        {SMS_TRIGGERS.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#aaa" }}>{t.label}</span>
            <button
              onClick={() => toggleTrigger(t.id, !(toggles[t.id] ?? true))}
              style={{
                background: "none",
                border: `1px solid ${(toggles[t.id] ?? true) ? "#00ff88" : "#333"}`,
                color: (toggles[t.id] ?? true) ? "#00ff88" : "#555",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                padding: "0.25rem 0.75rem",
                cursor: "pointer",
              }}
            >
              {(toggles[t.id] ?? true) ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>

      <div style={S.section}>
        <span style={S.sectionLabel}>TEST SMS</span>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="tel"
            placeholder="+15551234567"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            style={{ flex: 1, background: "#141414", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", padding: "0.5rem 0.75rem", outline: "none" }}
          />
          <button
            onClick={sendTest}
            style={{ background: "#e8ff00", border: "none", color: "#000", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.15em", padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            SEND TEST
          </button>
        </div>
        {testStatus && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: testStatus === "Sent!" ? "#00ff88" : "#ff6666" }}>{testStatus}</div>}
      </div>

      <div style={S.section}>
        <span style={S.sectionLabel}>USAGE</span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "#f0f0f0", letterSpacing: "0.05em" }}>
            {smsCount ?? "—"}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#555" }}>SMS sent this month</div>
          <button onClick={fetchStats} style={{ marginLeft: "auto", background: "none", border: "1px solid #333", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.3rem 0.75rem", cursor: "pointer" }}>
            REFRESH
          </button>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#333", marginTop: "0.5rem" }}>
          Estimated cost: ~$0.00645/SMS in US
        </div>
      </div>
    </main>
  )
}

// ── DMCA SECTION ─────────────────────────────────────────────────

function DmcaSection({ apiBase, adminKey }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`${apiBase}/admin/dmca`, { headers: { "x-admin-key": adminKey } })
      .then(r => r.ok ? r.json() : { reports: [] })
      .then(d => setReports(d.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (reportId, action) => {
    setActions(a => ({ ...a, [reportId]: "..." }))
    try {
      const r = await fetch(`${apiBase}/admin/dmca/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ reportId, action }),
      })
      const d = await r.json()
      setActions(a => ({ ...a, [reportId]: action }))
    } catch {
      setActions(a => ({ ...a, [reportId]: "ERROR" }))
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div><span style={S.sectionLabel}>COPYRIGHT</span><p style={{ ...S.sectionTitle, margin: 0 }}>DMCA Reports</p></div>
          <button onClick={load} style={{ background: "none", border: "1px solid #333", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.3rem 0.75rem", cursor: "pointer" }}>REFRESH</button>
        </div>
        {loading && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#444" }}>Loading...</div>}
        {!loading && reports.length === 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555", padding: "1rem 0" }}>No DMCA reports.</div>}
        {!loading && reports.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Date","ID","Reporter","Design ID","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {reports.map(r => {
                  const done = actions[r.reportId] && actions[r.reportId] !== "..."
                  return (
                    <tr key={r.reportId} style={{ opacity: done ? 0.5 : 1 }}>
                      <td style={S.td}>{r.createdAt?.slice(0, 10)}</td>
                      <td style={{ ...S.td, color: "#555", fontSize: "0.6rem" }}>{r.reportId?.slice(0, 8)}</td>
                      <td style={S.td}>{r.reporterEmail}</td>
                      <td style={{ ...S.td, color: "#e8ff00" }}>{r.designId?.slice(0, 12)}</td>
                      <td style={S.td}>
                        <span style={{ color: r.status === "PENDING" ? "#e8ff00" : r.status === "TAKEDOWN" ? "#ff4444" : "#555", fontSize: "0.6rem", textTransform: "uppercase" }}>{r.status || "PENDING"}</span>
                      </td>
                      <td style={S.td}>
                        {done ? (
                          <span style={{ color: "#00ff88", fontSize: "0.6rem" }}>{actions[r.reportId]}</span>
                        ) : (
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {[["TAKEDOWN","#ff4444"],["REJECT","#555"],["INFO","#e8ff00"]].map(([action, color]) => (
                              <button key={action} onClick={() => act(r.reportId, action)} style={{ background: "none", border: `1px solid ${color}44`, color, fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", padding: "0.2rem 0.4rem", cursor: "pointer" }}>{action}</button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

// ── SUPPORT SECTION ───────────────────────────────────────────────

function SupportSection({ apiBase, adminKey }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [actions, setActions] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`${apiBase}/admin/support/tickets/all`, { headers: { "x-admin-key": adminKey } })
      .then(r => r.ok ? r.json() : { tickets: [] })
      .then(d => setTickets(d.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (ticketId, action) => {
    setActions(a => ({ ...a, [ticketId]: "..." }))
    try {
      const r = await fetch(`${apiBase}/admin/support/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action }),
      })
      setActions(a => ({ ...a, [ticketId]: action }))
    } catch {
      setActions(a => ({ ...a, [ticketId]: "ERROR" }))
    }
  }

  const PRIORITY_COLORS = { LOW: "#555", MEDIUM: "#888", HIGH: "#e8ff00", URGENT: "#ff4444" }
  const STATUS_COLORS2 = { OPEN: "#e8ff00", IN_PROGRESS: "#64b4ff", RESOLVED: "#00ff88" }
  const FILTERS = ["ALL","OPEN","IN_PROGRESS","RESOLVED","URGENT"]

  const filtered = filter === "ALL" ? tickets : filter === "URGENT" ? tickets.filter(t => t.priority === "URGENT") : tickets.filter(t => t.status === filter)

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div><span style={S.sectionLabel}>HELP DESK</span><p style={{ ...S.sectionTitle, margin: 0 }}>Support Tickets</p></div>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#e8ff00" : "none", border: `1px solid ${filter === f ? "#e8ff00" : "#333"}`, color: filter === f ? "#000" : "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", padding: "0.25rem 0.5rem", cursor: "pointer" }}>{f}</button>
            ))}
            <button onClick={load} style={{ background: "none", border: "1px solid #333", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", padding: "0.25rem 0.5rem", cursor: "pointer" }}>REFRESH</button>
          </div>
        </div>
        {loading && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#444" }}>Loading...</div>}
        {!loading && filtered.length === 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555" }}>No tickets.</div>}
        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Date","ID","Subject","Priority","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(t => {
                  const done = actions[t.ticketId] && actions[t.ticketId] !== "..."
                  return (
                    <tr key={t.ticketId}>
                      <td style={S.td}>{t.createdAt?.slice(0, 10)}</td>
                      <td style={{ ...S.td, color: "#555", fontSize: "0.6rem" }}>{t.ticketId?.slice(0, 8)}</td>
                      <td style={{ ...S.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{t.subject}</td>
                      <td style={S.td}><span style={{ color: PRIORITY_COLORS[t.priority] || "#555", fontSize: "0.6rem" }}>{t.priority}</span></td>
                      <td style={S.td}><span style={{ color: STATUS_COLORS2[t.status] || "#555", fontSize: "0.6rem" }}>{t.status}</span></td>
                      <td style={S.td}>
                        {done ? (
                          <span style={{ color: "#00ff88", fontSize: "0.6rem" }}>{actions[t.ticketId]}</span>
                        ) : (
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {[["RESOLVE","#00ff88"],["ESCALATE","#ff4444"]].map(([action, color]) => (
                              <button key={action} onClick={() => act(t.ticketId, action)} style={{ background: "none", border: `1px solid ${color}44`, color, fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", padding: "0.2rem 0.4rem", cursor: "pointer" }}>{action}</button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

// ── REPUTATION SECTION ────────────────────────────────────────────

function ReputationSection({ apiBase, adminKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase}/admin/reputation`, { headers: { "x-admin-key": adminKey } })
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      {loading && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#444" }}>Loading...</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Brand Health Score", val: data.brandHealthScore?.toFixed(1) || "—", color: data.brandHealthScore >= 70 ? "#00ff88" : "#e8ff00" },
              { label: "Avg Sentiment", val: data.avgSentiment?.toFixed(1) || "—", color: "#e8ff00" },
              { label: "Resolution Rate", val: data.resolutionRate ? `${(data.resolutionRate * 100).toFixed(0)}%` : "—", color: "#64b4ff" },
            ].map(c => (
              <div key={c.label} style={{ background: "#141414", border: "1px solid #262626", padding: "1.25rem 1.5rem" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.5rem" }}>{c.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: c.color, letterSpacing: "0.05em" }}>{c.val}</div>
              </div>
            ))}
          </div>

          {data.recentScans?.length > 0 && (
            <div style={S.section}>
              <span style={S.sectionLabel}>SENTIMENT TREND</span>
              <p style={S.sectionTitle}>Daily Scans</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px", marginBottom: "0.5rem" }}>
                {data.recentScans.map((s, i) => {
                  const pct = (s.avgScore || 50)
                  return (
                    <div key={i} title={`${s.date}: ${pct.toFixed(0)}`} style={{ flex: 1, height: `${pct}%`, background: pct >= 70 ? "#00ff88" : pct >= 50 ? "#e8ff00" : "#ff4444", opacity: 0.7, minWidth: 0 }} />
                  )
                })}
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                {data.recentScans.map((s, i) => (
                  <div key={i} style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: "0.45rem", color: "#333", textAlign: "center", overflow: "hidden" }}>
                    {i % 3 === 0 ? s.date?.slice(5) : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.ticketsByPriority && (
            <div style={S.section}>
              <span style={S.sectionLabel}>VOLUME</span>
              <p style={S.sectionTitle}>Tickets by Priority</p>
              {Object.entries(data.ticketsByPriority).map(([priority, count]) => (
                <div key={priority} style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#aaa" }}>{priority}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#e8ff00" }}>{count}</span>
                  </div>
                  <div style={{ height: "3px", background: "#1a1a1a" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, count * 10)}%`, background: priority === "URGENT" ? "#ff4444" : "#e8ff00" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.recentAlerts?.length > 0 && (
            <div style={S.section}>
              <span style={S.sectionLabel}>ALERTS</span>
              {data.recentAlerts.map((a, i) => (
                <div key={i} style={{ padding: "0.6rem 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#ff6666" }}>{a}</div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

// ── SUPPLIERS SECTION ─────────────────────────────────────────────

function SuppliersSection({ apiBase, adminKey }) {
  const [manufacturers, setManufacturers] = useState([])
  const [quality, setQuality] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", country: "", contactEmail: "", contactPhone: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [survival, setSurvival] = useState(null)
  const [survivalLoading, setSurvivalLoading] = useState(true)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      fetch(`${apiBase}/admin/manufacturers`, { headers: { "x-admin-key": adminKey } }).then(r => r.ok ? r.json() : { manufacturers: [] }),
      fetch(`${apiBase}/admin/quality/reports`, { headers: { "x-admin-key": adminKey } }).then(r => r.ok ? r.json() : { reports: [] }),
    ]).then(([m, q]) => {
      setManufacturers(m.manufacturers || [])
      setQuality(q.reports || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const loadSurvival = () => {
    setSurvivalLoading(true)
    fetch(`${apiBase}/admin/survival-check`, { headers: { "x-admin-key": adminKey } })
      .then(r => r.ok ? r.json() : null)
      .then(setSurvival)
      .catch(() => {})
      .finally(() => setSurvivalLoading(false))
  }

  useEffect(() => { loadAll(); loadSurvival() }, [])

  const addManufacturer = async () => {
    setSaving(true)
    try {
      const r = await fetch(`${apiBase}/admin/manufacturers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        setShowAdd(false)
        setForm({ name: "", country: "", contactEmail: "", contactPhone: "", notes: "" })
        loadAll()
      }
    } finally {
      setSaving(false)
    }
  }

  const setRole = async (id, role) => {
    try {
      await fetch(`${apiBase}/admin/manufacturers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ role }),
      })
      loadAll()
    } catch {}
  }

  const del = async (id) => {
    if (!window.confirm("Delete this manufacturer?")) return
    try {
      await fetch(`${apiBase}/admin/manufacturers/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      loadAll()
    } catch {}
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      {/* Survival Check */}
      {!survivalLoading && survival && (
        <div style={{ ...S.section, borderColor: survival.survivalScore?.split("/")[0] >= 6 ? "#1a1a1a" : "#ff444444" }}>
          <span style={S.sectionLabel}>BUSINESS CONTINUITY</span>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", color: parseInt(survival.survivalScore) >= 6 ? "#00ff88" : "#ff4444", letterSpacing: "0.05em", lineHeight: 1 }}>{survival.survivalScore}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#555", letterSpacing: "0.2em", textTransform: "uppercase" }}>Survival Score</div>
            </div>
            {survival.gaps?.length > 0 && (
              <div>
                {survival.gaps.map((gap, i) => (
                  <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#ff6666", marginBottom: "0.25rem" }}>⚠ {gap}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manufacturers */}
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div><span style={S.sectionLabel}>SUPPLY CHAIN</span><p style={{ ...S.sectionTitle, margin: 0 }}>Manufacturers</p></div>
          <button onClick={() => setShowAdd(s => !s)} style={{ background: showAdd ? "#e8ff00" : "none", border: "1px solid #e8ff00", color: showAdd ? "#000" : "#e8ff00", fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.3rem 0.75rem", cursor: "pointer" }}>
            {showAdd ? "CANCEL" : "ADD MANUFACTURER"}
          </button>
        </div>

        {showAdd && (
          <div style={{ background: "#0d0d0d", border: "1px solid #262626", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[["name","Name *"],["country","Country"],["contactEmail","Email"],["contactPhone","Phone"]].map(([k, label]) => (
                <div key={k}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#555", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</div>
                  <input style={{ background: "#141414", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", padding: "0.5rem 0.65rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                    value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#555", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>Notes</div>
              <textarea style={{ background: "#141414", border: "1px solid #333", color: "#f0f0f0", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", padding: "0.5rem 0.65rem", width: "100%", boxSizing: "border-box", outline: "none", minHeight: "50px", resize: "vertical" }}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button onClick={addManufacturer} disabled={saving || !form.name} style={{ marginTop: "0.75rem", background: "#e8ff00", border: "none", color: "#000", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", padding: "0.5rem 1.25rem", cursor: "pointer" }}>
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        )}

        {loading && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#444" }}>Loading...</div>}
        {!loading && manufacturers.length === 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#555" }}>No manufacturers on file.</div>}
        {!loading && manufacturers.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Name","Country","Email","Role","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {manufacturers.map(m => (
                  <tr key={m.id}>
                    <td style={{ ...S.td, color: "#f0f0f0" }}>{m.name}</td>
                    <td style={S.td}>{m.country}</td>
                    <td style={S.td}>{m.contactEmail}</td>
                    <td style={S.td}><span style={{ color: m.role === "primary" ? "#00ff88" : m.role === "backup" ? "#e8ff00" : "#555", fontSize: "0.6rem", textTransform: "uppercase" }}>{m.role || "none"}</span></td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        {[["PRIMARY","primary","#00ff88"],["BACKUP","backup","#e8ff00"]].map(([label, role, color]) => (
                          <button key={role} onClick={() => setRole(m.id, role)} style={{ background: "none", border: `1px solid ${color}44`, color, fontFamily: "'DM Mono', monospace", fontSize: "0.45rem", letterSpacing: "0.1em", padding: "0.2rem 0.35rem", cursor: "pointer" }}>{label}</button>
                        ))}
                        <button onClick={() => del(m.id)} style={{ background: "none", border: "1px solid #ff444444", color: "#ff6666", fontFamily: "'DM Mono', monospace", fontSize: "0.45rem", letterSpacing: "0.1em", padding: "0.2rem 0.35rem", cursor: "pointer" }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quality Reports */}
      {quality.length > 0 && (
        <div style={S.section}>
          <span style={S.sectionLabel}>QUALITY</span>
          <p style={S.sectionTitle}>Quality Reports</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Date","Manufacturer","Score","Issue","Notes"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {quality.map(q => (
                  <tr key={q.reportId}>
                    <td style={S.td}>{q.createdAt?.slice(0, 10)}</td>
                    <td style={{ ...S.td, color: "#f0f0f0" }}>{q.manufacturerName || q.manufacturerId}</td>
                    <td style={{ ...S.td, color: q.qualityScore >= 7 ? "#00ff88" : "#ff4444" }}>{q.qualityScore}/10</td>
                    <td style={S.td}>{q.issueType}</td>
                    <td style={{ ...S.td, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis" }}>{q.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

export default function AdminPanel() {
  const [activeTab, setActiveTab]     = useState("dashboard")
  const [open, setOpen]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  // Dashboard data
  const [dashData, setDashData]       = useState(null)
  const [dashLoading, setDashLoading] = useState(false)
  const [dashError, setDashError]     = useState(null)

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
    if (activeTab !== "dashboard") return
    setDashLoading(true)
    setDashError(null)
    const key = ADMIN_KEY

    Promise.all([
      fetch(`${API_BASE}/admin/snapshot?key=${key}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/admin/cashflow?key=${key}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/admin/funding?key=${key}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/admin/orders?key=${key}&page=1`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/admin/creators?key=${key}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([snap, cf, fund, orders, creators]) => {
        const snapshot = snap ? {
          ordersToday:    snap.today?.orders ?? 0,
          ordersDelta:    (snap.today?.orders ?? 0) - (snap.yesterday?.orders ?? 0),
          revenueToday:   snap.today?.revenue ?? 0,
          revenueDelta:   (snap.today?.revenue ?? 0) - (snap.yesterday?.revenue ?? 0),
          signupsToday:   snap.today?.signups ?? 0,
          activeDesigns:  0,
          totalPreorders: snap.today?.orders ?? 0,
          activeCreators: 0,
          fundedDesigns:  0,
        } : null

        const cashFlow = cf?.days || []

        const funding = (fund?.campaigns || []).map(c => ({
          id:       c.id,
          name:     c.garment,
          creator:  c.creator,
          garment:  c.garment,
          colorway: c.colorway,
          orders:   c.orders,
          goal:     c.goal,
        }))

        const ordersOut = (orders?.orders || []).map(o => ({
          id:       o.orderId,
          customer: o.userId.slice(0, 8),
          design:   o.designId.slice(0, 8),
          item:     o.garmentType,
          amount:   o.amount,
          date:     o.createdAt,
          status:   o.status.toLowerCase(),
        }))

        const creatorsOut = (creators?.creators || []).map(c => ({
          handle:      c.username,
          name:        c.username,
          submissions: c.designsSubmitted,
          funded:      0,
          orders:      c.totalSales,
          earnings:    c.earnings,
          joined:      c.joinedDate,
          status:      c.status,
        }))

        setDashData({ snapshot, cashFlow, funding, orders: ordersOut, creators: creatorsOut })
      })
      .catch((err) => setDashError(err.message || "Failed to load dashboard"))
      .finally(() => setDashLoading(false))
  }, [activeTab])

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
    { id: "dashboard",  label: "OPS DASHBOARD" },
    { id: "funnel",     label: "FUNNEL"        },
    { id: "fraud",      label: "FRAUD"         },
    { id: "dmca",       label: "DMCA"          },
    { id: "support",    label: "SUPPORT"       },
    { id: "reputation", label: "REPUTATION"    },
    { id: "suppliers",  label: "SUPPLIERS"     },
    { id: "sms",        label: "SMS"           },
    { id: "tools",      label: "TOOLS"         },
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
          {dashLoading && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#555", padding: "2rem 0" }}>
              Loading dashboard…
            </div>
          )}
          {dashError && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#ff6666", padding: "2rem 0" }}>
              {dashError}
            </div>
          )}
          {dashData && (
            <>
              <SnapshotSection  snapshot={dashData.snapshot}  />
              <CashFlowSection  cashFlow={dashData.cashFlow}  />
              <FundingSection   funding={dashData.funding}    />
              <OrdersSection    orders={dashData.orders}      />
              <CreatorsSection  creators={dashData.creators}  />
            </>
          )}
        </main>
      )}

      {/* Funnel tab */}
      {activeTab === "funnel" && (
        <FunnelSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* Fraud tab */}
      {activeTab === "fraud" && (
        <FraudSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* DMCA tab */}
      {activeTab === "dmca" && (
        <DmcaSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* Support tab */}
      {activeTab === "support" && (
        <SupportSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* Reputation tab */}
      {activeTab === "reputation" && (
        <ReputationSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* Suppliers tab */}
      {activeTab === "suppliers" && (
        <SuppliersSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
      )}

      {/* SMS tab */}
      {activeTab === "sms" && (
        <SmsAdminSection apiBase={API_BASE} adminKey={ADMIN_KEY} />
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
