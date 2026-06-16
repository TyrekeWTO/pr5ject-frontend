import { useState, useEffect } from "react"
import "./App.css"
import DesignCard from "./components/DesignCard"
import Header from "./components/Header"
import LoadingArena from "./components/LoadingArena"
import AuthScreen from "./components/AuthScreen"
import SubmitScreen from "./components/SubmitScreen"
import OrderSuccess from "./components/OrderSuccess"
import OrderCancel from "./components/OrderCancel"
import StylingAssistant from "./components/StylingAssistant"
import DesignGenerator from "./components/DesignGenerator"
import Trends from "./components/Trends"
import SignupPage from "./components/SignupPage"
import VerifyPage from "./components/VerifyPage"
import LoginPage from "./components/LoginPage"
import NewPasswordPage from "./components/NewPasswordPage"
import ProfilePage from "./components/ProfilePage"
import LeaderboardPage from "./components/LeaderboardPage"
import PuzzlePage from "./components/PuzzlePage"
import AccountPage from "./components/AccountPage"
import AdminPanel from "./components/AdminPanel"
import ComingSoon from "./components/ComingSoon"
import DesignStudio from "./components/DesignStudio"
import TermsPage from "./components/TermsPage"
import PrivacyPage from "./components/PrivacyPage"
import CreatorAgreementPage from "./components/CreatorAgreementPage"
import { getCurrentUser, signOut, getIdToken } from "./auth/cognito"
import { track } from "./utils/track"
const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export default function App() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trends, setTrends] = useState(null)

  // Auth state
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [orderError, setOrderError] = useState(null)

  // Whether the site is open to visitors (null while loading)
  const [siteOpen, setSiteOpen] = useState(null)

  useEffect(() => { track("page_view", { page: "home" }) }, [])

  // Check for an existing session on load
  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setAuthChecked(true)
    })
  }, [])

  // Check the site-wide open/closed flag before rendering anything else
  useEffect(() => {
    fetch(`${API_BASE}/status`)
      .then((r) => r.json())
      .then((data) => setSiteOpen(data.open !== false))
      .catch(() => setSiteOpen(true))
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      const leaderboard = data.leaderboard || []
      setDesigns(leaderboard)
      setError(null)

      if (leaderboard.length > 0) {
        fetch(`${API_BASE}/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature: "trends", designs: leaderboard }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((t) => { if (t) setTrends(t) })
          .catch(() => {})
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  // Returns the first missing required legal doc, or null if all accepted.
  const checkLegalGate = async () => {
    try {
      const token = await getIdToken()
      const res = await fetch(`${API_BASE}/legal/status`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!res.ok) return null // fail open so a backend issue doesn't block users
      const data = await res.json()
      if (data.allRequired) return null
      return data.missing?.[0] || null
    } catch {
      return null // fail open
    }
  }

  const handleOrder = async (designId) => {
    if (!user) {
      setPendingAction(() => () => handleOrder(designId))
      setShowAuth(true)
      return
    }

    const missingDoc = await checkLegalGate()
    if (missingDoc) {
      window.location.assign(`/${missingDoc}?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setOrderError(null)
    try {
      const token = await getIdToken()
      // Empty body — server reads userId from the JWT and price from the design's garmentType
      const res = await fetch(`${API_BASE}/designs/${designId}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        if (res.status === 401) {
          // Token rejected — re-prompt sign-in and retry the order afterwards
          setPendingAction(() => () => handleOrder(designId))
          setShowAuth(true)
          return
        }
        if (res.status === 400) {
          setOrderError("This design isn't ready for pre-order yet.")
          return
        }
        throw new Error("Order failed")
      }
      const data = await res.json()
      track("checkout_started", { designId })
      // Hand off to Stripe Checkout (.assign performs the same redirect as
      // setting window.location.href, without tripping the lint immutability rule)
      window.location.assign(data.checkoutUrl)
    } catch (err) {
      console.error("Order error:", err)
      setOrderError("Something went wrong. Please try again.")
    }
  }

  const handleSubmitOpen = async () => {
    track("submit_open")
    if (!user) {
      setPendingAction(() => () => setShowSubmit(true))
      setShowAuth(true)
      return
    }

    const missingDoc = await checkLegalGate()
    if (missingDoc) {
      window.location.assign(`/${missingDoc}?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setShowSubmit(true)
  }

  const handleSubmitted = async () => {
    setShowSubmit(false)
    await fetchLeaderboard()
  }

  const handleSignOut = () => {
    signOut()
    setUser(null)
  }

  const handleAuthed = async () => {
    const u = await getCurrentUser()
    setUser(u)
    setShowAuth(false)

    // Award daily login XP (silent — non-blocking)
    try {
      const token = await getIdToken()
      if (token) {
        fetch(`${API_BASE}/users/checkin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } catch {}

    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // Lightweight path-based routing (no router lib).
  const path = window.location.pathname

  // /admin is always reachable (even when the site is closed), but only
  // renders anything if the key query param matches.
  if (path === "/admin") {
    const key = new URLSearchParams(window.location.search).get("key")
    return key === "437918" ? <AdminPanel /> : null
  }

  // Wait for the open/closed check before rendering anything else
  if (siteOpen === null) return null
  if (siteOpen === false) return <ComingSoon />

  if (path === "/order/success") return <OrderSuccess />
  if (path === "/order/cancel") return <OrderCancel />
  if (path === "/ai") return <StylingAssistant />
  if (path === "/generate") return <DesignGenerator />
  if (path === "/trends") return <Trends />
  if (path === "/signup") return <SignupPage />
  if (path === "/verify") return <VerifyPage />
  if (path === "/login") return <LoginPage />
  if (path === "/new-password") return <NewPasswordPage />
  if (path === "/profile") return <ProfilePage />
  if (path === "/leaderboard") return <LeaderboardPage />
  if (path === "/puzzles") return <PuzzlePage />
  if (path === "/account") return <AccountPage />
  if (path === "/studio") return <DesignStudio />
  if (path === "/terms") return <TermsPage />
  if (path === "/privacy") return <PrivacyPage />
  if (path === "/creator-agreement") return <CreatorAgreementPage />

  if (!authChecked) return null

  return (
    <div className="app">
      <Header user={user} onSignOut={handleSignOut} onSignIn={() => setShowAuth(true)} onSubmit={handleSubmitOpen} />
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">THE ARENA</span>
          <h2 className="arena-title">Live Designs</h2>
          <p className="arena-sub">
            50 pre-orders funds a design. Creator gets theirs free.
          </p>
        </div>

        {orderError && (
          <div className="error-state">
            <span className="error-icon">⚠</span>
            <p>{orderError}</p>
            <button onClick={() => setOrderError(null)} className="retry-btn">
              Dismiss
            </button>
          </div>
        )}

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
                onOrder={handleOrder}
              />
            ))}
          </div>
        )}

        {!loading && !error && trends && (
          <div className="trends-section">
            <span className="arena-label">AI INTEL</span>
            <h3 className="trends-title">What's Moving</h3>
            <div className="trends-grid">
              {trends.creatorTip && (
                <div className="trends-card">
                  <div className="trends-card-label">Creator Tip</div>
                  <div className="trends-card-value">{trends.creatorTip}</div>
                </div>
              )}
              {Array.isArray(trends.topCombos) && trends.topCombos.length > 0 && (
                <div className="trends-card">
                  <div className="trends-card-label">Top Combos</div>
                  <div className="trends-card-value">
                    {trends.topCombos.map((combo, i) => (
                      <div key={i} className="trends-combo">{combo}</div>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(trends.trending) && trends.trending.length > 0 && (
                <div className="trends-card">
                  <div className="trends-card-label">Trending Now</div>
                  <div className="trends-card-value">
                    {trends.trending.map((t, i) => (
                      <div key={i} className="trends-combo">
                        {typeof t === "string" ? t : (t.garmentType || t.name || JSON.stringify(t))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {showAuth && (
        <AuthScreen
          onAuthed={handleAuthed}
          onDismiss={() => { setShowAuth(false); setPendingAction(null) }}
        />
      )}
      {showSubmit && (
        <SubmitScreen
          onSubmitted={handleSubmitted}
          onDismiss={() => setShowSubmit(false)}
        />
      )}
    </div>
  )
}
