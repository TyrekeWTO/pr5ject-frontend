export default function OrderSuccess() {
  return (
    <div className="order-result">
      <span className="order-result-icon">✓</span>
      <h2 className="order-result-title">Card saved</h2>
      <p className="order-result-sub">
        You'll be charged when this drop hits its goal.
      </p>
      <a href="/" className="order-result-link">← Back to the Arena</a>
    </div>
  )
}
