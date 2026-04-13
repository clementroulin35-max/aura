import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './DashboardPage.css'; // Reusing general styles
import { API_BASE, VIEWS } from '../lib/constants.js';

export default function ProjectLandingPage({ projects, onProjectsUpdate, onNavigate, setBgIndex, setForceScroll }) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleCreateProject = async () => {
    if (!newProjectName) return;
    setIsUploading(true);

    let imageUrl = '/backgrounds/l0_vista.jpg'; // default
    if (fileInputRef.current && fileInputRef.current.files[0]) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API_BASE}/v1/resources/upload-bg`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          imageUrl = data.url;
        }
      } catch (e) {
        console.error("Upload fail", e);
      }
    }

    const newPrj = {
      id: `PRJ-${newProjectName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(Math.random() * 100)}`,
      name: newProjectName,
      description: newProjectDescription || "Nouveau projet d'exploration.",
      image: imageUrl,
      teams: []
    };

    const updated = [...projects, newPrj];
    await onProjectsUpdate(updated);
    setNewProjectName("");
    setNewProjectDescription("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);

    // Bascule auto sur le dashboard et applique le nouveau bg (dernier index)
    if (setBgIndex && onNavigate) {
      setBgIndex(updated.length - 1);
      if (setForceScroll) setForceScroll(prev => prev + 1);
      onNavigate(VIEWS.DASHBOARD);
    }
  };

  const handleUpdateProjectImage = async (projectId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create optimistic loading
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/v1/resources/upload-bg`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const updated = projects.map(p => {
          if (p.id === projectId) return { ...p, image: data.url };
          return p;
        });
        await onProjectsUpdate(updated);
      }
    } catch (err) {
      console.error("Upload fail project bg", err);
    }
  };

  return (
    <div className="main-scroll-container">
      <div className="dashboard-content" style={{ padding: '0 80px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '200px' }}>

        {/* SECTION 1 : CREATE PROJECT */}
        <div 
          className="creation-hero-section" 
          style={{ 
            minHeight: '85vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingTop: '80px', 
            paddingBottom: '40px'
          }}
        >
          <div 
            className="section-panel"
            style={{ 
              background: 'rgba(0,0,0,0.6)', padding: '40px', borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              maxWidth: '500px', margin: '0 auto', width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          >
            <h2 style={{ color: 'var(--text-neon)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', textAlign: 'center', fontSize: '18px' }}>INITIALISER UNE NOUVELLE MISSION</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '100%' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>NOM DU PROJET</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Epopée Spatiale..."
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 15px', color: '#fff', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DESCRIPTION (Optionnelle)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Briefing scénario ou objectifs..."
                  rows={3}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 15px', color: '#fff', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DESTINATION (IMAGE DE FOND)</label>
                <div 
                style={{ 
                  position: 'relative', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(0, 255, 128, 0.4)', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 15px', color: '#fff', fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => fileInputRef.current.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#333333';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.stroke = '#333333';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#333333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#fff';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.stroke = 'var(--neon-secondary)';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = fileName ? '#fff' : 'var(--text-dim)';
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--neon-secondary)" strokeWidth="2" style={{ transition: 'all 0.3s' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span style={{ color: fileName ? '#fff' : 'var(--text-dim)', textAlign: 'right', flex: 1, paddingLeft: '10px', transition: 'all 0.3s' }}>
                  {fileName || "SÉLECTIONNER UN FICHIER"}
                </span>
              </div>
               <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => setFileName(e.target.files[0]?.name || "")}
                />
              </div>

              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '6px', marginTop: '15px' }}>
                <motion.button
                  whileHover={(!newProjectName || isUploading) ? {} : { scale: 1.05, boxShadow: '0 0 35px rgba(0, 255, 128, 0.9)' }}
                  whileTap={(!newProjectName || isUploading) ? {} : { scale: 0.95 }}
                  onClick={handleCreateProject}
                  disabled={!newProjectName || isUploading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #00ff80 0%, #00cc66 100%)', 
                    border: 'none', color: '#000',
                    padding: '18px', fontSize: '16px', fontWeight: '900', letterSpacing: '4px', cursor: (!newProjectName || isUploading) ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase', borderRadius: '6px', transition: 'all 0.3s', 
                    opacity: (!newProjectName || isUploading) ? 0.3 : 1,
                    boxShadow: '0 4px 15px rgba(0, 255, 128, 0.3)',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    position: 'relative', zIndex: 1, 
                    fontFamily: 'var(--font-ui)', fontWeight: '400',
                    textShadow: 'var(--pixel-shadow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' 
                  }}>
                    {isUploading ? 'SYNCHRONISATION...' : (
                      <>
                        <span>🚀</span>
                        <span>ENGAGER LA MISSION</span>
                        <span>🚀</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 : EXISTING PROJECTS */}
        <div style={{ paddingBottom: '20px' }}>
          <h2 style={{ color: 'var(--slate-light)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontSize: '14px' }}>PROJETS ACTIFS ({projects.length})</h2>
          <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>

            {projects.map((p, idx) => (
              <div key={p.id} style={{
                position: 'relative', height: '150px', borderRadius: '8px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: `url(${p.image || '/backgrounds/l0_vista.jpg'})`,
                  backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.5)'
                }}></div>

                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <div style={{ fontSize: '10px', color: 'var(--neon-yellow)' }}>{p.id}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.name}</div>
                </div>

                <div
                  className="hover-actions"
                  onClick={() => document.getElementById(`upload-${p.id}`).click()}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s', flexDirection: 'column', gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Éditer l'image</div>
                  <input
                    id={`upload-${p.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpdateProjectImage(p.id, e)}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
