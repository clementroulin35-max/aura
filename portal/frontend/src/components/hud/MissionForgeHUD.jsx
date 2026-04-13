import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './hud.css';
import { API_BASE } from '../../lib/constants.js';

const unfoldVariants = {
  hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.95 },
  visible: {
    opacity: 1, filter: 'blur(0px)', scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.1 }
  }
};

export default function MissionForgeHUD({ onClose, x, y, mission, setMissionDraft, onExecuteStart, onExecuteEnd, isFocused, onFocus, activeProject }) {
  const [dimensions] = useState({ width: 700, height: 600 });
  const [running, setRunning] = useState(false);
  const dragControls = useDragControls();
  
  const [activeTab, setActiveTab] = useState('editor'); // editor, direct, historic
  const [missionPayload, setMissionPayload] = useState("");
  const [traceLogs, setTraceLogs] = useState([]);
  const [historic, setHistoric] = useState([]);
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
        } catch (parseErr) {
            throw new Error(`SYNTAXE JSON: ${parseErr.message}`);
        }

        if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
            throw new Error("STRUCTURE INVALIDE: Le payload doit être un objet JSON.");
        }

        // Ensure the ID matches for persistence
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
            } catch(e) {}
            throw new Error(`SERVEUR: ${errMsg}`);
        }

        setMissionDraft(payload);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
        setSaveStatus('error');
        // DISPATCH TO CENTRAL LOGS
        window.dispatchEvent(new CustomEvent('ORION_LOG', {
            detail: { 
                content: `[FORGE] Erreur de sauvegarde: ${e.message}`, 
                type: 'error' 
            }
        }));
        console.error("Save error:", e);
        setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleExecute = async () => {
    if (!missionPayload || running) return;
    
    // IMMEDIATE LOCK
    setRunning(true);
    if (onExecuteStart) onExecuteStart();
    
    setActiveTab('direct');
    setTraceLogs([{ time: new Date().toLocaleTimeString(), msg: "LANCEMENT DE L'ORCHESTRATION..." }]);
    
    try {
      let payload;
      try {
          payload = JSON.parse(missionPayload);
      } catch (parseErr) {
          throw new Error(`SYNTAXE JSON: ${parseErr.message}`);
      }

      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
          throw new Error("STRUCTURE INVALIDE: Le payload doit être un objet JSON.");
      }

      const res = await fetch(`${API_BASE}/v1/graph/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      setTraceLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `DISPATCH RÉUSSI: ${JSON.stringify(data.status || data)}` }]);
      setHistoric(prev => [...prev, { id: Date.now(), payload, result: data }]);
      
    } catch (e) {
      console.error("Failed to run mission", e);
      setTraceLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `ERROR: ${e.message}`, error: true }]);
    } finally {
      // Small delay before unlocking to avoid UI flicker
      setTimeout(() => {
        setRunning(false);
        if (onExecuteEnd) onExecuteEnd();
      }, 2000);
    }
  };

  return (
      <motion.div
        className="nexus-hud-panel"
        onPointerDownCapture={onFocus}
        drag dragControls={dragControls} dragListener={false} dragMomentum={false}
        dragConstraints={{ top: 70, left: 10, right: window.innerWidth - dimensions.width - 10, bottom: window.innerHeight - dimensions.height - 110 }}
        style={{
          width: dimensions.width, height: dimensions.height, minWidth: '400px', minHeight: '300px',
          x, y, resize: 'both', overflow: 'hidden',
          zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)',
          display: 'flex', flexDirection: 'column'
        }}
        variants={unfoldVariants} initial="hidden" animate="visible" exit="hidden"
      >
        <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
           <span className="hud-title">MISSION FORGE - TACTICAL ORCHESTRATION</span>
           {onClose && <button className="hud-close-btn" onClick={onClose}>[X]</button>}
        </div>

        {/* PREMIUM TABS */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {['editor', 'direct', 'historic'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px', background: activeTab === tab ? 'rgba(0, 255, 128, 0.1)' : 'transparent',
                border: 'none', borderBottom: `2px solid ${activeTab === tab ? 'var(--neon-secondary)' : 'transparent'}`,
                color: activeTab === tab ? '#fff' : 'var(--text-dim)', cursor: 'pointer', outline: 'none',
                textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold'
              }}
            >
              {tab === 'editor' ? 'EDITEUR DE MISSION' : tab === 'direct' ? 'RESULTAT DIRECT' : 'HISTORIQUE'}
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
                  border: `1px solid ${saveStatus === 'success' ? '#00ffa3' : 'var(--neon-blue)'}`,
                  color: saveStatus === 'success' ? '#00ffa3' : 'var(--neon-blue)',
                  padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase',
                  fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
                whileHover={{ scale: 1.05, background: 'rgba(0,210,255,0.1)' }}
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
                    disabled={running || isInitPayload || saveStatus === 'saving'}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      background: isInitPayload ? 'rgba(255,255,255,0.05)' : (running ? 'transparent' : 'linear-gradient(90deg, #b30000 0%, #ff3333 100%)'),
                      border: `1px solid ${isInitPayload ? 'rgba(255,255,255,0.2)' : '#ff3333'}`, 
                      color: isInitPayload ? 'var(--text-dim)' : '#fff',
                      padding: '15px 40px', cursor: (running || isInitPayload || saveStatus === 'saving') ? 'not-allowed' : 'pointer', textTransform: 'uppercase',
                      letterSpacing: '5px', fontWeight: 'bold', fontSize: '15px', borderRadius: '4px',
                      transition: 'all 0.3s ease', opacity: (running || isInitPayload) ? 0.4 : 1,
                      textShadow: isInitPayload ? 'none' : '0 0 10px rgba(255, 255, 255, 0.8)',
                      boxShadow: isInitPayload ? 'none' : '0 0 20px rgba(255, 51, 51, 0.5)'
                    }}
                    whileHover={(!isInitPayload && !running) ? { scale: 1.02, boxShadow: '0 0 30px rgba(255, 51, 51, 0.8)' } : {}}
                    whileTap={(!isInitPayload && !running) ? { scale: 0.98 } : {}}
                  >
                    <span style={{ 
                      position: 'relative', zIndex: 1, 
                      fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)',
                      letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                      {!running && !isInitPayload && <span>🚀</span>}
                      {running ? 'FORGE EN COURS...' : (isInitPayload ? 'EN ATTENTE D\'EXTRACTION' : 'ENGAGER LA MISSION')}
                      {!running && !isInitPayload && <span>🚀</span>}
                    </span>
                    
                    {!isInitPayload && !running && (
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

          {/* TAB: DIRECT TRACE */}
          <div style={{ display: activeTab === 'direct' ? 'flex' : 'none', flexDirection: 'column', flex: 1, padding: '20px', overflowY: 'auto' }}>
            {traceLogs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '50px' }}>Aucune exécution en cours.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {traceLogs.map((log, i) => (
                  <div key={i} style={{ 
                    background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px', borderLeft: `3px solid ${log.error ? '#ff3366' : 'var(--neon-secondary)'}`,
                    fontSize: '11px', fontFamily: 'var(--font-mono)', color: log.error ? '#ff3366' : 'var(--text-secondary)'
                  }}>
                    <div style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>[{log.time}]</div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{log.msg}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TAB: HISTORIC */}
          <div style={{ display: activeTab === 'historic' ? 'flex' : 'none', flexDirection: 'column', flex: 1, padding: '20px', overflowY: 'auto' }}>
            {historic.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '50px' }}>Aucune archive de mission.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {historic.map((h, i) => (
                  <div key={h.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--slate-light)' }}>FORGE #{i + 1}</h4>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(h.id).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--neon-yellow)' }}>{h.payload.title || 'Mission sans titre'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </motion.div>
  );
}
