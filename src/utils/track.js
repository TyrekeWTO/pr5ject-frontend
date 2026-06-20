const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

function getSessionId() {
  try {
    let sid = sessionStorage.getItem("pr5ject_sid")
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem("pr5ject_sid", sid)
    }
    return sid
  } catch {
    return ""
  }
}

export function track(event, props = {}) {
  try {
    fetch(`${API_BASE}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        ...props,
        sessionId: getSessionId(),
        ts: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // silently ignore — analytics must never break the UI
  }
}
