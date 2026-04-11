import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import orionImg from '../../assets/props/l2_orion.jpg';
import './props.css';
import './OrionCompanion.css';

/**
 * 🛰️ Orion Companion — The Living Interface
 * Handles diegetic speech bubbles, critical log filtering, and state animations.
 */
export default function OrionCompanion({ onClick, isActive, ui }) {
  const [state, setState] = useState('idle'); // idle | notification | active
  const [message, setMessage] = useState('');

  // Logic to detect "Critical" logs
  const isCritical = useCallback((content) => {
    const criticalPrefixes = ['[OK]', '[WARN]', '[ERROR]', '[SYNC]', '▸'];
    return criticalPrefixes.some(p => content.includes(p)) || content.length < 120;
  }, []);

  // Truncate to one sentence
  const formatMessage = useCallback((text) => {
    if (!text) return '';
    // Take first sentence or first 90 chars
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length < 90) return firstSentence.trim();
    return text.substring(0, 87) + '...';
  }, []);

  useEffect(() => {
    const handleLog = (event) => {
      // Respect Mute Protocol
      if (ui?.orionMuted) return;

      const { content } = event.detail || {};
      if (!content || !isCritical(content)) return;

      const formatted = formatMessage(content);
      setMessage(formatted);

      // Determine visual state based on Terminal visibility
      if (ui?.chatOpen) {
        setState('active');
      } else {
        setState('notification');
      }

      // Auto-clear after timeout
      const timer = setTimeout(() => {
        setState('idle');
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('ORION_LOG', handleLog);
    return () => window.removeEventListener('ORION_LOG', handleLog);
  }, [ui?.chatOpen, ui?.orionMuted, isCritical, formatMessage]);

  return (
    <div
      className={`prop-wrap prop-orion orion-companion-wrap${isActive ? ' active' : ''}`}
      onClick={onClick}
      title="Orion — Ouvrir le terminal"
      role="button"
      aria-label="Orion companion"
    >
      <AnimatePresence mode="wait">
        {/* Silence Protocol: Permanent block if muted */}
        {!ui?.orionMuted && state !== 'idle' && (
          <motion.div
            key={state}
            className={`orion-bubble ${state === 'notification' ? 'bubble-notif' : 'bubble-text'}`}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
          >
            {state === 'notification' ? (
              <span className="bubble-icon">💬</span>
            ) : (
              <span className="bubble-content">{message}</span>
            )}
            <div className="bubble-tail" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="orion-img-anchor"
      >
        <img src={orionImg} alt="Orion" className="prop-img" />
      </motion.div>
    </div>
  );
}
