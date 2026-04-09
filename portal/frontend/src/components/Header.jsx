import { useState, useEffect } from 'react';
import './Header.css';

export default function Header({ pulse, version, provider, chatModel, supervisorModel, onSettingsClick, settingsOpen }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pulseClass = pulse === 'NOMINAL' ? 'nominal'
    : pulse === 'EXECUTING' ? 'executing'
    : pulse === 'WARNING' ? 'warning' : 'error';

  return (
    <header className="header" id="header">
      {/* ── Brand ── */}
      <div className="header-brand">
        <span className="header-logo">
          <span className="logo-atlantis">ATLANTIS</span>
          <span className="logo-nexus">NEXUS</span>
        </span>
      </div>

      {/* ── Center: Model info ── */}
      <div className="header-center">
        <span className={`model-dot ${provider !== 'none' ? 'online' : 'offline'}`} />
        <span className="model-info">
          <span className="model-role">chat</span> {chatModel || '—'}
        </span>
        <span className="model-separator">·</span>
        <span className="model-info">
          <span className="model-role">graph</span> {supervisorModel || '—'}
        </span>
        <button
          className={`header-settings-btn ${settingsOpen ? 'active' : ''}`}
          onClick={onSettingsClick}
          title="LLM Settings"
        >
          ⚙
        </button>
        <div className="header-pulse">
          <span className={`pulse-dot ${pulseClass}`} />
          <span className={`pulse-label pulse-${pulseClass}`}>
            {pulse || 'SYNCING'}
          </span>
        </div>
      </div>

      {/* ── Right: Nav ── */}
      <nav className="header-nav">
        <button className="nav-btn active">DASHBOARD</button>
        <button className="nav-btn">SUPERVISEUR</button>
        <button className="nav-btn">MÉMOIRE</button>
        <button className="nav-btn nav-exit">EXIT</button>
      </nav>
    </header>
  );
}
