import { useState } from "react"

export default function Header({ user, onSignOut, onSubmit }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-mark">PR5JECT</span>
          <span className="logo-tag">THE CLOTHING CLOUD</span>
        </div>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav${menuOpen ? " open" : ""}`}>
          <a href="#" className="nav-link active">Arena</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onSubmit?.() }}>Submit</a>
          <a href="/ai" className="nav-link">AI Stylist</a>
          <a href="/trends" className="nav-link">Trends</a>
          <a href="/studio" className="nav-link">Design Studio</a>
          <a href="/configure" className="nav-link">3D Studio</a>
          <a href="/profile" className="nav-link">Profile</a>
          {!user && (
            <>
              <a href="/login" className="nav-link">Log In</a>
              <a href="/signup" className="nav-link">Sign Up</a>
            </>
          )}
          {user && (
            <>
              <span className="nav-user">{user.email}</span>
              <button className="nav-signout" onClick={onSignOut}>
                SIGN OUT
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
