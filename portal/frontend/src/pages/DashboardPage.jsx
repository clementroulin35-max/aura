import "./DashboardPage.css";
import chassisImg from "../assets/decor/l1_dashboard.jpg";
import PropOrion from "../components/props/PropOrion";
import ChatPanel from "../components/hud/ChatPanel";
import DashboardView from "../views/DashboardView";

export default function DashboardPage({ ui, onPropClick, onExecute }) {
  return (
    <>
      {/* L1 — Cockpit Chassis (chroma green windows -> transparent) */}
      <img src={chassisImg} alt="" className="dashboard-chassis" aria-hidden="true" />

      {/* L2 — Diegetic Props */}
      <div className="l2-props-layer">
        <PropOrion onClick={() => onPropClick("chat")} isActive={ui.chatOpen} />
      </div>

      {/* L3 — HUD Overlays */}
      <div className="l3-hud-layer">
        <DashboardView />
        {ui.chatOpen && <ChatPanel onClose={() => onPropClick("chat")} />}
      </div>
    </>
  );
}
