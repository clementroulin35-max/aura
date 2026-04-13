import { useState, useEffect } from 'react';
import './Footer.css';

export default function Footer({ currentView, backgrounds, activeIndex, onSelect, isJumping, ui, onMuteToggle, activeProject, projects, forceScrollTrigger }) {
  const [startIndex, setStartIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const visibleCount = 7;
  const maxStart = Math.max(0, backgrounds.length - visibleCount);

  const handlePrev = () => setStartIndex(Math.max(0, startIndex - 1));
  const handleNext = () => setStartIndex(Math.min(maxStart, startIndex + 1));

  useEffect(() => {
    // Only auto-center if activeIndex is out of view OR if we received an explicit forceScrollTrigger
    const isOutOfView = activeIndex >= startIndex + visibleCount || activeIndex < startIndex;
    if (isOutOfView || forceScrollTrigger > 0) {
      let newStart = activeIndex - Math.floor(visibleCount / 2);
      if (newStart < 0) newStart = 0;
      if (newStart > maxStart) newStart = maxStart;
      setStartIndex(newStart);
    }
    // Note: We removed the auto-scroll on every activeIndex change to allow manual navigation
  }, [forceScrollTrigger, activeIndex, maxStart, visibleCount]);

  // Determine which project name to show in the center
  const centerProjectName = hoveredIdx !== null && projects && projects[hoveredIdx % projects.length] 
    ? projects[hoveredIdx % projects.length].name 
    : "DESTINATION";

  return (
    <footer className="nexus-footer">
      <div className="footer-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {currentView !== 'PROJECTS' && (
          <button 
            className={`mute-toggle ${ui?.orionMuted ? 'muted' : 'active'}`}
            onClick={onMuteToggle}
            title={ui?.orionMuted ? "Démueter Orion" : "Mueter Orion"}
            aria-label="Mute orion"
          >
            <span className="mute-icon">{ui?.orionMuted ? '🔇' : '🗣️'}</span>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeProject ? 'var(--neon-yellow)' : 'var(--slate-light)', boxShadow: activeProject ? '0 0 8px var(--neon-yellow)' : 'none' }}></div>
          <div className="carousel-label" style={{ margin: 0 }}>PROJET ACTIF: <span style={{color: 'var(--neon-yellow)'}}>{activeProject?.name || "NON DÉFINI"}</span></div>
        </div>
      </div>

      <div className="footer-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="carousel-label hover-label" style={{ minHeight: '15px' }}>{centerProjectName}</div>
        
        <div className="carousel-nav-wrapper">
          <button className="carousel-nav-btn" onClick={handlePrev} disabled={startIndex === 0 || isJumping}>{'<'}</button>
          
          <div className="carousel-thumbnails">
            {backgrounds.slice(startIndex, startIndex + visibleCount).map((bg, mappedIdx) => {
              const idx = startIndex + mappedIdx;
              return (
                <button
                  key={idx}
                  className={`thumb-bubble ${idx === activeIndex ? 'active' : ''} ${isJumping ? 'disabled' : ''}`}
                  onClick={() => onSelect(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  disabled={isJumping}
                  aria-label={`Select background ${idx + 1}`}
                >
                  <div 
                    className="thumb-preview" 
                    style={{ backgroundImage: `url(${bg})` }} 
                  />
                  {idx === activeIndex && <div className="thumb-ring" />}
                </button>
              );
            })}
          </div>

          <button className="carousel-nav-btn" onClick={handleNext} disabled={startIndex === maxStart || isJumping}>{'>'}</button>
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
