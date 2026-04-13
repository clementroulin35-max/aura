import { useEffect } from 'react';

export function useSocketEvents() {
  useEffect(() => {
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
              msgContent = `[${data.actor}] ${data.event}: ${data.message || ''}`;
            } else {
              msgContent = data.message || JSON.stringify(data);
            }

            let type = 'info';
            if (data.status === 'OK' || data.status === 'SUCCESS') type = 'success';
            if (data.status === 'WARN' || data.status === 'FAILED') type = 'warn';
            if (data.status === 'ERROR') type = 'error';

            window.dispatchEvent(new CustomEvent('ORION_LOG', {
              detail: { content: msgContent, type }
            }));

            // Special Case: Mission Completion — Trigger feedback loop
            if (data.actor === "COMPILER" && data.event === "MissionEnd") {
              window.dispatchEvent(new CustomEvent('MISSION_COMPLETED', {
                detail: data
              }));
            }
          } catch(e) {
            console.error("WS Parse error", e);
          }
        };

        ws.onclose = () => {
          console.log("[WS] Disconnected, attempting reconnect in 5s...");
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
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);
}
