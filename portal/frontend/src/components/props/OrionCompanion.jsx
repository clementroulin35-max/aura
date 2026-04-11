import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import orionImg from '../../assets/props/l2_orion.jpg';
import './props.css';
import './OrionCompanion.css';

/**
 * 🛰️ Orion Companion — The Living Interface
 * Handles diegetic speech bubbles, critical log filtering, and state animations.
 */
export default function OrionCompanion({ onClick, isActive, ui, orion }) {
  const { mood, message, dialogueType, showBubble, handleManualClick } = orion || {};

  // Internal click handler to combine navigation + narrative
  const onBodyClick = (e) => {
    e.stopPropagation();
    handleManualClick?.('orion');
    onClick();
  };

  return (
    <div
      className={`prop-wrap prop-orion orion-companion-wrap${isActive ? ' active' : ''}`}
      onClick={onBodyClick}
      title="Orion — Ouvrir le terminal"
      role="button"
      aria-label="Orion companion"
    >
      <AnimatePresence mode="wait">
        {/* Silence Protocol: Permanent block if muted */}
        {!ui?.orionMuted && showBubble && (
          <motion.div
            key={message}
            className={`orion-bubble bubble-${dialogueType} mood-${mood}`}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
          >
            <div className="bubble-content">
              {message}
            </div>
            
            {/* Visual Indicators */}
            {dialogueType === 'speech' ? (
                <div className="bubble-tail" />
            ) : (
                <div className="thought-puffs">
                    <div className="puff puff-1" />
                    <div className="puff puff-2" />
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="orion-img-anchor"
      >
        <img 
          src={orionImg} 
          alt="Orion" 
          className="prop-img" 
          style={{ filter: 'url(#chroma-key-blue)' }}
        />
      </motion.div>
    </div>
  );
}
