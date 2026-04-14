import React, { useState, useEffect } from 'react';
import { motion, useDragControls, AnimatePresence, useMotionValue } from 'framer-motion';
import './hud.css';
import { API_BASE } from '../../lib/constants.js';

const AgentsHubWindow = ({ onClose, x, y, width, height, dragConstraints, isFocused, onFocus, projects, activeProject, onProjectsUpdate, targetTeamId }) => {
  const dragControls = useDragControls();

  const unfoldVariants = {
    hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.95 },
    visible: {
      opacity: 1, filter: 'blur(0px)', scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.1 }
    }
  };

  // --- Functional Resize Logic ---
  const handleResizeRight = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.pageX; const startY = e.pageY;
    const startWidth = width.get(); const startHeight = height.get();
    const onMouseMove = (moveEvent) => {
      width.set(Math.max(500, startWidth + (moveEvent.pageX - startX)));
      height.set(Math.max(400, startHeight + (moveEvent.pageY - startY)));
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
      const newWidth = Math.max(500, startWidth - deltaX);
      const actualDeltaX = startWidth - newWidth;

      width.set(newWidth);
      height.set(Math.max(400, startHeight + (moveEvent.pageY - startY)));
      x.set(startXPos + actualDeltaX);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/v1/resources/agents`)
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0) {
          setSelectedAgentId(data.agents[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Agents fetch error", err);
        setLoading(false);
      });
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const groupedAgents = agents.reduce((acc, agent) => {
    const type = agent.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(agent);
    return acc;
  }, {});

  return (
    <motion.div
      className="nexus-hud-panel"
      onPointerDownCapture={onFocus}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={dragConstraints}
      style={{
        width,
        height,
        minWidth: '500px',
        minHeight: '400px',
        x, y,
        zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      variants={unfoldVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">AGENTS HUB DIRECTORY</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      <div className="hud-content" style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: 0 }}>

        {/* Sidebar Roster */}
        <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '15px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-dim)' }}>Scanning registry...</div>
          ) : (
            Object.entries(groupedAgents).map(([type, list]) => (
              <div key={type} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-neon)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  {type === 'static' ? 'Core Frame (Static)' : 'Dynamic Forces'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      style={{
                        padding: '8px 12px',
                        background: selectedAgentId === agent.id ? 'var(--action-blue-mid)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${selectedAgentId === agent.id ? 'var(--neon-secondary)' : 'transparent'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.4)', border: '1px solid var(--slate-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
                        color: 'var(--text-dim)'
                      }}>
                        {agent.id.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: selectedAgentId === agent.id ? '#fff' : 'var(--slate-light)' }}>
                          {agent.id.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>w: {agent.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Info Pane */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {selectedAgent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--neon-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', letterSpacing: '2px' }}>
                    {selectedAgent.id.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Agent: {selectedAgent.id}
                    </h2>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px' }}>{selectedAgent.description}</div>
                  </div>
                </div>

                {/* Bouton d'assignation à l'équipe */}
                {targetTeamId && selectedAgent ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    style={{
                      background: 'var(--add-button)',
                      border: '1px solid var(--neon-secondary)',
                      color: 'var(--neon-secondary)',
                      padding: '10px 15px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span>
                    Assigner
                  </button>
                ) : null}

              </div>

              <div>
                <h3 style={{ fontSize: '11px', color: 'var(--slate-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Rôle Primaire</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', fontSize: '13px', lineHeight: '1.5' }}>
                  {selectedAgent.role}
                </div>
              </div>

              {selectedAgent.responsibilities && selectedAgent.responsibilities.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '11px', color: 'var(--slate-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Responsabilités</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {selectedAgent.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAgent.output_format && (
                <div>
                  <h3 style={{ fontSize: '11px', color: 'var(--slate-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Format de Sortie</h3>
                  <pre style={{ background: '#090a0f', padding: '10px', borderRadius: '4px', fontSize: '11px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {selectedAgent.output_format}
                  </pre>
                </div>
              )}

              {/* Confirmation Overlay */}
              <AnimatePresence>
                {showConfirm && targetTeamId && activeProject && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    style={{
                      position: 'absolute',
                      top: '0', left: '0', right: '0', bottom: '0',
                      background: 'rgba(0, 0, 0, 0.85)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 10,
                      padding: '40px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 128, 0.1)',
                      border: '1px solid var(--neon-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '20px', color: 'var(--neon-secondary)'
                    }}>
                      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>

                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Assigner l'agent {selectedAgent.id} ?
                    </h3>
                    <p style={{ margin: '0 0 30px 0', fontSize: '12px', color: 'var(--slate-light)' }}>
                      L'agent sera ajouté à l'équipe <strong style={{ color: 'var(--neon-yellow)' }}>{activeProject.teams.find(t => t.id === targetTeamId)?.name || targetTeamId}</strong>.
                    </p>

                    {/* Toggle Switch Confirmation */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <div style={{ position: 'relative', width: '200px', height: '60px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', overflow: 'hidden' }}>

                        <div
                          onClick={() => setShowConfirm(false)}
                          style={{ fontSize: '12px', color: 'var(--text-dim)', cursor: 'pointer', zIndex: 2 }}
                        >
                          ANNULER
                        </div>

                        <div
                          onClick={() => {
                            const newProjects = projects.map(p => {
                              if (p.id !== activeProject.id) return p;
                              const newTeams = p.teams.map(t => {
                                if (t.id !== targetTeamId) return t;
                                if (t.agents.includes(selectedAgent.id)) return t;
                                return { ...t, agents: [...t.agents, selectedAgent.id] };
                              });
                              return { ...p, teams: newTeams };
                            });
                            onProjectsUpdate(newProjects);
                            setShowConfirm(false);
                            if (onClose) onClose();
                          }}
                          style={{ fontSize: '12px', color: 'var(--neon-secondary)', fontWeight: 'bold', cursor: 'pointer', zIndex: 2 }}
                        >
                          CONFIRMER
                        </div>

                        <motion.div
                          animate={{ x: 0 }}
                          whileTap={{ scale: 0.9 }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 120 }}
                          dragElastic={0.1}
                          onDragEnd={(e, info) => {
                            if (info.point.x > 100) {
                              const newProjects = projects.map(p => {
                                if (p.id !== activeProject.id) return p;
                                const newTeams = p.teams.map(t => {
                                  if (t.id !== targetTeamId) return t;
                                  if (t.agents.includes(selectedAgent.id)) return t;
                                  return { ...t, agents: [...t.agents, selectedAgent.id] };
                                });
                                return { ...p, teams: newTeams };
                              });
                              onProjectsUpdate(newProjects);
                              setShowConfirm(false);
                              if (onClose) onClose();
                            } else if (info.point.x < -20) {
                              setShowConfirm(false);
                            }
                          }}
                          style={{
                            position: 'absolute', left: '10px',
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--neon-secondary)', cursor: 'grab',
                            boxShadow: '0 0 15px var(--neon-secondary)',
                            zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#000" strokeWidth="3">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </motion.div>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', opacity: 0.6 }}>GLISSEZ VERS LA DROITE POUR VALIDER</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          ) : (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '100px' }}>Sélectionnez un agent pour voir sa carte d'identité.</div>
          )}
        </div>
      </div>
      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div>
  );
};

export default AgentsHubWindow;
