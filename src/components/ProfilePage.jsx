import { useState, useEffect } from "react"
import { getCurrentUser, signOut } from "../auth/cognito"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setChecked(true)
    })
  }, [])

  const handleSignOut = () => {
    signOut()
    window.location.assign("/")
  }

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
              <p className="auth-sub">You're not signed in.</p>
              <a href="/login" className="auth-btn" style={{ textAlign: "center", textDecoration: "none" }}>
                LOG IN
              </a>
            </>
          )}

          {checked && user && (
            <>
              <p className="auth-sub">Signed in as</p>
              <p className="nav-user" style={{ marginBottom: "24px", fontSize: "16px" }}>{user.email}</p>
              <button className="auth-btn" onClick={handleSignOut}>SIGN OUT</button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
