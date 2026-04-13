import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, AnimatePresence, useMotionValue } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './hud.css';
import './HologramTerminal.css';
import { API_BASE } from '../../lib/constants.js';

// Defined OUTSIDE to prevent re-mounting and state loss on render (Fixes back-typing/reversed input)
const AutoExpandingTextarea = ({ value, onChange, onKeyDown, placeholder, disabled }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            className="hologram-textarea"
            rows="1"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus
        />
    );
};

const HologramTerminal = ({
    onClose, x, y, width, height, dragConstraints, initialLogs = [],
    chatMessages = [], setChatMessages,
    onMissionDraft,
    isFocused, onFocus
}) => {
    const [chatInput, setChatInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'logs'
    const screenRef = useRef(null);

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

    // Auto-scroll logic — handles both tabs and content updates
    useEffect(() => {
        if (screenRef.current) {
            screenRef.current.scrollTop = screenRef.current.scrollHeight;
        }
    }, [chatMessages, loading, activeTab, initialLogs]);

    const handleSend = async () => {
        const text = chatInput.trim();
        if (!text || loading || !setChatMessages) return;

        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: text, time: new Date().toLocaleTimeString() }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/v1/orion/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatMessages }),
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, {
                role: 'orion',
                content: data.response || '...',
                time: new Date().toLocaleTimeString()
            }]);

            if (data.bubble || data.mood) {
                window.dispatchEvent(new CustomEvent('ORION_SPOKE', {
                    detail: { text: data.bubble || "...", mood: data.mood || "neutral" }
                }));
            }

            if (data.mission_payload && typeof onMissionDraft === 'function') {
                onMissionDraft(data.mission_payload);
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'system', content: 'Signal perdu. Erreur de routage.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Resizing Logic
    const handleResizeRight = (mouseDownEvent) => {
        mouseDownEvent.preventDefault(); mouseDownEvent.stopPropagation();
        const startWidth = width.get(); const startHeight = height.get();
        const startX = mouseDownEvent.clientX; const startY = mouseDownEvent.clientY;
        const onMouseMove = (mouseMoveEvent) => {
            width.set(Math.max(610, startWidth + (mouseMoveEvent.clientX - startX)));
            height.set(Math.max(200, startHeight + (mouseMoveEvent.clientY - startY)));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleResizeLeft = (mouseDownEvent) => {
        mouseDownEvent.preventDefault(); mouseDownEvent.stopPropagation();
        const startWidth = width.get(); const startHeight = height.get();
        const startX = mouseDownEvent.clientX; const startY = mouseDownEvent.clientY;
        const startXPos = x.get();
        const onMouseMove = (mouseMoveEvent) => {
            const deltaX = mouseMoveEvent.clientX - startX;
            const newWidth = Math.max(610, startWidth - deltaX);
            const actualDeltaX = startWidth - newWidth;
            
            width.set(newWidth);
            height.set(Math.max(200, startHeight + (mouseMoveEvent.clientY - startY)));
            x.set(startXPos + actualDeltaX);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const MarkdownComponents = {
        table: ({ children }) => (
            <div className="md-table-wrapper">
                <table className="md-table">{children}</table>
            </div>
        ),
        blockquote: ({ children }) => (
            <div className="md-inset">{children}</div>
        ),
        ul: ({ children }) => <ul className="md-list">{children}</ul>,
        li: ({ children }) => <li className="md-list-item">{children}</li>,
        code: ({ children, inline }) => (
            inline ? <code className="md-code-inline">{children}</code> : <pre className="md-code-block"><code>{children}</code></pre>
        )
    };

    return (
        <motion.div
            className="nexus-hud-panel hologram-container"
            onPointerDownCapture={onFocus}
            drag
            dragControls={dragControls}
            dragListener={false} // Only drag via header
            dragMomentum={false}
            dragConstraints={dragConstraints}
            style={{
                width,
                height,
                x,
                y,
                zIndex: isFocused ? 'var(--z-hud-top)' : 'var(--z-hud-base)'
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
                style={{ fontFamily: 'var(--font-title)', textShadow: 'var(--pixel-shadow)', letterSpacing: '2px' }}
            >
                <div className="header-drag-zone">
                    <span className="hud-title">ORION TERMINAL V3.6</span>
                    <div className="terminal-tabs" onPointerDown={e => e.stopPropagation()}>
                        <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>CHAT</button>
                        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>LOGS</button>
                    </div>
                </div>
                {onClose && (
                    <button className="hud-close-btn hologram-close-btn" onClick={onClose}>X</button>
                )}
            </div>

            {/* Chat/Logs Content */}
            <div className="hologram-screen" ref={screenRef}>
                <div className="chat-stream">
                    <AnimatePresence initial={false}>
                        {activeTab === 'chat' && chatMessages.filter(m => m.role !== 'system').map((msg, i) => (
                            <motion.div
                                key={i}
                                className={`msg ${msg.role} ${msg.type || ''}`}
                                initial={{ opacity: 0, x: -10, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <span className="prefix">
                                    {msg.role === 'user' ? '›' : '⋄'}
                                </span>
                                <div className={`msg-content ${msg.role === 'orion' ? 'orion-card' : ''}`}>
                                    {msg.role === 'orion' || msg.role === 'assistant' ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={MarkdownComponents}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        <span className="content-text">{msg.content}</span>
                                    )}
                                    {msg.time && <span className="bubble-time">{msg.time}</span>}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {activeTab === 'logs' && initialLogs.map((log, i) => (
                        <div key={i} className={`msg system ${log.type || 'info'}`}>
                            <span className="prefix">■</span>
                            <div className="msg-content">
                                <span className="content-text">{log.content || log.message}</span>
                                {log.time && <span className="bubble-time">{log.time}</span>}
                            </div>
                        </div>
                    ))}
                    {activeTab === 'chat' && loading && (
                        <div className="msg orion">
                            <span className="prefix">⋄</span>
                            <span className="typing"><span /><span /><span /></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Row */}
            <div className="hologram-input">
                <AutoExpandingTextarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Engager Orion..."
                    disabled={loading}
                />
                <button
                    className="hologram-send-btn"
                    onClick={handleSend}
                    disabled={loading || !chatInput.trim()}
                >
                    ENGAGE
                </button>
            </div>

            {/* Resize Handles */}
            <div className="hud-resize-handle hologram-resize-handle" onMouseDown={handleResizeRight} />
            <div className="hud-resize-handle-left hologram-resize-handle-left" onMouseDown={handleResizeLeft} />
        </motion.div>
    );
};

export default HologramTerminal;
