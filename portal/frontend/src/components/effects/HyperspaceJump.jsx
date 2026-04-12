import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./HyperspaceJump.css";
import streaksImg from "../../assets/transitions/streaks.png";

/**
 * HyperspaceJump Component v2.1
 * Simplified to ONLY overlay high-fidelity VFX on top of the L0 layer.
 */
export default function HyperspaceJump({ isJumping }) {
  return (
    <AnimatePresence>
      {isJumping && (
        <motion.div
          className="hyperspace-jump-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 0. DIÈGETIC NOISE / GRAIN (Constant during jump) */}
          <div className="jump-grain-layer" />

          {/* 1. CINEMATIC VIGNETTE (Tightens during tension) */}
          <motion.div
            className="jump-vignette-layer"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{
              opacity: [0, 0.4, 0.6, 0.2, 0],
              scale: [1.2, 1, 0.8, 1, 1.2]
            }}
            transition={{
              duration: 4.4,
              times: [0, 0.08, 0.34, 0.72, 1],
              ease: "easeInOut"
            }}
          />

          {/* 2. THE TUNNEL (Streaks + Radial Flow) — Active during Phase 3 (1.5s - 3.2s) */}
          <motion.div
            className="jump-tunnel-container"
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              scale: [0.1, 0.3, 1.5, 2, 2.5]
            }}
            transition={{
              duration: 4.4,
              times: [0, 0.3, 0.38, 0.7, 0.9],
              ease: "easeIn"
            }}
          >
            <div className="jump-radial-glow" />
            <motion.div
              className="jump-streaks"
              style={{ backgroundImage: `url(${streaksImg})` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* 3. THE FLASH & BLACKOUT (Impact at 1.5s) — High Priority Layer */}
          <motion.div
            className="jump-flash-impact"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 1, 0, 1, 0], // Flash -> Blackout -> Flash -> Dissipate
              backgroundColor: ["#fff", "#fff", "#fff", "#000", "#fff", "#fff"]
            }}
            transition={{
              duration: 4.4,
              times: [0, 0.33, 0.34, 0.35, 0.36, 0.45], // Sharper timings
              ease: "linear"
            }}
          />

          {/* 4. THE SHATTER REVEAL (Shockwave) — Softened to avoid Polygon visibility */}
          <motion.div
            className="jump-shatter-layer"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0, 0.8, 0],
              scale: [0.5, 0.8, 1.8, 3.5]
            }}
            transition={{
              duration: 4.4,
              times: [0, 0.33, 0.35, 0.55],
              ease: "easeOut"
            }}
          />

          {/* Center Point Reticle (Subtle) */}
          <div className="jump-reticle" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
