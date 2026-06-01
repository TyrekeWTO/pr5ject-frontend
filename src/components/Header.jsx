export default function Header({ user, onSignOut, onSubmit }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-mark">PR5JECT</span>
          <span className="logo-tag">THE CLOTHING CLOUD</span>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link active">Arena</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onSubmit?.() }}>Submit</a>
          <a href="#" className="nav-link">Profile</a>
          {user && (
            <>
              <span className="nav-user">{user.phone}</span>
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