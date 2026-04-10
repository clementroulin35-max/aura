import { motion, AnimatePresence } from 'framer-motion';
import './SystemPanel.css';

const TEAM_AGENTS = {
  INTEGRITY: ['governance', 'core'],
  QUALITY: ['critik', 'corrector', 'qualifier'],
  STRATEGY: ['captain', 'task', 'brainstorming'],
  DEV: ['backend_dev'],
  MAINTENANCE: ['tester'],
};

export default function SystemPanel({ pulse, telemetry, activeTeams, lastResult, events }) {
  const pulseClass = pulse === 'NOMINAL' ? 'nominal'
    : pulse === 'EXECUTING' ? 'executing'
    : pulse === 'WARNING' ? 'warning' : 'error';

  const allTeams = ['INTEGRITY', 'QUALITY', 'STRATEGY', 'DEV', 'MAINTENANCE'];
  const visited = new Set(activeTeams || []);

  return (
    <div className="system-panel" id="system-panel">
      {/* Pulse */}
      <div className="section-panel glass-panel pulse-card">
        <div className="section-title">Supervisor</div>
        <div className={`pulse-ring ${pulseClass}`}>
          <span className={`pulse-ring-label ${pulseClass}`}>{pulse || '...'}</span>
        </div>
      </div>

      {/* Teams Pipeline */}
      <div className="section-panel glass-panel">
        <div className="section-title">Teams Pipeline</div>
        <div className="teams-pipeline">
          {allTeams.map((team) => {
            const isDone = visited.has(team);
            const isActive = activeTeams?.length > 0 && activeTeams[activeTeams.length - 1] === team;
            return (
              <div className={`team-row ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`} key={team}>
                <span className="team-indicator">
                  {isActive ? '◉' : isDone ? '●' : '○'}
                </span>
                <span className="team-name">{team}</span>
                <div className="team-agents">
                  {(TEAM_AGENTS[team] || []).map((a) => (
                    <span className="agent-chip" key={a}>{a}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry */}
      <div className="section-panel glass-panel">
        <div className="section-title">Telemetry</div>
        <div className="metric-row">
          <span className="metric-label">Tokens</span>
          <span className="metric-value highlight">{telemetry?.tokens?.total ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Local</span>
          <span className="metric-value">{telemetry?.intelligence?.local ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Simulation</span>
          <span className="metric-value">{telemetry?.intelligence?.simulation ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Uptime</span>
          <span className="metric-value">{telemetry?.uptime_seconds ? `${Math.round(telemetry.uptime_seconds)}s` : '--'}</span>
        </div>
      </div>

      {/* Event Log (compact) */}
      <div className="section-panel glass-panel events-panel">
        <div className="section-title">Event Bus</div>
        <div className="events-body">
          {(events || []).slice(-8).map((ev, i) => (
            <div className="event-line" key={i}>
              <span className="event-actor">{ev.actor}</span>
              <span className="event-msg">{ev.event?.slice(0, 40)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
