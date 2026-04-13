import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './hud.css';
import './MemoryRapportHUD.css';

export default function MemoryRapportHUD({ doc, onClose, x, y, width, height, dragConstraints, isFocused, onFocus }) {
  const dragControls = useDragControls();

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

  // --- Auto-Resize Logic (Pop-up on error) ---
  useEffect(() => {
    if (doc?.error) {
      width.set(450);
      height.set(350);
    } else {
      width.set(600);
      height.set(500);
    }
  }, [doc?.error, width, height]);

  if (!doc) return null;

  return (
    <motion.div
      className="nexus-hud-panel premium-reader"
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
      <div className="hud-header reader-header" onPointerDown={(e) => dragControls.start(e)}>
        <div className="header-meta">
          <span className="hud-title">{doc.filename}</span>
        </div>
        {onClose && <button className="hud-close-btn" onClick={onClose}>X</button>}
      </div>

      <div className="hud-content reader-content custom-scrollbar" style={{ position: 'relative' }}>
        {doc.error ? (
          <div className="reader-error-state">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="error-icon-wrapper"
            >
              <svg className="error-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
                <path d="M14 2V8H20" />
                <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
              </svg>
              <div className="error-glow" />
            </motion.div>
            <div className="error-text-container">
              <h2 className="error-title">FLUX DE DONNÉES INTERROMPU</h2>
              <p className="error-message">{doc.error}</p>
            </div>
          </div>
        ) : (
          <div className="markdown-container">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.content || "*Aucun contenu détecté dans ce module.*"}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {!doc.error && (
        <div className="reader-footer">
          <span className="footer-status">SYSTÈME DE LECTURE ORION V4.0 // ARCHIVE NÉVRALGIQUE</span>
          <div className="footer-deco" />
        </div>
      )}

      <div className="hud-resize-handle" onMouseDown={handleResizeRight} />
      <div className="hud-resize-handle-left" onMouseDown={handleResizeLeft} />
    </motion.div>
  );
}
