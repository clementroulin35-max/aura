import { motion, AnimatePresence } from 'framer-motion';
import './SystemPanel.css';

export default function SystemPanel({ pulse, telemetry, mission }) {
  const pulseClass = pulse === 'NOMINAL' ? 'nominal' : pulse === 'WARNING' ? 'warning' : 'error';

  return (
    <div className="system-panel" id="system-panel">
      {/* Pulse Ring */}
      <div className="section-panel glass-panel pulse-card">
        <div className="section-title">System Pulse</div>
        <div className={`pulse-ring ${pulseClass}`}>
          <span className={`pulse-ring-label ${pulseClass}`}>{pulse || '...'}</span>
        </div>
        {mission?.teams_visited?.length > 0 && (
          <div className="teams-flow">
            {mission.teams_visited.map((t, i) => (
              <motion.span
                key={`${t}-${i}`}
                className="team-chip"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {t}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Telemetry */}
      <div className="section-panel glass-panel">
        <div className="section-title">Telemetry</div>
        <div className="metric-row">
          <span className="metric-label">Tokens</span>
          <span className="metric-value highlight">{telemetry?.tokens?.total ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Uptime</span>
          <span className="metric-value">{telemetry?.uptime_seconds ? `${Math.round(telemetry.uptime_seconds)}s` : '--'}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Local</span>
          <span className="metric-value">{telemetry?.intelligence?.local ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Remote</span>
          <span className="metric-value">{telemetry?.intelligence?.remote ?? 0}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Simulation</span>
          <span className="metric-value">{telemetry?.intelligence?.simulation ?? 0}</span>
        </div>
      </div>

      {/* Mission Results */}
      <AnimatePresence>
        {mission?.results?.length > 0 && (
          <motion.div
            className="section-panel glass-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="section-title">Mission Results</div>
            {mission.results.map((r, i) => (
              <div className="result-card" key={i}>
                <div className="result-card-header">
                  <span className="result-card-team">{r.team}</span>
                  <span className={`status-badge ${r.verdict?.includes('PASS') || r.verdict?.includes('CLEAN') ? 'nominal' : 'warning'}`}>
                    {r.verdict?.slice(0, 30)}
                  </span>
                </div>
                {r.critique && <p className="result-card-verdict">{r.critique.slice(0, 200)}</p>}
                {r.analysis && <p className="result-card-verdict">{r.analysis.slice(0, 200)}</p>}
                {r.guidance && <p className="result-card-verdict">{r.guidance.slice(0, 200)}</p>}
              </div>
            ))}

            {/* Progress Bar */}
            {mission.iterations > 0 && (
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, (mission.iterations / 5) * 100)}%` }} />
                </div>
                <div className="progress-label">
                  <span>{mission.iterations} iterations</span>
                  <span>{mission.status}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
