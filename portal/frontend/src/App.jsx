import './styles/index.css';
import './styles/App.css';
import { useState, useEffect, useRef } from 'react';
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
  const xSettings = useMotionValue(35);
  const ySettings = useMotionValue(100);
  const xProjectTeams = useMotionValue(35);
  const yProjectTeams = useMotionValue(100);
  const xHub = useMotionValue(35);
  const yHub = useMotionValue(100);
  const xMonitor = useMotionValue(35);
  const yMonitor = useMotionValue(100);
  const xDocs = useMotionValue(35);
  const yDocs = useMotionValue(100);
  const xArchives = useMotionValue(35);
  const yArchives = useMotionValue(100);
  const xDraft = useMotionValue(35);
  const yDraft = useMotionValue(100);

  // Window Dimensions (Persistent)
  const wTerminal = useMotionValue(700);
  const hTerminal = useMotionValue(450);
  const wSettings = useMotionValue(400);
  const hSettings = useMotionValue(550);
  const wProjectTeams = useMotionValue(600);
  const hProjectTeams = useMotionValue(500);
  const wHub = useMotionValue(650);
  const hHub = useMotionValue(550);
  const wMonitor = useMotionValue(350);
  const hMonitor = useMotionValue(600);
  const wDocs = useMotionValue(500);
  const hDocs = useMotionValue(350);
  const wArchives = useMotionValue(600);
  const hArchives = useMotionValue(500);
  const wDraft = useMotionValue(700);
  const hDraft = useMotionValue(600);

  // Dynamic Viewport Constraints
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDragConstraints = (wValue, hValue) => {
    return {
      top: 68,
      left: 5,
      right: viewport.width - (wValue?.get() || 100) - 5,
      bottom: viewport.height - 125 // 125 for footer ledge
    };
  };

  const [bgIndex, setBgIndex] = useState(0);
  const [forceScroll, setForceScroll] = useState(0); // Counter to trigger scroll
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPhase, setJumpPhase] = useState('idle');

  const { status: systemStatus, config: systemConfig, ollamaReachability, allModels } = useSystemStatus();
  const orion = useOrionIntelligence(isJumping, ui);

  const [activeAgentIds, setActiveAgentIds] = useState([]);
  const [lastMissionDocs, setLastMissionDocs] = useState({}); // Grouped by mission_id
  const [activeDocument, setActiveDocument] = useState(null);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fetch('/api/v1/resources/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects || []))
      .catch(err => console.error("Projects fetch error", err));
  }, []);

  // Load Mission & Existing Deliverables for Active Project
  useEffect(() => {
    const activeProject = projects[bgIndex % projects.length];
    if (activeProject) {
      // 1. Fetch Mission Draft
      fetch(`/api/v1/resources/missions/${activeProject.id}`)
        .then(res => res.json())
        .then(data => {
          setMissionDraft(data.mission || null);
        })
        .catch(err => console.error("Mission load error", err));

      // 2. Fetch Grouped Deliverables
      fetch(`/api/v1/resources/project_deliverables/${activeProject.id}`)
        .then(res => res.json())
        .then(data => {
          setLastMissionDocs(data.deliverables || {});
        })
        .catch(err => console.error("Deliverables load error", err));
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

  // Improved Generic HUD Toggle (Persistent Position & Dimensions)
  const toggleHUD = (key) => {
    setUi(prev => ({ ...prev, [key]: !prev[key] }));
    if (!ui[key]) setActiveWindow(key);
  };

  const handleOpenDoc = async (doc) => {
    // doc: { filename, mission_id, content?, isTechnical? }
    let targetDoc = { ...doc };

    // If no content, fetch from server
    if (!targetDoc.content) {
      try {
        const url = `/api/v1/resources/read_project_file?filename=${targetDoc.filename}${targetDoc.mission_id ? `&mission_id=${targetDoc.mission_id}` : ''}${activeProject ? `&project_id=${activeProject.id}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("File not found");
        const data = await res.json();
        targetDoc.content = data.content;
      } catch (err) {
        console.error("Open doc error:", err);
        targetDoc.error = `Le fichier "${doc.filename}" est introuvable.`;

        // Dispatch error to LLM console
        window.dispatchEvent(new CustomEvent('ORION_LOG', {
          detail: {
            content: `[DOCS] Erreur critique: Impossible de lire ${doc.filename}. Le module de données est manquant ou corrompu.`,
            type: 'error',
            actor: 'SYSTEM'
          }
        }));
      }
    }

    setActiveDocument(targetDoc);
    setUi(prev => ({ ...prev, archivesOpen: true }));
    setActiveWindow("archivesOpen");
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
      console.log("[HUD] Mission completion event received:", data);

      let missionId = data.mission_id;
      let missionProjectId = data.project_id || null;
      let missionResult = { status: "SUCCESS", teams_visited: [], results: [] };

      // Resilient Context Parsing
      try {
        if (data.context) {
          const parsed = typeof data.context === 'string' ? JSON.parse(data.context) : data.context;
          missionResult.teams_visited = parsed.teams_visited || [];
          missionResult.results = parsed.results || [];
          if (parsed.mission_id) missionId = parsed.mission_id;
          if (parsed.project_id) missionProjectId = parsed.project_id;
        } else if (data.results) {
          // Flatten direct results if context is missing but results are present (enriched backend)
          missionResult.results = data.results || [];
          missionResult.teams_visited = data.teams_visited || [];
        }
      } catch (err) {
        console.warn("[HUD] Could not parse mission context JSON", err);
      }

      // Filter out replayed events (Ghost calls fix)
      const eventTime = data.timestamp ? Date.parse(data.timestamp) : Date.now();
      const isStale = eventTime < sessionStartTime;

      if (isStale) {
        console.log("[HUD] Stale mission event ignored for interpretation, but clearing execution state.");
        setUi(prev => ({ ...prev, executing: false }));
        setActiveAgentIds([]);
        return;
      }

      const isDuplicate = missionId && lastProcessedMissionId.current === missionId;
      if (!isDuplicate && missionId) lastProcessedMissionId.current = missionId;

      try {
        if (!isDuplicate && !isStale) {
          // 1. Refresh Projects
          fetch('/api/v1/resources/projects')
            .then(res => res.json())
            .then(data => setProjects(data.projects || []))
            .catch(err => console.error("Projects refresh error", err));

          // 2. Refresh Deliverables (True Discovery)
          const targetProjectId = missionProjectId || (activeProject ? activeProject.id : null);
          if (targetProjectId) {
            console.log(`[HUD] Refreshing deliverables for ${targetProjectId}...`);
            fetch(`/api/v1/resources/project_deliverables/${targetProjectId}`)
              .then(res => res.json())
              .then(data => {
                setLastMissionDocs(data.deliverables || {});
              })
              .catch(err => console.error("Deliverables sync error", err));
          }

          // 3. Request Orion Interpretation
          const res = await fetch('/api/v1/orion/interpret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mission_result: missionResult,
              mission_id: missionId,
              original_objective: (missionDraft && missionDraft.context) ? missionDraft.context : "Mission non spécifiée"
            })
          });

          if (res.ok) {
            const result = await res.json();
            setChatMessages(prev => [...prev, {
              role: 'assistant',
              content: result.summary,
              mood: result.mood || 'neutral',
              bubble: result.bubble,
              type: 'orion'
            }]);
          } else {
            throw new Error("Interpretation service unavailable");
          }
        }
      } catch (err) {
        if (!isDuplicate && !isStale) {
          console.warn("[ORION] Fallback interpretation active", err);
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: "▸ Analyse de mission terminée. Les livrables sont disponibles dans l'onglet DOCUMENTS de la Forge.",
            mood: 'neutral',
            type: 'orion'
          }]);
        }
      } finally {
        // ALWAYS clear executing state on MISSION_COMPLETED
        setUi(prev => ({ ...prev, executing: false }));
        setActiveAgentIds([]);
      }
    };

    const handleProjectSync = () => {
      console.log("[HUD] Projects sync requested by backend");
      fetch('/api/v1/resources/projects')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error("Projects sync error", err));
    };

    const handleAgentActive = (e) => {
      const { agentId } = e.detail;
      // Cascade mode: only the current one pulses
      setActiveAgentIds([agentId]);
    };

    const handleAgentInactive = (e) => {
      const { agentId } = e.detail;
      setActiveAgentIds(prev => prev.filter(id => id !== agentId));
    };

    // Fallback: Scan logs for completion keywords if socket event is missed
    const checkCompletionKeywords = () => {
      if (!ui.executing) return;
      const lastLogs = logHistory.slice(-5);
      const hasCompleted = lastLogs.some(l =>
        (l.content && (l.content.includes("verdict: COMPLETED") || l.content.includes("MISSION TERMINEE"))) ||
        (l.event === "MISSION_COMPLETED")
      );
      if (hasCompleted) {
        console.log("[HUD] Completion detected via log scanning fallback.");
        setUi(prev => ({ ...prev, executing: false }));
        setActiveAgentIds([]);
      }
    };
    checkCompletionKeywords();

    window.addEventListener('MISSION_COMPLETED', handleMissionComplete);
    window.addEventListener('ORION_MISSION_COMPLETE', handleMissionComplete);
    window.addEventListener('ORION_LOG', handleLog);
    window.addEventListener('PROJECTS_SYNC', handleProjectSync);
    window.addEventListener('AGENT_ACTIVE', handleAgentActive);
    window.addEventListener('AGENT_INACTIVE', handleAgentInactive);
    return () => {
      window.removeEventListener('MISSION_COMPLETED', handleMissionComplete);
      window.removeEventListener('ORION_MISSION_COMPLETE', handleMissionComplete);
      window.removeEventListener('ORION_LOG', handleLog);
      window.removeEventListener('PROJECTS_SYNC', handleProjectSync);
      window.removeEventListener('AGENT_ACTIVE', handleAgentActive);
      window.removeEventListener('AGENT_INACTIVE', handleAgentInactive);
    };
  }, [logHistory, ui.executing, sessionStartTime]); // Added dependencies for fallback

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
        onToggleHUD={toggleHUD}
        status={systemStatus}
        ui={ui}
        hasActiveDocument={!!activeDocument}
        hideHudControls={view === VIEWS.PROJECTS}
      />

      {/* Global Desktop HUD Layer — Reversed Order (Terminal on Top) */}
      <div className="l3-hud-layer global-hud" style={{ top: '0', height: '100vh', pointerEvents: 'none', display: view === VIEWS.PROJECTS ? 'none' : 'block' }}>
        {/* Memory Windows (Background) - Refactored as Reader */}
        {activeDocument && ui.archivesOpen && (
          <MemoryRapportHUD
            doc={activeDocument}
            onClose={() => {
              setUi(prev => ({ ...prev, archivesOpen: false }));
              setActiveDocument(null);
            }}
            x={xArchives} y={yArchives}
            width={wArchives} height={hArchives}
            dragConstraints={getDragConstraints(wArchives, hArchives)}
            isFocused={activeWindow === "archivesOpen"}
            onFocus={() => setActiveWindow("archivesOpen")}
          />
        )}
        {ui.docsOpen && (
          <MemoryDocsWindow
            onClose={() => toggleHUD("docsOpen")}
            x={xDocs} y={yDocs}
            width={wDocs} height={hDocs}
            dragConstraints={getDragConstraints(wDocs, hDocs)}
            isFocused={activeWindow === "docsOpen"}
            onFocus={() => setActiveWindow("docsOpen")}
            onOpenDoc={handleOpenDoc}
          />
        )}

        {/* Execution Engine Window */}
        {ui.missionDraftOpen && (
          <MissionForgeHUD
            onClose={() => toggleHUD("missionDraftOpen")}
            x={xDraft} y={yDraft}
            width={wDraft} height={hDraft}
            dragConstraints={getDragConstraints(wDraft, hDraft)}
            mission={missionDraft || {
              title: "NOUVELLE MISSION",
              context: "Définissez le contexte...",
              objectives: ["Objectif 1"],
              constraints: ["Contrainte 1"],
              selected_skills: []
            }}
            setMissionDraft={setMissionDraft}
            onExecuteStart={() => setUi(prev => ({ ...prev, executing: true }))}
            onExecuteEnd={() => { }}
            executing={ui.executing}
            results={lastMissionDocs}
            onOpenDoc={handleOpenDoc}
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
            width={wMonitor} height={hMonitor}
            dragConstraints={getDragConstraints(wMonitor, hMonitor)}
            status={systemStatus}
            isExecuting={ui.executing}
            activeProject={activeProject}
            activeAgentIds={activeAgentIds}
            isFocused={activeWindow === "monitorOpen"}
            onFocus={() => setActiveWindow("monitorOpen")}
          />
        )}
        {ui.projectTeamsOpen && (
          <ProjectTeamsWindow
            onClose={() => toggleHUD("projectTeamsOpen")}
            x={xProjectTeams} y={yProjectTeams}
            width={wProjectTeams} height={hProjectTeams}
            dragConstraints={getDragConstraints(wProjectTeams, hProjectTeams)}
            isFocused={activeWindow === "projectTeamsOpen"}
            onFocus={() => setActiveWindow("projectTeamsOpen")}
            projects={projects}
            activeProject={activeProject}
            onProjectsUpdate={handleUpdateProjects}
            onOpenHub={(teamId) => { setUi(prev => ({ ...prev, hubOpen: true, hubTargetTeamId: teamId })); setActiveWindow("hubOpen"); }}
          />
        )}
        {ui.hubOpen && (
          <AgentsHubWindow
            onClose={() => toggleHUD("hubOpen")}
            x={xHub} y={yHub}
            width={wHub} height={hHub}
            dragConstraints={getDragConstraints(wHub, hHub)}
            isFocused={activeWindow === "hubOpen"}
            onFocus={() => setActiveWindow("hubOpen")}
            projects={projects}
            activeProject={activeProject}
            onProjectsUpdate={handleUpdateProjects}
            targetTeamId={ui.hubTargetTeamId}
          />
        )}

        {/* Core Windows (Foreground) */}
        {ui.settingsOpen && (
          <LLMConfigWindow
            onClose={() => toggleHUD("settingsOpen")}
            x={xSettings} y={ySettings}
            width={wSettings} height={hSettings}
            dragConstraints={getDragConstraints(wSettings, hSettings)}
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
            x={xTerminal} y={yTerminal}
            width={wTerminal} height={hTerminal}
            dragConstraints={getDragConstraints(wTerminal, hTerminal)}
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
