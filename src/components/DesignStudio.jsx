import { useState, useRef, useEffect } from "react"
import { getIdToken } from "../auth/cognito"
import "./DesignStudio.css"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"
const CF_BASE = "https://d1wxtx6tyeb7i0.cloudfront.net"

const STYLE_CONTEXT = "Streetwear graphic design for acid-washed heavy cotton garments. Style: dark, gritty, high-contrast. Influences: Y2K chrome hardware, distressed textures, hand-script typography. Color palette: black, charcoal, faded pink, silver metallic. Output should be a flat graphic suitable for screen printing or embroidery. Transparent or white background."

const GARMENT_TIPS = {
  "star-shorts": "Best placement: front chest or center back",
  "five-hoodie": "Hood and chest panel work best for bold graphics",
}

const GARMENTS = {
  "star-shorts": {
    name: "Star Shorts",
    views: {
      front: { black: "/garments/shorts-front-black.jpg", pink: "/garments/shorts-back-pink.jpg", sand: null, olive: null },
      back:  { black: "/garments/shorts-back-black.jpg",  pink: "/garments/shorts-back-pink.jpg", sand: null, olive: null },
    },
    colors: ["black", "pink", "sand", "olive"],
    colorSwatches: { black: "#1a1a1a", pink: "#e0457b", sand: "#c8b89a", olive: "#6b7c47" },
    overlayZone: { view: "front", top: "22%", left: "18%", width: "64%", height: "38%", label: "Front Graphic Area" },
  },
  "five-hoodie": {
    name: "Five Hoodie",
    views: {
      front: { black: "/garments/hoodie-front-black.png", sand: null, olive: null, crimson: null },
      back:  { black: null, sand: null, olive: null, crimson: null },
    },
    colors: ["black", "sand", "olive", "crimson"],
    colorSwatches: { black: "#2a2a2a", sand: "#c8b89a", olive: "#6b7c47", crimson: "#9b1c1c" },
    overlayZone: { view: "back", top: "14%", left: "15%", width: "70%", height: "62%", label: "Back Panel" },
  },
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

function parsePct(s) { return parseFloat(s) }

function initBounds(zone) {
  return {
    top:    parsePct(zone.top),
    left:   parsePct(zone.left),
    width:  parsePct(zone.width),
    height: parsePct(zone.height),
  }
}

function dataURLToBlob(dataURL) {
  const [header, data] = dataURL.split(",")
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export default function DesignStudio() {
  const [activeGarment, setActiveGarment] = useState("star-shorts")
  const [activeView, setActiveView]       = useState("front")
  const [activeColor, setActiveColor]     = useState("black")
  const [selectedSize, setSelectedSize]   = useState(null)
  const [thumbnails, setThumbnails]       = useState([]) // { id, url, file }
  const [activeThumbIdx, setActiveThumbIdx] = useState(null)
  const [overlayBounds, setOverlayBounds] = useState(initBounds(GARMENTS["star-shorts"].overlayZone))
  const [tilt, setTilt]                   = useState({ x: 0, y: 0 })
  const [aiModalOpen, setAiModalOpen]     = useState(false)
  const [aiPrompt, setAiPrompt]           = useState("")
  const [aiLoading, setAiLoading]         = useState(false)
  const [aiError, setAiError]             = useState(null)
  const [submitting, setSubmitting]       = useState(false)
  const [submitError, setSubmitError]     = useState(null)
  const [toast, setToast]                 = useState(null)
  const [imgErrors, setImgErrors]         = useState({})
  const [view360Active, setView360Active] = useState(false)
  const [view360Frames, setView360Frames] = useState([])
  const [view360Loading, setView360Loading] = useState(false)
  const [view360Error, setView360Error]   = useState(null)
  const [view360Playing, setView360Playing] = useState(false)
  const [view360FrameIdx, setView360FrameIdx] = useState(0)

  const fileInputRef  = useRef(null)
  const viewerRef     = useRef(null)
  const cardRef       = useRef(null)
  const garmentImgRef = useRef(null)
  const resizingRef   = useRef(null)
  const drag360Ref    = useRef(null)

  const GARMENT_360_KEY = { "star-shorts": "shorts", "five-hoodie": "hoodie" }

  const garment      = GARMENTS[activeGarment]
  const overlayZone  = garment.overlayZone
  const showOverlay  = activeView === overlayZone.view
  const activeOverlay = activeThumbIdx !== null ? thumbnails[activeThumbIdx] : null
  const imgKey       = `${activeGarment}-${activeView}-${activeColor}`
  const imgSrc       = garment.views[activeView][activeColor]

  if (activeGarment === "star-shorts" && activeView === "front" && activeColor === "black") {
    console.log("[DesignStudio] shorts/front/black resolved src:", imgSrc)
  }

  // Reset state when garment changes
  useEffect(() => {
    setActiveView("front")
    setActiveColor(GARMENTS[activeGarment].colors[0])
    setOverlayBounds(initBounds(GARMENTS[activeGarment].overlayZone))
    setActiveThumbIdx(null)
  }, [activeGarment])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // 360 frame loop
  useEffect(() => {
    if (!view360Playing || view360Frames.length === 0) return
    const t = setInterval(() => setView360FrameIdx(i => (i + 1) % view360Frames.length), 150)
    return () => clearInterval(t)
  }, [view360Playing, view360Frames.length])

  // Global resize mouse listeners
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const { dir, startX, startY, startBounds } = resizingRef.current
      const dx = (e.clientX - startX) / rect.width  * 100
      const dy = (e.clientY - startY) / rect.height * 100

      const zone = GARMENTS[activeGarment].overlayZone
      const zTop   = parsePct(zone.top),  zLeft  = parsePct(zone.left)
      const zRight  = zLeft + parsePct(zone.width)
      const zBottom = zTop  + parsePct(zone.height)
      const MIN = 10

      let { top, left, width, height } = startBounds

      if (dir.includes("e")) width  = Math.max(MIN, Math.min(startBounds.width + dx, zRight - left))
      if (dir.includes("w")) {
        const nl = Math.max(zLeft, Math.min(startBounds.left + dx, startBounds.left + startBounds.width - MIN))
        width = startBounds.left + startBounds.width - nl
        left  = nl
      }
      if (dir.includes("s")) height = Math.max(MIN, Math.min(startBounds.height + dy, zBottom - top))
      if (dir.includes("n")) {
        const nt = Math.max(zTop, Math.min(startBounds.top + dy, startBounds.top + startBounds.height - MIN))
        height = startBounds.top + startBounds.height - nt
        top    = nt
      }
      setOverlayBounds({ top, left, width, height })
    }
    const onUp = () => { resizingRef.current = null }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [activeGarment])

  // 3D tilt — mouse
  const handleViewerMouseMove = (e) => {
    if (!viewerRef.current) return
    const rect = viewerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    setTilt({
      x: Math.max(-8, Math.min(8, -(e.clientY - cy) / 20)),
      y: Math.max(-8, Math.min(8,  (e.clientX - cx) / 20)),
    })
  }
  const handleViewerMouseLeave = () => setTilt({ x: 0, y: 0 })

  // 3D tilt — touch
  const handleTouchMove = (e) => {
    if (!viewerRef.current) return
    const rect = viewerRef.current.getBoundingClientRect()
    const t  = e.touches[0]
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    setTilt({
      x: Math.max(-5, Math.min(5, -(t.clientY - cy) / 20)),
      y: Math.max(-5, Math.min(5,  (t.clientX - cx) / 20)),
    })
  }
  const handleTouchEnd = () => setTilt({ x: 0, y: 0 })

  // 360 view
  const handle360View = async () => {
    const token = await getIdToken()
    if (!token) { window.location.href = "/join"; return }
    setView360Loading(true)
    setView360Error(null)
    try {
      const res = await fetch(`${API_BASE}/studio/360`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ garment: GARMENT_360_KEY[activeGarment], color: activeColor }),
      })
      if (!res.ok) throw new Error("generation failed")
      const data = await res.json()
      if (!data.frames?.length) throw new Error("no frames returned")
      setView360Frames(data.frames)
      setView360FrameIdx(0)
      setView360Playing(true)
      setView360Active(true)
    } catch (err) {
      console.warn("360:", err)
      setView360Error("360° view unavailable")
    } finally {
      setView360Loading(false)
    }
  }

  const exit360 = () => {
    setView360Active(false)
    setView360Frames([])
    setView360Playing(false)
    setView360FrameIdx(0)
    setView360Error(null)
    drag360Ref.current = null
  }

  const handle360DragStart = (e) => {
    if (!view360Active || view360Frames.length === 0) return
    setView360Playing(false)
    drag360Ref.current = { startX: e.clientX, startFrame: view360FrameIdx }
  }

  const handle360DragMove = (e) => {
    if (!drag360Ref.current) return
    const dx   = e.clientX - drag360Ref.current.startX
    const step = Math.round(dx / 40)
    const n    = view360Frames.length
    setView360FrameIdx(((drag360Ref.current.startFrame + step) % n + n) % n)
  }

  const handle360DragEnd = () => { drag360Ref.current = null }

  // File upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - thumbnails.length)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setThumbnails((prev) => {
          if (prev.length >= 3) return prev
          const next = [...prev, { id: `${Date.now()}-${Math.random()}`, url: ev.target.result, file }]
          setActiveThumbIdx(next.length - 1)
          return next
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removeThumbnail = (idx) => {
    setThumbnails((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      setActiveThumbIdx((cur) => {
        if (cur === null) return null
        if (cur === idx) return next.length > 0 ? Math.min(idx, next.length - 1) : null
        return cur > idx ? cur - 1 : cur
      })
      return next
    })
  }

  const handleResizeStart = (e, dir) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = { dir, startX: e.clientX, startY: e.clientY, startBounds: { ...overlayBounds } }
  }

  // Canvas snapshot (no html2canvas dep)
  const captureSnapshot = async () => {
    const W = 800, H = Math.round(W * 4 / 3)
    const canvas = document.createElement("canvas")
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#0d0d0d"
    ctx.fillRect(0, 0, W, H)

    const img = garmentImgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, W, H)
    } else {
      ctx.fillStyle = garment.colorSwatches[activeColor] || "#1a1a1a"
      ctx.globalAlpha = 0.7
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1
    }

    if (activeOverlay && showOverlay) {
      const ob = overlayBounds
      try {
        const oImg = new Image()
        oImg.crossOrigin = "anonymous"
        await new Promise((res) => { oImg.onload = res; oImg.onerror = res; oImg.src = activeOverlay.url })
        ctx.globalCompositeOperation = "multiply"
        ctx.drawImage(oImg, ob.left / 100 * W, ob.top / 100 * H, ob.width / 100 * W, ob.height / 100 * H)
        ctx.globalCompositeOperation = "source-over"
      } catch {}
    }

    return canvas.toDataURL("image/png")
  }

  const handleSnapshot = async () => {
    const dataURL = await captureSnapshot()
    const a = document.createElement("a")
    a.href = dataURL
    a.download = `${garment.name.replace(/\s+/g, "-").toLowerCase()}-custom.png`
    a.click()
  }

  // Open AI modal — redirect to /join if not logged in
  const handleOpenAiModal = async () => {
    const token = await getIdToken()
    if (!token) {
      window.location.href = "/join"
      return
    }
    setAiError(null)
    setAiModalOpen(true)
  }

  // AI generate
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    try {
      const token = await getIdToken()
      if (!token) {
        window.location.href = "/join"
        return
      }
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          garment: activeGarment,
          color: activeColor,
          styleContext: STYLE_CONTEXT,
        }),
      })
      if (!res.ok) throw new Error("AI generation failed")
      const data = await res.json()
      const url = data.imageUrl || data.url || data.image
      if (!url) throw new Error("No image returned")
      const entry = { id: `ai-${Date.now()}`, url, file: null }
      setThumbnails((prev) => {
        const next = prev.length >= 3 ? [...prev.slice(0, 2), entry] : [...prev, entry]
        setActiveThumbIdx(next.length - 1)
        return next
      })
      setAiModalOpen(false)
      setAiPrompt("")
    } catch (err) {
      console.warn("AI generate:", err)
      setAiError("Generation failed — try again")
    } finally {
      setAiLoading(false)
    }
  }

  // Pre-order submit
  const handlePreorder = async () => {
    if (!selectedSize || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    let token
    try {
      token = await getIdToken()
    } catch {
      setSubmitError("Please log in to pre-order. Sign up at /signup")
      setSubmitting(false)
      return
    }

    try {
      const designRes = await fetch(`${API_BASE}/designs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: `${garment.name} — Custom`,
          garmentType: activeGarment,
          configuration: {
            garment: activeGarment,
            colorway: activeColor,
            view: activeView,
            size: selectedSize,
            hasCustomDesign: activeOverlay !== null,
          },
        }),
      })
      if (!designRes.ok) throw new Error("Design submission failed")
      const { designId } = await designRes.json()

      // Upload snapshot
      try {
        const dataURL = await captureSnapshot()
        const blob    = dataURLToBlob(dataURL)
        const urlRes  = await fetch(`${API_BASE}/designs/${designId}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ designId, contentType: "image/png" }),
        })
        if (urlRes.ok) {
          const { uploadUrl } = await urlRes.json()
          await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: blob })
        }
      } catch (snapErr) {
        console.warn("Snapshot upload failed:", snapErr)
      }

      setToast("Your design is in the Arena! Get 50 pre-orders to make it real.")
      setTimeout(() => { window.location.href = "/" }, 2500)
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const overlayStyle = {
    position: "absolute",
    top:    `${overlayBounds.top}%`,
    left:   `${overlayBounds.left}%`,
    width:  `${overlayBounds.width}%`,
    height: `${overlayBounds.height}%`,
  }

  return (
    <div className="app ds-page">
      <main className="ds-main">

        <div className="ds-layout">
          {/* ── VIEWER ── */}
          <div className="ds-viewer-col">
            <div
              ref={viewerRef}
              className="ds-perspective"
              onMouseMove={view360Active ? handle360DragMove : handleViewerMouseMove}
              onMouseLeave={view360Active ? handle360DragEnd : handleViewerMouseLeave}
              onMouseDown={view360Active ? handle360DragStart : undefined}
              onMouseUp={view360Active ? handle360DragEnd : undefined}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`ds-card-float${view360Active || view360Loading ? " paused" : ""}`}>
                <div
                  ref={cardRef}
                  className="ds-card"
                  style={view360Active ? {} : { transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
                >
                  {/* Loading overlay */}
                  {view360Loading && (
                    <div className="ds-360-loading">
                      <span className="ds-spinner ds-spinner-yellow" />
                      <span className="ds-360-loading-text">Generating 360° view... (~45s)</span>
                    </div>
                  )}

                  {/* 360 frame viewer */}
                  {view360Active && (
                    <>
                      <img
                        src={view360Frames[view360FrameIdx]}
                        alt={`360° frame ${view360FrameIdx}`}
                        className="ds-garment-img"
                        draggable={false}
                      />
                      <div className="ds-360-controls">
                        <button
                          className="ds-360-play-btn"
                          onClick={() => setView360Playing(p => !p)}
                        >
                          {view360Playing ? "⏸ PAUSE" : "▶ PLAY"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Static garment view */}
                  {!view360Loading && !view360Active && (
                    <>
                      {imgSrc && !imgErrors[imgKey] ? (
                        <img
                          ref={garmentImgRef}
                          key={imgKey}
                          src={imgSrc}
                          alt={garment.name}
                          className="ds-garment-img"
                          onError={() => setImgErrors((p) => ({ ...p, [imgKey]: true }))}
                        />
                      ) : (
                        <div
                          className="ds-placeholder"
                          style={{ backgroundColor: garment.colorSwatches[activeColor] || "#1a1a1a" }}
                        >
                          <span className="ds-placeholder-text">
                            {garment.name} — PHOTO COMING SOON
                          </span>
                        </div>
                      )}

                      {showOverlay && (
                        <div
                          className={`ds-overlay-zone${activeOverlay ? " has-image" : " empty"}`}
                          style={overlayStyle}
                          onClick={!activeOverlay ? () => fileInputRef.current?.click() : undefined}
                        >
                          {activeOverlay ? (
                            <>
                              <img
                                src={activeOverlay.url}
                                alt="Custom design"
                                className="ds-overlay-img"
                              />
                              {["nw", "ne", "sw", "se"].map((dir) => (
                                <div
                                  key={dir}
                                  className={`ds-resize-handle ds-handle-${dir}`}
                                  onMouseDown={(e) => handleResizeStart(e, dir)}
                                />
                              ))}
                            </>
                          ) : (
                            <span className="ds-add-label">+ Add Your Design</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="ds-controls-col">

            {/* Garment selector */}
            <div className="ds-section">
              <span className="ds-section-label">GARMENT</span>
              <div className="ds-pill-group">
                {Object.entries(GARMENTS).map(([key, g]) => (
                  <button
                    key={key}
                    className={`ds-pill${activeGarment === key ? " active" : ""}`}
                    onClick={() => setActiveGarment(key)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div className="ds-section">
              <span className="ds-section-label">VIEW</span>
              <div className="ds-pill-group">
                {["front", "back"].map((v) => (
                  <button
                    key={v}
                    className={`ds-pill${activeView === v ? " active" : ""}`}
                    onClick={() => setActiveView(v)}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Color swatches */}
            <div className="ds-section">
              <span className="ds-section-label">COLOR</span>
              <div className="ds-swatches">
                {garment.colors.map((c) => (
                  <button
                    key={c}
                    className={`ds-swatch${activeColor === c ? " selected" : ""}`}
                    style={{ backgroundColor: garment.colorSwatches[c] || "#333" }}
                    onClick={() => setActiveColor(c)}
                    aria-label={c}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Upload zone — only when overlay view is active */}
            {showOverlay && (
              <div className="ds-section">
                <span className="ds-section-label">CUSTOMIZE THIS AREA</span>
                <span className="ds-zone-hint">{overlayZone.label}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="ds-hidden-input"
                  onChange={handleFileChange}
                />
                <button
                  className="ds-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={thumbnails.length >= 3}
                >
                  {thumbnails.length >= 3 ? "MAX 3 UPLOADS" : "UPLOAD DESIGN"}
                </button>

                {thumbnails.length > 0 && (
                  <div className="ds-thumbnail-strip">
                    {thumbnails.map((t, idx) => (
                      <div
                        key={t.id}
                        className={`ds-thumbnail${activeThumbIdx === idx ? " active" : ""}`}
                        onClick={() => setActiveThumbIdx(activeThumbIdx === idx ? null : idx)}
                      >
                        <img src={t.url} alt={`Design ${idx + 1}`} />
                        <button
                          className="ds-thumb-remove"
                          onClick={(e) => { e.stopPropagation(); removeThumbnail(idx) }}
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI + Snapshot + 360 */}
            <div className="ds-section ds-action-row">
              <button className="ds-ai-btn" onClick={handleOpenAiModal} disabled={view360Loading}>
                ✦ AI DESIGN
              </button>
              <button className="ds-snapshot-btn" onClick={handleSnapshot} disabled={view360Active || view360Loading}>
                SNAPSHOT
              </button>
              <button
                className={`ds-360-btn${view360Active ? " active" : ""}`}
                onClick={view360Active ? exit360 : handle360View}
                disabled={view360Loading}
              >
                {view360Loading
                  ? <><span className="ds-spinner ds-spinner-dark" /> GEN...</>
                  : view360Active ? "EXIT 360" : "360° VIEW"}
              </button>
            </div>

            {view360Error && <div className="ds-error">{view360Error}</div>}
            {submitError && <div className="ds-error">{submitError}</div>}
          </div>
        </div>
      </main>

      {/* ── STICKY BAR ── */}
      <div className="ds-sticky-bar">
        <div className="ds-size-row">
          {SIZES.map((s) => (
            <button
              key={s}
              className={`ds-size-btn${selectedSize === s ? " selected" : ""}`}
              onClick={() => setSelectedSize(selectedSize === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          className={`ds-preorder-btn${!selectedSize ? " disabled" : ""}`}
          onClick={handlePreorder}
          disabled={!selectedSize || submitting}
        >
          {submitting ? "SUBMITTING..." : !selectedSize ? "SELECT SIZE" : "PRE-ORDER • 50 NEEDED"}
        </button>
      </div>

      {/* ── AI MODAL ── */}
      {aiModalOpen && (
        <div
          className="ds-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget && !aiLoading) { setAiModalOpen(false); setAiError(null) } }}
        >
          <div className="ds-modal-box">
            <button className="ds-modal-close" onClick={() => { setAiModalOpen(false); setAiError(null) }} disabled={aiLoading}>✕</button>
            <span className="ds-section-label">AI DESIGN GENERATOR</span>
            <h3 className="ds-modal-title">Describe Your Design</h3>
            <p className="ds-modal-sub">
              Tell the AI what graphic you want on your {garment.name}.
            </p>
            <input
              className="ds-modal-input"
              type="text"
              placeholder="e.g. retro sun motif, black and yellow..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
              disabled={aiLoading}
              autoFocus
            />
            {GARMENT_TIPS[activeGarment] && (
              <p className="ds-modal-tip">{GARMENT_TIPS[activeGarment]}</p>
            )}
            {aiError && <p className="ds-modal-error">{aiError}</p>}
            <div className="ds-modal-actions">
              <button
                className="ds-modal-gen-btn"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
              >
                {aiLoading ? <><span className="ds-spinner" /> GENERATING...</> : "GENERATE"}
              </button>
              <button className="ds-modal-cancel-btn" onClick={() => { setAiModalOpen(false); setAiError(null) }} disabled={aiLoading}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className="ds-toast">{toast}</div>}
    </div>
  )
}
