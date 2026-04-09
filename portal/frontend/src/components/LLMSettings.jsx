import { useState, useEffect, useCallback } from 'react';
import './LLMSettings.css';

const PROVIDER_LABELS = {
  ollama: { name: 'Ollama', icon: '🏠', type: 'Local' },
  gemini: { name: 'Google Gemini', icon: '💎', type: 'Cloud' },
  openai: { name: 'OpenAI', icon: '🤖', type: 'Cloud' },
  anthropic: { name: 'Anthropic (Claude)', icon: '🧠', type: 'Cloud' },
  mistral: { name: 'Mistral AI', icon: '🌬️', type: 'Cloud' },
  xai: { name: 'xAI (Grok)', icon: '⚡', type: 'Cloud' },
};

export default function LLMSettings({ config, onSave, onClose, api }) {
  const [localConfig, setLocalConfig] = useState(config || {});
  const [models, setModels] = useState({});
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);

  // Load models for each provider
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ollamaRes, pricingRes] = await Promise.all([
          api.fetchOllamaStatus(),
          api.fetchPricing(),
        ]);
        setOllamaStatus(ollamaRes);
        setPricing(pricingRes);

        const providerIds = Object.keys(PROVIDER_LABELS);
        const modelData = {};
        for (const pid of providerIds) {
          try {
            modelData[pid] = await api.fetchModels(pid);
          } catch { modelData[pid] = []; }
        }
        setModels(modelData);
      } catch (err) {
        console.warn('[Settings] Load failed:', err);
      }
    };
    loadData();
  }, [api]);

  const updateRole = (role, field, value) => {
    setLocalConfig((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  };

  const updateProvider = (pid, field, value) => {
    setLocalConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [pid]: { ...prev.providers?.[pid], [field]: value },
      },
    }));
  };

  const applyPreset = (preset) => {
    const p = localConfig.presets?.[preset];
    if (!p) return;
    setLocalConfig((prev) => ({
      ...prev,
      chat: { ...prev.chat, ...p.chat },
      supervisor: { ...prev.supervisor, ...p.supervisor },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(localConfig);
    setSaving(false);
  };

  const handleTest = async (pid) => {
    const key = localConfig.providers?.[pid]?.api_key || '';
    const result = await api.testProvider(pid, key);
    setTestResults((prev) => ({ ...prev, [pid]: result }));
  };

  const getModelsForProvider = (pid) => models[pid] || [];

  const renderRoleConfig = (role, label, icon) => {
    const rc = localConfig[role] || {};
    const providerModels = getModelsForProvider(rc.provider || 'ollama');

    return (
      <div className="settings-role-card glass-panel">
        <div className="settings-role-header">
          <span>{icon} {label}</span>
        </div>
        <div className="settings-field">
          <label>Provider</label>
          <select value={rc.provider || 'ollama'} onChange={(e) => updateRole(role, 'provider', e.target.value)}>
            {Object.entries(PROVIDER_LABELS).map(([pid, p]) => (
              <option key={pid} value={pid}>{p.icon} {p.name}</option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>Model</label>
          <select value={rc.model || ''} onChange={(e) => updateRole(role, 'model', e.target.value)}>
            {providerModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id} {m.params ? `(${m.params})` : ''} {m.installed === false ? '⬇' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>Température: {rc.temperature ?? 0.3}</label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={rc.temperature ?? 0.3}
            onChange={(e) => updateRole(role, 'temperature', parseFloat(e.target.value))}
          />
        </div>
        <div className="settings-field">
          <label>Max Tokens</label>
          <input
            type="number" min="128" max="8192" step="128"
            value={rc.max_tokens ?? 1024}
            onChange={(e) => updateRole(role, 'max_tokens', parseInt(e.target.value))}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="llm-settings" id="llm-settings">
      <div className="settings-header">
        <span className="settings-title">⚙ LLM Configuration</span>
        <button className="settings-close-btn" onClick={onClose}>← Chat</button>
      </div>

      <div className="settings-body">
        {/* Presets */}
        <div className="settings-section">
          <div className="settings-section-title">Presets</div>
          <div className="settings-presets">
            {Object.entries(localConfig.presets || {}).map(([key, preset]) => (
              <button key={key} className="preset-btn" onClick={() => applyPreset(key)}>
                <span className="preset-name">{preset.name}</span>
                <span className="preset-detail">
                  {preset.chat?.model || '—'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Role configs side by side */}
        <div className="settings-roles">
          {renderRoleConfig('chat', 'CHAT (Orion)', '🐱')}
          {renderRoleConfig('supervisor', 'SUPERVISOR (LangGraph)', '⚡')}
        </div>

        {/* Providers */}
        <div className="settings-section">
          <div className="settings-section-title">Providers</div>
          <div className="settings-providers">
            {Object.entries(PROVIDER_LABELS).map(([pid, pinfo]) => {
              const prov = localConfig.providers?.[pid] || {};
              const isOllama = pid === 'ollama';
              const status = isOllama ? ollamaStatus?.status : (prov.enabled && prov.api_key ? 'configured' : 'off');
              const testResult = testResults[pid];

              return (
                <div className={`provider-row ${status === 'online' || status === 'configured' ? 'active' : ''}`} key={pid}>
                  <div className="provider-header">
                    <span className={`provider-dot ${status === 'online' || status === 'configured' ? 'on' : 'off'}`} />
                    <span className="provider-name">{pinfo.icon} {pinfo.name}</span>
                    <span className="provider-type">{pinfo.type}</span>
                  </div>

                  {isOllama ? (
                    <div className="provider-detail">
                      <span className="provider-status">
                        {ollamaStatus?.status === 'online' ? '● Online' : '○ Offline'}
                      </span>
                      {ollamaStatus?.models?.length > 0 && (
                        <span className="provider-models">
                          {ollamaStatus.models.map((m) => m.id).join(', ')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="provider-detail">
                      <div className="provider-key-row">
                        <input
                          type="password"
                          className="provider-key-input"
                          placeholder="API Key..."
                          value={prov.api_key || ''}
                          onChange={(e) => updateProvider(pid, 'api_key', e.target.value)}
                        />
                        <label className="provider-toggle">
                          <input
                            type="checkbox"
                            checked={prov.enabled || false}
                            onChange={(e) => updateProvider(pid, 'enabled', e.target.checked)}
                          />
                          <span>Actif</span>
                        </label>
                        <button className="provider-test-btn" onClick={() => handleTest(pid)}>
                          Test
                        </button>
                      </div>
                      {testResult && (
                        <span className={`provider-test-result ${testResult.success ? 'ok' : 'fail'}`}>
                          {testResult.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing */}
        {pricing?.pricing && (
          <div className="settings-section">
            <div className="settings-section-title">
              Tarifs estimés <span className="pricing-disclaimer">{pricing.disclaimer}</span>
            </div>
            <div className="pricing-table-container">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Model</th>
                    <th>Input /1M</th>
                    <th>Output /1M</th>
                    <th>Contexte</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pricing.pricing).flatMap(([provider, pricingModels]) =>
                    pricingModels.map((m) => (
                      <tr key={`${provider}-${m.model}`}>
                        <td className="pricing-provider">{PROVIDER_LABELS[provider]?.icon} {provider}</td>
                        <td>{m.name}</td>
                        <td className="pricing-cost">{m.input_per_1m === 0 ? 'FREE' : `$${m.input_per_1m}`}</td>
                        <td className="pricing-cost">{m.output_per_1m === 0 ? 'FREE' : `$${m.output_per_1m}`}</td>
                        <td>{m.context}</td>
                        <td className="pricing-type">{m.type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Actions — outside scrollable body, always visible */}
      <div className="settings-actions">
        <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? '◉ Saving...' : '💾 Sauvegarder'}
        </button>
        <button className="settings-reset-btn" onClick={() => setLocalConfig(config)}>
          ↩ Réinitialiser
        </button>
      </div>
    </div>
  );
}

