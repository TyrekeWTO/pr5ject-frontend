import { useState } from "react"
import { track } from "../utils/track"

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
    creatorUsername,
    creatorRank,
  } = design

  const imageUrl = `${CF_BASE}/designs/${designId}/image.jpg`
  const title = garmentType.replace(/-/g, " ")

  const fundingPercent = Math.min(100, Math.round((orderCount / THRESHOLD) * 100))
  const isFunded = status === "FUNDED"

  const handleOrder = async () => {
    track("preorder_click", { designId })
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
        {creatorUsername && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#888", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {creatorUsername}
            {creatorRank && (
              <span style={{ fontSize: "0.5rem", color: "#e8ff00", letterSpacing: "0.1em" }}>{creatorRank}</span>
            )}
          </div>
        )}
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
