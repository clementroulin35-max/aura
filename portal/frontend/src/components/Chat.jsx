import { useRef, useEffect } from 'react';
import './Chat.css';

export default function Chat({ messages, input, onInputChange, onSend, disabled, loading }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat glass-panel" id="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-avatar">🐱</span>
          <span className="chat-title">ORION</span>
          {disabled && <span className="chat-offline-badge">OFFLINE</span>}
        </div>
        <span className="chat-msg-count">{messages.length} messages</span>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {disabled && messages.length === 0 && (
          <div className="chat-offline-overlay">
            <div className="chat-offline-icon">◉</div>
            <div className="chat-offline-text">ORION OFFLINE</div>
            <div className="chat-offline-sub">Aucun LLM détecté. Lancez Ollama pour activer le chat.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div className={`chat-bubble ${msg.role}`} key={i}>
            <div className="chat-bubble-header">
              <span className="chat-bubble-author">
                {msg.role === 'user' ? '◆ Capitaine' : '🐱 Orion'}
              </span>
              <span className="chat-bubble-time">{msg.time || ''}</span>
            </div>
            <div className="chat-bubble-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble orion">
            <div className="chat-bubble-header">
              <span className="chat-bubble-author">🐱 Orion</span>
            </div>
            <div className="chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-bar">
        <input
          id="chat-input"
          className="chat-input"
          type="text"
          placeholder={disabled ? 'ORION OFFLINE — LLM requis' : '▸ Parlez au Capitaine...'}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          autoFocus
        />
        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={onSend}
          disabled={disabled || loading || !input.trim()}
        >
          ▸
        </button>
      </div>
    </div>
  );
}
