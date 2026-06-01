import { useState, useEffect } from "react"
import "./App.css"
import DesignCard from "./components/DesignCard"
import Header from "./components/Header"
import LoadingArena from "./components/LoadingArena"
import AuthScreen from "./components/AuthScreen"
import SubmitScreen from "./components/SubmitScreen"
import OrderSuccess from "./components/OrderSuccess"
import OrderCancel from "./components/OrderCancel"
import { getCurrentUser, signOut, getIdToken } from "./auth/cognito"
const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export default function App() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Auth state
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [orderError, setOrderError] = useState(null)

  // Check for an existing session on load
  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setAuthChecked(true)
    })
  }, [])

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
    if (!user) {
      setPendingAction(() => () => handleVote(designId))
      setShowAuth(true)
      return
    }
    try {
      const token = await getIdToken()
      const res = await fetch(`${API_BASE}/designs/${designId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          console.warn("Vote rejected:", data.error)
          return
        }
        throw new Error(data.error || "Vote failed")
      }
      await fetchLeaderboard()
    } catch (err) {
      console.error("Vote error:", err)
    }
  }

  const handleOrder = async (designId) => {
    if (!user) {
      setPendingAction(() => () => handleOrder(designId))
      setShowAuth(true)
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
      // Hand off to Stripe Checkout (.assign performs the same redirect as
      // setting window.location.href, without tripping the lint immutability rule)
      window.location.assign(data.checkoutUrl)
    } catch (err) {
      console.error("Order error:", err)
      setOrderError("Something went wrong. Please try again.")
    }
  }

  const handleSubmitOpen = () => {
    if (!user) {
      setPendingAction(() => () => setShowSubmit(true))
      setShowAuth(true)
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
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // Lightweight path-based routing for the Stripe return pages (no router lib).
  const path = window.location.pathname
  if (path === "/order/success") return <OrderSuccess />
  if (path === "/order/cancel") return <OrderCancel />

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
                onVote={handleVote}
                onOrder={handleOrder}
              />
            ))}
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