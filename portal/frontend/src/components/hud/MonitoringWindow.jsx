import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';
import './hud.css';
import './MonitoringWindow.css';

export default function MonitoringWindow({ onClose, x, y, width, height, dragConstraints, status = 'OFFLINE', isExecuting, isFocused, onFocus, activeProject, activeAgentIds = [] }) {
  const dragControls = useDragControls();

  const isOnline = status === 'ONLINE';

  const unfoldVariants = {
    hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.95 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.05
      }
    }
  };

  // Real-time stats derived from project
  const totalAgents = activeProject?.teams?.reduce((acc, t) => acc + t.agents.length, 0) || 0;
  const teamCount = activeProject?.teams?.length || 0;
  const projectTime = activeProject ? "4h 23m" : "--"; // Still hardcoded time, but scoped to existence
  const statusColor = isOnline ? 'var(--status-success)' : 'var(--status-error)';

  // --- Functional Resize Logic ---
  const handleResizeRight = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.pageX; const startY = e.pageY;
    const startWidth = width.get(); const startHeight = height.get();
    const onMouseMove = (moveEvent) => {
      width.set(Math.max(300, startWidth + (moveEvent.pageX - startX)));
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
      const newWidth = Math.max(300, startWidth - deltaX);
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

  return (
    <motion.div
      className={`nexus-hud-panel monitoring-window ${isOnline ? 'is-online' : 'is-offline'}`}
      onPointerDownCapture={onFocus}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={dragConstraints}
      style={{ 
        width, 
        height, 
        minWidth: '300px',
        minHeight: '400px',
        x, y, 
        zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)', 
      }}
      variants={unfoldVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">SYSTEM MONITORING</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      <div className="hud-content monitoring-content">
        {/* Pulse Section */}
        <section className="pulse-section">
          <div className="pulse-gauge">
            <div className={`nexus-status-led ${isOnline ? 'active' : 'error'}`} />
            <span className="pulse-label">NEURAL HEARTBEAT: <span style={{ color: statusColor }}>{status}</span></span>
          </div>
        </section>

        {/* Dynamic Telemetry Section */}
        <section className="telemetry-section">
          <h4 className="section-header">PROJECT TELEMETRY</h4>
          <dl className="metric-list">
            <div className="metric-row">
              <dt>Active Project</dt>
              <dd className="neon-yellow">{activeProject?.name || '---'}</dd>
            </div>
            <div className="metric-row">
              <dt>Project Time</dt>
              <dd>{projectTime}</dd>
            </div>
            <div className="metric-row">
              <dt>Deployed Agents</dt>
              <dd className="neon-blue">{totalAgents} UNITS</dd>
            </div>
            <div className="metric-row">
              <dt>Orchestrated Teams</dt>
              <dd>{teamCount}</dd>
            </div>
            <div className="metric-row">
               <dt>Execution State</dt>
               <dd style={{ color: isExecuting ? 'var(--neon-yellow)' : 'var(--text-dim)', fontWeight: isExecuting ? 'bold' : 'normal' }}>
                 {isExecuting ? 'ACTIVE :: ORION_FORGE' : 'PASSIVE :: LISTENING'}
               </dd>
            </div>
          </dl>
        </section>

        {/* Global Summary Section */}
        <section className="telemetry-section agents-summary">
          <h4 className="section-header">TEAM LIVE FEED</h4>
          {!activeProject ? (
            <div className="empty-state">No projection target acquired.</div>
          ) : (
            <div className="teams-vertical-list">
              {activeProject.teams.map(team => (
                <div key={team.id} className="team-summary-block">
                  <div className="team-header-label">[ {team.name.toUpperCase()} ]</div>
                  {team.agents.map(agent => (
                    <div key={agent} className={`agent-monitoring-row ${activeAgentIds.includes(agent.toLowerCase()) ? 'is-active' : ''}`}>
                      <div className="agent-diode-container">
                        <div className={`agent-diode ${activeAgentIds.includes(agent.toLowerCase()) ? 'pulsing' : ''}`} />
                      </div>
                      <span className="agent-id-name">{agent.toUpperCase()}</span>
                      <span className="agent-status-tag">
                        {activeAgentIds.includes(agent.toLowerCase()) ? (
                          <span className="status-blink active">WORKING</span>
                        ) : isExecuting ? (
                          <span className="status-dim queued">QUEUED</span>
                        ) : (
                          <span className="status-dim">SLEEP</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div>
  );
}
