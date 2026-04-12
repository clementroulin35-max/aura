import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import vegaJar from "../../assets/props/l2_vega_jar.png";
import vegaBrainV2 from "../../assets/props/l2_vega_brain.png";
import "./props.css";
import "./BrainJar.css";

/**
 * 🛰️ BrainJar — Cerebro-Laboratory (Multi-Layer Architecture)
 * Symmetrical companion to Orion.
 * Ver 4.8: Enforced clipping and Pixar V2 brain integration.
 * Layers: [Jar Frame] -> [CLIP: Liquid -> Bubbles -> Brain Core]
 */
export default function BrainJar({ onClick, orion }) {
  const { mood, showBubble } = orion || {};
  const [activity, setActivity] = useState(0);

  // Determine Liquid Color based on Mood
  const MOOD_COLORS = {
    happy: "var(--cyan-glow)",
    alert: "var(--amber-glow)",
    error: "var(--error-red)",
    travel: "var(--purple-glow)"
  };

  const currentLiquidColor = MOOD_COLORS[mood] || MOOD_COLORS.happy;

  // 🎧 Sync with ORION_LOG activity or Orion speaking
  useEffect(() => {
    if (showBubble) setActivity(0.8);

    let decayTimer;
    const handleLog = () => {
      setActivity(1.0);
      clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        const decayInterval = setInterval(() => {
          setActivity(prev => {
            if (prev <= 0) {
              clearInterval(decayInterval);
              return 0;
            }
            return prev - 0.1;
          });
        }, 150);
      }, 500);
    };

    window.addEventListener('ORION_LOG', handleLog);
    return () => {
      window.removeEventListener('ORION_LOG', handleLog);
      clearTimeout(decayTimer);
    };
  }, [showBubble]);

  const handleJarClick = () => {
    const jar = document.querySelector(".brain-jar-wrap");
    if (jar) {
      jar.animate(
        [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(-3px) rotate(-1deg)" },
          { transform: "translateX(3px) rotate(1deg)" },
          { transform: "translateX(0) rotate(0deg)" }
        ],
        { duration: 250, easing: "ease-in-out" }
      );
    }
    onClick?.();
  };

  return (
    <div className={`brain-jar-wrap prop-wrap mood-${mood}`} onClick={handleJarClick}>
      <div className="vega-composition-container">
        {/* Diegetic Clipping Boundary (Limits the liquid to the jar's interior) */}
        <div className="inner-jar-clip">
          {/* Layer 1: Liquid Mask */}
          <motion.div
            className="layer-liquid"
            style={{
              background: `linear-gradient(to bottom, transparent, ${currentLiquidColor})`
            }}
            animate={{
              height: ["90%", "92%", "90%"], /* Submerge Core (V5.9) */
              borderRadius: ["1% 1% 0 0", "2% 2% 0 0", "1% 1% 0 0"], /* Flat Surface (V6.1) */
              filter: `blur(8px) brightness(${0.5 + activity * 0.3}) saturate(1.2)`
            }}
            transition={{
              duration: 3 / (1 + activity),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Layer 2: Bubbles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="layer-bubble"
              initial={{ y: 50, x: (i * 10) - 20, opacity: 0 }}
              animate={{
                y: -100,
                opacity: [0, 0.4, 0],
                x: (i * 10) - 20 + Math.sin(i + Date.now() / 1000) * 8
              }}
              transition={{
                duration: 2 / (0.6 + Math.random() + activity),
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          ))}

          {/* Layer 3: Pixar Brain Core (V2 Green Chroma) */}
          <motion.img
            src={vegaBrainV2}
            className="layer-brain-core prop-img"
            alt="Vega Core"
            animate={{
              y: [-2, 2, -2],
              scale: [1.6, 1.7 + activity * 0.1, 1.6],
              opacity: [0.9, 1, 0.9]
            }}
            style={{
              filter: 'url(#chroma-key-green)'
            }}
            transition={{
              duration: 2 / (1 + activity),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Layer 0: Jar Structure (Chroma Blue) - Always on Top */}
        <img
          src={vegaJar}
          className="layer-jar-frame prop-img"
          alt="Jar Frame"
          style={{ filter: 'url(#chroma-key-blue)' }}
        />

        {/* Layer 4: Ambient Glow (Behind Jar) */}
        <div
          className="layer-pulsar-glow"
          style={{
            '--glow-color': currentLiquidColor,
            opacity: 0.1 + activity * 0.4,
            transform: `translate(-50%, -50%) scale(${1.0 + activity * 0.2})`
          }}
        />
      </div>
    </div>
  );
}
