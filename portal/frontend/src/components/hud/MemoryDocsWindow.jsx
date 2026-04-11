import { motion, useDragControls } from 'framer-motion';
import { useState } from 'react';
import './hud.css';
import './MemoryDocsWindow.css';

const DOCS = [
  { name: "ORION_V3_VIBE.md",    type: "DESIGN" },
  { name: "README.md",            type: "GUIDE"  },
  { name: "how_to_use.md",        type: "GUIDE"  },
  { name: "roadmap.yaml",         type: "PLAN"   },
];

export default function MemoryDocsWindow({ onClose, x, y }) {
  const dragControls = useDragControls();
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });

  return (
    <motion.div
      className="nexus-hud-panel docs-window"
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      style={{ width: dimensions.width, height: dimensions.height, x, y }}
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">TECHNICAL DOCUMENTS</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>[X]</button>}
      </div>

      <div className="hud-content docs-content">
        <ul className="docs-grid">
          {DOCS.map(d => (
            <li key={d.name} className="doc-card">
              <span className="doc-icon">📄</span>
              <div className="doc-info">
                <span className="doc-name">{d.name}</span>
                <span className="doc-type">{d.type}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-resize-handle" />
    </motion.div>
  );
}
