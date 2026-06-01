import { useState } from "react"

const GARMENT_EMOJI = {
  "cargo-shorts": "🩳",
  "tactical-hoodie": "🧥",
  "utility-vest": "🦺",
  "track-pants": "👖",
  "bomber-jacket": "🧣",
}

const THRESHOLD = 50
const CF_BASE = "https://d1wxtx6tyeb7i0.cloudfront.net"

export default function DesignCard({ design, onVote, onOrder }) {
  const [ordering, setOrdering] = useState(false)
  const [voting, setVoting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const {
    designId,
    garmentType,
    configuration,
    voteCount = 0,
    orderCount = 0,
    status,
    rank,
    creatorId,
  } = design

  const imageUrl = `${CF_BASE}/designs/${designId}/image.jpg`

  const fundingPercent = Math.min(100, Math.round((orderCount / THRESHOLD) * 100))
  const isFunded = status === "FUNDED"

  const handleVote = async () => {
    setVoting(true)
    await onVote(designId)
    setVoting(false)
  }

  const handleOrder = async () => {
    setOrdering(true)
    // On success onOrder redirects to Stripe Checkout (page navigates away);
    // on error/sign-in it returns and we re-enable the button.
    await onOrder(designId)
    setOrdering(false)
  }

  return (
    <div className={`design-card ${isFunded ? "funded" : ""}`}>

      {!imgFailed && (
        <div className={`card-img-wrap${imgLoaded ? " loaded" : ""}`}>
          <img
            src={imageUrl}
            alt=""
            className="card-img"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        </div>
      )}

      <div className="card-rank">#{rank}</div>

      <div className="card-garment">
        <span className="garment-icon">
          {GARMENT_EMOJI[garmentType] || "👕"}
        </span>
        <div className="garment-tag">{garmentType.replace("-", " ")}</div>
      </div>

      <div className="config-chips">
        {Object.entries(configuration || {}).map(([key, val]) => (
          <span key={key} className="chip">{val}</span>
        ))}
      </div>

      <div className="card-creator">
        by <span>{creatorId}</span>
      </div>

      <div className="funding-section">
        <div className="funding-labels">
          <span className="funding-pct">{fundingPercent}% funded</span>
          <span className="funding-count">{orderCount} / {THRESHOLD} orders</span>
        </div>
        <div className="funding-bar">
          <div
            className={`funding-fill ${isFunded ? "funded" : ""}`}
            style={{ width: `${fundingPercent}%` }}
          />
        </div>
        {isFunded && (
          <div className="funded-badge">🏆 FUNDED — GOING TO MANUFACTURING</div>
        )}
      </div>

      <div className="stats-row">
        <button
          className={`vote-btn ${voting ? "loading" : ""}`}
          onClick={handleVote}
          disabled={voting || isFunded}
        >
          {voting ? "..." : `▲ ${voteCount}`}
        </button>
        <button
          className={`preorder-btn ${ordering ? "loading" : ""}`}
          onClick={handleOrder}
          disabled={ordering || isFunded}
        >
          {ordering ? "..." : "Pre-order"}
        </button>
        <span className="stat-divider" />
        <span className="order-stat">{orderCount} pre-orders</span>
      </div>
    </div>
  )
}