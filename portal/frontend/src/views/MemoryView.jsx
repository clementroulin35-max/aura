import "./MemoryView.css";

const ARCHIVES = [
  { id: "LG-001", title: "Mission Alpha — Build Pipeline",    date: "2026-04-09" },
  { id: "LG-002", title: "Mission Beta — Sovereignty Audit",  date: "2026-04-08" },
];
const DOCS = [
  { name: "ORION_V3_VIBE.md",    type: "DESIGN" },
  { name: "README.md",            type: "GUIDE"  },
  { name: "how_to_use.md",        type: "GUIDE"  },
  { name: "roadmap.yaml",         type: "PLAN"   },
];

export default function MemoryView() {
  return (
    <div className="memory-hud">
      <div className="glass-panel archives-panel">
        <h3 className="panel-title">Mission Archives</h3>
        <ul className="archive-list">
          {ARCHIVES.map(a => (
            <li key={a.id} className="archive-card">
              <span className="archive-id">{a.id}</span>
              <span className="archive-title">{a.title}</span>
              <span className="archive-date">{a.date}</span>
              <button className="expand-btn">EXPAND</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass-panel docs-panel">
        <h3 className="panel-title">Technical Documents</h3>
        <ul className="docs-grid">
          {DOCS.map(d => (
            <li key={d.name} className="doc-card">
              <span className="doc-icon">📄</span>
              <span className="doc-name">{d.name}</span>
              <span className="doc-type">{d.type}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
