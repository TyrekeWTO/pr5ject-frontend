import { useState } from "react"

const GARMENT_EMOJI = {
  "cargo-shorts": "🩳",
  "tactical-hoodie": "🧥",
  "utility-vest": "🦺",
  "track-pants": "👖",
  "bomber-jacket": "🧣",
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const THRESHOLD = 50

export default function DesignCard({ design, onVote, onOrder }) {
  const [selectedSize, setSelectedSize] = useState("")
  const [ordering, setOrdering] = useState(false)
  const [voting, setVoting] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

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

  const fundingPercent = Math.min(100, Math.round((orderCount / THRESHOLD) * 100))
  const isFunded = status === "FUNDED"

  const handleVote = async () => {
    setVoting(true)
    await onVote(designId)
    setVoting(false)
  }

  const handleOrder = async () => {
    if (!selectedSize) return
    setOrdering(true)
    const result = await onOrder(designId, selectedSize)
    setOrderResult(result)
    setOrdering(false)
  }

  return (
    <div className={`design-card ${isFunded ? "funded" : ""}`}>

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
        <span className="stat-divider" />
        <span className="order-stat">{orderCount} pre-orders</span>
      </div>

      {!isFunded && (
        <div className="order-section">
          <div className="size-grid">
            {SIZES.map((s) => (
              <button
                key={s}
                className={`size-btn ${selectedSize === s ? "selected" : ""}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            className={`order-btn ${!selectedSize ? "disabled" : ""} ${ordering ? "loading" : ""}`}
            onClick={handleOrder}
            disabled={!selectedSize || ordering}
          >
            {ordering ? "Placing order..." : "Pre-Order — Fund This Drop"}
          </button>
          {orderResult?.creatorReward && (
            <div className="creator-reward">
              🏆 YOUR DESIGN FUNDED. YOUR PAIR IS FREE.
            </div>
          )}
          {orderResult && !orderResult.creatorReward && (
            <div className="order-confirm">
              ✓ Order placed — {orderResult.ordersUntilFunded} more needed to fund
            </div>
          )}
        </div>
      )}
    </div>
  )
}