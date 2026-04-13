import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../lib/constants.js';

export function useSystemStatus() {
  const [status, setStatus] = useState('OFFLINE');
  const [config, setConfig] = useState(null);
  const [ollamaReachability, setOllamaReachability] = useState('idle');
  const [allModels, setAllModels] = useState({});
  const hasAudited = useRef(false);

  const auditNeuralSync = async (event = null) => {
    // If it's a manual UI trigger (event exists), we always fire.
    // Otherwise, it's the startup mount call.
    if (!event && hasAudited.current) return;
    if (!event) hasAudited.current = true;

    if (event?.detail?.status) {
      setStatus(event.detail.status);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/v1/llm/config`);
      const data = await res.json();
      const configData = data.config || data;
      const providers = configData.providers || {};
      
      console.log("[SYS] Neural Sync Config:", configData);
      setConfig(configData);

      // --- HIGH PRIORITY: Llama Connectivity Test ---
      const ollamaProv = providers.ollama;
      if (ollamaProv?.enabled) {
          // Fire log immediately
          window.dispatchEvent(new CustomEvent('ORION_LOG', { 
              detail: { content: `[SYS] Tentative de connexion au serveur Llama: ${ollamaProv.base_url || 'local'}...`, type: 'info' } 
          }));
          setOllamaReachability('checking');

          // Async Task for Llama Result
          (async () => {
              try {
                  const testRes = await fetch(`${API_BASE}/v1/llm/test`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ provider: 'ollama', api_key: ollamaProv.base_url }),
                  });
                  const testData = await testRes.json();
                  setOllamaReachability(testData.success ? 'reachable' : 'unreachable');
                  
                  if (testData.success) setStatus('ONLINE');

                  window.dispatchEvent(new CustomEvent('ORION_LOG', { 
                      detail: { 
                          content: testData.success ? `[SUCCESS] Serveur Llama détecté et opérationnel!` : `[ERROR] Échec de connexion Llama.`, 
                          type: testData.success ? 'success' : 'error' 
                      } 
                  }));
              } catch (e) {
                  setOllamaReachability('unreachable');
              }
          })();
      }

      // Check for other ONLINE triggers (Cloud keys)
      const hasCloudKey = Object.entries(providers).some(([pid, p]) => 
          p.enabled && pid !== 'ollama' && p.api_key && p.api_key.length > 8
      );
      if (hasCloudKey) setStatus('ONLINE');

      // --- SECONDARY PRIORITY: Model Scanning (Non-blocking) ---
      const modelPromises = Object.entries(providers)
          .filter(([_, p]) => p.enabled)
          .map(([pid, _]) => 
              fetch(`${API_BASE}/v1/llm/models/${pid}`)
                  .then(res => res.json())
                  .then(models => ({ pid, models }))
                  .catch(() => null)
          );

      Promise.all(modelPromises).then(results => {
          const newModelMap = {};
          results.forEach(r => { if (r) newModelMap[r.pid] = r.models; });
          setAllModels(newModelMap);
      });

    } catch (e) {
      setStatus('OFFLINE');
    }
  };

  useEffect(() => {
    auditNeuralSync();
    window.addEventListener('ORION_SYNC_REQ', auditNeuralSync);
    return () => window.removeEventListener('ORION_SYNC_REQ', auditNeuralSync);
  }, []);

  return { status, config, ollamaReachability, allModels };
}
