import './Footer.css';

export default function Footer({ backgrounds, activeIndex, onSelect, isJumping }) {
  return (
    <footer className="nexus-footer">
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
        <div className="footer-status">
            COORD_LOCK: {activeIndex.toString().padStart(2, '0')}
        </div>
      </div>
    </footer>
  );
}
