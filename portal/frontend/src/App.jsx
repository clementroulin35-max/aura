import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Terminal from './components/Terminal';
import SystemPanel from './components/SystemPanel';
import { fetchPulse, runMission, connectEvents } from './api';
import './App.css';

export default function App() {
  const [pulse, setPulse] = useState('SYNCING');
  const [version, setVersion] = useState('v3.0.0');
  const [telemetry, setTelemetry] = useState({});
  const [logs, setLogs] = useState([]);
  const [mission, setMission] = useState(null);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // Fetch system pulse on mount + interval
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

  // WebSocket event stream
  useEffect(() => {
    const ws = connectEvents((event) => {
      setLogs((prev) => [...prev.slice(-200), event]);
    });
    wsRef.current = ws;
    return () => ws?.close();
  }, []);

  // Run mission
  const handleMission = useCallback(async () => {
    if (!task.trim() || loading) return;
    setLoading(true);
    setLogs((prev) => [...prev, {
      timestamp: new Date().toISOString(),
      actor: 'USER',
      event: `Mission: ${task}`,
      status: 'OK',
    }]);

    try {
      const result = await runMission(task);
      setMission(result);
      setPulse('NOMINAL');
      setLogs((prev) => [...prev, {
        timestamp: new Date().toISOString(),
        actor: 'COMPILER',
        event: `Completed: ${result.teams_visited?.join(' → ') || 'N/A'}`,
        status: 'SUCCESS',
      }]);
    } catch (err) {
      setPulse('WARNING');
      setLogs((prev) => [...prev, {
        timestamp: new Date().toISOString(),
        actor: 'SYSTEM',
        event: `Error: ${err.message}`,
        status: 'FAIL',
      }]);
    } finally {
      setLoading(false);
      setTask('');
    }
  }, [task, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleMission();
  };

  return (
    <div className="app-container">
      <div className="app-background" />
      <Header pulse={pulse} version={version} />

      <main className="main-content">
        <div className="panel-left">
          <div className="mission-bar">
            <input
              id="mission-input"
              className="mission-input"
              type="text"
              placeholder="▸ Enter mission directive..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
            <motion.button
              id="mission-btn"
              className={`mission-btn ${loading ? 'loading' : ''}`}
              onClick={handleMission}
              disabled={loading || !task.trim()}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? '◉ RUNNING' : '▸ EXECUTE'}
            </motion.button>
          </div>
          <Terminal logs={logs} />
        </div>

        <div className="panel-right">
          <SystemPanel
            pulse={pulse}
            telemetry={telemetry}
            mission={mission}
          />
        </div>
      </main>
    </div>
  );
}
