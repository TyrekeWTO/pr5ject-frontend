import { getIdToken } from "../auth/cognito"

const API_BASE = import.meta.env.VITE_API_BASE || "https://lyizxn1vgk.execute-api.us-east-1.amazonaws.com/prod"

export async function startSubscribe() {
  const token = await getIdToken()
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  })
  const data = await res.json()
  window.location.assign(data.checkoutUrl)
}
