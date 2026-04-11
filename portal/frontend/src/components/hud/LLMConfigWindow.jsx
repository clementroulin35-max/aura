import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './LLMConfigWindow.css';
import { API_BASE } from '../../lib/constants.js';

const LLMConfigWindow = ({ onClose, x, y }) => {
    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);

    // Window Interaction State
    const [dimensions, setDimensions] = useState({ width: 800, height: 650 });
    const dragControls = useDragControls();

    useEffect(() => {
        fetch(`${API_BASE}/llm-config`)
            .then(r => r.json())
            .then(setConfig)
            .catch(() => setConfig({ error: true }));
    }, []);

    const handleSave = async () => {
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
    };

    const startResizing = (mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;
        const startX = mouseDownEvent.clientX;
        const startY = mouseDownEvent.clientY;

        const onMouseMove = (mouseMoveEvent) => {
            const newWidth = Math.max(400, startWidth + (mouseMoveEvent.clientX - startX));
            const newHeight = Math.max(350, startHeight + (mouseMoveEvent.clientY - startY));
            setDimensions({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

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
            {/* Draggable Header */}
            <div
                className="config-header"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="header-drag-zone">
                    <span className="config-title">ATLANTIS SYSTEM — LLM CONFIG</span>
                </div>
                {onClose && (
                    <button className="config-close-btn" onClick={onClose}>[X]</button>
                )}
            </div>

            {/* Config Content */}
            <div className="config-body">
                {!config && <div className="config-status">INITIALIZING...</div>}
                {config?.error && <div className="config-status error">LINK LOST. BACKEND OFFLINE.</div>}
                {config && !config.error && (
                    <div className="config-form">
                        <div className="field-group">
                            <label>SOVEREIGNTY MODE</label>
                            <select
                                value={config.mode}
                                onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                            >
                                <option value="FAST">FAST (Gemini 2.0 Flash)</option>
                                <option value="HIGH">HIGH (Claude 3.5 Sonnet)</option>
                            </select>
                        </div>

                        <div className="field-group">
                            <label>ACTIVE NEURAL MODEL</label>
                            <input
                                type="text"
                                value={config.model}
                                readOnly
                                className="readonly-field"
                            />
                        </div>

                        <div className="field-group">
                            <label>COMPUTATION PROVIDER</label>
                            <input
                                type="text"
                                value={config.provider}
                                readOnly
                                className="readonly-field"
                            />
                        </div>

                        <div className="config-actions">
                            <button
                                className="apply-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "SYNCHRONIZING..." : "APPLY CONFIGURATION"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Resize Handle (Bottom-Right) */}
            <div className="config-resize-handle" onMouseDown={startResizing} />
        </motion.div>
    );
};

export default LLMConfigWindow;
