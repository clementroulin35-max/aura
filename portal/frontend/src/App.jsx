import './styles/index.css';
import './styles/App.css';
import { useState, useEffect } from 'react';
import { useMotionValue } from 'framer-motion';
import { VIEWS } from './lib/constants.js';
import Header from './components/layouts/Header.jsx';
import Footer from './components/layouts/Footer.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreditsPage from './pages/CreditsPage.jsx';
import HyperspaceJump from './components/effects/HyperspaceJump.jsx';

// HUD Components
import HologramTerminal from './components/hud/HologramTerminal.jsx';
import LLMConfigWindow from './components/hud/LLMConfigWindow.jsx';
import TeamsWindow from './components/hud/TeamsWindow.jsx';
import MonitoringWindow from './components/hud/MonitoringWindow.jsx';
import MemoryDocsWindow from './components/hud/MemoryDocsWindow.jsx';
import MemoryRapportHUD from './components/hud/MemoryRapportHUD.jsx';

import { useSystemStatus } from './hooks/useSystemStatus.js';

// Discover all background images dynamically
const bgModules = import.meta.glob('./assets/backgrounds/*.{jpg,png,jpeg,webp}', { eager: true });
const BACKGROUNDS = Object.values(bgModules).map(m => m.default);

function ChromaFilters() {
  return (
    <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="chroma-key-green" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1  0  0  0  0
            0  1  0  0  0
            0  0  1  0  0
           -1  2 -1  0  0" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="out" />
        </filter>
        <filter id="chroma-key-blue" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            -1.2 -1.2 2.4 0 -0.1" result="mask" />
          <feComponentTransfer in="mask" result="better-mask">
            <feFuncA type="linear" slope="12" intercept="-6" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="better-mask" operator="out" />
        </filter>
      </defs>
    </svg>
  );
}

const PAGES = {
  [VIEWS.DASHBOARD]: DashboardPage,
  [VIEWS.INFO]: CreditsPage,
};

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [logHistory, setLogHistory] = useState([]);
  
  // HUD State — Windows are manually opened
  const [ui, setUi] = useState({
    chatOpen: false,
    settingsOpen: false,
    teamsOpen: false,
    monitorOpen: false,
    docsOpen: false,
    archivesOpen: false,
    executing: false,
    orionMuted: false
  });

  // Window Positions (Persistent across views)
  const xTerminal = useMotionValue(35);
  const yTerminal = useMotionValue(100);
  const xSettings = useMotionValue(window.innerWidth - 1055);
  const ySettings = useMotionValue(100);
  const xTeams = useMotionValue(100);
  const yTeams = useMotionValue(145);
  const xMonitor = useMotionValue(window.innerWidth - 350);
  const yMonitor = useMotionValue(145);
  const xDocs = useMotionValue(200);
  const yDocs = useMotionValue(190);
  const xArchives = useMotionValue(window.innerWidth - 500);
  const yArchives = useMotionValue(190);

  const [bgIndex, setBgIndex] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPhase, setJumpPhase] = useState('idle');
  
  const { status: systemStatus, config: systemConfig, ollamaReachability, allModels } = useSystemStatus();

  const handlePropClick = (panel) => {
    setUi(prev => ({
      ...prev,
      [panel + 'Open']: !prev[panel + 'Open'],
      chatOpen: panel === 'chat' ? !prev.chatOpen : prev.chatOpen,
      settingsOpen: panel === 'settings' ? !prev.settingsOpen : prev.settingsOpen,
      orionMuted: panel === 'mute' ? !prev.orionMuted : prev.orionMuted,
    }));
  };

  // Improved Generic HUD Toggle
  const toggleHUD = (key) => {
    setUi(prev => ({ ...prev, [key]: !prev[key] }));
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

  useEffect(() => {
    const handleLog = (e) => {
      setLogHistory(prev => [...prev, {
        ...e.detail,
        time: new Date().toLocaleTimeString()
      }]);
    };
    window.addEventListener('ORION_LOG', handleLog);
    return () => window.removeEventListener('ORION_LOG', handleLog);
  }, []);

  const initiateJump = (index) => {
    if (index === bgIndex || isJumping) return;
    setIsJumping(true);
    setJumpPhase('departure');
    setTimeout(() => {
      setBgIndex(index);
      setJumpPhase('arrival');
    }, 800);
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

      <div
        className={`l0-vista phase-${jumpPhase}`}
        style={{ backgroundImage: `url(${currentBgSrc})` }}
        aria-hidden="true"
      />

      <HyperspaceJump isJumping={isJumping} />

      <Header
        currentView={view}
        onNavigate={setView}
        onSettingsClick={() => toggleHUD("settingsOpen")}
        onToggleHUD={toggleHUD} // Pass generic toggle to header
        status={systemStatus}
        ui={ui}
      />

      {/* Global Desktop HUD Layer — Reversed Order (Terminal on Top) */}
      <div className="l3-hud-layer global-hud" style={{ top: '0', height: '100vh', pointerEvents: 'none' }}>
        {/* Memory Windows (Background) */}
        {ui.archivesOpen && <MemoryRapportHUD onClose={() => toggleHUD("archivesOpen")} x={xArchives} y={yArchives} />}
        {ui.docsOpen && <MemoryDocsWindow onClose={() => toggleHUD("docsOpen")} x={xDocs} y={yDocs} />}
        
        {/* Supervisor Windows */}
        {ui.monitorOpen && <MonitoringWindow onClose={() => toggleHUD("monitorOpen")} x={xMonitor} y={yMonitor} status={systemStatus} />}
        {ui.teamsOpen && <TeamsWindow onClose={() => toggleHUD("teamsOpen")} x={xTeams} y={yTeams} />}
        
        {/* Core Windows (Foreground) */}
        {ui.settingsOpen && (
          <LLMConfigWindow 
            onClose={() => toggleHUD("settingsOpen")} 
            x={xSettings} 
            y={ySettings} 
            initialConfig={systemConfig}
            initialReachability={ollamaReachability}
            initialModels={allModels}
          />
        )}
        {ui.chatOpen && (
          <HologramTerminal 
            onClose={() => toggleHUD("chatOpen")} 
            x={xTerminal} 
            y={yTerminal} 
            initialLogs={logHistory}
          />
        )}
      </div>

      <PageComponent ui={ui} onPropClick={handlePropClick} onExecute={handleExecute} />

      <Footer
        backgrounds={BACKGROUNDS}
        activeIndex={bgIndex}
        onSelect={initiateJump}
        isJumping={isJumping}
        ui={ui}
        onMuteToggle={() => handlePropClick("mute")}
      />
    </div>
  );
}
