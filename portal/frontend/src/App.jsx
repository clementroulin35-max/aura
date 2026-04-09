import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Chat from './components/Chat';
import MissionPreview from './components/MissionPreview';
import SystemPanel from './components/SystemPanel';
import LLMSettings from './components/LLMSettings';
import {
  fetchPulse, runMission, chatWithOrion, interpretResult,
  checkOrionStatus, connectEvents, fetchLLMConfig, saveLLMConfig,
  fetchModels, testProvider, fetchOllamaStatus, fetchPricing,
} from './api';
import './App.css';

const llmApi = { fetchModels, testProvider, fetchOllamaStatus, fetchPricing };

export default function App() {
  const [pulse, setPulse] = useState('SYNCING');
  const [version, setVersion] = useState('v3.0.0');
  const [telemetry, setTelemetry] = useState({});
  const [events, setEvents] = useState([]);

  // ORION Chat state
  const [orionOnline, setOrionOnline] = useState(false);
  const [provider, setProvider] = useState('none');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Mission state
  const [objective, setObjective] = useState('');
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [activeTeams, setActiveTeams] = useState([]);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [llmConfig, setLlmConfig] = useState(null);

  const wsRef = useRef(null);

  // Check ORION availability
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkOrionStatus();
      setOrionOnline(status.available);
      setProvider(status.provider);
    };
    checkStatus();
    const id = setInterval(checkStatus, 15000);
    return () => clearInterval(id);
  }, []);

  // Load LLM config
  useEffect(() => {
    fetchLLMConfig().then(setLlmConfig);
  }, []);

  // Fetch pulse
  useEffect(() => {
    const poll = async () => {
      const data = await fetchPulse();
      if (data) {
        setPulse(data.status || 'NOMINAL');
        setVersion(data.version || 'v3.0.0');
        setTelemetry(data.telemetry || {});
      }
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  // WebSocket events
  useEffect(() => {
    const ws = connectEvents((event) => {
      setEvents((prev) => [...prev.slice(-100), event]);
      if (event.actor && event.event?.includes('RouteDecision')) {
        setActiveTeams((prev) => [...prev, event.context || '']);
      }
    });
    wsRef.current = ws;
    return () => ws?.close();
  }, []);

  const now = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Send chat message to ORION
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatLoading || !orionOnline) return;

    const userMsg = { role: 'user', content: chatInput, time: now() };
    setChatMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const result = await chatWithOrion(currentInput, history);

      const orionMsg = { role: 'orion', content: result.response, time: now() };
      setChatMessages((prev) => [...prev, orionMsg]);

      if (result.suggested_objective) {
        setObjective(result.suggested_objective);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, {
        role: 'orion',
        content: `[ERREUR] ${err.message}`,
        time: now(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, orionOnline, chatMessages]);

  // Execute mission via RED BUTTON
  const handleExecute = useCallback(async () => {
    if (!objective.trim() || executing) return;

    setExecuting(true);
    setActiveTeams([]);
    setPulse('EXECUTING');

    setChatMessages((prev) => [...prev, {
      role: 'orion',
      content: `⚡ Mission lancée : "${objective.slice(0, 80)}..."`,
      time: now(),
    }]);

    try {
      const result = await runMission(objective);
      setLastResult(result);
      setPulse('NOMINAL');

      if (orionOnline) {
        const interpretation = await interpretResult(result, objective);
        setLastResult((prev) => ({ ...prev, summary: interpretation.summary }));
        setChatMessages((prev) => [...prev, {
          role: 'orion',
          content: interpretation.summary,
          time: now(),
        }]);
      }
    } catch (err) {
      setPulse('WARNING');
      setChatMessages((prev) => [...prev, {
        role: 'orion',
        content: `[MISSION ÉCHOUÉE] ${err.message}`,
        time: now(),
      }]);
    } finally {
      setExecuting(false);
    }
  }, [objective, executing, orionOnline]);

  // Save LLM config
  const handleSaveConfig = async (newConfig) => {
    await saveLLMConfig(newConfig);
    setLlmConfig(newConfig);
    const status = await checkOrionStatus();
    setOrionOnline(status.available);
    setProvider(status.provider);
  };

  const chatModel = llmConfig?.chat?.model || '—';
  const chatProvider = llmConfig?.chat?.provider || '—';
  const supModel = llmConfig?.supervisor?.model || '—';
  const supProvider = llmConfig?.supervisor?.provider || '—';

  return (
    <div className="app-container">
      <div className="app-background" />
      <Header
        pulse={pulse}
        version={version}
        provider={provider}
        chatModel={`${chatProvider}/${chatModel}`}
        supervisorModel={`${supProvider}/${supModel}`}
        onSettingsClick={() => setShowSettings(!showSettings)}
        settingsOpen={showSettings}
      />

      <main className={`main-content ${showSettings ? 'layout-settings' : 'layout-default'}`}>
        {showSettings ? (
          /* Settings mode: Settings panel (wide) + Supervisor */
          <>
            <div className="col-settings">
              <LLMSettings
                config={llmConfig}
                onSave={handleSaveConfig}
                onClose={() => setShowSettings(false)}
                api={llmApi}
              />
            </div>
            <div className="col-supervisor">
              <SystemPanel
                pulse={pulse}
                telemetry={telemetry}
                activeTeams={activeTeams}
                lastResult={lastResult}
                events={events}
              />
            </div>
          </>
        ) : (
          /* Default mode: Chat + Mission + Supervisor */
          <>
            <div className="col-chat">
              <Chat
                messages={chatMessages}
                input={chatInput}
                onInputChange={setChatInput}
                onSend={handleChatSend}
                disabled={!orionOnline}
                loading={chatLoading}
              />
            </div>
            <div className="col-mission">
              <MissionPreview
                objective={objective}
                onObjectiveChange={setObjective}
                onExecute={handleExecute}
                executing={executing}
                disabled={!orionOnline}
                lastResult={lastResult}
              />
            </div>
            <div className="col-supervisor">
              <SystemPanel
                pulse={pulse}
                telemetry={telemetry}
                activeTeams={activeTeams}
                lastResult={lastResult}
                events={events}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
