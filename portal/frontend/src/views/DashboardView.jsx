import "./DashboardView.css";

/* DashboardView — L3 HUD layer for Dashboard page */
// - isChatOpen: toggled by PropOrion
// - onToggleChat: close callback
export default function DashboardView({ isChatOpen, onToggleChat }) {
  return (
    <div className="view-dashboard">
       {/* 
           HologramTerminal was moved to App.jsx global HUD layer 
           to persist position and content between page switches.
       */}
    </div>
  );
}
