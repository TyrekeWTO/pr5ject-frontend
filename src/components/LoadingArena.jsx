export default function LoadingArena() {
  return (
    <div className="designs-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="design-card skeleton">
          <div className="skel card-img-fallback" />
        </div>
      ))}
    </div>
  )
}
