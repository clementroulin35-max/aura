import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './HologramTerminal.css';
import { API_BASE } from '../../lib/constants.js';

const HologramTerminal = ({ onClose }) => {
    // Chat State
    const [messages, setMessages] = useState([
        { role: 'system', content: '▸ Console GSS connectée au Nexus.' },
        { role: 'system', content: '▸ Mode ISO-PROD actif. Systèmes cockpit stables.' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const screenRef = useRef(null);

    // Window Interaction State
    const [dimensions, setDimensions] = useState({ width: 500, height: 600 });
    const dragControls = useDragControls();

    // Auto-scroll logic
    useEffect(() => {
        if (screenRef.current) {
            screenRef.current.scrollTop = screenRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text, time: new Date().toLocaleTimeString() }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/orion/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { 
                role: 'orion', 
                content: data.response || '...', 
                time: new Date().toLocaleTimeString() 
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'system', content: 'Signal perdu. Erreur de routage.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Resizing Logic
    const startResizing = (mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;
        const startX = mouseDownEvent.clientX;
        const startY = mouseDownEvent.clientY;

        const onMouseMove = (mouseMoveEvent) => {
            const newWidth = Math.max(400, startWidth + (mouseMoveEvent.clientX - startX));
            const newHeight = Math.max(400, startHeight + (mouseMoveEvent.clientY - startY));
            setDimensions({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <motion.div 
            className="hologram-container"
            drag
            dragControls={dragControls}
            dragListener={false} // Only drag via header
            dragMomentum={false}
            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Flexible bounds
            style={{ width: dimensions.width, height: dimensions.height }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {/* Draggable Header */}
            <div 
                className="hologram-header"
                onPointerDown={(e) => dragControls.start(e)}
                style={{ cursor: 'grab' }}
            >
                <div className="header-drag-zone">
                    <span className="hologram-title">ORION TERMINAL v3.6</span>
                </div>
                {onClose && (
                    <button className="hologram-close-btn" onClick={onClose}>[X]</button>
                )}
            </div>

            {/* Chat Content */}
            <div className="hologram-screen" ref={screenRef}>
                <div className="chat-stream">
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg ${msg.role}`}>
                            <span className="prefix">
                                {msg.role === 'user' ? '›' : (msg.role === 'system' ? '■' : '⋄')}
                            </span>
                            <div className="msg-content">
                                <span className="content-text">{msg.content}</span>
                                {msg.time && <span className="bubble-time">{msg.time}</span>}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="msg orion">
                            <span className="prefix">⋄</span>
                            <span className="typing"><span/><span/><span/></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Row */}
            <div className="hologram-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Saisissez une commande..."
                    autoFocus
                />
                <button 
                    className="hologram-send-btn" 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()}
                >
                    EXEC
                </button>
            </div>

            {/* Resize Handle */}
            <div 
                className="hologram-resize-handle" 
                onMouseDown={startResizing}
            />
        </motion.div>
    );
};

export default HologramTerminal;
