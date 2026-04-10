import "./SupervisorView.css";

const PIPELINE_TEAMS = [
  { id: "integrity",   label: "INTEGRITY",   status: "done"    },
  { id: "quality",     label: "QUALITY",     status: "active"  },
  { id: "strategy",    label: "STRATEGY",    status: "pending" },
  { id: "dev",         label: "DEV",         status: "pending" },
  { id: "maintenance", label: "MAINTENANCE", status: "pending" },
];

function StatusIcon({ status }) {
  if (status === "done")   return <span className="pipeline-status done">DONE</span>;
  if (status === "active") return <span className="pipeline-status active">ACTIVE</span>;
  return <span className="pipeline-status pending">WAIT</span>;
}

export default function SupervisorView() {
  return (
    <div className="supervisor-hud">
      {/* Pulse Panel */}
      <div className="glass-panel pulse-panel">
        <h3 className="panel-title">System Pulse</h3>
        <div className="pulse-gauge">
          <div className="pulse-ring" />
          <span className="pulse-label">IDLE</span>
        </div>
      </div>

      {/* Pipeline Panel */}
      <div className="glass-panel pipeline-panel">
        <h3 className="panel-title">Teams Pipeline</h3>
        <ul className="pipeline-list">
          {PIPELINE_TEAMS.map(t => (
            <li key={t.id} className={`pipeline-item ${t.status}`}>
              <span className="pipeline-name">{t.label}</span>
              <StatusIcon status={t.status} />
            </li>
          ))}
        </ul>
      </div>

      {/* Telemetry Panel */}
      <div className="glass-panel telemetry-panel">
        <h3 className="panel-title">Telemetry</h3>
        <dl className="metric-list">
          <div className="metric-row"><dt>Tokens</dt><dd>—</dd></div>
          <div className="metric-row"><dt>Agents</dt><dd>0</dd></div>
          <div className="metric-row"><dt>Uptime</dt><dd>—</dd></div>
          <div className="metric-row"><dt>Status</dt><dd className="ok">NOMINAL</dd></div>
        </dl>
      </div>
    </div>
  );
}
