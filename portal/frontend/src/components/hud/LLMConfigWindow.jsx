import React, { useState, useEffect, useMemo } from 'react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import './LLMConfigWindow.css';
import { API_BASE } from '../../lib/constants.js';

// --- Premium Sub-Components ---

const HUDSwitch = ({ enabled, onChange, label }) => (
    <div className="hud-switch-group">
        {label && <span className="switch-label">{label}</span>}
        <div
            className={`hud-switch-track ${enabled ? 'active' : ''}`}
            onClick={() => onChange(!enabled)}
        >
            <motion.div
                className="hud-switch-thumb"
                animate={{ x: enabled ? 18 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </div>
    </div>
);

const TierSelector = ({ activeTier, onChange }) => {
    const tiers = [
        { id: 'ALU', label: 'ALU', icon: '⚪', color: 'var(--slate-light)' },
        { id: 'GOLD', label: 'GOLD', icon: '🟡', color: 'var(--neon-yellow)' },
        { id: 'DIAMANT', label: 'DIAMANT', icon: '💎', color: 'var(--neon-cyan, #00f2ff)' }
    ];

    return (
        <div className="tier-selector-container">
            <div className="tier-track">
                {tiers.map(tier => (
                    <div
                        key={tier.id}
                        className={`tier-item ${activeTier === tier.id ? 'active' : ''}`}
                        onClick={() => onChange(tier.id)}
                        style={{ '--tier-color': tier.color }}
                    >
                        <span className="tier-icon">{tier.icon}</span>
                        <span className="tier-label">{tier.label}</span>
                    </div>
                ))}
                <motion.div
                    className="tier-shuttle"
                    animate={{
                        left: activeTier === 'ALU' ? '1%' : activeTier === 'GOLD' ? '34.33%' : '67.66%',
                        width: '31.33%'
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
            </div>
        </div>
    );
};

// --- Main Window ---

const LLMConfigWindow = ({ onClose, x, y }) => {
    const [config, setConfig] = useState(null);
    const [allModels, setAllModels] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success
    const [activeSection, setActiveSection] = useState('PROVIDERS');
    const [validation, setValidation] = useState({}); // { pid: { status, msg } }

    // Tier Selection State
    const [chatTier, setChatTier] = useState('ALU');
    const [supervisorTier, setSupervisorTier] = useState('GOLD');

    const [dimensions, setDimensions] = useState({ width: 1020, height: 705 });
    const dragControls = useDragControls();

    const KEY_PREFIXES = {
        gemini: 'AIza',
        openai: 'sk-',
        anthropic: 'sk-ant-',
        xai: 'xai-',
        mistral: ''
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const configRes = await fetch(`${API_BASE}/v1/llm/config`);
                const configData = await configRes.json();
                setConfig(configData);

                // Fetch models for all enabled providers
                const providersRes = await fetch(`${API_BASE}/v1/llm/providers`);
                const providers = await providersRes.json();

                const modelMap = {};
                for (const p of providers) {
                    const mRes = await fetch(`${API_BASE}/v1/llm/models/${p.id}`);
                    modelMap[p.id] = await mRes.json();
                }
                setAllModels(modelMap);
            } catch (e) {
                setConfig({ error: true });
            }
        };
        loadData();
    }, []);


    // Categorization Engine - Strict Validation Filter
    const categorizedModels = useMemo(() => {
        const tiers = { ALU: [], GOLD: [], DIAMANT: [] };

        Object.entries(allModels).forEach(([provider, models]) => {
            const provConfig = config?.providers?.[provider];
            const isEnabled = provConfig?.enabled;

            // GATE: Session validation if exists, otherwise Sovereign Trust (plausible auth)
            let isValidated = false;
            if (validation[provider]) {
                isValidated = validation[provider].status === 'valid';
            } else if (isEnabled) {
                // Initial load fallback: check plausibility
                if (provider === 'ollama') isValidated = !!provConfig.base_url;
                else isValidated = provConfig.api_key && provConfig.api_key.length > 8;
            }

            if (!isEnabled || !isValidated) return;

            models.forEach(m => {
                const id = m.id.toLowerCase();
                let tier = 'GOLD';
                if (id.includes('flash') || id.includes('mini') || id.includes('haiku') || id.includes('small') || (m.params && parseFloat(m.params) < 5)) {
                    tier = 'ALU';
                } else if (id.includes('pro') || id.includes('sonnet') || id.includes('o1') || id.includes('o4') || id.includes('large') || m.type === 'reasoning') {
                    tier = 'DIAMANT';
                }
                if (tiers[tier].filter(x => x.provider === provider).length < 3) {
                    tiers[tier].push({ ...m, provider });
                }
            });
        });

        Object.keys(tiers).forEach(t => {
            tiers[t].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        });

        return tiers;
    }, [allModels, config?.providers, validation]);

    const PROVIDER_LOGOS = {
        gemini: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
        ),
        openai: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8l-4 4 4 4 4-4-4-4z" />
            </svg>
        ),
        anthropic: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 22h20L12 2z" strokeLinejoin="round" />
                <path d="M12 8l-3 6h6l-3-6z" fill="currentColor" opacity="0.2" />
            </svg>
        ),
        mistral: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12l-9-9-9 9 9 9 9-9z" />
                <path d="M12 7l-5 5 5 5 5-5-5-5z" fill="currentColor" opacity="0.2" />
            </svg>
        ),
        ollama: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9l3 3 3-3M9 15l3-3 3 3" strokeLinecap="round" />
            </svg>
        ),
        xai: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l16 16M20 4L4 16" strokeLinecap="round" />
            </svg>
        )
    };

    const handleTest = async (pid) => {
        const prov = config.providers[pid];
        const value = pid === 'ollama' ? prov.base_url : prov.api_key;

        // Guard: Empty Input
        if (!value || value.trim().length === 0) {
            window.dispatchEvent(new CustomEvent('ORION_LOG', {
                detail: {
                    role: 'orion',
                    content: `Tu n'as pas d'excuses pour avoir tenté une validation de clé pour ${pid.toUpperCase()} sans saisir aucune donnée ! Moi j'ai des patounes, je ne peux pas le faire, mais TOI tu as des doigts !`
                }
            }));
            return;
        }

        setValidation(prev => ({ ...prev, [pid]: { status: 'testing', msg: 'VALIDATING...' } }));

        try {
            const res = await fetch(`${API_BASE}/v1/llm/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: pid, api_key: value }),
            });
            const data = await res.json();

            const newValidation = {
                ...validation,
                [pid]: { status: data.success ? 'valid' : 'invalid', msg: data.message }
            };
            setValidation(newValidation);

            // Dispatch Diegetic Log to Terminal
            window.dispatchEvent(new CustomEvent('ORION_LOG', {
                detail: {
                    role: 'orion',
                    content: data.success
                        ? `[OK] Neural Path pour ${pid.toUpperCase()} stabilisé. Synchronisation parfaite.`
                        : `[WARN] Échec de liaison ${pid.toUpperCase()}. Le Nexus rejette tes données : ${data.message}`
                }
            }));

            // Header Sync based on strict validation result
            const hasValidPath = Object.entries(config.providers).some(([id, p]) => {
                const isCurrent = id === pid;
                const status = isCurrent ? (data.success ? 'valid' : 'invalid') : validation[id]?.status;

                // Consistency check identical to isNeuralSyncActive logic
                if (status) return p.enabled && status === 'valid';
                if (p.enabled) {
                    if (id === 'ollama') return !!p.base_url;
                    return p.api_key && p.api_key.length > 8;
                }
                return false;
            });
            window.dispatchEvent(new CustomEvent('ORION_SYNC_REQ', { detail: { status: hasValidPath ? 'ONLINE' : 'OFFLINE' } }));

        } catch (e) {
            setValidation(prev => ({ ...prev, [pid]: { status: 'invalid', msg: 'CONNECTION ERROR' } }));
            window.dispatchEvent(new CustomEvent('ORION_LOG', {
                detail: { role: 'orion', content: `[ERROR] Rupture de lien avec ${pid.toUpperCase()}. Le Nexus est offline.` }
            }));
            window.dispatchEvent(new CustomEvent('ORION_SYNC_REQ', { detail: { status: 'OFFLINE' } }));
        }
    };

    const handleSave = async () => {
        if (!config || config.error) return;
        setSaveStatus('saving');
        try {
            await fetch(`${API_BASE}/v1/llm/config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config }),
            });
            setSaveStatus('success');

            // Sync current validated status to Header
            const finalStatus = isNeuralSyncActive ? 'ONLINE' : 'OFFLINE';
            window.dispatchEvent(new CustomEvent('ORION_SYNC_REQ', { detail: { status: finalStatus } }));

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            setSaveStatus('idle');
        }
    };

    const startResizing = (mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;
        const startX = mouseDownEvent.clientX;
        const startY = mouseDownEvent.clientY;

        const onMouseMove = (mouseMoveEvent) => {
            setDimensions({
                width: Math.max(635, startWidth + (mouseMoveEvent.clientX - startX)),
                height: Math.max(445, startHeight + (mouseMoveEvent.clientY - startY))
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const isNeuralSyncActive = useMemo(() => {
        if (!config || !config.providers) return false;
        return Object.entries(config.providers).some(([pid, p]) => {
            if (!p.enabled) return false;

            // If we have a session validation result, follow it strictly
            if (validation[pid]) {
                return validation[pid].status === 'valid';
            }

            // Fallback for initial boot (Sovereign Trust):
            // If enabled and has plausible key/URL, consider it ACTIVE until tested otherwise.
            if (pid === 'ollama') return !!p.base_url;
            return p.api_key && p.api_key.length > 8;
        });
    }, [config, validation]);

    return (
        <motion.div
            className="llm-config-container"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={{ top: 64, left: 0, right: window.innerWidth - dimensions.width, bottom: window.innerHeight - 120 }}
            dragElastic={0}
            style={{ width: dimensions.width, height: dimensions.height, x, y }}
            layout="position"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <div className="config-header" onPointerDown={(e) => dragControls.start(e)}>
                <div className="header-drag-zone">
                    <span className="config-title">ATLANTIS SYSTEM — NEURAL SYNC</span>
                </div>
                <button className="config-close-btn" onClick={onClose}>[X]</button>
            </div>

            <div className="config-body">
                {!config && <div className="config-status">INITIALIZING...</div>}
                {config?.error && <div className="config-status error">LINK LOST. BACKEND OFFLINE.</div>}

                {config && !config.error && (
                    <div className="config-layout">
                        {/* Sidebar */}
                        <div className="config-sidebar">
                            <div className="sidebar-title">SUBSYSTEMS</div>
                            <button
                                className={`sidebar-btn ${activeSection === 'PROVIDERS' ? 'active' : ''}`}
                                onClick={() => setActiveSection('PROVIDERS')}
                            >PROVIDERS</button>
                            <button
                                className={`sidebar-btn ${activeSection === 'ROLES' ? 'active' : ''}`}
                                onClick={() => setActiveSection('ROLES')}
                            >CORE ROLES</button>
                        </div>

                        {/* Main Content Area */}
                        <div className="config-main">
                            <AnimatePresence mode="wait">
                                {activeSection === 'PROVIDERS' && (
                                    <motion.div
                                        key="providers"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                    >
                                        <div className="section-header-premium">
                                            <div className="section-title">ACTIVE PROVIDERS</div>
                                            <div className={`telemetry-badge ${isNeuralSyncActive ? 'active' : 'inactive'}`}>
                                                <div className="telemetry-dot" />
                                                <span>NEURAL SYNC: {isNeuralSyncActive ? 'ACTIVE' : 'NOT FOUND'}</span>
                                            </div>
                                        </div>
                                        <div className="providers-grid">
                                            {Object.entries(config.providers || {}).map(([pid, prov]) => (
                                                <div key={pid} className={`provider-card-premium ${prov.enabled ? 'enabled' : ''} ${validation[pid]?.status || ''}`}>
                                                    <div className="provider-header-main">
                                                        <div className="p-info">
                                                            <div className="p-logo">{PROVIDER_LOGOS[pid] || pid.charAt(0).toUpperCase()}</div>
                                                            <div className="p-name">{pid.toUpperCase()}</div>
                                                        </div>
                                                        <HUDSwitch
                                                            enabled={prov.enabled}
                                                            onChange={(val) => {
                                                                setConfig({
                                                                    ...config,
                                                                    providers: { ...config.providers, [pid]: { ...prov, enabled: val } }
                                                                });
                                                                // Reset validation status when disabling
                                                                if (!val) {
                                                                    setValidation(prev => ({ ...prev, [pid]: null }));
                                                                }
                                                                // Sync request to reflect strictly validated status
                                                                const willBeActive = val && validation[pid]?.status === 'valid';
                                                                const otherValid = Object.entries(config.providers).some(([id, p]) => id !== pid && p.enabled && validation[id]?.status === 'valid');
                                                                const nextStatus = (willBeActive || otherValid) ? 'ONLINE' : 'OFFLINE';
                                                                window.dispatchEvent(new CustomEvent('ORION_SYNC_REQ', { detail: { status: nextStatus } }));
                                                            }}
                                                        />
                                                    </div>

                                                    {prov.enabled && (
                                                        <div className="provider-config-expanded">
                                                            <div className="input-group-premium">
                                                                <input
                                                                    type={pid === 'ollama' ? "text" : "password"}
                                                                    className={`config-input ${validation[pid]?.status || ''}`}
                                                                    value={pid === 'ollama' ? prov.base_url || '' : prov.api_key || ''}
                                                                    placeholder={pid === 'ollama' ? "http://localhost:11434" : "●●●●●●●●●●●●●●●●"}
                                                                    onChange={(e) => {
                                                                        const field = pid === 'ollama' ? 'base_url' : 'api_key';
                                                                        setConfig({
                                                                            ...config,
                                                                            providers: { ...config.providers, [pid]: { ...prov, [field]: e.target.value } }
                                                                        });
                                                                    }}
                                                                />
                                                                <button
                                                                    className={`test-btn ${validation[pid]?.status || ''}`}
                                                                    onClick={() => handleTest(pid)}
                                                                >
                                                                    {validation[pid]?.status === 'testing' ? '...' : 'VALIDATE'}
                                                                </button>
                                                            </div>
                                                            {/* Inline messages removed as per Captain's directive — logs now in Terminal */}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeSection === 'ROLES' && (
                                    <motion.div
                                        key="roles"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="roles-wrapper"
                                    >
                                        <div className="section-header-premium">
                                            <div className="section-title-group">
                                                <div className="section-title">CORE AGENT ROLES</div>
                                                <div className="section-subtitle">Assigning neural tiers to subsystem orchestrators.</div>
                                            </div>
                                            <div className={`telemetry-badge ${isNeuralSyncActive ? 'active' : 'inactive'}`}>
                                                <div className="telemetry-dot" />
                                                <span>NEURAL SYNC: {isNeuralSyncActive ? 'ACTIVE' : 'NOT FOUND'}</span>
                                            </div>
                                        </div>

                                        <div className="roles-container">
                                            <div className="role-box">
                                                <div className="role-header-mini">CHAT (NEURAL INTERFACE)</div>
                                                <TierSelector
                                                    activeTier={chatTier}
                                                    onChange={setChatTier}
                                                />
                                                <div className="model-selection-list">
                                                    {categorizedModels[chatTier]?.map(m => (
                                                        <div
                                                            key={`${m.provider}-${m.id}`}
                                                            className={`model-option ${config.chat?.model === m.id ? 'selected' : ''}`}
                                                            onClick={() => setConfig({
                                                                ...config,
                                                                chat: { ...config.chat, provider: m.provider, model: m.id }
                                                            })}
                                                        >
                                                            <span className="m-name">{m.name}</span>
                                                            <span className="m-provider">{m.provider.toUpperCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="role-box">
                                                <div className="role-header-mini">SUPERVISOR (MISSION CONTROL)</div>
                                                <TierSelector
                                                    activeTier={supervisorTier}
                                                    onChange={setSupervisorTier}
                                                />
                                                <div className="model-selection-list">
                                                    {categorizedModels[supervisorTier]?.map(m => (
                                                        <div
                                                            key={`${m.provider}-${m.id}`}
                                                            className={`model-option ${config.supervisor?.model === m.id ? 'selected' : ''}`}
                                                            onClick={() => setConfig({
                                                                ...config,
                                                                supervisor: { ...config.supervisor, provider: m.provider, model: m.id }
                                                            })}
                                                        >
                                                            <span className="m-name">{m.name}</span>
                                                            <span className="m-provider">{m.provider.toUpperCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="config-actions">
                                            <button
                                                className={`apply-btn-premium ${saveStatus === 'success' ? 'success' : ''}`}
                                                onClick={handleSave}
                                                disabled={saveStatus !== 'idle'}
                                            >
                                                {saveStatus === 'saving' ? "SYNCING..." :
                                                    saveStatus === 'success' ? "NEURAL PATHS ALIGNED ✓" :
                                                        "SAVE & APPLY CONFIGURATION"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
            <div className="config-resize-handle" onMouseDown={startResizing} />
        </motion.div>
    );
};

export default LLMConfigWindow;
