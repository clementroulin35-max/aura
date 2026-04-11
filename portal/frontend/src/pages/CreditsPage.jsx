import chassisImg from "../assets/decors/l1_contactus.jpg";
import "./CreditsPage.css";

export default function CreditsPage() {
  return (
    <div className="credits-page">
      {/* L1 — Cockpit Chassis */}
      <img src={chassisImg} alt="" className="dashboard-chassis" aria-hidden="true" />
      
      {/* Content Overlay */}
      <div className="credits-overlay">
        <div className="credits-content">
          <h1 className="credits-title">ATLANTIS NEXUS</h1>
          <p className="credits-subtitle">Sovereign OS V3.6 — Protocol Orion</p>
          
          <div className="credits-grid">
            <div className="credit-section">
              <h3>ARCHITECTURE</h3>
              <p>GSS Orion Core — LangGraph</p>
              <p>Adaptive Intelligence Layer</p>
            </div>
            <div className="credit-section">
              <h3>INTERFACE</h3>
              <p>Diegetic UX Prototype</p>
              <p>Glassmorphism HUD v2.0</p>
            </div>
            <div className="credit-section">
              <h3>MAINFRAME</h3>
              <p>Windows Hyper-V Service</p>
              <p>Neural Path Synchronizer</p>
            </div>
          </div>
          
          <div className="credits-footer">
            <p>© 2026 Gravity Systems — All neural rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
