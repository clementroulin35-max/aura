import './Footer.css';

export default function Footer({ backgrounds, activeIndex, onSelect, isJumping, ui, onMuteToggle }) {
  return (
    <footer className="nexus-footer">
      <div className="footer-left">
        <button 
          className={`mute-toggle ${ui?.orionMuted ? 'muted' : 'active'}`}
          onClick={onMuteToggle}
          title={ui?.orionMuted ? "Démueter Orion" : "Mueter Orion"}
          aria-label="Mute orion"
        >
          <span className="mute-icon">{ui?.orionMuted ? '🔇' : '🗣️'}</span>
        </button>
      </div>

      <div className="footer-content">
        <div className="carousel-label">DESTINATION</div>
        <div className="carousel-thumbnails">
          {backgrounds.map((bg, idx) => (
            <button
              key={idx}
              className={`thumb-bubble ${idx === activeIndex ? 'active' : ''} ${isJumping ? 'disabled' : ''}`}
              onClick={() => onSelect(idx)}
              disabled={isJumping}
              aria-label={`Select background ${idx + 1}`}
            >
              <div 
                className="thumb-preview" 
                style={{ backgroundImage: `url(${bg})` }} 
              />
              {idx === activeIndex && <div className="thumb-ring" />}
            </button>
          ))}
        </div>
      </div>

      <div className="footer-right">
        <div className="footer-status">
            COORD_LOCK: {activeIndex.toString().padStart(2, '0')}
        </div>
      </div>
    </footer>
  );
}
