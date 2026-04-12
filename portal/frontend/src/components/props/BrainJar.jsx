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

  // 🫧 V6.17: Stabilize bubble properties to prevent re-randomization on every render
  const bubbleData = React.useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      x: (Math.random() * 200) - 100,
      size: 3 + Math.random() * 4,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 5
    }));
  }, []);

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
          {/* Layer 3: Pixar Brain Core (V2 Green Chroma) — Backmost (V6.15) */}
          <motion.img
            src={vegaBrainV2}
            className="layer-brain-core prop-img"
            alt="Vega Core"
            animate={{
              y: [-2, 2, -2],
              scale: [1.6, 1.7 + activity * 0.1, 1.6],
              opacity: [0.9, 1, 0.9],
              filter: `url(#chroma-key-green) brightness(${0.8 + activity * 0.3})`
            }}
            transition={{
              duration: 2.5 / (1 + activity),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Layer 1: Liquid Mask — Midground Refraction (V6.15) */}
          <motion.div
            className="layer-liquid"
            style={{
              background: `linear-gradient(to bottom, transparent, ${currentLiquidColor})`
            }}
            animate={{
              height: ["90%", "92%", "90%"],
              borderRadius: ["1% 1% 0 0", "2% 2% 0 0", "1% 1% 0 0"],
              brightness: [0.5 + activity * 0.3, 0.7 + activity * 0.3, 0.5 + activity * 0.3]
            }}
            transition={{
              duration: 3 / (1 + activity),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Layer 2: Bubbles — Absolute Foreground detail (15 total) (V6.17 Optimized) */}
          {bubbleData.map((b, i) => (
            <motion.div
              key={i}
              className="layer-bubble"
              initial={{
                y: 380,
                x: b.x,
                opacity: 0,
                width: b.size,
                height: b.size
              }}
              animate={{
                y: -420,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: b.duration / (1 + activity),
                repeat: Infinity,
                delay: b.delay,
                ease: "linear"
              }}
            />
          ))}
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
            opacity: 0.2 + activity * 0.4,
            transform: `translate(-50%, -50%) scale(${1.0 + activity * 0.2})`
          }}
        />
      </div>
    </div>
  );
}
