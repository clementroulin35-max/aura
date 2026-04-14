import React, { useState, useEffect } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import './hud.css';
import { API_BASE } from '../../lib/constants.js';

const unfoldVariants = {
  hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.95 },
  visible: {
    opacity: 1, filter: 'blur(0px)', scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.1 }
  }
};

export default function MissionForgeHUD({
  onClose, x, y, width, height, dragConstraints, mission, setMissionDraft,
  onExecuteStart, onExecuteEnd,
  executing, results, onOpenDoc,
  isFocused, onFocus, activeProject
}) {
  const [running, setRunning] = useState(false);
  const dragControls = useDragControls();

  // --- Functional Resize Logic ---
  const handleResizeRight = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.pageX; const startY = e.pageY;
    const startWidth = width.get(); const startHeight = height.get();
    const onMouseMove = (moveEvent) => {
      width.set(Math.max(400, startWidth + (moveEvent.pageX - startX)));
      height.set(Math.max(300, startHeight + (moveEvent.pageY - startY)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeLeft = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.pageX; const startY = e.pageY;
    const startWidth = width.get(); const startHeight = height.get();
    const startXPos = x.get();
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const newWidth = Math.max(400, startWidth - deltaX);
      const actualDeltaX = startWidth - newWidth;

      width.set(newWidth);
      height.set(Math.max(300, startHeight + (moveEvent.pageY - startY)));
      x.set(startXPos + actualDeltaX);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [activeTab, setActiveTab] = useState('editor'); // editor, results
  const [missionPayload, setMissionPayload] = useState("");
  const [lastStepLabel, setLastStepLabel] = useState("Initialisation...");
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', or errorMessage

  useEffect(() => {
    if (mission) {
      setMissionPayload(typeof mission === 'string' ? mission : JSON.stringify({
        project_id: activeProject?.id || "N/A",
        ...mission
      }, null, 2));
    } else {
      setMissionPayload("");
    }
  }, [mission, activeProject]);

  // RESET SAVE STATUS ON EDIT
  useEffect(() => {
    if (saveStatus && saveStatus !== 'saving') {
      setSaveStatus(null);
    }
  }, [missionPayload]);

  // Real-time trace listener for status label
  useEffect(() => {
    const handleLog = (e) => {
      const { actor, content } = e.detail;
      if (actor) {
        setLastStepLabel(`${actor}: ${content}`);
      }
    };

    const handleComplete = () => {
      setRunning(false);
      if (onExecuteEnd) onExecuteEnd();
    };

    window.addEventListener('ORION_LOG', handleLog);
    window.addEventListener('MISSION_COMPLETED', handleComplete);
    return () => {
      window.removeEventListener('ORION_LOG', handleLog);
      window.removeEventListener('MISSION_COMPLETED', handleComplete);
    };
  }, [onExecuteEnd]);

  // SYNC RUNNING STATE WITH PROP
  useEffect(() => {
    if (!executing && running) {
      setRunning(false);
    }
  }, [executing]);

  const handleSave = async () => {
    if (!missionPayload || !activeProject) {
      setSaveStatus("MISSING CONTEXT");
      return;
    }
    setSaveStatus('saving');
    try {
      const cleanedPayload = missionPayload.trim();
      let payload;
      try {
        payload = JSON.parse(cleanedPayload);
        const sanitized = JSON.stringify(payload, null, 2);
        setMissionPayload(sanitized);
      } catch (parseErr) {
        throw new Error(`SYNTAXE JSON: ${parseErr.message}`);
      }

      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error("STRUCTURE INVALIDE: Le payload doit être un objet JSON.");
      }

      payload.project_id = activeProject.id;

      const res = await fetch(`${API_BASE}/v1/resources/save_mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: activeProject.id, mission: payload })
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `ERROR ${res.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.detail || errMsg;
        } catch (e) { }
        throw new Error(`SERVEUR: ${errMsg}`);
      }

      setMissionDraft(payload);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus('error');
      window.dispatchEvent(new CustomEvent('ORION_LOG', {
        detail: { content: `[FORGE] Erreur de sauvegarde: ${e.message}`, type: 'error' }
      }));
      console.error("Save error:", e);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleExecute = async () => {
    if (!missionPayload || running || executing) return;

    setRunning(true);
    if (onExecuteStart) onExecuteStart();

    // REDIRECTION TO DOCUMENTS TAB
    setActiveTab('results');
    setLastStepLabel("LANCEMENT DE L'ORCHESTRATION...");

    try {
      let payload;
      try {
        payload = JSON.parse(missionPayload);
      } catch (parseErr) {
        throw new Error(`SYNTAXE JSON: ${parseErr.message}`);
      }

      const res = await fetch(`${API_BASE}/v1/graph/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Graph results are handled via WebSocket/Event bus now
    } catch (e) {
      console.error("Failed to run mission", e);
      setRunning(false);
    }
  };

  return (
    <motion.div
      className="nexus-hud-panel"
      onPointerDownCapture={onFocus}
      drag dragControls={dragControls} dragListener={false} dragMomentum={false}
      dragConstraints={dragConstraints}
      style={{
        width,
        height,
        minWidth: '400px',
        minHeight: '300px',
        x,
        y,
        overflow: 'hidden',
        zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)',
        display: 'flex',
        flexDirection: 'column'
      }}
      variants={unfoldVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">MISSION FORGE - TACTICAL ORCHESTRATION</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      {/* PREMIUM TABS */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {['editor', 'results'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px', background: activeTab === tab ? 'var(--neon-blue)' : 'transparent',
              border: 'none', borderBottom: `2px solid ${activeTab === tab ? 'var(--neon-secondary)' : 'transparent'}`,
              color: activeTab === tab ? '#fff' : 'var(--text-dim)', cursor: 'pointer', outline: 'none',
              textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold'
            }}
          >
            {tab === 'editor' ? 'EDITEUR DE MISSION' : 'DOCUMENTS'}
          </button>
        ))}
      </div>

      <div className="hud-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>

        {/* TAB: EDITOR */}
        <div style={{ display: activeTab === 'editor' ? 'flex' : 'none', flexDirection: 'column', flex: 1, padding: '20px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--slate-light)', margin: '0 0 10px 0' }}>CONFIGURATION PAYLOAD JSON</h3>
          <textarea
            value={missionPayload}
            onChange={(e) => setMissionPayload(e.target.value)}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px',
              padding: '15px', borderRadius: '4px', resize: 'none', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px', alignItems: 'center' }}>
            <motion.button
              onClick={handleSave}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${saveStatus === 'success' ? '#00ffa3' : 'var(--text-primary)'}`,
                color: saveStatus === 'success' ? '#00ffa3' : 'var(--text-primary)',
                padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase',
                fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? '...' : saveStatus === 'success' ? 'SAVED ✓' : (saveStatus || '💾 SAUVEGARDER')}
            </motion.button>

            {(() => {
              const isInitPayload = !missionPayload || missionPayload.includes("NOUVELLE MISSION") || missionPayload.includes("Définissez le contexte");
              return (
                <motion.button
                  onClick={handleExecute}
                  disabled={running || executing || isInitPayload || saveStatus === 'saving'}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: isInitPayload ? 'rgba(255,255,255,0.05)' : (running || executing ? 'transparent' : 'linear-gradient(90deg, #b30000 0%, #ff3333 100%)'),
                    border: `1px solid ${isInitPayload ? 'rgba(255,255,255,0.2)' : '#ff3333'}`,
                    color: isInitPayload ? 'var(--text-dim)' : '#fff',
                    padding: '15px 40px', cursor: (running || executing || isInitPayload || saveStatus === 'saving') ? 'not-allowed' : 'pointer', textTransform: 'uppercase',
                    letterSpacing: '5px', fontWeight: 'bold', fontSize: '15px', borderRadius: '4px',
                    transition: 'all 0.3s ease', opacity: (running || executing || isInitPayload) ? 0.4 : 1,
                    textShadow: isInitPayload ? 'none' : '0 0 10px rgba(255, 255, 255, 0.8)',
                    boxShadow: isInitPayload ? 'none' : '0 0 20px rgba(255, 51, 51, 0.5)'
                  }}
                  whileHover={(!isInitPayload && !running && !executing) ? { scale: 1.02, boxShadow: '0 0 30px rgba(255, 51, 51, 0.8)' } : {}}
                  whileTap={(!isInitPayload && !running && !executing) ? { scale: 0.98 } : {}}
                >
                  <span style={{
                    position: 'relative', zIndex: 1,
                    fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)',
                    letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    {!running && !executing && !isInitPayload && <span>🚀</span>}
                    {(running || executing) ? 'FORGE EN COURS...' : (isInitPayload ? 'EN ATTENTE D\'EXTRACTION' : 'ENGAGER LA MISSION')}
                    {!running && !executing && !isInitPayload && <span>🚀</span>}
                  </span>

                  {!isInitPayload && !running && !executing && (
                    <motion.div
                      initial={{ x: '-100%' }} animate={{ x: '200%' }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '40px', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        transform: 'skewX(-20deg)', pointerEvents: 'none', zIndex: 0
                      }}
                    />
                  )}
                </motion.button>
              );
            })()}
          </div>
        </div>

        {/* TAB: DOCUMENTS (RESULTS) */}
        <div style={{ display: activeTab === 'results' ? 'flex' : 'none', flexDirection: 'column', flex: 1, padding: '20px', overflowY: 'auto', position: 'relative' }} className="custom-scrollbar">

          {(running || executing) && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 8, 12, 0.92)', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(12px)', padding: '40px'
            }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '30px' }}>
                {/* Outer Scan Hex */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    border: '2px dashed var(--neon-blue-glow)',
                    borderRadius: '30%', filter: 'drop-shadow(0 0 5px rgba(0, 210, 255, 0.2))'
                  }}
                />
                {/* Inner Pulsing Core */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{
                    position: 'absolute', top: '20%', left: '20%', right: '20%', bottom: '20%',
                    background: 'radial-gradient(circle, var(--neon-blue-glow) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }}
                />
                {/* Spinning Indicators */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  style={{
                    position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
                    borderTop: '3px solid var(--neon-blue)',
                    borderRight: '1px solid transparent',
                    borderRadius: '50%', opacity: 0.8
                  }}
                />
              </div>

              <div className="loader-text-block" style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-title)', fontSize: '14px', color: '#fff',
                  letterSpacing: '4px', marginBottom: '8px', textShadow: '0 0 10px var(--neon-blue)'
                }}>
                  FORGE EN COURS
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--neon-blue)',
                  opacity: 0.8, maxWidth: '280px', margin: '0 auto', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {lastStepLabel.toUpperCase()}
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: '20px', width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0, 210, 255, 0.2), transparent)' }} />
            </div>
          )}

          {!results || Object.keys(results).length === 0 ? (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '50px' }}>Aucun document produit pour cette session.</div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '30px',
              opacity: (running || executing) ? 0.3 : 1, pointerEvents: (running || executing) ? 'none' : 'auto',
              filter: (running || executing) ? 'grayscale(0.5)' : 'none', transition: 'all 0.4s ease'
            }}>
              {Object.entries(results).map(([missionId, files]) => (
                <div key={missionId} className="mission-group">
                  <h4 style={{
                    fontSize: '11px', color: 'var(--neon-secondary)', borderBottom: '1px solid rgba(0,255,128,0.2)',
                    paddingBottom: '5px', marginBottom: '15px', letterSpacing: '2px'
                  }}>
                    {missionId === 'ROOT' ? 'PROJECT DOCUMENTS' : `MISSION :: ${missionId.toUpperCase()}`}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                    {files.map((filename, i) => (
                      <motion.div
                        key={i}
                        onClick={() => !running && !executing && onOpenDoc && onOpenDoc({ filename, mission_id: missionId })}
                        style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                          padding: '15px', borderRadius: '8px', cursor: (running || executing) ? 'not-allowed' : 'pointer', textAlign: 'center',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                        }}
                        whileHover={(!running && !executing) ? { scale: 1.05, border: '1px solid var(--neon-secondary)', background: 'rgba(0, 255, 128, 0.05)' } : {}}
                      >
                        <div style={{ fontSize: '24px' }}>📄</div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', wordBreak: 'break-all' }}>{filename}</div>
                        <div style={{ fontSize: '9px', color: 'var(--neon-secondary)', textTransform: 'uppercase' }}>READ MODULE</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div >
  );
}
