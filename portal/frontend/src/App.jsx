import './styles/index.css';
import './styles/App.css';
import { useState } from 'react';
import { VIEWS } from './lib/constants.js';
import Header from './components/layout/Header.jsx';
import DashboardPage  from './pages/DashboardPage.jsx';
import SupervisorPage from './pages/SupervisorPage.jsx';
import MemoryPage     from './pages/MemoryPage.jsx';
import vistaImg from './assets/backgrounds/l0_vista.jpg';

// SVG Chroma-Key filters (injected once)
function ChromaFilters() {
  return (
    <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Green chroma key — removes #00ff00 from L1 chassis windows */}
        <filter id="chroma-key-green" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            1  0  0  0  0
            0  1  0  0  0
            0  0  1  0  0
           -1  2 -1  0  0" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="out" />
        </filter>
        {/* Blue chroma key — removes #0000ff from L2 prop backgrounds */}
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
  [VIEWS.DASHBOARD]:  DashboardPage,
  [VIEWS.SUPERVISOR]: SupervisorPage,
  [VIEWS.MEMORY]:     MemoryPage,
};

export default function App() {
  const [view, setView]     = useState(VIEWS.DASHBOARD);
  const [ui, setUi]         = useState({ chatOpen: false, settingsOpen: false, executing: false });

  function handlePropClick(panel) {
    setUi(prev => ({
      ...prev,
      chatOpen:     panel === 'chat'     ? !prev.chatOpen     : false,
      settingsOpen: panel === 'settings' ? !prev.settingsOpen : false,
    }));
  }

  async function handleExecute() {
    setUi(prev => ({ ...prev, executing: true }));
    try {
      await fetch('/api/graph/run', { method: 'POST' });
    } catch (e) {
      console.error('Execute failed:', e);
    } finally {
      setTimeout(() => setUi(prev => ({ ...prev, executing: false })), 2000);
    }
  }

  const PageComponent = PAGES[view] || DashboardPage;

  return (
    <div className="app-shell">
      {/* SVG filter definitions */}
      <ChromaFilters />

      {/* L0 — THE VISTA (fixed ocean background) */}
      <div
        className="l0-vista"
        style={{ backgroundImage: `url(${vistaImg})` }}
        aria-hidden="true"
      />

      {/* Persistent Header (z-index above all layers) */}
      <Header currentView={view} onNavigate={setView} />

      {/* Active Page (L1 chassis + L2 props + L3 HUD) */}
      <PageComponent
        ui={ui}
        onPropClick={handlePropClick}
        onExecute={handleExecute}
      />
    </div>
  );
}
