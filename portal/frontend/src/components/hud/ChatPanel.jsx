import { useState, useRef, useEffect } from "react";
import "./ChatPanel.css";
import { API_BASE } from "../../lib/constants.js";

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user", content: text, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orion/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "orion", content: data.response || "...", time: new Date().toLocaleTimeString() }]);
    } catch {
      setMessages(prev => [...prev, { role: "orion", content: "Signal perdu. Backend hors ligne.", time: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-panel glass-panel" id="chat-panel">
      <div className="chat-panel-header">
        <span className="chat-panel-title">ORION TERMINAL</span>
        <button className="panel-close-btn" onClick={onClose} aria-label="Fermer">X</button>
      </div>
      <div className="chat-panel-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="chat-empty">Bonsoir, Capitaine. Que puis-je pour vous ?</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <span className="bubble-author">{m.role === "user" ? "Capitaine" : "Orion"}</span>
            <span className="bubble-content">{m.content}</span>
            <span className="bubble-time">{m.time}</span>
          </div>
        ))}
        {loading && <div className="chat-bubble orion"><span className="typing"><span/><span/><span/></span></div>}
      </div>
      <div className="chat-input-row">
        <input
          id="chat-input"
          className="chat-input"
          type="text"
          placeholder="Parlez au Capitaine..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={loading}
          autoFocus
        />
        <button id="chat-send-btn" className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>ENVOYER</button>
      </div>
    </div>
  );
}
