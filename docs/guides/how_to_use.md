# GSS Orion V3 — Guide d'utilisation complet

> Ce guide explique honnêtement ce que fait chaque partie du système,
> ce qui est automatisé, ce qui est manuel, et ce qui nécessite un LLM actif.

---

## Les 2 couches : MOI vs LE SUPERVISOR

### Couche 1 : L'Architecte (Moi, dans l'IDE)

**C'est moi** — l'IA dans ton IDE (Gemini/Antigravity).

| Ce que je fais | Comment |
|:---------------|:--------|
| Écrire/modifier du code | Tu me demandes, j'édite les fichiers |
| Exécuter des commandes `make` | Je lance `make test`, `make lint`, etc. |
| Debugger | J'analyse les erreurs et je corrige |
| Documenter | J'écris les audits, README, guides |
| Architecturer | Je prends les décisions de design |

**Je ne suis PAS le LangGraph supervisor.** Je le code, il tourne.

### Couche 2 : Le Supervisor (LangGraph)

**C'est du code** dans `core/graph/`. Quand tu exécutes une "mission", voici le flux exact :

```
make graph TASK="Audit the codebase"
 │
 ├─→ core/graph/compiler.py → execute_graph("Audit the codebase")
 │     │
 │     ├─→ supervisor_node() → "Quelle équipe pour cette tâche ?"
 │     │     └─→ core/graph/router.py → analyse les mots-clés → "INTEGRITY"
 │     │
 │     ├─→ INTEGRITY team → governance_node + core_node
 │     │     └─→ Scanne brain/principles.json, vérifie R01-R10
 │     │     └─→ Pas de LLM (pure filesystem analysis)
 │     │
 │     ├─→ supervisor_node() → prochain team → "QUALITY"
 │     │
 │     ├─→ QUALITY team → critik → corrector → qualifier
 │     │     └─→ critik analyse la tâche
 │     │     └─→ corrector appelle core/llm.py ← ICI LE LLM EST APPELÉ
 │     │     └─→ qualifier valide
 │     │
 │     ├─→ ... boucle jusqu'à MAX_ITERATIONS (5) ou FINISH
 │     │
 │     └─→ POST-MISSION: record_activity() → brain/scores.json mis à jour
 │
 └─→ Retourne {status: "COMPLETED", teams_visited: [...], results: [...]}
```

### Ce que le supervisor NE FAIT PAS

- ❌ **Il ne modifie pas les fichiers source** (core/, ops/, portal/)
- ❌ **Il ne fait pas de git commit**
- ❌ **Il ne parle pas comme un chatbot** — il retourne du JSON
- ❌ **Sans LLM (Ollama/Cloud), les réponses sont `[SIM] No LLM available...`**

### Ce que le supervisor FAIT réellement

- ✅ Route les tâches vers la bonne équipe (par mots-clés)
- ✅ Exécute des analyses filesystem (principalement dans INTEGRITY)
- ✅ Appelle le LLM pour les équipes QUALITY et STRATEGY (si disponible)
- ✅ Incrémente les scores des agents dans `brain/scores.json`
- ✅ Émet des événements dans `logs/events.jsonl`

---

## Le Frontend (Atlantis Dashboard)

### Comment le lancer

```
make portal
```

Cela lance :
- **Backend** : FastAPI sur `http://localhost:8000`
- **Frontend** : React/Vite sur `http://localhost:5173`
- **Watchdog** : sentinelle sur port 21230

### Ce qu'on voit dans le dashboard

1. **Header** : pulse (NOMINAL/WARNING), version
2. **Mission Input** : un champ texte + bouton "EXECUTE"
3. **Terminal** : logs en temps réel (événements du bus)
4. **System Panel** : télémétrie, résultats de mission

### Quand tu tapes une mission dans le chat frontend

Le frontend fait un `POST /v1/graph/run` avec `{"task": "ta mission"}`.
Le backend exécute `execute_graph(task)` et retourne le résultat JSON.

**Ce n'est PAS un chat conversationnel.** C'est un lanceur de mission one-shot.
Tu obtiens un rapport structuré, pas une réponse en langage naturel.

---

## Les commandes VRAIMENT utiles au quotidien

### Cycle de session typique

```bash
# 1. OUVRIR UNE SESSION
make boot                  # Lance sentinelles + sync + affiche le status

# 2. TRAVAILLER (me demander des modifications dans l'IDE)
#    ... tu codes avec moi ...

# 3. VÉRIFIER SON TRAVAIL
make test                  # 84 tests, 2 workers
make lint                  # ruff check + format

# 4. CONSTRUIRE (avant un commit)
make build                 # lint → test → sync → audit → crystallize → commit

# 5. FERMER LA SESSION
make exit                  # crystallize + stop sentinels
```

### Commandes individuelles (à la carte)

| Commande | Quand l'utiliser | Ce qu'elle fait concrètement |
|:---------|:-----------------|:---------------------------|
| `make test` | Après chaque modification | 84 tests pytest, 2 workers xdist, coverage 62% |
| `make lint` | Avant un commit | ruff check + auto-fix + format |
| `make audit` | Vérifier la constitution | Scanne R01-R10 (SRP, VERSION, secrets...) |
| `make status` | Check rapide | Version, pulse, mémoire |
| `make graph TASK="..."` | Tester le supervisor | Lance une mission LangGraph (mode SIM sans Ollama) |
| `make leaderboard` | Voir les scores agents | Classement par score/weight/usage |
| `make memory-status` | Voir les learnings | Combien d'entrées pending/active |
| `make validate` | Validation complète | 10 étapes, sentinels hot, ~2min |
| `make crystallize` | Sauver l'état | bridge + atlas + memory + flags + integrity |

### Commandes rarement utilisées

| Commande | Quand |
|:---------|:------|
| `make memory-log CAT="pattern" MSG="..."` | Quand tu veux loguer un apprentissage |
| `make memory-compact` | Si `memory.json` dépasse 100 entrées |
| `make rag-index` | Reconstruire l'index de recherche |
| `make rag-query Q="..."` | Chercher dans brain/ + .agents/ |
| `make check-flags` | Injecter des findings dans la roadmap |
| `make shadow-sync` | Commit rapide local |

---

## Le LLM : avec ou sans ?

### Sans LLM (état actuel)

Le système fonctionne à **80%** sans LLM :
- ✅ Tests, lint, governance, sync, sentinels, memory, RAG, integrity
- ⚠️ Les missions LangGraph retournent `[SIM] No LLM available`
- ⚠️ Les équipes QUALITY/STRATEGY ne produisent pas de vraie analyse

### Avec Ollama (recommandé pour le local)

```bash
# 1. Installer Ollama (https://ollama.com)
# 2. Télécharger un modèle
ollama pull llama3.2

# 3. Lancer Ollama (il écoute sur localhost:11434)
ollama serve

# 4. Maintenant les missions sont réelles
make graph TASK="Audit the quality of core/graph/router.py"
```

Le `core/llm.py` auto-détecte Ollama sur `localhost:11434`.

### Avec un LLM cloud

```bash
# Mettre la clé dans .env
GEMINI_API_KEY=xxx      # ou
OPENAI_API_KEY=xxx      # ou
ANTHROPIC_API_KEY=xxx
```

---

## Les sentinelles : comment ça marche

### Architecture

```
Watchdog (port 21230, TCP PulseServer)
├── atlas          — snapshot système toutes les 60s
├── resources      — CPU/RAM, purge fantômes toutes les 15s
├── git_drift      — analyse git status toutes les 60s
├── log_rotator    — archivage vieux logs toutes les 3600s
└── knowledge      — seuil d'ingestion mémoire toutes les 120s

Self-Healing
└── surveille le port 21230, restart watchdog si mort (max 3 tentatives)
```

### Commandes

```bash
make sentinels-start     # Lance le watchdog (daemon)
make sentinels-verify    # Vérifie que le port 21230 répond
make sentinels-stop      # Arrête proprement
```

Les sentinelles tournent en background. Elles écrivent :
- `logs/atlas.json` — snapshot système
- `logs/events.jsonl` — événements bus
- `logs/sentinel_alerts.jsonl` — alertes
- `logs/watchdog.pid` — PID du processus

---

## Flux de données concret

```
brain/bridge.json       ← crystallize écrit ici (pulse, version, last_session)
brain/memory.json       ← adaptive_memory écrit ici (learnings)
brain/scores.json       ← dynamic_orchestrator écrit ici (agent scores)
brain/manifest.json     ← sync.manifest écrit ici (file hashes)
brain/principles.json   ← SOURCE DE VÉRITÉ (tu le modifies manuellement)
brain/personality.json  ← SOURCE DE VÉRITÉ (tu le modifies manuellement)

experts/registry.yaml   ← SOURCE DE VÉRITÉ STATIQUE (type, weight, description)
experts/rules/*.yaml    ← SOURCE DE VÉRITÉ (routing rules, roadmap, governance)

logs/*                  ← Tout est jetable et non commité (.gitignore)
```

---

## Résumé : tes actions manuelles

| Action | Quand | Comment |
|:-------|:------|:--------|
| **Créer/modifier du code** | Développement | Me demander dans l'IDE |
| **`make boot`** | Début de session | Terminal |
| **`make test`** | Après modifications | Terminal |
| **`make build`** | Avant push | Terminal |
| **`make exit`** | Fin de session | Terminal |
| **Installer Ollama** | Si tu veux des missions LLM réelles | 1 fois |
| **Modifier brain/*.json** | Changer les principes, personnalité | Éditeur |
| **Modifier experts/rules/*.yaml** | Changer les règles de routing | Éditeur |
