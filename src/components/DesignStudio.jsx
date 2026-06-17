import { useState, useRef, useEffect, useCallback } from "react"
import { getIdToken } from "../auth/cognito"
import { track } from "../utils/track"
import "./DesignStudio.css"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

const STYLE_CONTEXT = "Streetwear graphic design for acid-washed heavy cotton garments. Style: dark, gritty, high-contrast. Influences: Y2K chrome hardware, distressed textures, hand-script typography. Color palette: black, charcoal, faded pink, silver metallic. Output should be a flat graphic suitable for screen printing or embroidery. Transparent or white background."

const GARMENTS = {
  shorts: {
    name: "Star Shorts",
    views: ["front", "back", "side"],
    colors: {
      black: {
        front: "/garments/shorts-front-black.jpg",
        back:  "/garments/shorts-back-black.jpg",
        side:  "/garments/shorts-side-black.jpg",
      },
      pink: {
        front: "/garments/shorts-front-pink.jpg",
        back:  "/garments/shorts-back-pink.jpg",
        side:  "/garments/shorts-side-pink.jpg",
      },
    },
    colorSwatches: { black: "#1a1a1a", pink: "#e0457b" },
    overlayZone: {
      front: { top: "20%", left: "25%", width: "50%", height: "40%", label: "Front Graphic Area" },
      back:  { top: "25%", left: "30%", width: "40%", height: "35%", label: "Back Graphic Area" },
      side:  { top: "20%", left: "20%", width: "60%", height: "40%", label: "Side Graphic Area" },
    },
  },
  hoodie: {
    name: "Five Hoodie",
    views: ["front", "back"],
    colors: {
      black: {
        front: "/garments/hoodie-front-black.png",
        back:  "/garments/hoodie-back-black.png",
      },
    },
    colorSwatches: { black: "#2a2a2a" },
    overlayZone: {
      front: { top: "25%", left: "30%", width: "40%", height: "35%", label: "Chest Panel" },
      back:  { top: "15%", left: "20%", width: "60%", height: "50%",  label: "Back Panel" },
    },
  },
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const LOADING_TIPS = [
  "Nova Canvas is generating your design...",
  "Creating streetwear-optimized graphic...",
  "Applying PR5JECT style...",
]

const TOUR_STEPS = [
  { label: "Pick your garment", target: "garment" },
  { label: "Choose your colorway", target: "color" },
  { label: "Describe your design and let AI build it", target: "ai" },
  { label: "Or upload your own graphic", target: "upload" },
]

const QUICK_STARTS = [
  { label: "SOMETHING BOLD & LOUD", message: "I want something bold and loud — big graphic, high contrast, aggressive energy" },
  { label: "CLEAN & MINIMAL", message: "I'm going for clean and minimal — subtle, understated, premium vibes" },
  { label: "I HAVE AN IDEA — LET ME DESCRIBE IT", message: null },
]

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
  const [activeGarment, setActiveGarment] = useState("shorts")
  const [activeView, setActiveView]       = useState("front")
  const [activeColor, setActiveColor]     = useState("black")
  const [selectedSize, setSelectedSize]   = useState(null)
  const [thumbnails, setThumbnails]       = useState([])
  const [activeThumbIdx, setActiveThumbIdx] = useState(null)
  const [overlayBounds, setOverlayBounds] = useState(initBounds(GARMENTS["shorts"].overlayZone.front))
  const [tilt, setTilt]                   = useState({ x: 0, y: 0 })
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
  const [showHomeBtn, setShowHomeBtn]     = useState(false)

  // AI modal state
  const [aiModalOpen, setAiModalOpen]           = useState(false)
  const [aiStep, setAiStep]                     = useState("stylist") // "stylist" | "builder" | "generating"
  const [aiCustomInput, setAiCustomInput]       = useState("")
  const [aiShowCustom, setAiShowCustom]         = useState(false)
  const [aiStylistLoading, setAiStylistLoading] = useState(false)
  const [aiStylistResponse, setAiStylistResponse] = useState(null)
  const [aiFollowUpInput, setAiFollowUpInput]   = useState("")
  const [aiPrompt, setAiPrompt]                 = useState("")
  const [aiStylistTip, setAiStylistTip]         = useState(null)
  const [aiLoading, setAiLoading]               = useState(false)
  const [aiError, setAiError]                   = useState(null)
  const [aiProgressPct, setAiProgressPct]       = useState(0)
  const [aiTipIdx, setAiTipIdx]                 = useState(0)
  const [aiRetryCountdown, setAiRetryCountdown] = useState(null)

  // Hardware suggestion state
  const [hwSuggestion, setHwSuggestion]   = useState("")
  const [hwSubmitting, setHwSubmitting]   = useState(false)
  const [hwSuccess, setHwSuccess]         = useState(false)
  const [hwError, setHwError]             = useState(null)

  // Onboarding tour
  const [tourStep, setTourStep] = useState(null)

  const fileInputRef     = useRef(null)
  const viewerRef        = useRef(null)
  const cardRef          = useRef(null)
  const garmentImgRef    = useRef(null)
  const resizingRef      = useRef(null)
  const drag360Ref       = useRef(null)
  const progressTimerRef = useRef(null)
  const tipTimerRef      = useRef(null)
  const retryTimerRef    = useRef(null)
  const homeBtnTimerRef  = useRef(null)

  const garment     = GARMENTS[activeGarment]
  const overlayZone = garment.overlayZone[activeView]
  const showOverlay = !!overlayZone
  const activeOverlay = activeThumbIdx !== null ? thumbnails[activeThumbIdx] : null
  const imgKey      = `${activeGarment}-${activeView}-${activeColor}`
  const imgSrc      = garment.colors[activeColor]?.[activeView]
  const colorKeys   = Object.keys(garment.colors)

  useEffect(() => { track("page_view", { page: "studio" }) }, [])

  // First-visit tour
  useEffect(() => {
    if (!localStorage.getItem("pr5ject_studio_tour_done")) {
      const t = setTimeout(() => setTourStep(1), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const dismissTour = useCallback(() => {
    setTourStep(null)
    localStorage.setItem("pr5ject_studio_tour_done", "1")
  }, [])

  const advanceTour = useCallback(() => {
    setTourStep(s => {
      if (s >= 4) { dismissTour(); return null }
      return s + 1
    })
  }, [dismissTour])

  // Reset when garment changes
  useEffect(() => {
    const g = GARMENTS[activeGarment]
    setActiveView("front")
    setActiveColor(Object.keys(g.colors)[0])
    setOverlayBounds(initBounds(g.overlayZone.front))
    setActiveThumbIdx(null)
  }, [activeGarment])

  // Update overlay bounds when view changes
  useEffect(() => {
    const zone = garment.overlayZone[activeView]
    if (zone) setOverlayBounds(initBounds(zone))
  }, [activeView, activeGarment]) // eslint-disable-line

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

  // AI progress bar & rotating tips
  useEffect(() => {
    if (!aiLoading) {
      clearInterval(progressTimerRef.current)
      clearInterval(tipTimerRef.current)
      setAiProgressPct(0)
      setAiTipIdx(0)
      return
    }
    let pct = 0
    progressTimerRef.current = setInterval(() => {
      pct = Math.min(90, pct + 90 / (20 * 10))
      setAiProgressPct(pct)
    }, 100)
    tipTimerRef.current = setInterval(() => {
      setAiTipIdx(i => (i + 1) % LOADING_TIPS.length)
    }, 3000)
    return () => {
      clearInterval(progressTimerRef.current)
      clearInterval(tipTimerRef.current)
    }
  }, [aiLoading])

  // Retry countdown
  useEffect(() => {
    if (aiRetryCountdown === null) return
    if (aiRetryCountdown === 0) { handleAiGenerate(); return }
    retryTimerRef.current = setTimeout(() => setAiRetryCountdown(c => c - 1), 1000)
    return () => clearTimeout(retryTimerRef.current)
  }, [aiRetryCountdown]) // eslint-disable-line

  // Global resize mouse listeners
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const { dir, startX, startY, startBounds } = resizingRef.current
      const dx = (e.clientX - startX) / rect.width  * 100
      const dy = (e.clientY - startY) / rect.height * 100

      const zone = GARMENTS[activeGarment].overlayZone[activeView]
      if (!zone) return
      const zTop    = parsePct(zone.top),  zLeft  = parsePct(zone.left)
      const zRight  = zLeft + parsePct(zone.width)
      const zBottom = zTop  + parsePct(zone.height)
      const MIN = 10
      let { top, left, width, height } = startBounds

      if (dir.includes("e")) width  = Math.max(MIN, Math.min(startBounds.width + dx, zRight - left))
      if (dir.includes("w")) {
        const nl = Math.max(zLeft, Math.min(startBounds.left + dx, startBounds.left + startBounds.width - MIN))
        width = startBounds.left + startBounds.width - nl; left = nl
      }
      if (dir.includes("s")) height = Math.max(MIN, Math.min(startBounds.height + dy, zBottom - top))
      if (dir.includes("n")) {
        const nt = Math.max(zTop, Math.min(startBounds.top + dy, startBounds.top + startBounds.height - MIN))
        height = startBounds.top + startBounds.height - nt; top = nt
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
  }, [activeGarment, activeView])

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
    track("studio_360_view", { garment: activeGarment, color: activeColor })
    const token = await getIdToken()
    if (!token) { window.location.href = "/join"; return }
    setView360Loading(true)
    setView360Error(null)
    try {
      const res = await fetch(`${API_BASE}/studio/360`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ garment: activeGarment, color: activeColor }),
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
    if (files.length > 0) track("studio_upload", { count: files.length })
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

  // Canvas snapshot
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
    track("studio_snapshot", { garment: activeGarment, color: activeColor })
    const dataURL = await captureSnapshot()
    const a = document.createElement("a")
    a.href = dataURL
    a.download = `${garment.name.replace(/\s+/g, "-").toLowerCase()}-custom.png`
    a.click()
  }

  // Open AI modal
  const handleOpenAiModal = async () => {
    const token = await getIdToken()
    if (!token) { window.location.href = "/join"; return }
    setAiStep("stylist")
    setAiCustomInput("")
    setAiShowCustom(false)
    setAiStylistResponse(null)
    setAiFollowUpInput("")
    setAiPrompt("")
    setAiStylistTip(null)
    setAiStylistLoading(false)
    setAiError(null)
    setAiRetryCountdown(null)
    setAiModalOpen(true)
  }

  // Call the AI stylist
  const callStylist = async (message) => {
    setAiStylistLoading(true)
    setAiStylistResponse(null)
    setAiError(null)
    try {
      const token = await getIdToken()
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ feature: "review_prompt", prompt: message, garment: activeGarment, color: activeColor }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiStylistResponse(data)
        if (data.tip) setAiStylistTip(data.tip)
      } else {
        setAiError("Stylist unavailable — try again")
      }
    } catch {
      setAiError("Network error — try again")
    } finally {
      setAiStylistLoading(false)
    }
  }

  // AI generate
  const handleAiGenerate = async () => {
    const prompt = aiPrompt.trim()
    if (!prompt || aiLoading) return
    track("studio_ai_generate", { garment: activeGarment })
    setAiLoading(true)
    setAiError(null)
    setAiRetryCountdown(null)
    try {
      const token = await getIdToken()
      if (!token) { window.location.href = "/join"; return }
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ prompt, garment: activeGarment, color: activeColor, styleContext: STYLE_CONTEXT }),
      })
      const data = await res.json()

      if (!res.ok) {
        const errType = data?.error || "unknown"
        if (errType === "throttled") {
          setAiError("Too many requests — wait 5 seconds and try again")
          setAiRetryCountdown(5)
        } else if (errType === "bedrock_auth") {
          setAiError("AI generation is temporarily unavailable")
        } else {
          setAiError("Something went wrong. Your prompt has been saved — try again")
        }
        return
      }

      const url = data.imageUrl || data.url || data.image
      if (!url) { setAiError("No image returned — try again"); return }

      const entry = { id: `ai-${Date.now()}`, url, file: null }
      setThumbnails((prev) => {
        const next = prev.length >= 3 ? [...prev.slice(0, 2), entry] : [...prev, entry]
        setActiveThumbIdx(next.length - 1)
        return next
      })
      setAiModalOpen(false)
    } catch (err) {
      console.warn("AI generate:", err)
      setAiError("Something went wrong. Your prompt has been saved — try again")
    } finally {
      setAiLoading(false)
    }
  }

  // Hardware suggestion submit
  const handleHardwareSubmit = async () => {
    const text = hwSuggestion.trim()
    if (!text || hwSubmitting) return
    setHwSubmitting(true)
    setHwError(null)
    try {
      const token = await getIdToken()
      if (!token) { window.location.href = "/join"; return }
      const aiThumb = thumbnails.find(t => t.id.startsWith("ai-"))
      const res = await fetch(`${API_BASE}/hardware-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({
          suggestion: text,
          garment:    activeGarment,
          color:      activeColor,
          imageUrl:   aiThumb?.url || "",
        }),
      })
      if (!res.ok) throw new Error("Submit failed")
      setHwSuccess(true)
      setHwSuggestion("")
    } catch {
      setHwError("Couldn't submit — try again")
    } finally {
      setHwSubmitting(false)
    }
  }

  // Pre-order submit
  const handlePreorder = async () => {
    if (!selectedSize || submitting) return
    track("studio_preorder", { garment: activeGarment, color: activeColor, size: selectedSize })
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
      setShowHomeBtn(true)
      clearTimeout(homeBtnTimerRef.current)
      homeBtnTimerRef.current = setTimeout(() => setShowHomeBtn(false), 10000)
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
      {/* ── BACK BUTTON ── */}
      <div className="ds-back-bar">
        <a href="/" className="ds-back-btn">← Back to Arena</a>
      </div>

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
                  {view360Loading && (
                    <div className="ds-360-loading">
                      <span className="ds-spinner ds-spinner-yellow" />
                      <span className="ds-360-loading-text">Generating 360° view... (~45s)</span>
                    </div>
                  )}

                  {view360Active && (
                    <>
                      <img
                        src={view360Frames[view360FrameIdx]}
                        alt={`360° frame ${view360FrameIdx}`}
                        className="ds-garment-img"
                        draggable={false}
                      />
                      <div className="ds-360-controls">
                        <button className="ds-360-play-btn" onClick={() => setView360Playing(p => !p)}>
                          {view360Playing ? "⏸ PAUSE" : "▶ PLAY"}
                        </button>
                      </div>
                    </>
                  )}

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
                              <img src={activeOverlay.url} alt="Custom design" className="ds-overlay-img" />
                              {["nw", "ne", "sw", "se"].map((dir) => (
                                <div
                                  key={dir}
                                  className={`ds-resize-handle ds-handle-${dir}`}
                                  onMouseDown={(e) => handleResizeStart(e, dir)}
                                />
                              ))}
                            </>
                          ) : (
                            <div className="ds-overlay-empty-state">
                              <span className="ds-overlay-drop-title">DROP YOUR DESIGN HERE</span>
                              <span className="ds-overlay-drop-sub">Upload an image or use AI DESIGN</span>
                            </div>
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

            <div className={`ds-section${tourStep === 1 ? " ds-tour-highlight" : ""}`} data-tour="garment">
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

            <div className="ds-section">
              <span className="ds-section-label">VIEW</span>
              <div className="ds-pill-group">
                {garment.views.map((v) => {
                  if (v === "side" && !garment.colors[activeColor]?.[v]) return null
                  return (
                    <button
                      key={v}
                      className={`ds-pill${activeView === v ? " active" : ""}`}
                      onClick={() => setActiveView(v)}
                    >
                      {v.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={`ds-section${tourStep === 2 ? " ds-tour-highlight" : ""}`} data-tour="color">
              <span className="ds-section-label">COLOR</span>
              <div className="ds-swatches">
                {colorKeys.map((c) => (
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

            {showOverlay && (
              <div className={`ds-section${tourStep === 4 ? " ds-tour-highlight" : ""}`} data-tour="upload">
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

            <div className={`ds-section ds-action-row${tourStep === 3 ? " ds-tour-highlight" : ""}`} data-tour="ai">
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

            {thumbnails.some(t => t.id.startsWith("ai-")) && (
              <>
                <p className="ds-hw-disclaimer">
                  AI graphics apply to the fabric. Hardware customization (strings, zippers, buttons) is submitted separately below.
                </p>
                <div className="ds-section ds-hw-section">
                  <span className="ds-section-label">CUSTOM HARDWARE</span>
                  {hwSuccess ? (
                    <p className="ds-hw-success">We got it — we'll make it happen 🔥</p>
                  ) : (
                    <>
                      <p className="ds-hw-prompt">Want custom hardware? Describe your idea:</p>
                      <textarea
                        className="ds-hw-textarea"
                        placeholder="e.g. Star-shaped zipper pull, chrome aglets, custom snap buttons..."
                        value={hwSuggestion}
                        onChange={e => setHwSuggestion(e.target.value)}
                        rows={3}
                      />
                      {hwError && <p className="ds-error">{hwError}</p>}
                      <button
                        className="ds-hw-submit-btn"
                        onClick={handleHardwareSubmit}
                        disabled={!hwSuggestion.trim() || hwSubmitting}
                      >
                        {hwSubmitting ? "SUBMITTING..." : "SUBMIT IDEA"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
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
          onClick={(e) => { if (e.target === e.currentTarget && !aiLoading) setAiModalOpen(false) }}
        >
          <div className="ds-modal-box ds-modal-mobile-full">
            <button
              className="ds-modal-close"
              onClick={() => { if (!aiLoading) setAiModalOpen(false) }}
              disabled={aiLoading}
            >✕</button>

            {/* ── STEP 1: STYLIST CONVERSATION ── */}
            {aiStep === "stylist" && (
              <div className="ds-modal-step">
                <span className="ds-section-label">✦ AI STYLIST</span>
                <h3 className="ds-modal-title">Tell me what you're going for and I'll help you design something fire.</h3>

                {!aiStylistResponse && !aiStylistLoading && (
                  <>
                    <div className="ds-quickstart-group">
                      {QUICK_STARTS.map((q) => (
                        <button
                          key={q.label}
                          className={`ds-quickstart-btn${aiShowCustom && q.message === null ? " selected" : ""}`}
                          onClick={() => {
                            if (q.message === null) {
                              setAiShowCustom(true)
                            } else {
                              setAiShowCustom(false)
                              callStylist(q.message)
                            }
                          }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                    {aiShowCustom && (
                      <div className="ds-custom-input-row">
                        <textarea
                          className="ds-modal-input ds-modal-textarea"
                          placeholder="Describe your idea..."
                          value={aiCustomInput}
                          onChange={e => setAiCustomInput(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="ds-modal-nav">
                          <button
                            className="ds-modal-gen-btn"
                            onClick={() => callStylist(aiCustomInput)}
                            disabled={!aiCustomInput.trim()}
                          >
                            GET ADVICE →
                          </button>
                        </div>
                      </div>
                    )}
                    {aiError && <p className="ds-modal-error">{aiError}</p>}
                  </>
                )}

                {aiStylistLoading && (
                  <div className="ds-stylist-loading">
                    <span className="ds-spinner ds-spinner-yellow" />
                    <span>Thinking about your design...</span>
                  </div>
                )}

                {aiStylistResponse && !aiStylistLoading && (
                  <div className="ds-chat-response">
                    <div className="ds-chat-bubble">
                      <p className="ds-chat-message">{aiStylistResponse.message}</p>
                      {aiStylistResponse.tip && (
                        <p className="ds-chat-tip">✦ TIP: {aiStylistResponse.tip}</p>
                      )}
                    </div>

                    {aiStylistResponse.needs_more_info ? (
                      <>
                        {aiStylistResponse.follow_up_question && (
                          <p className="ds-follow-up-label">{aiStylistResponse.follow_up_question}</p>
                        )}
                        <textarea
                          className="ds-modal-input ds-modal-textarea"
                          placeholder="Your answer..."
                          value={aiFollowUpInput}
                          onChange={e => setAiFollowUpInput(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="ds-modal-nav">
                          <button
                            className="ds-modal-cancel-btn"
                            onClick={() => { setAiStylistResponse(null); setAiShowCustom(false) }}
                          >
                            ← START OVER
                          </button>
                          <button
                            className="ds-modal-gen-btn"
                            onClick={() => callStylist(aiFollowUpInput)}
                            disabled={!aiFollowUpInput.trim()}
                          >
                            SEND →
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="ds-modal-nav">
                        <button
                          className="ds-modal-cancel-btn"
                          onClick={() => { setAiStylistResponse(null); setAiShowCustom(false) }}
                        >
                          REFINE IT
                        </button>
                        <button
                          className="ds-modal-gen-btn"
                          onClick={() => {
                            setAiPrompt(aiStylistResponse.improved_prompt || "")
                            setAiStylistTip(aiStylistResponse.tip || null)
                            setAiStep("builder")
                          }}
                        >
                          USE THIS PROMPT →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: PROMPT BUILDER ── */}
            {aiStep === "builder" && (
              <div className="ds-modal-step">
                <span className="ds-section-label">✦ AI DESIGN GENERATOR</span>
                <h3 className="ds-modal-title">Your Prompt</h3>

                {aiStylistTip && (
                  <div className="ds-builder-tip">✦ {aiStylistTip}</div>
                )}

                <textarea
                  className="ds-assembled-prompt"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={4}
                />

                {aiError && (
                  <div className="ds-modal-error-box">
                    <p className="ds-modal-error">{aiError}</p>
                    {aiRetryCountdown !== null && (
                      <p className="ds-retry-countdown">
                        {aiRetryCountdown > 0 ? `Auto-retry in ${aiRetryCountdown}s...` : "Retrying..."}
                      </p>
                    )}
                  </div>
                )}

                <div className="ds-modal-nav">
                  <button className="ds-modal-cancel-btn" onClick={() => setAiStep("stylist")}>
                    ← Back to Stylist
                  </button>
                  <button
                    className="ds-modal-gen-btn"
                    onClick={() => { setAiStep("generating"); handleAiGenerate() }}
                    disabled={!aiPrompt.trim() || aiRetryCountdown !== null}
                  >
                    GENERATE →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: GENERATING ── */}
            {aiStep === "generating" && (
              <div className="ds-modal-step">
                <span className="ds-section-label">✦ AI DESIGN GENERATOR</span>
                <h3 className="ds-modal-title">
                  {aiLoading ? "Generating Your Design" : aiError ? "Generation Failed" : "Done"}
                </h3>

                {aiLoading && (
                  <div className="ds-progress-wrap">
                    <div className="ds-progress-bar-track">
                      <div className="ds-progress-bar-fill" style={{ width: `${aiProgressPct}%` }} />
                    </div>
                    <p className="ds-modal-loading-tip">{LOADING_TIPS[aiTipIdx]}</p>
                  </div>
                )}

                {aiError && (
                  <div className="ds-modal-error-box">
                    <p className="ds-modal-error">{aiError}</p>
                    {aiRetryCountdown !== null && (
                      <p className="ds-retry-countdown">
                        {aiRetryCountdown > 0 ? `Auto-retry in ${aiRetryCountdown}s...` : "Retrying..."}
                      </p>
                    )}
                  </div>
                )}

                <div className="ds-modal-nav">
                  <button
                    className="ds-modal-cancel-btn"
                    onClick={() => setAiStep("builder")}
                    disabled={aiLoading}
                  >
                    ← Edit Prompt
                  </button>
                  {aiError && !aiLoading && (
                    <button
                      className="ds-modal-gen-btn"
                      onClick={handleAiGenerate}
                      disabled={aiRetryCountdown !== null}
                    >
                      TRY AGAIN
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ONBOARDING TOUR ── */}
      {tourStep !== null && (
        <div className="ds-tour-overlay">
          <div className={`ds-tour-tooltip ds-tour-step-${tourStep}`}>
            <p className="ds-tour-msg">{TOUR_STEPS[tourStep - 1]?.label}</p>
            <div className="ds-tour-actions">
              <button className="ds-tour-skip" onClick={dismissTour}>SKIP</button>
              <button className="ds-tour-next" onClick={advanceTour}>
                {tourStep < 4 ? "NEXT →" : "GOT IT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className="ds-toast">{toast}</div>}

      {/* ── FLOATING HOME BUTTON ── */}
      {showHomeBtn && (
        <a href="/" className="ds-home-float">⌂ HOME</a>
      )}
    </div>
  )
}
