import chassisImg from "../assets/decor/l1_supervisor.jpg";
import SupervisorView from "../views/SupervisorView";

export default function SupervisorPage({ ui, onPropClick, onExecute }) {
  return (
    <>
      <img src={chassisImg} alt="" className="dashboard-chassis" aria-hidden="true" />
      <div className="l3-hud-layer">
        <SupervisorView />
      </div>
    </>
  );
}
