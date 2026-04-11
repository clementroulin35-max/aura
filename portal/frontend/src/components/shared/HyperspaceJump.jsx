import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./HyperspaceJump.css";
import streaksImg from "../../assets/streaks.png";

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
          {/* 1. TUNNEL: Streaks + Radial Gradient */}
          <motion.div
            className="jump-tunnel-container"
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{
              opacity: [0, 1, 1, 0.5, 0], // Added fade-out
              scale: 1.5
            }}
            transition={{ duration: 1.5, delay: 0.75, times: [0, 0.75] }}
          >
            <div className="jump-radial-glow" />
            <motion.div
              className="jump-streaks"
              style={{ backgroundImage: `url(${streaksImg})` }}
              animate={{ scale: [1, 2.5], opacity: [0, 1, 0.6] }}
              transition={{ duration: 0.4, repeat: 3, ease: "linear" }}
            />
          </motion.div>

          {/* 2. FLASH: Central blinding light */}
          <motion.div
            className="jump-flash"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 5, 15],
              opacity: [0, 0.7, 0.7, 0] // Flash must disappear
            }}
            transition={{
              duration: 1.5,
              delay: 0.2,
              times: [0, 0.6, 0.8, 1],
              ease: "easeIn"
            }}
          />

          {/* 3. SHATTER REVEAL: Only on the white flash layer */}
          <motion.div
            className="jump-shatter-layer"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0], // Appears during flash, then shatters
              scale: [1, 1, 1.8],
              filter: ["blur(0px)", "blur(0px)", "blur(20px)"]
            }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              times: [0, 0.1, 0.4, 0.6],
              ease: "easeOut"
            }}
          />

          {/* Fixed center point */}
          <div className="jump-reticle" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
