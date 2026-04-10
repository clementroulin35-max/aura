import { useRef, useEffect } from 'react';
import './Terminal.css';

export default function Terminal({ logs }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const getActorClass = (actor) => {
    const a = (actor || '').toLowerCase();
    if (a.includes('supervisor')) return 'supervisor';
    if (a.includes('integrity')) return 'integrity';
    if (a.includes('quality')) return 'quality';
    if (a.includes('strategy')) return 'strategy';
    if (a.includes('dev')) return 'dev';
    if (a.includes('maintenance')) return 'maintenance';
    if (a.includes('compiler')) return 'compiler';
    return 'system';
  };

  const getStatusClass = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'OK' || s === 'NOMINAL' || s === 'SUCCESS') return 'ok';
    if (s === 'WARN' || s === 'WARNING') return 'warn';
    if (s === 'FAIL' || s === 'ERROR') return 'fail';
    return '';
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts.slice(11, 19);
    }
  };

  return (
    <div className="terminal glass-panel" id="terminal">
      <div className="terminal-header">
        <div className="terminal-header-left">
          <div className="terminal-dots">
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-dot" />
          </div>
          <span className="terminal-title">Mission Feed</span>
        </div>
        <span className="terminal-title" style={{ color: 'var(--text-muted)' }}>
          {logs.length} events
        </span>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {logs.length === 0 ? (
          <div className="terminal-empty">
            <span className="terminal-empty-icon">◉</span>
            <span className="terminal-empty-text">En attente de mission...</span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div className="log-line" key={i} style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className={`log-actor ${getActorClass(log.actor)}`}>{log.actor}</span>
              <span className="log-message">{log.event}{log.context ? ` — ${log.context}` : ''}</span>
              <span className={`log-status ${getStatusClass(log.status)}`}>{log.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
