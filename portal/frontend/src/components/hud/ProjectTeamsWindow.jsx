import React, { useState, useEffect } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import './hud.css';

const ProjectTeamsWindow = ({ onClose, x, y, width, height, dragConstraints, isFocused, onFocus, projects, activeProject, onProjectsUpdate, onOpenHub }) => {
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
      width.set(Math.max(600, startWidth + (moveEvent.pageX - startX)));
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
      const newWidth = Math.max(600, startWidth - deltaX);
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

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [agentSpecs, setAgentSpecs] = useState("");
  const [unlockDelete, setUnlockDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamAgents, setNewTeamAgents] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);

  useEffect(() => {
    fetch('/api/v1/resources/agents')
      .then(res => res.json())
      .then(data => setAvailableAgents(data.agents || []))
      .catch(err => console.error(err));
  }, []);

  // Sync state when activeProject changes
  useEffect(() => {
    if (activeProject && activeProject.teams && activeProject.teams.length > 0) {
      if (!selectedTeamId || !activeProject.teams.find(t => t.id === selectedTeamId)) {
        const firstTeam = activeProject.teams[0];
        setSelectedTeamId(firstTeam.id);
        if (firstTeam.agents.length > 0) {
          setSelectedAgentId(firstTeam.agents[0]);
        } else {
          setSelectedAgentId(null);
        }
      }
    } else {
      setSelectedTeamId(null);
      setSelectedAgentId(null);
    }
  }, [activeProject]);

  // Sync agent specs when selected agent changes
  useEffect(() => {
    if (selectedAgentId && activeProject) {
      const activeTeam = activeProject.teams.find(t => t.agents.includes(selectedAgentId));
      if (activeTeam && activeTeam.specs && activeTeam.specs[selectedAgentId]) {
         const specs = activeTeam.specs[selectedAgentId];
         // If specs is an object, format it for the textarea
         if (typeof specs === 'object' && specs !== null) {
           setAgentSpecs(JSON.stringify(specs, null, 2));
         } else {
           setAgentSpecs(specs);
         }
      } else {
         setAgentSpecs(`Configuration spécifique de l'agent '${selectedAgentId}' pour le projet '${activeProject.name}'.`);
      }
      setUnlockDelete(false);
      setSaveStatus('idle');
    } else {
      setAgentSpecs("");
    }
  }, [selectedAgentId, activeProject]);

  const activeTeam = activeProject?.teams?.find(t => t.id === selectedTeamId);

  const handleSave = () => {
    if (!activeTeam || !selectedAgentId || !onProjectsUpdate) return;
    setSaveStatus('saving');
    
    const newProjects = projects.map(p => {
      if (p.id !== activeProject.id) return p;
      const newTeams = p.teams.map(t => {
        if (t.id !== activeTeam.id) return t;
        const newSpecs = { ...(t.specs || {}) };
        newSpecs[selectedAgentId] = agentSpecs;
        return { ...t, specs: newSpecs };
      });
      return { ...p, teams: newTeams };
    });

    onProjectsUpdate(newProjects).then(() => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
    });
  };

  const handleDelete = () => {
    if (!unlockDelete || !activeTeam || !selectedAgentId || !onProjectsUpdate) return;
    
    // Find next agent or team to select
    const currentAgentIndex = activeTeam.agents.indexOf(selectedAgentId);
    let nextAgentToSelect = null;
    let nextTeamIdToSelect = activeTeam.id;

    if (activeTeam.agents.length > 1) {
      // If we're deleting the first agent, select the last one. Otherwise, the previous one.
      if (currentAgentIndex === 0) {
        nextAgentToSelect = activeTeam.agents[activeTeam.agents.length - 1];
      } else {
        nextAgentToSelect = activeTeam.agents[currentAgentIndex - 1];
      }
    } else {
      // Current team will be deleted. Select another team if possible.
      const currentTeamIndex = activeProject.teams.findIndex(t => t.id === activeTeam.id);
      if (activeProject.teams.length > 1) {
        const targetTeam = activeProject.teams[currentTeamIndex === 0 ? 1 : currentTeamIndex - 1];
        nextTeamIdToSelect = targetTeam.id;
        nextAgentToSelect = targetTeam.agents[0];
      } else {
        nextTeamIdToSelect = null;
        nextAgentToSelect = null;
      }
    }

    // Remove agent from team. If team empty, remove team.
    const newProjects = projects.map(p => {
      if (p.id !== activeProject.id) return p;
      const newTeams = p.teams.map(t => {
        if (t.id !== activeTeam.id) return t;
        const newAgents = t.agents.filter(a => a !== selectedAgentId);
        return { ...t, agents: newAgents };
      }).filter(t => t.agents.length > 0);
      return { ...p, teams: newTeams };
    });

    onProjectsUpdate(newProjects).then(() => {
       setSelectedTeamId(nextTeamIdToSelect);
       setSelectedAgentId(nextAgentToSelect);
    });
    setUnlockDelete(false);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName || !activeProject || !onProjectsUpdate) return;
    
    const newTeam = {
      id: `team-${newTeamName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(Math.random() * 100)}`,
      name: newTeamName,
      agents: newTeamAgents,
      specs: {} // Initialize empty specs
    };

    const newProjects = projects.map(p => {
      if (p.id !== activeProject.id) return p;
      return { ...p, teams: [...p.teams, newTeam] };
    });

    await onProjectsUpdate(newProjects);
    setNewTeamName("");
    setNewTeamAgents([]);
    setSelectedTeamId(newTeam.id);
    if (newTeam.agents.length > 0) {
      setSelectedAgentId(newTeam.agents[0]);
    }
  };

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
        minWidth: '600px',
        minHeight: '400px',
        x, y,
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
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)} style={{ fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)', letterSpacing: '2px' }}>
         <span className="hud-title">PROJECT TEAMS ORCHESTRATION</span>
         {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      <div className="hud-content" style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
        
        {!activeProject ? (
          <div style={{ color: 'var(--slate-light)', textAlign: 'center', marginTop: '50px' }}>Aucun projet actif dans le Nexus. Veuillez sélectionner une destination.</div>
        ) : (
          <>
            {/* Top Row: Teams Grids */}
            <div style={{ 
              display: 'flex', gap: '20px', padding: '20px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              {activeProject.teams.map(team => (
                <div 
                  key={team.id} 
                  onClick={() => {
                    setSelectedTeamId(team.id);
                  }}
                  style={{
                    background: selectedTeamId === team.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedTeamId === team.id ? 'var(--neon-yellow)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '6px',
                    padding: '15px',
                    minWidth: '280px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '12px', color: selectedTeamId === team.id ? 'var(--neon-yellow)' : 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {team.name}
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--slate-light)' }}>{team.agents.length} AGENTS</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {team.agents.map(agentId => (
                      <motion.div 
                        key={agentId} 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamId(team.id);
                          setSelectedAgentId(agentId);
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                          background: selectedAgentId === agentId ? 'rgba(0, 255, 128, 0.2)' : 'rgba(0,0,0,0.4)', 
                          padding: '10px', borderRadius: '4px', width: '60px',
                          cursor: 'pointer', border: `1px solid ${selectedAgentId === agentId ? 'var(--neon-secondary)' : 'transparent'}`,
                          boxShadow: selectedAgentId === agentId ? '0 0 10px rgba(0, 255, 128, 0.3)' : 'none'
                        }}
                      >
                        <div style={{ 
                          width: '35px', height: '35px', borderRadius: '50%', 
                          background: 'var(--hud-bg-dark)', border: '1px solid var(--slate-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
                          color: selectedAgentId === agentId ? 'var(--neon-secondary)' : 'var(--slate-light)'
                        }}>
                          {agentId.substring(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '9px', color: selectedAgentId === agentId ? '#fff' : 'var(--text-dim)', textAlign: 'center', wordBreak: 'break-all' }}>
                          {agentId}
                        </span>
                      </motion.div>
                    ))}
                    
                    {/* Add Agent Button / Reticle */}
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2, borderStyle: 'solid', borderColor: 'var(--neon-yellow)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeamId(team.id);
                        if(onOpenHub) onOpenHub(team.id);
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)', borderRadius: '4px', width: '60px', height: '65px',
                        border: '1px dashed rgba(255, 255, 255, 0.2)', cursor: 'pointer', transition: 'all 0.2s',
                        gap: '5px'
                      }}
                    >
                      <div style={{ 
                        width: '30px', height: '30px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ color: 'var(--slate-light)' }}>
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                      <span style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>AJOUTER</span>
                    </motion.div>
                  </div>
                </div>
              ))}

              <motion.div 
                onClick={() => setSelectedTeamId('new_team')}
                whileHover={{ scale: 1.02, borderColor: 'var(--neon-yellow)', boxShadow: '0 0 15px rgba(255, 255, 0, 0.1)' }}
                style={{
                  background: selectedTeamId === 'new_team' ? 'rgba(0, 255, 128, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px dashed ${selectedTeamId === 'new_team' ? 'var(--neon-yellow)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '6px', padding: '15px', minWidth: '150px', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                <motion.div 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-light)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </motion.div>
                <div style={{ fontSize: '10px', color: 'var(--slate-light)', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>CREER EQUIPE</div>
              </motion.div>


            </div>

            {/* Bottom Row: Agent Editor or Team Creator */}
            {selectedTeamId === 'new_team' ? (
              <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
                <h3 style={{ 
                  color: 'var(--neon-secondary)', margin: '0 0 20px 0', textTransform: 'uppercase', 
                  letterSpacing: '2px', fontSize: '14px', fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)' 
                }}>FORGER UNE NOUVELLE ÉQUIPE</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                  <input 
                    type="text" 
                    placeholder="NOM DE L'ÉQUIPE"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '15px', color: '#fff', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                  />

                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--slate-light)', marginBottom: '10px', textTransform: 'uppercase' }}>SÉLECTIONNER LES AGENTS ({newTeamAgents.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {availableAgents.map(a => {
                         const isSelected = newTeamAgents.includes(a.id);
                         return (
                           <div 
                             key={a.id}
                             onClick={() => {
                               setNewTeamAgents(prev => 
                                 prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]
                               );
                             }}
                             style={{
                               padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase',
                               border: `1px solid ${isSelected ? 'var(--neon-secondary)' : 'rgba(255,255,255,0.1)'}`,
                               background: isSelected ? 'rgba(0, 255, 128, 0.15)' : 'rgba(0,0,0,0.3)',
                               color: isSelected ? '#fff' : 'var(--text-dim)', transition: 'all 0.2s'
                             }}
                           >
                             {a.id}
                           </div>
                         );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateTeam}
                    disabled={!newTeamName}
                    style={{ 
                      marginTop: '20px', background: 'rgba(0, 255, 128, 0.2)', border: '1px solid var(--neon-secondary)', color: 'var(--neon-secondary)', 
                      padding: '15px', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', cursor: !newTeamName ? 'not-allowed' : 'pointer', 
                      textTransform: 'uppercase', borderRadius: '4px', opacity: !newTeamName ? 0.5 : 1
                    }}
                  >
                    CRÉER L'ÉQUIPE
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Leaft 1/3: Team Agents List */}
              <div style={{ width: '33%', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '15px', textTransform: 'uppercase' }}>
                  {activeTeam ? `Roster: ${activeTeam.name}` : 'SÉLECTIONNEZ UNE ÉQUIPE'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeTeam?.agents?.map(agentId => (
                    <div 
                      key={agentId}
                      onClick={() => setSelectedAgentId(agentId)}
                      style={{
                        padding: '10px 15px',
                        background: selectedAgentId === agentId ? 'rgba(0, 255, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${selectedAgentId === agentId ? 'var(--neon-secondary)' : 'transparent'}`,
                        borderLeft: `3px solid ${selectedAgentId === agentId ? 'var(--neon-secondary)' : 'transparent'}`,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: selectedAgentId === agentId ? '#fff' : 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      {'>'} {agentId}
                    </div>
                  ))}
                  {(!activeTeam?.agents || activeTeam.agents.length === 0) && (
                     <div style={{ fontSize: '11px', color: 'var(--slate-light)' }}>L'équipe est vide. Ajoutez des agents depuis le Hub.</div>
                  )}
                </div>
              </div>

              {/* Right 2/3: Specification Editor */}
              <div style={{ width: '67%', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {selectedAgentId ? (
                  <>
                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ 
                        fontSize: '11px', color: 'var(--neon-secondary)', margin: 0, textTransform: 'uppercase',
                        fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)'
                      }}>
                        SPÉCIFICATIONS DIRECTIVES: {selectedAgentId}
                      </h4>
                    </div>
                    
                    <textarea 
                      value={agentSpecs}
                      onChange={(e) => setAgentSpecs(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '15px',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        resize: 'none',
                        outline: 'none',
                        borderRadius: '4px',
                        marginBottom: '15px'
                      }}
                    />

                    {/* Actions bar (Checkbox and Buttons) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={unlockDelete} 
                          onChange={(e) => setUnlockDelete(e.target.checked)} 
                          style={{ appearance: 'none', width: '16px', height: '16px', background: unlockDelete ? 'var(--neon-error, #ff3366)' : 'transparent', border: '1px solid var(--slate-light)', borderRadius: '2px', cursor: 'pointer', outline: 'none' }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--slate-light)', fontStyle: 'italic' }}>
                          Déverrouiller le retrait d'agent
                        </span>
                      </label>

                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                          onClick={handleDelete}
                          disabled={!unlockDelete}
                          style={{
                            background: unlockDelete ? 'rgba(255, 51, 102, 0.2)' : 'transparent',
                            border: `1px solid ${unlockDelete ? '#ff3366' : 'rgba(255,255,255,0.1)'}`,
                            color: unlockDelete ? '#ff3366' : 'rgba(255,255,255,0.3)',
                            padding: '8px 16px',
                            fontSize: '10px',
                            cursor: unlockDelete ? 'pointer' : 'not-allowed',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            fontFamily: 'var(--font-ui)',
                            textShadow: unlockDelete ? 'var(--pixel-shadow)' : 'none'
                          }}
                        >
                          SUPPRIMER
                        </button>

                        <button 
                          onClick={handleSave}
                          disabled={saveStatus !== 'idle'}
                          style={{
                            background: saveStatus === 'success' ? 'rgba(0, 255, 128, 0.4)' : 'rgba(0, 255, 128, 0.2)',
                            border: `1px solid ${saveStatus === 'success' ? '#fff' : 'var(--neon-secondary)'}`,
                            color: saveStatus === 'success' ? '#fff' : 'var(--text-primary)',
                            padding: '8px 16px',
                            fontSize: '10px',
                            cursor: saveStatus !== 'idle' ? 'default' : 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {saveStatus === 'saving' ? (
                            <svg className="spinner-detect" viewBox="0 0 50 50" style={{ width: '12px', height: '12px' }}>
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor"></circle>
                            </svg>
                          ) : saveStatus === 'success' ? 'OK' : 'SAUVEGARDER'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '100px' }}>
                    Aucun agent sélectionné pour l'édition de spécifications.
                  </div>
                )}
              </div>
            </div>
            )}
          </>
        )}
      </div>
      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div>
  );
};

export default ProjectTeamsWindow;
