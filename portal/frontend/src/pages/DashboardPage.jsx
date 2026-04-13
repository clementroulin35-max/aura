import "./DashboardPage.css";
import chassisImg from "../assets/decors/l1_dashboard.jpg";
import OrionCompanion from "../components/props/OrionCompanion";
import BrainJar from "../components/props/BrainJar";
export default function DashboardPage({ ui, onPropClick, orion }) {
  return (
    <>
      {/* L1 — Cockpit Chassis (chroma green windows -> transparent) */}
      <img src={chassisImg} alt="" className="l1-chassis" aria-hidden="true" />

      {/* L2 — Diegetic Props */}
      <div className="l2-props-layer">
        <OrionCompanion
          onClick={() => onPropClick("chat")}
          isActive={ui.chatOpen}
          ui={ui}
          orion={orion}
        />
        <BrainJar 
          onClick={() => orion.handleManualClick("vega")}
          orion={orion}
        />
      </div>

      {/* 
          L3 — HUD Overlays are managed globally in App.jsx 
          to allow persistence across page transitions.
      */}
    </>
  );
}
