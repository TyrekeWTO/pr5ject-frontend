const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export async function track(event, props = {}) {
  try {
    await fetch(`${API_BASE}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...props, ts: Date.now() }),
    })
  } catch {
    // silently ignore — 404s and network errors must never block UI
  }
}
