/**
 * GSS Orion V3.5 — API Hook
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

export async function chatWithOrion(message, history = []) {
  const res = await fetch(`${API_BASE}/v1/orion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function interpretResult(missionResult, originalObjective) {
  const res = await fetch(`${API_BASE}/v1/orion/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mission_result: missionResult, original_objective: originalObjective }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function checkOrionStatus() {
  try {
    const res = await fetch(`${API_BASE}/v1/orion/status`);
    if (!res.ok) return { available: false, provider: 'none' };
    return await res.json();
  } catch {
    return { available: false, provider: 'none' };
  }
}

// ── LLM Config API ──

export async function fetchLLMConfig() {
  const res = await fetch(`${API_BASE}/v1/llm/config`);
  if (!res.ok) return {};
  return await res.json();
}

export async function saveLLMConfig(config) {
  const res = await fetch(`${API_BASE}/v1/llm/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  return await res.json();
}

export async function fetchProviders() {
  const res = await fetch(`${API_BASE}/v1/llm/providers`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchModels(provider) {
  const res = await fetch(`${API_BASE}/v1/llm/models/${provider}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function testProvider(provider, apiKey = '') {
  const res = await fetch(`${API_BASE}/v1/llm/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey }),
  });
  return await res.json();
}

export async function fetchOllamaStatus() {
  try {
    const res = await fetch(`${API_BASE}/v1/llm/ollama/status`);
    if (!res.ok) return { status: 'offline', models: [] };
    return await res.json();
  } catch {
    return { status: 'offline', models: [] };
  }
}

export async function fetchPricing() {
  try {
    const res = await fetch(`${API_BASE}/v1/llm/pricing`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

