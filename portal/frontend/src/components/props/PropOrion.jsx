import './props.css';
import orionImg from '../../assets/props/l2_orion.jpg';

export default function PropOrion({ onClick, isActive }) {
  return (
    <div
      className={`prop-wrap prop-orion${isActive ? ' active' : ''}`}
      onClick={onClick}
      title="Orion — Ouvrir le terminal"
      role="button"
      aria-label="Orion chat terminal"
    >
      <img src={orionImg} alt="Orion" className="prop-img" />
    </div>
  );
}
