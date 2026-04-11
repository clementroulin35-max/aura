import { motion, useDragControls } from 'framer-motion';
import { useState } from 'react';
import './hud.css';
import './MemoryRapportHUD.css';

const ARCHIVES = [
  { id: "LG-001", title: "Mission Alpha — Build Pipeline",    date: "2026-04-09" },
  { id: "LG-002", title: "Mission Beta — Sovereignty Audit",  date: "2026-04-08" },
];

export default function MemoryRapportHUD({ onClose, x, y }) {
  const dragControls = useDragControls();
  const [dimensions, setDimensions] = useState({ width: 450, height: 380 });

  return (
    <motion.div
      className="nexus-hud-panel archives-window"
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      style={{ width: dimensions.width, height: dimensions.height, x, y }}
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">MISSION ARCHIVES</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>[X]</button>}
      </div>

      <div className="hud-content archives-content">
        <ul className="archive-list">
          {ARCHIVES.map(a => (
            <li key={a.id} className="archive-card">
              <div className="archive-meta">
                <span className="archive-id">{a.id}</span>
                <span className="archive-date">{a.date}</span>
              </div>
              <span className="archive-title">{a.title}</span>
              <div className="archive-actions">
                <button className="expand-btn">RESTORE SCAN</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-resize-handle" />
    </motion.div>
  );
}
