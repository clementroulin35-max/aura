# SPÉCIFICATIONS FONCTIONNELLES : PORTAL ORION V3.6—ATLANTIS NEXUS

Ce document constitue le référentiel complet du fonctionnement, des interactions et de l'architecture du Portal Orion. Il garantit la traçabilité de chaque comportement utilisateur et de chaque pont technique entre l'interface diegetique et le Nexus.

---

## 1. VISION & ARCHITECTURE GLOBALE

### 1.1 Philosophie du Design
Le Portal Orion est une interface **diégétique** simulant le cockpit d'un vaisseau spatial. L'UX privilégie l'immersion ("Pixar High-Key") via la glassmorphisme, les animations organiques et la réactivité en temps réel.

### 1.2 Structure du Projet
- **Frontend** : React (Vite), Framer Motion (Animations/HUD), CSS Natif.
- **Backend** : FastAPI (Python), WebSocket pour le streaming de logs, REST pour les ressources.
- **Chemins Clés** :
    - `App.jsx` : Orchestrateur global de l'état et du cycle de vie.
    - `Header.jsx` : Contrôle de navigation et indicateurs de statut.
    - `useSocketEvents.js` : Pont neural (WebSocket) traitant les flux asynchrones.
    - `portal/backend/routers/` : Points de terminaison API (Resources, Graph, Orion, LLM).

---

## 2. NAVIGATION ET NAVIGATION ET ÉTAT GLOBAL

### 2.1 Cycle de Vie de la Session (Boot)
1. **Établissement du Lien** : À l'initialisation, le hook `useSocketEvents` ouvre un tunnel WebSocket vers `ws://localhost:8000/ws/events`.
2. **Synchronisation Initiale** : Récupération automatique de la liste des projets (`/api/v1/resources/projects`) et de la configuration LLM.
3. **Dispatch d'Audit** : Le système envoie un log de succès "[SYS] Lien WebSocket établi" dès que la connexion est confirmée.

### 2.2 Gestion des Vues (Pages)
- **Mission Control (`PROJECTS`)** : Vue de gestion des archives et création de projets. Fond d'écran fixe.
- **Workstation (`DASHBOARD`)** : Vue cockpit interactive. Le fond d'écran s'ajuste dynamiquement au projet sélectionné (`bgIndex`).
- **Transitions** : Utilisation du composant `HyperspaceJump` pour les changements de vue, simulant un saut en hyperespace (Phase: idle -> warm -> jump -> exit).

### 2.3 État de l'UI (`ui`)
L'objet `ui` dans `App.jsx` suit la visibilité de chaque HUD :
- `chatOpen`, `settingsOpen`, `missionDraftOpen`, etc.
- `executing` : Verrouille certaines interactions pendant qu'une mission LangGraph est en cours.
- `orionMuted` : État de déconnexion vocale/visuelle du compagnon.

---

## 3. PROTOCOLE D'INTERACTION HUD

Tous les HUD (Heads-Up Display) héritent d'un comportement standard via le composant `nexus-hud-panel`.

### 3.1 Déplacement (Drag)
- **Zone de saisie** : Seul le Header du HUD (`hud-header`) permet le déplacement.
- **Isolation** : Les boutons et inputs à l'intérieur du HUD interceptent les événements pour ne pas déclencher de drag involontaire.
- **Contraintes** : Le drag est limité par `getDragConstraints`.
    - `TOP` : 68px (évite de recouvrir le Header du site).
    - `BOTTOM` : 125px (garde la fenêtre au-dessus de la "Ledge" du footer).
    - `LEFT/RIGHT` : 5px de marge de sécurité.

### 3.2 Redimensionnement (Resize)
- **Poignée Droite** : Redimensionne en largeur et hauteur depuis le coin inférieur droit.
- **Poignée Gauche** : Redimensionne en largeur depuis la gauche, avec ajustement dynamique de la position `x` pour simuler une extension naturelle.
- **Bornes** : Chaque HUD définit ses `minWidth` et `minHeight` (Ex: Terminal 610x200).

### 3.3 Focus & Z-Index
- Le clic sur n'importe quelle partie d'un HUD (capture via `onPointerDownCapture`) met à jour `activeWindow`.
- Le HUD actif reçoit un `zIndex` de `var(--z-hud-top)`, les autres restent à `var(--z-hud-base)`.

---

## 4. MODULES DÉTAILLÉS

### 4.1 TERMINAL ORION (Hologram Terminal)
Interface de communication directe avec l'IA et flux de logs.
*   **Onglet CHAT** : 
    - Input auto-extensible. 
    - Envoi via `Enter` ou bouton `ENGAGE`. 
    - Récupération via `POST /v1/orion/chat`.
    - **Logic d'Interprétation** : Le système extrait les balises `[MOOD]`, `[BUBBLE]` et `[MISSION_JSON]`. Si un JSON de mission est détecté, il peuple automatiquement le **Mission Forge**.
*   **Onglet LOGS** :
    - Affichage chronologique inverse des événements système.
    - Code couleur : Cyan (Info), Vert (Success), Jaune (Warn), Rouge (Error).
    - Auto-scroll forcé vers le bas à chaque nouveau message.

### 4.2 MISSION FORGE (Tactical Orchestration)
Outil de création et surveillance des missions LangGraph.
*   **Éditeur de Mission** :
    - Zone de texte JSON avec validation de syntaxe en temps réel avant sauvegarde.
    - Bouton `SAUVEGARDER` : Envoie à `/v1/resources/save_mission`.
*   **Exécution** :
    - Bouton `ENGAGER LA MISSION` : Déclenche l'orchestration via `/v1/graph/run`.
    - **UI d'Exécution** : Activation d'un portail de diagnostic hexagonal animé. 
    - Étiquette de statut dynamique : Affiche en temps réel le dernier log reçu (`ORION_LOG`).
*   **Résultats** :
    - Groupage automatique des fichiers générés par `mission_id`.
    - Clic sur un fichier : Ouvre instantanément le **Memory Archive**.

### 4.3 NEURAL SYNC (LLM Config)
Centre de contrôle de l'intelligence système.
*   **Détection Ollama** : Ping automatique du serveur local via `/v1/llm/test`. Met à jour le voyant de connectivité (READY, LINK FAILED, SYNC OK).
*   **Gestion des Fournisseurs** : Switches d'activation pour Gemini, OpenAI, Claude, etc. Validation des clés API via API Backend avec retour visuel (Card verte/rouge).
*   **Tiers Neuronaux** :
    - **ALU** : Modèles légers (Flash, Haiku).
    - **GOLD** : Modèles équilibrés.
    - **DIAMANT** : Modèles de raisonnement (Pro, Sonnet).
    - L'utilisateur peut assigner un tier spécifique au Chat ou au Superviseur.

### 4.4 MEMORY ARCHIVE (Lecteur de Documents)
Rendu des livrables et rapports de mission.
*   **Affichage** : Support complet du Markdown (Gfm) via `ReactMarkdown`.
*   **Gestion d'Erreur** : Si `read_project_file` échoue (404), le HUD bascule en mode **"Pop-up d'erreur"** :
    - Redimensionnement automatique à 450x350.
    - Masquage du pied de page décoratif.
    - Affichage d'une icône de diagnostic rouge et d'un message d'alerte centré.
*   **Synchronisation** : Toute ouverture de doc émet un log système dans le terminal.

### 4.5 SYSTEM MONITORING (Télémétrie)
Vue d'ensemble de la santé du Nexus.
*   **Heartbeat** : Animation de pulsation synchronisée avec le statut `ONLINE/OFFLINE`.
*   **Télémétrie Projet** : Décompte des agents déployés, équipes mobilisées et temps de session.
*   **Live Feed Agents** : Liste des agents avec indicateurs d'état (WORKING - pulse vert, QUEUED - jaune, SLEEP - gris). Les statuts `WORKING` sont déclenchés par les événements WebSocket `AGENT_ACTIVE` (Type `TaskStarted`).

---

## 5. COUCHE DE COMMUNICATION (WEBSOCKET & API)

### 5.1 Protocole WebSocket (`events.py`)
Le backend diffuse des objets JSON structurés :
- `actor` : L'entité émettrice (Ex: `GRAPH`, `PERSISTENCE`, `NODE:[Scout]`).
- `event` : Le type d'action (`MISSION_COMPLETED`, `TaskStarted`, `EnvironmentReady`).
- `status` : `OK`, `WARN`, `ERROR`.
- `message` / `context` : Le contenu informatif.

### 5.2 Catalogue des Endpoints API Clés
- **Ressources** :
    - `GET /v1/resources/projects` : Liste des missions actives.
    - `GET /v1/resources/project_deliverables/{id}` : Scan des dossiers `projects/` pour trouver les `.md`.
    - `POST /v1/resources/upload-bg` : Upload d'image pour personnalisation cockpit.
- **Orchestration** :
    - `POST /v1/graph/run` : Lancement asynchrone du moteur LangGraph.

---

## 6. LOGIQUE DIÉGÉTIQUE (EFFETS VISUELS)

- **Orion & Vega** : Ces "Accessoires" (Props) réagissent aux événements. Orion "parle" via l'événement `ORION_SPOKE`, affichant une bulle de texte temporaire au-dessus de l'image.
- **Filtres Chroma** : Les éléments `l1-chassis` et les vidéos d'arrière-plan utilisent des filtres SVG (`chroma-key-green`, `chroma-key-blue`) pour simuler la transparence des fenêtres du cockpit sans utiliser de PNG lourds.
- **Scanlines & Flickers** : Effets CSS appliqués aux HUD en erreur pour simuler une défaillance matérielle réaliste.

---
*Fin du document — Version 3.6.8 :: Audit de Vision Utilisateur.*
