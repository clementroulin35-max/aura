import { useEffect, useRef } from 'react';

export function useSocketEvents() {
  const closingRef = useRef(false);

  useEffect(() => {
    closingRef.current = false;
    let ws;
    let reconnectTimeout;

    const connect = () => {
      // API_BASE is usually http://..., replace with ws://
      const wsUrl = "ws://localhost:8000/ws/events";
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[WS] System Neural Link Established");
          window.dispatchEvent(new CustomEvent('ORION_LOG', {
            detail: { content: '[SYS] Lien WebSocket établi avec le Nexus.', type: 'success' }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Format log message
            let msgContent = "";
            if (data.event === "HEARTBEAT") return; // Ignore ping
            
            if (data.actor) {
              msgContent = `[${data.actor}] ${data.event}: ${data.message || data.context || ''}`;
            } else {
              msgContent = data.message || data.context || JSON.stringify(data);
            }

            let type = 'info';
            if (data.status === 'OK' || data.status === 'SUCCESS') type = 'success';
            if (data.status === 'WARN' || data.status === 'FAILED') type = 'warn';
            if (data.status === 'ERROR') type = 'error';

            window.dispatchEvent(new CustomEvent('ORION_LOG', {
              detail: { 
                content: msgContent, 
                type,
                actor: data.actor,
                event: data.event,
                data: data 
              }
            }));

            // Cascade Case: Agent Started Task
            if (data.actor.startsWith("NODE:") && data.event === "TaskStarted") {
                const agentId = data.actor.replace("NODE:[", "").replace("]", "").toLowerCase();
                window.dispatchEvent(new CustomEvent('AGENT_ACTIVE', {
                  detail: { agentId }
                }));
            }

            // Cascade Case: Agent Finished Task
            if (data.actor.startsWith("NODE:") && data.event === "TaskFinished") {
                const agentId = data.actor.replace("NODE:[", "").replace("]", "").toLowerCase();
                window.dispatchEvent(new CustomEvent('AGENT_INACTIVE', {
                  detail: { agentId }
                }));
            }

            // Special Case: Mission Completion — Trigger feedback loop
            if (data.actor === "GRAPH" && data.event === "MISSION_COMPLETED") {
              window.dispatchEvent(new CustomEvent('MISSION_COMPLETED', {
                detail: data
              }));
            }

            // Sync Case: Environment Ready — Trigger Project Refresh
            if (data.actor === "PERSISTENCE" && data.event === "EnvironmentReady") {
              window.dispatchEvent(new CustomEvent('PROJECTS_SYNC', {
                detail: data
              }));
            }
          } catch(e) {
            console.error("WS Parse error", e);
          }
        };

        ws.onclose = () => {
          if (closingRef.current) {
            console.log("[WS] Connection closed intentionally.");
            return;
          }
          console.log("[WS] Disconnected unexpectedly, attempting reconnect in 5s...");
          reconnectTimeout = setTimeout(connect, 5000);
        };
        
        ws.onerror = (err) => {
          console.error("[WS] Error", err);
          ws.close();
        };

      } catch(e) {
        console.error("WS Connect error", e);
      }
    };

    connect();

    return () => {
      closingRef.current = true;
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);
}
