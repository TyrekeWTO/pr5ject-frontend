import { useEffect } from "react"
import { track } from "../utils/track"

export default function OrderCancel() {
  useEffect(() => { track("order_cancel") }, [])

  return (
    <div className="order-result">
      <span className="order-result-icon muted">×</span>
      <h2 className="order-result-title">Pre-order cancelled</h2>
      <a href="/" className="order-result-link">← Back to the Arena</a>
    </div>
  )
}
