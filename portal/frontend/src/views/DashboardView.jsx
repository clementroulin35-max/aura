import HologramTerminal from "./HologramTerminal/HologramTerminal";
import "./DashboardView.css";

/* DashboardView — L3 HUD layer for Dashboard page */
// - isChatOpen: toggled by PropOrion
// - onToggleChat: close callback
export default function DashboardView({ isChatOpen, onToggleChat }) {
  return (
    <div className="view-dashboard">
      {isChatOpen && (
        <div className="dashboard-terminal-wrapper">
          <HologramTerminal onClose={onToggleChat} />
        </div>
      )}
    </div>
  );
}
