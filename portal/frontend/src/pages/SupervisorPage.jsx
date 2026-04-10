import chassisImg from "../assets/decor/l1_supervisor.jpg";
import PropOrion from "../components/props/PropOrion";
import ChatPanel from "../components/hud/ChatPanel";
import SupervisorView from "../views/SupervisorView";

export default function SupervisorPage({ ui, onPropClick, onExecute }) {
  return (
    <>
      <img src={chassisImg} alt="" className="dashboard-chassis" aria-hidden="true" />
      <div className="l2-props-layer">
        <PropOrion onClick={() => onPropClick("chat")} isActive={ui.chatOpen} />
      </div>
      <div className="l3-hud-layer">
        <SupervisorView />
        {ui.chatOpen && <ChatPanel onClose={() => onPropClick("chat")} />}
      </div>
    </>
  );
}
