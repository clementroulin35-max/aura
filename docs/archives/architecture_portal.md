# Plan Architecture — Portal Orion V3 (v22.0.0)

Refonte de l'arborescence du portail avant intégration des assets Stitch.  
**Règle** : déplacer les fichiers existants sans les modifier. Aucune correction de code.

---

## Frontend — Nouvelle Arborescence

```
portal/frontend/src/
│
├── main.jsx                    # Entrée app (inchangé)
│
├── styles/                     # CSS globaux uniquement
│   ├── index.css               # Reset + variables CSS (tokens)
│   ├── globals.css             # Utilitaires globaux, keyframes
│   └── App.css                 # Layout racine app-container
│
├── lib/                        # Utilitaires purs (pas de React)
│   ├── api.js                  # Client HTTP / fetch wrappers
│   └── constants.js            # [NEW] Constantes partagées (endpoints, etc.)
│
├── hooks/                      # Custom React hooks
│   └── [vides pour l'instant — à créer]
│   └── useSystemStatus.js      # [FUTURE] État système
│   └── useChat.js              # [FUTURE] Logique chat
│
├── assets/
│   ├── backgrounds/            # Layer 0 — La Vista (scènes environnement)
│   │   └── l0_vista.jpg
│   ├── decor/                  # Layer 1 — Le Chassis (cadres de pages)
│   │   ├── l1_dashboard.png
│   │   ├── l1_supervisor.png
│   │   └── l1_memory.png
│   ├── props/                  # Layer 2 — Objets diegétiques
│   │   ├── l2_orion.png
│   └── icons/                  # SVG icons, favicon
│       ├── react.svg
│       └── vite.svg
│
├── components/
│   ├── layout/                 # Composants de structure (toutes pages)
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   └── Footer.jsx          # [NEW — vide placeholder]
│   │
│   ├── hud/                    # HUD overlays (flottants, triggered par props)
│   │   ├── ChatPanel.jsx       # ← Chat.jsx renommé
│   │   ├── ChatPanel.css
│   │   ├── SettingsPanel.jsx   # ← LLMSettings.jsx renommé
│   │   └── SettingsPanel.css
│   │
│   ├── props/                  # Les 3 objets diegétiques interactifs
│   │   ├── PropOrion.jsx       # [NEW] Orion cat — click → Chat
│   │   └── props.css           # CSS partagé de tous les props
│   │
│   └── shared/                  # Composants réutilisables multi-pages
│       ├── SystemPanel.jsx
│       ├── SystemPanel.css
│       ├── Terminal.jsx
│       ├── Terminal.css
│       ├── MissionPreview.jsx
│       └── MissionPreview.css
│
├── views/                      # Vues HUD insérées dynamiquement dans les pages
│   ├── DashboardView.jsx       # [NEW] Vue vide — cockpit accueil
│   ├── DashboardView.css
│   ├── SupervisorView.jsx      # [NEW] Analytics LangGraph
│   ├── SupervisorView.css
│   ├── MemoryView.jsx          # [NEW] Archives + Docs
│   └── MemoryView.css
│
└── pages/                      # Pages complètes (L1 chassis + vue)
    ├── DashboardPage.jsx       # [NEW] Assemble L1-D + DashboardView
    ├── SupervisorPage.jsx      # [NEW] Assemble L1-S + SupervisorView
    └── MemoryPage.jsx          # [NEW] Assemble L1-M + MemoryView
```

---

## Backend — Nouvelle Arborescence

```
portal/backend/
│
├── app.py                      # FastAPI app factory (inchangé)
├── __init__.py
│
├── routers/                    # Routes HTTP (existantes)
│   ├── __init__.py
│   ├── orion.py                # Chat / Orion endpoint
│   ├── atlas.py                # Atlas / status
│   ├── events.py               # SSE event stream
│   ├── graph.py                # LangGraph triggers
│   └── llm_config.py           # LLM config CRUD
│
├── services/                   # [NEW] Logique métier découplée des routes
│   ├── __init__.py
│   ├── llm_service.py          # ← Extraire logique de llm_registry.py
│   ├── chat_service.py         # [NEW] Orchestration chat + historique
│   └── graph_service.py        # [NEW] Interface LangGraph
│
├── schemas/                    # [NEW] Pydantic models (validation I/O)
│   ├── __init__.py
│   ├── chat.py                 # ChatRequest, ChatResponse
│   ├── config.py               # LLMConfig model
│   └── system.py               # SystemStatus, Metrics
│
├── middleware/                 # [NEW] Auth, CORS, rate limiting
│   ├── __init__.py
│   └── cors.py                 # ← Extraire config CORS de app.py
│
└── utils/                      # [NEW] Helpers partagés backend
    ├── __init__.py
    └── prompt_builder.py       # ← orion_prompt.py déplacé ici
```

---

## Logique de Classification

### Frontend — Règle des 5 zones
| Zone | Nature | Modifiable par Flash ? |
|:-----|:-------|:----------------------|
| `pages/` | Assemblage (1 fichier = 1 URL) | ⚠️ Risque faible |
| `views/` | Contenu HUD par page | ✅ Safe — scope limité |
| `components/layout/` | Structure globale (Header) | ❌ Ne pas toucher sans aval |
| `components/hud/` | Overlays triggered | ✅ Safe — isolés |
| `components/props/` | Objets diegétiques | ✅ Safe — un fichier par prop |
| `components/shared/` | Réutilisables | ⚠️ Impact multi-pages |
| `styles/` | Tokens globaux | ❌ Ne pas toucher sans aval |
| `lib/` | Utilitaires purs | ✅ Safe — pas de JSX |

### Backend — Règle de séparation
- **Router** = seulement `@router.get/post` → appel service
- **Service** = toute la logique métier
- **Schema** = toute la validation Pydantic

---

## Fichiers à Déplacer (existants → nouvelle cible)

### Frontend
| Source | Destination |
|:-------|:-----------|
| `src/index.css` | `src/styles/index.css` |
| `src/App.css` | `src/styles/App.css` |
| `src/api.js` | `src/lib/api.js` |
| `src/components/Header.jsx` | `src/components/layout/Header.jsx` |
| `src/components/Header.css` | `src/components/layout/Header.css` |
| `src/components/Chat.jsx` | `src/components/hud/ChatPanel.jsx` |
| `src/components/Chat.css` | `src/components/hud/ChatPanel.css` |
| `src/components/LLMSettings.jsx` | `src/components/hud/SettingsPanel.jsx` |
| `src/components/LLMSettings.css` | `src/components/hud/SettingsPanel.css` |
| `src/components/SystemPanel.jsx` | `src/components/shared/SystemPanel.jsx` |
| `src/components/SystemPanel.css` | `src/components/shared/SystemPanel.css` |
| `src/components/Terminal.jsx` | `src/components/shared/Terminal.jsx` |
| `src/components/Terminal.css` | `src/components/shared/Terminal.css` |
| `src/components/MissionPreview.jsx` | `src/components/shared/MissionPreview.jsx` |
| `src/components/MissionPreview.css` | `src/components/shared/MissionPreview.css` |
| `src/assets/hero.png` | `src/assets/backgrounds/hero.png` |
| `src/assets/*.svg` | `src/assets/icons/` |

### Backend
| Source | Destination |
|:-------|:-----------|
| `backend/orion_prompt.py` | `backend/utils/prompt_builder.py` |

> [!NOTE]
> `llm_registry.py` reste à sa place pour l'instant — il sera scindé en `services/llm_service.py` lors de la refonte backend complète.

---

## Verification Plan

- `make portal` doit démarrer sans erreur après les déplacements.
- Les imports dans `App.jsx` seront mis à jour en 1 seule passe lors de l'intégration Stitch.

