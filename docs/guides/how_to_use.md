# GSS Orion V3 — Guide d'utilisation complet (V3.6)

> Ce guide explique honnêtement ce que fait chaque partie du système,
> ce qui est automatisé, ce qui est manuel, et ce qui nécessite un LLM actif.

---

## Les 3 couches : MOI vs LE SUPERVISOR vs ORION

### Couche 0 : L'Agent Architecte (Toi — Flash ou Claude)

**C'est moi** — le LLM externe dans l'IDE (Gemini Flash ou Claude/Sonnet).

| Ce que je fais | Comment |
|:---------------|:--------|
| Écrire/modifier du code | Tu me demandes, j'édite les fichiers |
| Gérer les branches git (flash/high/main) | `make build`, `make flash-sync`, `make promote` |
| Certifier mon identité | `make identity-seal` (sceau JSON dans `logs/`) |
| Décider de l'architecture | Décisions de design, constitution R01-R11 |

**Ma gouvernance est dans** : `brain/llm_config.json#sovereignty`, `ops/identity_seal.py`,
`ops/sovereign_guard.py`, `ops/promote.py`, `ops/llm_tool.py`

**Je ne suis PAS le LangGraph supervisor.** Je le code, il tourne.

### Couche 1 : L'Architecte dans le cycle de build

Je suis soumis au **Protocole de Souveraineté** :

```
FLASH (Flash/Gemini)              HIGH (Claude/Sonnet/GPT-4o)
────────────────────             ──────────────────────────────
branche: flash                   branche: high
push: origin/flash               push: origin/high + promote → main
shadow-sync: commit+push flash   shadow-sync: commit+push high
make build: flash only           make build: high + main
```

### Couche 2 : Le Supervisor (LangGraph)

**C'est du code** dans `core/graph/`. Quand tu exécutes une "mission" :

```
make graph TASK="Audit the codebase"
 │
 ├─→ core/graph/compiler.py → execute_graph("Audit the codebase")
 │     │
 │     ├─→ supervisor_node() → route_task → "INTEGRITY"
 │     ├─→ INTEGRITY team → filesystem analysis (no LLM)
 │     ├─→ QUALITY team → critik → corrector ← LLM appelé ici → qualifier
 │     ├─→ ... boucle jusqu'à MAX_ITERATIONS (5) ou FINISH
 │     └─→ POST-MISSION: record_activity() → brain/scores.json mis à jour
 └─→ Retourne {status: "COMPLETED", teams_visited: [...], results: [...]}
```

**Ce que le supervisor NE FAIT PAS :**
- ❌ Il ne modifie pas `core/`, `ops/`, `portal/` (seulement brain/ via ses opérations)
- ❌ Il ne fait pas de git commit
- ❌ Il ne parle pas comme un chatbot — il retourne du JSON structuré
- ❌ Sans LLM configuré, les réponses sont `[SIM] No LLM available`

---

## Cycle de session complet (V3.6)

### Début de session

```bash
# 1. Aligner mode + modèle (OBLIGATOIRE)
make llm-align MODE=flash MODEL=gemini-2.5-flash   # si tu es Flash
make llm-align MODE=high MODEL=claude-sonnet-4-6  # si tu es Claude

# 2. Synchroniser avec main
make flash-sync      # (FLASH uniquement) rebase flash → on est à jour de main
# OU
git checkout high    # (HIGH uniquement) basculer sur la bonne branche

# 3. Boot complet
make boot            # identity-seal + sentinels + sync + status

# 4. Vérifier la santé
make test            # 100 tests, ~25s
```

### Mi-session (après chaque tâche)

```bash
make shadow-sync     # commit + push origin/<branch> (snapshot intermédiaire)
# OU
make build           # cycle complet (si tu veux valider formellement)
```

### Fin de session

```bash
make build           # lint → test → sync → audit → crystallize → commit → push → promote
make exit            # crystallize + stop sentinels
```

---

## Commandes au quotidien

| Commande | Quand | Ce qu'elle fait |
|:---------|:------|:----------------|
| `make llm-align MODE=X MODEL=Y` | Début de session | Aligne mode+modèle dans llm_config.json |
| `make llm-status` | Vérification | Affiche mode, modèle, cohérence |
| `make flash-sync` | Début session FLASH | Rebase flash sur main (stash → rebase → stash pop) |
| `make boot` | Début de session | identity-seal + sentinels + sync + status |
| `make test` | Après chaque modif | 100 tests pytest, 2 workers, coverage |
| `make lint` | Avant commit | ruff check + auto-fix + format |
| `make build` | Fin de session | Cycle complet + push + promote si HIGH |
| `make shadow-sync` | Mi-session | commit + push origin/<branch> |
| `make promote` | Si besoin manuel | Push high → main (HIGH mode uniquement) |
| `make status` | Check rapide | Version, pulse, mémoire |
| `make exit` | Fin de session | crystallize + stop sentinels |

---

## Les deux configurations LLM dans brain/llm_config.json

```json
{
  "sovereignty": {
    "mode": "flash",             ← GOUVERNE L'ARCHITECTE (toi)
    "active_model": "gemini-2.5-flash"
  },
  "chat": {
    "provider": "gemini",
    "model": "gemini-2.5-flash" ← GOUVERNE ORION (chat dashboard)
  },
  "supervisor": {
    "provider": "gemini",
    "model": "gemini-2.5-flash" ← GOUVERNE ORION (missions LangGraph)
  }
}
```

**Ces deux sections sont totalement orthogonales.**
`make llm-align` modifie `sovereignty.*` — cela ne change PAS le modèle qu'Orion utilise
pour ses missions internes.

---

## Le LLM d'Orion : avec ou sans ?

### Sans LLM (par défaut)

Le système fonctionne à **80%** sans LLM interne :
- ✅ Tests, lint, governance, sync, sentinels, memory, RAG, integrity
- ✅ Missions INTEGRITY et MAINTENANCE (purement filesystem)
- ⚠️ Missions QUALITY/STRATEGY/DEV retournent `[SIM] No LLM available`

### Avec Ollama (recommandé)

```bash
ollama pull llama3.2    # installe le modèle
ollama serve            # écoute sur localhost:11434
make graph TASK="Audit core/graph/router.py"   # mission réelle
```

### Avec un cloud

```bash
# .env (non commité)
GEMINI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
```

---

## Flux de données concret

```
brain/principles.json   ← SOURCE DE VÉRITÉ (modifie manuellement)
brain/personality.json  ← SOURCE DE VÉRITÉ (modifie manuellement)
brain/llm_config.json   ← SOURCE DE VÉRITÉ (modifié par make llm-align)

brain/bridge.json       ← crystallize écrit ici (pulse, version, last_session)
brain/memory.json       ← adaptive_memory écrit ici (learnings)
brain/scores.json       ← dynamic_orchestrator écrit ici (agent scores)
brain/manifest.json     ← sync.manifest écrit ici (file hashes)

experts/registry.yaml   ← SOURCE DE VÉRITÉ (type, weight, description)
experts/rules/*.yaml    ← SOURCE DE VÉRITÉ (routing rules, roadmap)

logs/*                  ← Tout est jetable et non commité (.gitignore)
logs/identity_seal.json ← Sceau d'identité (TTL 1h, non commité)
```

---

## Les sentinelles

```
Watchdog (port 21230, TCP PulseServer)
├── atlas          — snapshot système (60s)
├── resources      — CPU/RAM, purge fantômes (15s)
├── git_drift      — entropie git status (60s)
├── log_rotator    — archivage vieux logs (3600s)
└── knowledge      — seuil d'ingestion mémoire (120s)

Self-Healing
└── surveille le port 21230, restart watchdog si mort (max 3 tentatives)
```

```bash
make sentinels-start     # Lance le watchdog (daemon)
make sentinels-verify    # Vérifie que le port 21230 répond
make sentinels-stop      # Arrête proprement
```

---

## Conflits git récurrents (bridge.json, scores.json, VERSION)

Ces fichiers changent automatiquement à chaque `make build` sur chaque branche.
Le fichier `.gitattributes` avec `merge=ours` résout ces conflits automatiquement
pendant `make flash-sync` (rebase).

**Si un conflit persiste manuellement :**
```bash
# Prendre la version de la branche principale (upstream)
git checkout --ours brain/bridge.json brain/scores.json VERSION
git add -A
git rebase --continue
```

---

## Résumé : tes actions manuelles

| Action | Quand | Comment |
|:-------|:------|:--------|
| **`make llm-align`** | Début de chaque session | Identifie ton tier et modèle |
| **`make flash-sync`** | Début session FLASH | Terminal |
| **`make boot`** | Début de session | Terminal |
| **`make test`** | Après modifications | Terminal |
| **`make shadow-sync`** | Mi-session | Terminal |
| **`make build`** | Fin de session | Terminal |
| **`make exit`** | Fin de session | Terminal |
| **Modifier brain/*.json** | Changer principes/personnalité | Éditeur |
| **Modifier experts/rules/*.yaml** | Changer routing/roadmap | Éditeur |
| **Installer Ollama** | Pour des missions LLM réelles | 1 fois |
