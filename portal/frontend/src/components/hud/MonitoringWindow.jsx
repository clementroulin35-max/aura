import { motion, useDragControls } from 'framer-motion';
import { useState, useEffect } from 'react';
import './hud.css';
import './MonitoringWindow.css';

export default function MonitoringWindow({ onClose, x, y, status = 'OFFLINE', isExecuting, isFocused, onFocus, activeProject }) {
  const dragControls = useDragControls();
  const [dimensions, setDimensions] = useState({ width: 350, height: 600 });

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

  return (
    <motion.div
      className={`nexus-hud-panel monitoring-window ${isOnline ? 'is-online' : 'is-offline'}`}
      onPointerDownCapture={onFocus}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: 70, left: 10, right: window.innerWidth - dimensions.width - 10, bottom: window.innerHeight - dimensions.height - 110 }}
      style={{ 
        width: dimensions.width, 
        height: dimensions.height, 
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
        {onClose && <button className="hud-close-btn" onClick={onClose}>[X]</button>}
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
               <dd style={{ color: isExecuting ? 'var(--neon-yellow)' : 'var(--text-dim)' }}>
                 {isExecuting ? 'ACTIVE :: INJECTING' : 'IDLE :: LISTENING'}
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
                    <div key={agent} className="agent-monitoring-row">
                      <span className="agent-id-name">{agent.toUpperCase()}</span>
                      <span className="agent-status-tag">
                        {isExecuting ? (
                          <span className="status-blink active">ACTIVE</span>
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

      <div className="hud-resize-handle" />
    </motion.div>
  );
}
