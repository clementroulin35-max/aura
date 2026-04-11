import './styles/index.css';
import './styles/App.css';
import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { VIEWS } from './lib/constants.js';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SupervisorPage from './pages/SupervisorPage.jsx';
import MemoryPage from './pages/MemoryPage.jsx';
import HyperspaceJump from './components/shared/HyperspaceJump.jsx';
import HologramTerminal from './components/hud/HologramTerminal.jsx';
import LLMConfigWindow from './components/hud/LLMConfigWindow.jsx';

// Discover all background images dynamically
const bgModules = import.meta.glob('./assets/backgrounds/*.{jpg,png,jpeg,webp}', { eager: true });
const BACKGROUNDS = Object.values(bgModules).map(m => m.default);

function ChromaFilters() {
  return (
    <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="chroma-key-green" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            1  0  0  0  0
            0  1  0  0  0
            0  0  1  0  0
           -1  2 -1  0  0" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="out" />
        </filter>
        <filter id="chroma-key-blue" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            1  0  0  0  0
            0  1  0  0  0
            0  0  1  0  0
           -1 -1  2  0  0" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="out" />
        </filter>
      </defs>
    </svg>
  );
}

const PAGES = {
  [VIEWS.DASHBOARD]: DashboardPage,
  [VIEWS.SUPERVISOR]: SupervisorPage,
  [VIEWS.MEMORY]: MemoryPage,
};

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [ui, setUi] = useState({ chatOpen: false, settingsOpen: false, executing: false });

  const xTerminal = useMotionValue(50);
  const yTerminal = useMotionValue(100);
  const xSettings = useMotionValue(window.innerWidth - 850);
  const ySettings = useMotionValue(100);

  // Hyperspace Jump State Management
  const [bgIndex, setBgIndex] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPhase, setJumpPhase] = useState('idle'); // idle | departure | arrival

  const handlePropClick = (panel) => {
    setUi(prev => ({
      ...prev,
      chatOpen: panel === 'chat' ? !prev.chatOpen : prev.chatOpen,
      settingsOpen: panel === 'settings' ? !prev.settingsOpen : prev.settingsOpen,
    }));
  };

  const handleExecute = async () => {
    setUi(prev => ({ ...prev, executing: true }));
    try {
      await fetch('/api/graph/run', { method: 'POST' });
    } catch (e) {
      console.error('Execute failed:', e);
    } finally {
      setTimeout(() => setUi(prev => ({ ...prev, executing: false })), 2000);
    }
  };

  /**
   * Cinematic Jump Trigger
   * Coordinates the L0 animations (in App.css) with precisely timed state swaps.
   */
  const initiateJump = (index) => {
    if (index === bgIndex || isJumping) return;

    setIsJumping(true);
    setJumpPhase('departure');

    // 1. Departure peak: Switch the background source under the tunnel/flash
    setTimeout(() => {
      setBgIndex(index);
      setJumpPhase('arrival');
    }, 800);

    // 2. Cleanup: End jump sequence
    setTimeout(() => {
      setIsJumping(false);
      setJumpPhase('idle');
    }, 2000);
  };

  const PageComponent = PAGES[view] || DashboardPage;
  const currentBgSrc = BACKGROUNDS[bgIndex];

  return (
    <div className={`app-shell state-${jumpPhase} ${isJumping ? 'is-jumping' : ''}`}>
      <ChromaFilters />

      {/* L0 — THE VISTA (Main background layer) */}
      <div
        className={`l0-vista phase-${jumpPhase}`}
        style={{ backgroundImage: `url(${currentBgSrc})` }}
        aria-hidden="true"
      />

      {/* THE CINEMATIC JUMP OVERLAY (Framer Motion) - Nested between L0 and L1 */}
      <HyperspaceJump isJumping={isJumping} />

      <Header
        currentView={view}
        onNavigate={setView}
        onSettingsClick={() => handlePropClick("settings")}
      />

      {/* GLOBAL HUD LAYER — Windows persist state across views */}
      <div
        className="l3-hud-layer global-hud"
        style={{ top: '0', height: '100vh', pointerEvents: 'none' }}
      >
        {/* Terminal: Only shown on Dashboard when toggled */}
        <div style={{ display: (view === VIEWS.DASHBOARD && ui.chatOpen) ? 'block' : 'none' }}>
          <HologramTerminal
            onClose={() => handlePropClick("chat")}
            x={xTerminal}
            y={yTerminal}
            dragConstraints={{ top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight }}
          />
        </div>

        {/* Settings: Only shown on Dashboard when toggled */}
        <div style={{ display: (view === VIEWS.DASHBOARD && ui.settingsOpen) ? 'block' : 'none' }}>
          <LLMConfigWindow
            onClose={() => handlePropClick("settings")}
            x={xSettings}
            y={ySettings}
            dragConstraints={{ top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight }}
          />
        </div>
      </div>

      <PageComponent
        ui={ui}
        onPropClick={handlePropClick}
        onExecute={handleExecute}
      />

      <Footer
        backgrounds={BACKGROUNDS}
        activeIndex={bgIndex}
        onSelect={initiateJump}
        isJumping={isJumping}
      />
    </div>
  );
}
