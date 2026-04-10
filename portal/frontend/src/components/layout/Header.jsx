import './Header.css';
import { VIEWS } from '../../lib/constants.js';

export default function Header({ currentView, onNavigate }) {
  const navItems = [
    { id: VIEWS.DASHBOARD,  label: 'Dashboard'   },
    { id: VIEWS.SUPERVISOR, label: 'Superviseur'  },
    { id: VIEWS.MEMORY,     label: 'Mémoire'      },
  ];

  return (
    <header className="nexus-header">
      {/* Brand */}
      <div className="nexus-brand">
        <span className="brand-name">Atlantis Nexus</span>
        <span className="brand-version">V3.6</span>
      </div>

      {/* Navigation */}
      <nav className="nexus-nav">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            className={`nav-btn${currentView === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* System Status */}
      <div className="nexus-status">
        <span className="status-dot" />
        <span>OPERATIONAL</span>
      </div>
    </header>
  );
}
