import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './hud.css';
import './HologramTerminal.css';
import { API_BASE } from '../../lib/constants.js';

const HologramTerminal = ({ onClose, x, y, initialLogs = [] }) => {
    // Chat State — Seed with default welcome then initialLogs
    const [messages, setMessages] = useState([
        { role: 'system', content: '▸ Console GSS connectée au Nexus.' },
        { role: 'system', content: '▸ Orion actif. Systèmes cockpit stables.' },
        ...initialLogs.map(log => ({
            role: log.role || 'system',
            content: log.content || log.message, // handle legacy 'message' field
            type: log.type || 'info',
            time: log.time
        }))
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const screenRef = useRef(null);

    // Window Interaction State
    const [dimensions, setDimensions] = useState({ width: 785, height: 450 });
    const dragControls = useDragControls();

    const unfoldVariants = {
        hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.95 },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.1
            }
        }
    };

    // Auto-scroll logic — still needed for state updates like handleSend
    useEffect(() => {
        if (screenRef.current) {
            screenRef.current.scrollTop = screenRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Update messages when initialLogs change (from App.jsx)
    useEffect(() => {
        if (initialLogs.length > 0) {
            const lastLog = initialLogs[initialLogs.length - 1];
            // Only append the new log if it hasn't been added yet
            setMessages(prev => {
                const alreadyHas = prev.some(m => m.content === lastLog.content && m.time === lastLog.time);
                if (alreadyHas) return prev;
                return [...prev, {
                    role: lastLog.role || 'system',
                    content: lastLog.content || lastLog.message,
                    type: lastLog.type || 'info',
                    time: lastLog.time
                }];
            });
        }
    }, [initialLogs]);

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
            const newWidth = Math.max(610, startWidth + (mouseMoveEvent.clientX - startX));
            const newHeight = Math.max(200, startHeight + (mouseMoveEvent.clientY - startY));
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
            className="nexus-hud-panel hologram-container"
            drag
            dragControls={dragControls}
            dragListener={false} // Only drag via header
            dragMomentum={false}
            dragConstraints={{ top: 64, left: 0, right: window.innerWidth - dimensions.width, bottom: window.innerHeight - 120 }}
            dragElastic={0}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                x,
                y,
                zIndex: 'var(--z-hud-base)'
            }}
            variants={unfoldVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            {/* Draggable Header */}
            <div
                className="hud-header"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="header-drag-zone">
                    <span className="hud-title">ORION TERMINAL V3.6</span>
                </div>
                {onClose && (
                    <button className="hud-close-btn hologram-close-btn" onClick={onClose}>[X]</button>
                )}
            </div>

            {/* Chat Content */}
            <div className="hologram-screen" ref={screenRef}>
                <div className="chat-stream">
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg ${msg.role} ${msg.type || ''}`}>
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
                            <span className="typing"><span /><span /><span /></span>
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
                className="hud-resize-handle hologram-resize-handle"
                onMouseDown={startResizing}
            />
        </motion.div>
    );
};

export default HologramTerminal;
