import './Header.css';
import { VIEWS } from '../../lib/constants.js';

export default function Header({ currentView, onNavigate, onToggleHUD, status = 'OFFLINE', ui, hasActiveDocument, hideHudControls }) {
  return (
    <header className="nexus-header">
      {/* Brand */}
      <div className="nexus-brand" onClick={() => onNavigate(VIEWS.DASHBOARD)} style={{ cursor: 'pointer' }}>
        <span className="brand-atlantis">Atlantis</span>
        <span className="brand-nexus">NEXUS</span>
        <span className="brand-version">V3.6</span>
      </div>

      {/* Simplified Navigation */}
      <nav className="nexus-nav">
        <button
          className={`nav-btn${currentView === VIEWS.PROJECTS ? ' active' : ''}`}
          onClick={() => onNavigate(VIEWS.PROJECTS)}
        >
          Mission Control
        </button>
        <button
          className={`nav-btn${currentView === VIEWS.DASHBOARD ? ' active' : ''}`}
          onClick={() => onNavigate(VIEWS.DASHBOARD)}
        >
          Workstation
        </button>
      </nav>

      {/* Neural Sync Status & Launchpad Controls */}
      {!hideHudControls && (
        <div className="nexus-controls-group">
          {/* Neural Sync Status */}
          <div className="nexus-status">
            <div className={`status-indicator ${(status || 'OFFLINE').toLowerCase()}`}>
              <span className="status-dot" />
              <span className="status-label">{status || 'OFFLINE'}</span>
            </div>
          </div>

          {/* Global Apps Launch — All HUD Triggers Always Visible */}
          <div className="nexus-apps-launch">
            {hasActiveDocument && (
              <button
                className={`app-btn active-doc-btn ${ui?.archivesOpen ? 'active' : ''}`}
                onClick={() => onToggleHUD("archivesOpen")}
                title="Rapport Actif"
              >
                <div className="btn-pulse" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
            )}
            <button
              className={`app-btn ${ui?.chatOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("chatOpen")}
              title="Terminal Orion"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36015 14.8911 4 16.1272L3 21L7.8728 20C9.10892 20.6399 10.5124 21 12 21Z" />
                <path d="M8 12H16M8 9H13M8 15H11" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={`app-btn ${ui?.hubOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("hubOpen")}
              title="Agents Hub"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                <circle cx="9" cy="10" r="3"></circle>
                <line x1="15" y1="9" x2="19" y2="9"></line>
                <line x1="15" y1="13" x2="19" y2="13"></line>
                <path d="M5 18c0-2 2-4 4-4h0c2 0 4 2 4 4"></path>
              </svg>
            </button>
            <button
              className={`app-btn ${ui?.missionDraftOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("missionDraftOpen")}
              title="Mission Forge"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 14V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V14" />
                <path d="M12 21V11" />
                <path d="M7 11L12 3L17 11" />
                <path d="M10 11H14" />
              </svg>
            </button>
            <button
              className={`app-btn ${ui?.projectTeamsOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("projectTeamsOpen")}
              title="Équipes & Projets"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2522 22.1614 16.5523C21.6184 15.8524 20.8581 15.3516 20 15.13" />
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11903 19.0078 7.01C19.0078 7.90097 18.7122 8.76608 18.1676 9.46768C17.623 10.1693 16.8604 10.6697 16 10.89" />
              </svg>
            </button>

            <button
              className={`app-btn ${ui?.docsOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("docsOpen")}
              title="Documents"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
                <path d="M14 2V8H20" />
                <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
              </svg>
            </button>

            <button
              className={`app-btn ${ui?.monitorOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("monitorOpen")}
              title="Monitoring"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12H18L15 21L9 3L6 12H2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className={`app-btn settings-gear-btn ${ui?.settingsOpen ? 'active' : ''}`}
              onClick={() => onToggleHUD("settingsOpen")}
              title="Neural Sync Config"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
