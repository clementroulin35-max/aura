import { useState, useEffect } from "react";
import "./SettingsPanel.css";
import { API_BASE } from "../../lib/constants.js";

export default function SettingsPanel({ onClose }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/llm-config`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => setConfig({ error: true }));
  }, []);

  async function save() {
    if (!config || config.error) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/llm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-panel glass-panel" id="settings-panel">
      <div className="settings-header">
        <span className="settings-title">VEGA — LLM CONFIG</span>
        <button className="panel-close-btn" onClick={onClose} aria-label="Fermer">X</button>
      </div>
      <div className="settings-body">
        {!config && <div className="settings-loading">Chargement...</div>}
        {config?.error && <div className="settings-error">Backend hors ligne.</div>}
        {config && !config.error && (
          <div className="settings-form">
            <div className="setting-row">
              <label className="setting-label">Mode</label>
              <span className="setting-value">{config.mode || "—"}</span>
            </div>
            <div className="setting-row">
              <label className="setting-label">Model</label>
              <span className="setting-value">{config.model || "—"}</span>
            </div>
            <div className="setting-row">
              <label className="setting-label">Provider</label>
              <span className="setting-value">{config.provider || "—"}</span>
            </div>
            <button className="save-btn" onClick={save} disabled={saving}>
              {saving ? "SAVING..." : "APPLY"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
