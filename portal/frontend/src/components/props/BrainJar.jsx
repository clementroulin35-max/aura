import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vegaJar from "../../assets/props/l2_vega_jar.png";
import vegaBrain from "../../assets/props/l2_vega_brain.png";
import "./props.css";
import "./BrainJar.css";

/**
 * 🛰️ BrainJar — Cerebro-Laboratory (Multi-Layer Architecture)
 * Symmetrical companion to Orion.
 * Layers: [Jar Frame] -> [Liquid] -> [Bubbles] -> [Brain Core]
 */
export default function BrainJar() {
  const [activity, setActivity] = useState(0);

  // 🎧 Sync with ORION_LOG activity
  useEffect(() => {
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
  }, []);

  const handleClick = () => {
    // Neural shock animation
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
  };

  return (
    <div className="brain-jar-wrap prop-wrap lite-mode" onClick={handleClick}>
      <div className="jar-label">
        <span className={`jar-status-dot ${activity > 0.1 ? 'active' : ''}`} />
        NEURAL_PROCESSOR_VEGA
      </div>

      <div className="vega-composition-container">
        {/* Layer 1: Liquid Mask (Inside Jar) */}
        <motion.div
          className="layer-liquid"
          animate={{
            height: ["45%", "50%", "45%"],
            borderRadius: ["20% 20% 0 0", "30% 30% 0 0", "20% 20% 0 0"]
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
              y: -80,
              opacity: [0, 0.6, 0],
              x: (i * 10) - 20 + Math.sin(i + Date.now()) * 5
            }}
            transition={{
              duration: 2 / (0.6 + Math.random() + activity),
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}

        <motion.img
          src={vegaBrain}
          className="layer-brain-core prop-img"
          alt="Vega Core"
          animate={{
            y: [-3, 3, -3],
            scale: [1, 1.05 + activity * 0.15, 1],
            opacity: [0.85, 1, 0.85]
          }}
          style={{
            filter: `url(#chroma-key-blue) brightness(${0.9 + activity * 0.4}) contrast(1.1)`
          }}
          transition={{
            duration: 2 / (1 + activity),
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Layer 0 (RE-RENDERED ON TOP): Jar Structure (Chroma Blue) */}
        <img
          src={vegaJar}
          className="layer-jar-frame prop-img"
          alt="Jar Frame"
        />

        {/* Layer 4: Interior Glow */}
        <div
          className="layer-pulsar-glow"
          style={{
            opacity: 0.1 + activity * 0.6,
            transform: `scale(${1 + activity * 0.5})`
          }}
        />
      </div>
    </div>
  );
}
