export default function LoadingArena() {
  return (
    <div className="designs-grid">
      {[1, 2].map((i) => (
        <div key={i} className="design-card skeleton">
          <div className="skel skel-rank" />
          <div className="skel skel-garment" />
          <div className="skel skel-chips" />
          <div className="skel skel-bar" />
          <div className="skel skel-btn" />
        </div>
      ))}
    </div>
  )
}