import './styles/index.css';
import './styles/App.css';
import { useState, useEffect } from 'react';
import { useMotionValue } from 'framer-motion';
import { VIEWS } from './lib/constants.js';
import Header from './components/layouts/Header.jsx';
import Footer from './components/layouts/Footer.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectLandingPage from './pages/ProjectLandingPage.jsx';
import HyperspaceJump from './components/effects/HyperspaceJump.jsx';

// HUD Components
import HologramTerminal from './components/hud/HologramTerminal.jsx';
import LLMConfigWindow from './components/hud/LLMConfigWindow.jsx';
import AgentsHubWindow from './components/hud/AgentsHubWindow.jsx';
import MissionForgeHUD from './components/hud/MissionForgeHUD.jsx';
import ProjectTeamsWindow from './components/hud/ProjectTeamsWindow.jsx';
import MonitoringWindow from './components/hud/MonitoringWindow.jsx';
import MemoryDocsWindow from './components/hud/MemoryDocsWindow.jsx';
import MemoryRapportHUD from './components/hud/MemoryRapportHUD.jsx';

import { useSystemStatus } from './hooks/useSystemStatus.js';
import { useOrionIntelligence } from './hooks/useOrionIntelligence.js';
import { useSocketEvents } from './hooks/useSocketEvents.js';

// Note: Backgrounds are now mapped reactively from the projects array instead of statically imported.

function ChromaFilters() {
  return (
    <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="chroma-key-green" colorInterpolationFilters="sRGB">
          {/* 1. Detection (Stable Matrix) */}
          <feColorMatrix in="SourceGraphic" type="matrix" values="
            0 0 0 0 0
            0 0 0 0 0
            0 0 0 0 0
            -1 2 -1 0 -0.1" result="mask" />
          
          {/* 2. Sharp Threshold -> Binary-ish Mask */}
          <feComponentTransfer in="mask" result="final-mask">
            <feFuncA type="linear" slope="30" intercept="-15" />
          </feComponentTransfer>

          {/* 3. Spill Suppression: Turn green reflections into neutral grey */}
          <feColorMatrix in="SourceGraphic" type="matrix" values="
            1 0 0 0 0
            0.3 0.4 0.3 0 0
            0 0 1 0 0
            0 0 0 1 0" result="spill-removed" />

          {/* 4. Composite: Cut the final sharpened hole out of the cleaned Source */}
          <feComposite in="spill-removed" in2="final-mask" operator="out" />
        </filter>
        <filter id="chroma-key-blue" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            -1.2 -1.2 2.4 0 -0.1" result="mask" />
          <feComponentTransfer in="mask" result="better-mask">
            <feFuncA type="linear" slope="12" intercept="-6" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="better-mask" operator="out" />
        </filter>
      </defs>
    </svg>
  );
}

const PAGES = {
  [VIEWS.DASHBOARD]: DashboardPage,
  [VIEWS.PROJECTS]: ProjectLandingPage,
};

export default function App() {
  const [view, setView] = useState(VIEWS.PROJECTS);
  const [logHistory, setLogHistory] = useState([]);
  const [missionDraft, setMissionDraft] = useState(null);
  const [sessionStartTime] = useState(Date.now());

  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: '▸ Console GSS connectée au Nexus.' },
    { role: 'system', content: '▸ Orion actif. Systèmes cockpit stables.' }
  ]);
  const [activeWindow, setActiveWindow] = useState(null);

  useSocketEvents();

  // HUD State — Windows are manually opened
  const [ui, setUi] = useState({
    chatOpen: false,
    settingsOpen: false,
    projectTeamsOpen: false,
    hubOpen: false,
    monitorOpen: false,
    docsOpen: false,
    archivesOpen: false,
    missionDraftOpen: false,
    executing: false,
    orionMuted: false
  });

  // Window Positions (Persistent across views)
  const xTerminal = useMotionValue(35);
  const yTerminal = useMotionValue(100);
  const xSettings = useMotionValue(window.innerWidth - 1045);
  const ySettings = useMotionValue(100);
  const xProjectTeams = useMotionValue(35);
  const yProjectTeams = useMotionValue(570);
  const xHub = useMotionValue(400);
  const yHub = useMotionValue(100);
  const xMonitor = useMotionValue(window.innerWidth - 1365);
  const yMonitor = useMotionValue(100);
  const xDocs = useMotionValue(835);
  const yDocs = useMotionValue(570);
  const xArchives = useMotionValue(370);
  const yArchives = useMotionValue(570);
  const xDraft = useMotionValue(window.innerWidth / 2 - 275);
  const yDraft = useMotionValue(100);

  const [bgIndex, setBgIndex] = useState(0);
  const [forceScroll, setForceScroll] = useState(0); // Counter to trigger scroll
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPhase, setJumpPhase] = useState('idle');

  const { status: systemStatus, config: systemConfig, ollamaReachability, allModels } = useSystemStatus();
  const orion = useOrionIntelligence(isJumping, ui);

  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fetch('/api/v1/resources/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects || []))
      .catch(err => console.error("Projects fetch error", err));
  }, []);

  // Load Mission for Active Project
  useEffect(() => {
    const activeProject = projects[bgIndex % projects.length];
    if (activeProject) {
      fetch(`/api/v1/resources/missions/${activeProject.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.mission) {
                setMissionDraft(data.mission);
            } else {
                setMissionDraft(null); // Reset or use defaults
            }
        })
        .catch(err => console.error("Mission load error", err));
    }
  }, [bgIndex, projects]);

  const handleUpdateProjects = async (newProjects) => {
    try {
      const res = await fetch('/api/v1/resources/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: newProjects })
      });
      if (res.ok) {
        setProjects(newProjects);
      }
    } catch (e) {
        console.error("Projects sync error", e);
    }
  };

  const activeProject = projects.length > 0 ? projects[bgIndex % projects.length] : null;

  const handleMissionDraft = (payload) => {
    setMissionDraft(payload);
    setUi(prev => ({ ...prev, missionDraftOpen: true }));
    // Ensure the Forge window is focused
    setActiveWindow("missionDraftOpen");
  };

  const handlePropClick = (panel) => {
    let key = panel + 'Open';
    let willOpen = !ui[key];
    if (panel === 'chat') { key = 'chatOpen'; willOpen = !ui.chatOpen; }
    if (panel === 'settings') { key = 'settingsOpen'; willOpen = !ui.settingsOpen; }
    
    setUi(prev => ({
      ...prev,
      [panel + 'Open']: !prev[panel + 'Open'],
      chatOpen: panel === 'chat' ? !prev.chatOpen : prev.chatOpen,
      settingsOpen: panel === 'settings' ? !prev.settingsOpen : prev.settingsOpen,
      orionMuted: panel === 'mute' ? !prev.orionMuted : prev.orionMuted,
    }));
    if (willOpen && panel !== 'mute') setActiveWindow(key);
  };

  // Improved Generic HUD Toggle
  const toggleHUD = (key) => {
    setUi(prev => ({ ...prev, [key]: !prev[key] }));
    if (!ui[key]) setActiveWindow(key);
  };

  useEffect(() => {
    const handleLog = (e) => {
      setLogHistory(prev => [...prev, {
        ...e.detail,
        time: new Date().toLocaleTimeString()
      }]);
    };

    const handleMissionComplete = async (e) => {
      const data = e.detail;
      
      // Filter out replayed events (Ghost calls fix)
      // Check data.timestamp (ISO) against sessionStartTime
      const eventTime = data.timestamp ? Date.parse(data.timestamp) : Date.now();
      if (eventTime < sessionStartTime) {
        console.log("[HUD] Ignoring old mission event:", data.event, "time:", new Date(eventTime).toLocaleTimeString());
        return;
      }

      console.log("[HUD] Mission completed event received", data);
      
      let missionResult = { status: "SUCCESS", teams_visited: [], artifacts: [] };
      try {
        if (data.context) {
          const parsed = JSON.parse(data.context);
          missionResult.teams_visited = parsed.teams_visited || [];
          missionResult.mission_id = parsed.mission_id;
        }
      } catch (err) {
        console.warn("[HUD] Could not parse mission context JSON", err);
      }

      // 1. Refresh Projects (to show new teams/agents)
      fetch('/api/v1/resources/projects')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error("Projects refresh error", err));

      // 2. Request Orion Interpretation
      try {
        const res = await fetch('/api/v1/orion/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mission_result: missionResult,
            original_objective: missionDraft?.context || "Mission non spécifiée"
          })
        });
        
        if (res.ok) {
          const result = await res.json();
          // 3. Inject Orion's summary into chat
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: result.summary,
            mood: result.mood || 'neutral',
            bubble: result.bubble,
            type: 'orion'
          }]);
        }
      } catch (err) {
        console.error("Interpretation error", err);
      } finally {
        setUi(prev => ({ ...prev, executing: false }));
      }
    };

    const handleProjectSync = () => {
      console.log("[HUD] Projects sync requested by backend");
      fetch('/api/v1/resources/projects')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error("Projects sync error", err));
    };

    window.addEventListener('ORION_LOG', handleLog);
    window.addEventListener('MISSION_COMPLETED', handleMissionComplete);
    window.addEventListener('PROJECTS_SYNC', handleProjectSync);
    return () => {
      window.removeEventListener('ORION_LOG', handleLog);
      window.removeEventListener('MISSION_COMPLETED', handleMissionComplete);
      window.removeEventListener('PROJECTS_SYNC', handleProjectSync);
    };
  }, []);

  const initiateJump = (index) => {
    if (index === bgIndex || isJumping) return;
    
    // Bypass jump cinematic completely on Project Landing Page
    if (view === VIEWS.PROJECTS) {
      setBgIndex(index);
      setForceScroll(prev => prev + 1);
      return;
    }

    setIsJumping(true);
    
    // Phase 0: Anticipation (0s - 0.3s)
    setJumpPhase('anticipation');

    // Phase 1: Departure/Tension (0.3s - 1.5s)
    setTimeout(() => {
      setJumpPhase('departure');
    }, 300);

    // Phase 2: The Breach (Impact at 1.5s)
    setTimeout(() => {
      setBgIndex(index);
      setJumpPhase('arrival'); // Re-using arrival for the transition into tunnel/void
    }, 1500);

    // Phase 3: Tunnel/Void (Starts shortly after impact)
    // Phase 4: Arrival/Recovery (End of sequence)
    setTimeout(() => {
      setIsJumping(false);
      setJumpPhase('idle');
    }, 4400); // 4.4s total cinematic flow
  };

  const BACKGROUNDS = projects.length > 0 
    ? projects.map(p => p.image || '/backgrounds/l0_vista.jpg') 
    : ['/backgrounds/l0_vista.jpg'];

  const PageComponent = PAGES[view] || DashboardPage;
  const currentBgSrc = BACKGROUNDS[bgIndex % BACKGROUNDS.length];

  return (
    <div className={`app-shell state-${jumpPhase} ${isJumping ? 'is-jumping' : ''} view-${view}`}>
      <ChromaFilters />
      <HyperspaceJump isJumping={isJumping} />

      <div
        className={`l0-vista phase-${jumpPhase}`}
        style={{ backgroundImage: `url(${currentBgSrc})` }}
        aria-hidden="true"
      />

      <Header
        currentView={view}
        onNavigate={setView}
        onSettingsClick={() => toggleHUD("settingsOpen")}
        onToggleHUD={toggleHUD} // Pass generic toggle to header
        status={systemStatus}
        ui={ui}
        hideHudControls={view === VIEWS.PROJECTS}
      />

      {/* Global Desktop HUD Layer — Reversed Order (Terminal on Top) */}
      <div className="l3-hud-layer global-hud" style={{ top: '0', height: '100vh', pointerEvents: 'none', display: view === VIEWS.PROJECTS ? 'none' : 'block' }}>
        {/* Memory Windows (Background) */}
        {ui.archivesOpen && <MemoryRapportHUD onClose={() => toggleHUD("archivesOpen")} x={xArchives} y={yArchives} isFocused={activeWindow === "archivesOpen"} onFocus={() => setActiveWindow("archivesOpen")} />}
        {ui.docsOpen && <MemoryDocsWindow onClose={() => toggleHUD("docsOpen")} x={xDocs} y={yDocs} isFocused={activeWindow === "docsOpen"} onFocus={() => setActiveWindow("docsOpen")} />}

        {/* Execution Engine Window */}
        {ui.missionDraftOpen && (
           <MissionForgeHUD 
             onClose={() => toggleHUD("missionDraftOpen")} 
             x={xDraft} 
             y={yDraft} 
             mission={missionDraft || { 
               title: "NOUVELLE MISSION", 
               context: "Définissez le contexte...", 
               objectives: ["Objectif 1"], 
               constraints: ["Contrainte 1"],
               selected_skills: []
             }} 
             setMissionDraft={setMissionDraft}
             onExecuteStart={() => setUi(prev => ({...prev, executing: true}))}
             onExecuteEnd={() => setUi(prev => ({...prev, executing: false}))}
             isFocused={activeWindow === "missionDraftOpen"} 
             onFocus={() => setActiveWindow("missionDraftOpen")} 
             activeProject={activeProject}
           />
        )}

        {/* Supervisor Windows */}
        {ui.monitorOpen && (
          <MonitoringWindow 
            onClose={() => toggleHUD("monitorOpen")} 
            x={xMonitor} y={yMonitor} 
            status={systemStatus} 
            isExecuting={ui.executing}
            isFocused={activeWindow === "monitorOpen"} 
            onFocus={() => setActiveWindow("monitorOpen")} 
            activeProject={activeProject} 
          />
        )}
        {ui.projectTeamsOpen && <ProjectTeamsWindow onClose={() => toggleHUD("projectTeamsOpen")} x={xProjectTeams} y={yProjectTeams} isFocused={activeWindow === "projectTeamsOpen"} onFocus={() => setActiveWindow("projectTeamsOpen")} projects={projects} activeProject={activeProject} onProjectsUpdate={handleUpdateProjects} onOpenHub={(teamId) => { setUi(prev => ({...prev, hubOpen: true, hubTargetTeamId: teamId})); setActiveWindow("hubOpen"); }} />}
        {ui.hubOpen && <AgentsHubWindow onClose={() => toggleHUD("hubOpen")} x={xHub} y={yHub} isFocused={activeWindow === "hubOpen"} onFocus={() => setActiveWindow("hubOpen")} projects={projects} activeProject={activeProject} onProjectsUpdate={handleUpdateProjects} targetTeamId={ui.hubTargetTeamId} />}

        {/* Core Windows (Foreground) */}
        {ui.settingsOpen && (
          <LLMConfigWindow
            onClose={() => toggleHUD("settingsOpen")}
            x={xSettings}
            y={ySettings}
            initialConfig={systemConfig}
            initialReachability={ollamaReachability}
            initialModels={allModels}
            isFocused={activeWindow === "settingsOpen"}
            onFocus={() => setActiveWindow("settingsOpen")}
          />
        )}

        {ui.chatOpen && (
          <HologramTerminal
            onClose={() => toggleHUD("chatOpen")}
            x={xTerminal}
            y={yTerminal}
            initialLogs={logHistory}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            onMissionDraft={handleMissionDraft}
            isFocused={activeWindow === "chatOpen"}
            onFocus={() => setActiveWindow("chatOpen")}
          />
        )}
      </div>

      <PageComponent
        ui={ui}
        onPropClick={handlePropClick}
        orion={orion}
        projects={projects}
        onProjectsUpdate={handleUpdateProjects}
        onNavigate={setView}
        setBgIndex={setBgIndex}
        setForceScroll={setForceScroll}
      />

      <Footer
        currentView={view}
        backgrounds={BACKGROUNDS}
        activeIndex={bgIndex % BACKGROUNDS.length}
        onSelect={initiateJump}
        isJumping={isJumping}
        ui={ui}
        onMuteToggle={() => handlePropClick("mute")}
        activeProject={activeProject}
        projects={projects}
        forceScrollTrigger={forceScroll}
      />
    </div>
  );
}
