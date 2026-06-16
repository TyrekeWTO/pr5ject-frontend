import { useRef, useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useTexture } from "@react-three/drei"

const CF_BASE = "https://d1wxtx6tyeb7i0.cloudfront.net"

const COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Olive", value: "#5c5f3a" },
  { name: "Sand", value: "#c2b280" },
  { name: "Crimson", value: "#9b1c2e" },
]

const GARMENT_TYPES = [
  { key: "tee", label: "TEE" },
  { key: "hoodie", label: "HOODIE" },
  { key: "zip-hoodie", label: "ZIP HOODIE" },
  { key: "shorts", label: "SHORTS" },
]

const DESIGNS = [
  { key: "none", label: "No design", designId: null, backTextures: null },
  { key: "hoodie-five", label: "Prized Pieces - Five Hoodie", designId: "722cac6e-ebbb-440b-99d3-b847b6a01ed0", backTextures: null },
  {
    key: "shorts-star",
    label: "Prized Pieces - Star Shorts",
    designId: "91fb8a8a-1eab-4918-9568-92f05427a97c",
    backTextures: {
      "washed-black": "image_back_black.jpg",
      "pink": "image_back_pink.jpg",
    },
  },
]

const BACK_COLORWAYS = [
  { key: "washed-black", label: "WASHED BLACK" },
  { key: "pink", label: "PINK" },
]

// Smooth out facet edges so fabric reads as soft material rather than hard plastic.
const smoothGeo = (geo) => geo.computeVertexNormals()

function fabricProps(color, isSand) {
  return { color, roughness: isSand ? 0.95 : 0.85, metalness: 0.05 }
}

// Plain fabric material, optionally attached to a specific material slot
// (used for the multi-material faces of box/cylinder geometries).
function Fabric({ color, isSand, attach }) {
  return <meshStandardMaterial attach={attach} {...fabricProps(color, isSand)} />
}

// Box geometry has 6 material slots: [+x, -x, +y, -y, +z, -z].
// Slot 4 (+z) is the front face, slot 5 (-z) is the rear face — the
// design texture goes on whichever one matches the active view.
function BoxTexturedFace({ color, isSand, textureUrl, faceSlot = 4 }) {
  const texture = useTexture(textureUrl)
  const side = fabricProps(color, isSand)
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((slot) => (
        slot === faceSlot
          ? <meshStandardMaterial key={slot} attach={`material-${slot}`} map={texture} roughness={side.roughness} metalness={side.metalness} />
          : <meshStandardMaterial key={slot} attach={`material-${slot}`} {...side} />
      ))}
    </>
  )
}

// Cylinder geometry has 3 material slots: [side, top cap, bottom cap].
// Slot 0 (the wrap-around side) carries the design texture for shorts.
function CylinderWrapTexture({ color, isSand, textureUrl }) {
  const texture = useTexture(textureUrl)
  const cap = fabricProps(color, isSand)
  return (
    <>
      <meshStandardMaterial attach="material-0" map={texture} roughness={cap.roughness} metalness={cap.metalness} />
      <meshStandardMaterial attach="material-1" {...cap} />
      <meshStandardMaterial attach="material-2" {...cap} />
    </>
  )
}

function OversizedTee({ color, isSand, textureUrl, faceSlot }) {
  return (
    <group>
      {/* Torso — wider than tall */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.6, 1.8, 1.0]} onUpdate={smoothGeo} />
        {textureUrl ? <BoxTexturedFace color={color} isSand={isSand} textureUrl={textureUrl} faceSlot={faceSlot} /> : <Fabric color={color} isSand={isSand} />}
      </mesh>
      {/* Shoulder taper panels */}
      <mesh position={[1.15, 0.78, 0]} rotation={[0, 0, -0.32]}>
        <boxGeometry args={[0.7, 0.45, 0.96]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-1.15, 0.78, 0]} rotation={[0, 0, 0.32]}>
        <boxGeometry args={[0.7, 0.45, 0.96]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Sleeves — angled down 25deg, tapered */}
      <mesh position={[1.7, 0.2, 0]} rotation={[0, 0, -0.44]}>
        <cylinderGeometry args={[0.42, 0.5, 1.15, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-1.7, 0.2, 0]} rotation={[0, 0, 0.44]}>
        <cylinderGeometry args={[0.42, 0.5, 1.15, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Crew neck collar */}
      <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.07, 12, 24]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
    </group>
  )
}

function CroppedHoodie({ color, isSand, textureUrl, faceSlot }) {
  return (
    <group>
      {/* Torso — shorter than the tee */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 1.4, 1.0]} onUpdate={smoothGeo} />
        {textureUrl ? <BoxTexturedFace color={color} isSand={isSand} textureUrl={textureUrl} faceSlot={faceSlot} /> : <Fabric color={color} isSand={isSand} />}
      </mesh>
      {/* Sleeves — slightly longer than the tee */}
      <mesh position={[1.55, 0.05, 0]} rotation={[0, 0, -0.44]}>
        <cylinderGeometry args={[0.4, 0.46, 1.3, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-1.55, 0.05, 0]} rotation={[0, 0, 0.44]}>
        <cylinderGeometry args={[0.4, 0.46, 1.3, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Ribbed cuffs */}
      <mesh position={[2.05, -0.55, 0]} rotation={[0, 0, -0.44]}>
        <cylinderGeometry args={[0.35, 0.37, 0.18, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-2.05, -0.55, 0]} rotation={[0, 0, 0.44]}>
        <cylinderGeometry args={[0.35, 0.37, 0.18, 16]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Hood — dome sitting at the top back, against the collar */}
      <mesh position={[0, 0.85, -0.32]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Kangaroo pocket — flat inset on the lower front */}
      <mesh position={[0, -0.3, 0.51]}>
        <boxGeometry args={[1.1, 0.5, 0.1]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
    </group>
  )
}

function ZipUpCroppedHoodie({ color, isSand, textureUrl, faceSlot }) {
  return (
    <group>
      <CroppedHoodie color={color} isSand={isSand} textureUrl={textureUrl} faceSlot={faceSlot} />
      {/* Zip line — thin flat box, center front, top to bottom */}
      <mesh position={[0, 0.1, 0.56]}>
        <boxGeometry args={[0.06, 1.35, 0.03]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Front pockets at hip level */}
      <mesh position={[0.55, -0.55, 0.53]}>
        <boxGeometry args={[0.6, 0.3, 0.07]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-0.55, -0.55, 0.53]}>
        <boxGeometry args={[0.6, 0.3, 0.07]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
    </group>
  )
}

function Shorts({ color, isSand, textureUrl }) {
  return (
    <group>
      {/* Waistband — flat wide cylinder, slightly wider than the legs */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.3, 24]} onUpdate={smoothGeo} />
        {textureUrl ? <CylinderWrapTexture color={color} isSand={isSand} textureUrl={textureUrl} /> : <Fabric color={color} isSand={isSand} />}
      </mesh>
      {/* Legs — short cylinders, slight outward angle */}
      <mesh position={[0.55, -0.15, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.55, 0.5, 1.2, 20]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-0.55, -0.15, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.55, 0.5, 1.2, 20]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      {/* Drawstring — two thin cylinders hanging from the waistband center */}
      <mesh position={[0.08, 0.35, 0.95]}>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
      <mesh position={[-0.08, 0.35, 0.95]}>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} onUpdate={smoothGeo} />
        <Fabric color={color} isSand={isSand} />
      </mesh>
    </group>
  )
}

function GarmentMesh({ garmentType, color, isSand, textureUrl, faceSlot }) {
  const props = { color, isSand, textureUrl, faceSlot }
  return (
    <group rotation={[0.3, 0.5, 0]}>
      {garmentType === "tee" && <OversizedTee {...props} />}
      {garmentType === "hoodie" && <CroppedHoodie {...props} />}
      {garmentType === "zip-hoodie" && <ZipUpCroppedHoodie {...props} />}
      {garmentType === "shorts" && <Shorts {...props} />}
    </group>
  )
}

export default function Configurator() {
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0].key)
  const [color, setColor] = useState(COLORS[0])
  const [designKey, setDesignKey] = useState(DESIGNS[0].key)
  const [view, setView] = useState("front")
  const [colorway, setColorway] = useState(BACK_COLORWAYS[0].key)
  const canvasRef = useRef(null)
  const [snapshot, setSnapshot] = useState(null)

  const selectedDesign = DESIGNS.find((d) => d.key === designKey)
  const frontTextureUrl = selectedDesign?.designId
    ? `${CF_BASE}/designs/${selectedDesign.designId}/image.jpg`
    : null
  const backFile = selectedDesign?.backTextures?.[colorway]
  const backTextureUrl = backFile
    ? `${CF_BASE}/designs/${selectedDesign.designId}/${backFile}`
    : null

  const textureUrl = view === "back" ? backTextureUrl : frontTextureUrl
  const faceSlot = view === "back" ? 5 : 4
  const showColorwayToggle = view === "back" && !!selectedDesign?.backTextures
  const isSand = color.name === "Sand"

  const handleSnapshot = () => {
    const canvas = canvasRef.current?.querySelector("canvas")
    if (!canvas) return
    setSnapshot(canvas.toDataURL("image/png"))
  }

  return (
    <div className="app">
      <main className="main">
        <div className="arena-header">
          <span className="arena-label">3D CONFIGURATOR</span>
          <h2 className="arena-title">Configure Your Design</h2>
          <p className="arena-sub">
            Rotate, pick a garment and color, apply a design, then snapshot your build.
          </p>
        </div>

        <div className="ai-section">
          <div ref={canvasRef} style={{ width: "100%", height: "400px" }}>
            <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 5], fov: 50 }}>
              <ambientLight intensity={0.45} />
              <directionalLight position={[5, 5, 5]} intensity={1.1} />
              <directionalLight position={[-4, -2, 3]} intensity={0.3} />
              <Suspense fallback={null}>
                <GarmentMesh garmentType={garmentType} color={color.value} isSand={isSand} textureUrl={textureUrl} faceSlot={faceSlot} />
              </Suspense>
              <OrbitControls />
            </Canvas>
          </div>

          <label className="submit-label" style={{ marginTop: "1rem" }}>Design</label>
          <select
            className="auth-input submit-select"
            value={designKey}
            onChange={(e) => setDesignKey(e.target.value)}
          >
            {DESIGNS.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>

          <div className="config-chips" style={{ marginTop: "1rem" }}>
            {[{ key: "front", label: "FRONT" }, { key: "back", label: "BACK" }].map((v) => (
              <button
                key={v.key}
                className={`chip${v.key === view ? " active" : ""}`}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {showColorwayToggle && (
            <div className="config-chips" style={{ marginTop: "1rem" }}>
              {BACK_COLORWAYS.map((c) => (
                <button
                  key={c.key}
                  className={`chip${c.key === colorway ? " active" : ""}`}
                  onClick={() => setColorway(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="config-chips" style={{ marginTop: "1rem" }}>
            {GARMENT_TYPES.map((g) => (
              <button
                key={g.key}
                className={`chip${g.key === garmentType ? " active" : ""}`}
                onClick={() => setGarmentType(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="config-chips" style={{ marginTop: "1rem" }}>
            {COLORS.map((c) => (
              <button
                key={c.name}
                className={`chip${c.name === color.name ? " active" : ""}`}
                onClick={() => setColor(c)}
                style={{ borderColor: c.value }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="ai-input-row" style={{ marginTop: "1rem" }}>
            <button className="ai-gen-btn" onClick={handleSnapshot}>
              SNAPSHOT
            </button>
          </div>

          {snapshot && (
            <div className="trends-card">
              <div className="trends-card-label">Snapshot</div>
              <img src={snapshot} alt="Configurator snapshot" style={{ maxWidth: "100%" }} />
            </div>
          )}
        </div>

        <a href="/" className="order-result-link">← Back to the Arena</a>
      </main>
    </div>
  )
}
