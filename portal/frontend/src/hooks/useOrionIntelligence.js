import { useState, useEffect, useCallback, useRef } from 'react';
import { pickDialogue } from '../lib/narrative.js';

/**
 * 🛰️ useOrionIntelligence (Ver. 4.6 — The Narrative Buffer)
 * Manages a queue of dialogues to prevent rapid flickering and ensure readability.
 * Synchronizes emotional states (mood) with the cockpit accessories.
 */
export function useOrionIntelligence(isJumping, ui) {
  const [mood, setMood] = useState('happy');
  const [message, setMessage] = useState('');
  const [dialogueType, setDialogueType] = useState('speech');
  const [showBubble, setShowBubble] = useState(false);
  
  const queue = useRef([]);
  const isProcessing = useRef(false);
  const clickCount = useRef(0);
  const clickTimeout = useRef(null);
  const idleTimeout = useRef(null);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || queue.current.length === 0) return;
    
    isProcessing.current = true;
    const next = queue.current.shift();

    setMood(next.mood);
    setMessage(next.text);
    setDialogueType(next.type);
    setShowBubble(true);
    
    // Snappy Pacing (V6.6): Fixed 2.5s for better UI responsiveness
    const duration = 2500;

    await new Promise(resolve => setTimeout(resolve, duration));
    
    setShowBubble(false);
    // Short gap between messages (V6.6)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    isProcessing.current = false;
    processQueue();
  }, []);

  const triggerDialogue = useCallback((category) => {
    const dialogue = pickDialogue(category);
    if (!dialogue) return;

    // Check for duplicates in queue
    if (queue.current.some(d => d.text === dialogue.text)) return;

    // Buffer Management (V6.6): Prevent clumping. Max 3 pending messages.
    // If the queue is overwhelmed, discard the oldest to prioritize new info.
    if (queue.current.length >= 3) {
      queue.current.shift();
    }

    queue.current.push(dialogue);
    processQueue();
  }, [processQueue]);

  // 🖱️ Manual Trigger Handler
  const handleManualClick = useCallback((target) => {
    clickCount.current++;
    clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => { clickCount.current = 0; }, 2000);

    if (clickCount.current > 4) {
      triggerDialogue('click_spam');
      return;
    }

    if (target === 'orion') triggerDialogue('click_random');
    if (target === 'vega') triggerDialogue('brain_click');
  }, [triggerDialogue]);

  // 🎧 Event Listeners (Logs)
  useEffect(() => {
    const handleLog = (event) => {
      if (ui?.orionMuted) return;
      const { content, type } = event.detail || {};
      if (!content) return;

      if (type === 'success') triggerDialogue('log_ok');
      else if (type === 'error') triggerDialogue('log_error');
      else if (type === 'warn') triggerDialogue('log_warn');
      else if (content.includes('[SYS]')) triggerDialogue('log_ok');
    };

    window.addEventListener('ORION_LOG', handleLog);
    return () => window.removeEventListener('ORION_LOG', handleLog);
  }, [ui?.orionMuted, triggerDialogue]);

  // 🌌 Travel Synchronization
  useEffect(() => {
    if (isJumping) {
      triggerDialogue('travel_start');
    } else if (message.includes('Distorsion imminente') || message.includes('Saut enclenché')) {
      triggerDialogue('travel_arrival');
    }
  }, [isJumping, triggerDialogue, message]);

  // 💤 Idle Ticker (Adjusted for queue stability)
  useEffect(() => {
    const startIdleTimer = () => {
      const randomInterval = Math.floor(Math.random() * (180000 - 30000 + 1)) + 30000;
      idleTimeout.current = setTimeout(() => {
        if (!showBubble && !isJumping && queue.current.length === 0) {
            triggerDialogue(Math.random() > 0.7 ? 'idle_long' : 'idle_soft');
        }
        startIdleTimer();
      }, randomInterval);
    };

    startIdleTimer();
    return () => clearTimeout(idleTimeout.current);
  }, [showBubble, isJumping, triggerDialogue]);

  return {
    mood,
    message,
    dialogueType,
    showBubble,
    handleManualClick
  };
}
