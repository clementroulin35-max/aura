import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { useState } from 'react';
import './hud.css';
import './MemoryDocsWindow.css';

const DOCS = [
  { name: "ORION_V3_VIBE.md",    type: "DESIGN" },
  { name: "README.md",            type: "GUIDE"  },
  { name: "how_to_use.md",        type: "GUIDE"  },
  { name: "roadmap.yaml",         type: "PLAN"   },
];

export default function MemoryDocsWindow({ onClose, x, y, width, height, dragConstraints, isFocused, onFocus, onOpenDoc }) {
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

  return (
    <motion.div
      className="nexus-hud-panel docs-window"
      onPointerDownCapture={onFocus}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={dragConstraints}
      style={{
        width,
        height,
        minWidth: '400px',
        minHeight: '300px',
        x, y,
        zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)',
      }}
      variants={unfoldVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="hud-header" onPointerDown={(e) => dragControls.start(e)}>
        <span className="hud-title">TECHNICAL DOCUMENTS</span>
        {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      <div className="hud-content docs-content">
        <ul className="docs-grid">
          {DOCS.map(d => (
            <li 
              key={d.name} 
              className="doc-card"
              onClick={() => onOpenDoc && onOpenDoc({ filename: d.name, type: d.type, isTechnical: true })}
              style={{ cursor: 'pointer' }}
            >
              <span className="doc-icon">📄</span>
              <div className="doc-info">
                <span className="doc-name">{d.name}</span>
                <span className="doc-type">{d.type}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div>
  );
}
