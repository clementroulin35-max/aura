/**
 * GSS Orion V3 — API Hook
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000';

export async function fetchPulse() {
  try {
    const res = await fetch(`${API_BASE}/v1/atlas/pulse`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Pulse fetch failed:', err.message);
    return null;
  }
}

export async function runMission(task) {
  const res = await fetch(`${API_BASE}/v1/graph/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export function connectEvents(onMessage) {
  const ws = new WebSocket('ws://localhost:8000/ws/events');
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch { /* ignore parse errors */ }
  };
  ws.onerror = () => console.warn('[WS] Connection error');
  ws.onclose = () => {
    console.warn('[WS] Disconnected. Reconnecting in 5s...');
    setTimeout(() => connectEvents(onMessage), 5000);
  };
  return ws;
}
