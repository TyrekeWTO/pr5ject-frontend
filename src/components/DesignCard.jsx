import { useState } from "react"

const THRESHOLD = 50
const CF_BASE = "https://d1wxtx6tyeb7i0.cloudfront.net"

export default function DesignCard({ design, onOrder }) {
  const [ordering, setOrdering] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const {
    designId,
    garmentType,
    orderCount = 0,
    status,
  } = design

  const imageUrl = `${CF_BASE}/designs/${designId}/image.jpg`
  const title = garmentType.replace(/-/g, " ")

  const fundingPercent = Math.min(100, Math.round((orderCount / THRESHOLD) * 100))
  const isFunded = status === "FUNDED"

  const handleOrder = async () => {
    setOrdering(true)
    // On success onOrder redirects to Stripe Checkout (page navigates away);
    // on error/sign-in it returns and we re-enable the button.
    await onOrder(designId)
    setOrdering(false)
  }

  return (
    <div
      className={`design-card ${isFunded ? "funded" : ""}${revealed ? " revealed" : ""}`}
      onClick={() => setRevealed((r) => !r)}
    >
      {!imgFailed ? (
        <img
          src={imageUrl}
          alt={title}
          className="card-img"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="card-img-fallback" />
      )}

      <div className="card-overlay">
        <div className="card-overlay-title">{title}</div>
        <div className="card-overlay-funding">
          {isFunded ? "Funded" : `${fundingPercent}% funded`}
        </div>
        <button
          className={`preorder-btn ${ordering ? "loading" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleOrder() }}
          disabled={ordering || isFunded}
        >
          {ordering ? "..." : "Pre-order"}
        </button>
      </div>

      <div className="funding-bar">
        <div
          className={`funding-fill ${isFunded ? "funded" : ""}`}
          style={{ width: `${fundingPercent}%` }}
        />
      </div>
    </div>
  )
}
