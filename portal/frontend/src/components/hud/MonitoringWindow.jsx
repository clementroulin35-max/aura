import { motion, useDragControls } from 'framer-motion';
import { useState } from 'react';
import './hud.css';
import './MonitoringWindow.css';

export default function MonitoringWindow({ onClose, x, y, status = 'OFFLINE' }) {
  const dragControls = useDragControls();
  const [dimensions, setDimensions] = useState({ width: 300, height: 450 });
  
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

  return (
    <motion.div
      className={`nexus-hud-panel monitoring-window ${isOnline ? 'is-online' : 'is-offline'}`}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      style={{ width: dimensions.width, height: dimensions.height, x, y }}
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
            <div className={`pulse-ring ${isOnline ? 'pulse-green' : 'pulse-red'}`} />
            <span className="pulse-label">NEURAL HEARTBEAT: {status}</span>
          </div>
        </section>

        {/* Telemetry Section */}
        <section className="telemetry-section">
          <h4 className="section-header">TELEMETRY</h4>
          <dl className="metric-list">
            <div className="metric-row"><dt>Tokens</dt><dd>1.4k/s</dd></div>
            <div className="metric-row"><dt>Agents</dt><dd>3</dd></div>
            <div className="metric-row"><dt>Uptime</dt><dd>14:23:05</dd></div>
            <div className="metric-row"><dt>Status</dt><dd className="status-ok">OPTIMAL</dd></div>
          </dl>
        </section>
      </div>

      <div className="hud-resize-handle" />
    </motion.div>
  );
}
