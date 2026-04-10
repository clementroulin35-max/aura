import chassisImg from "../assets/decor/l1_memory.jpg";
import MemoryView from "../views/MemoryView";

export default function MemoryPage() {
  return (
    <>
      <img src={chassisImg} alt="" className="dashboard-chassis" aria-hidden="true" />
      <div className="l3-hud-layer">
        <MemoryView />
      </div>
    </>
  );
}
