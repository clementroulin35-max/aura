import { useState, useEffect } from 'react';
import './Header.css';

export default function Header({ pulse, version }) {
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

  const pulseClass = pulse === 'NOMINAL' ? 'nominal' : pulse === 'WARNING' ? 'warning' : 'error';

  return (
    <header className="header" id="header">
      <div className="header-brand">
        <span className="header-logo">GSS ORION</span>
        <span className="header-version">{version || 'v3.0.0'}</span>
      </div>
      <nav className="header-nav">
        <div className="header-pulse">
          <span className={`pulse-dot ${pulseClass}`} />
          <span style={{ color: `var(--${pulseClass === 'nominal' ? 'green-ok' : pulseClass === 'warning' ? 'amber-warn' : 'red-alert'})` }}>
            {pulse || 'SYNCING'}
          </span>
        </div>
        <time className="header-time">{time}</time>
      </nav>
    </header>
  );
}
