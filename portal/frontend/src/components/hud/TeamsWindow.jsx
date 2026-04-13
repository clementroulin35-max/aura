import { motion, useDragControls } from 'framer-motion';
import { useState } from 'react';
import './hud.css';
import './TeamsWindow.css';

const PIPELINE_TEAMS = [
  { id: "integrity",   label: "INTEGRITY",   status: "done"    },
  { id: "quality",     label: "QUALITY",     status: "active"  },
  { id: "strategy",    label: "STRATEGY",    status: "pending" },
  { id: "dev",         label: "DEV",         status: "pending" },
  { id: "maintenance", label: "MAINTENANCE", status: "pending" },
];

function StatusIcon({ status }) {
  if (status === "done")   return <span className="pipeline-status done">DONE</span>;
  if (status === "active") return <span className="pipeline-status active">ACTIVE</span>;
  return <span className="pipeline-status pending">WAIT</span>;
}

export default function TeamsWindow({ onClose, x, y, isFocused, onFocus }) {
  const dragControls = useDragControls();
  const [dimensions, setDimensions] = useState({ width: 320, height: 400 });

  return (
    <motion.div
      className="nexus-hud-panel teams-window"
      onPointerDownCapture={onFocus}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: 70, left: 10, right: window.innerWidth - dimensions.width - 10, bottom: window.innerHeight - dimensions.height - 110 }}
      style={{ width: dimensions.width, height: dimensions.height, x, y, zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)' }}
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">TEAMS PIPELINE</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>[X]</button>}
      </div>

      <div className="hud-content teams-content">
        <ul className="pipeline-list">
          {PIPELINE_TEAMS.map(t => (
            <li key={t.id} className={`pipeline-item ${t.status}`}>
              <span className="pipeline-name">{t.label}</span>
              <StatusIcon status={t.status} />
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-resize-handle" />
    </motion.div>
  );
}
