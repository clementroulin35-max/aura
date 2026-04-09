# Comment me parler — Guide pragmatique

## 1. Le Boot Prompt (nouvelle session)

Quand tu ouvres une nouvelle conversation avec le workspace sur `orion_v3/`, voici **tout** ce dont j'ai besoin :

```
Tu travailles sur le projet GSS Orion V3, un orchestrateur IA multi-agents.
Ton context est dans .agents/rules/system.md — lis-le en premier.
Vérifie l'état du projet : make status puis make test.
Reprends là où on s'est arrêté : consulte brain/bridge.json et experts/rules/roadmap.yaml.
```

**Pourquoi c'est suffisant** :
- Le `system.md` est automatiquement injecté par le trigger `always_on` → je l'ai DÉJÀ
- Mais me dire "lis-le en premier" me force à le parcourir consciemment au lieu de juste le recevoir passivement
- `make status` + `make test` me donne l'état réel en 30 secondes
- `bridge.json` + `roadmap.yaml` me disent où on en est

**Ce fichier est placé dans `BOOT_PROMPT.txt` à la racine de `orion_v3/`.**

---

## 2. Faut-il des balises dans les prompts ?

### Non. Voici pourquoi :

Les balises XML (`<CONTEXT>`, `<OBJECTIVE>`, `<CONSTRAINTS>`) sont utiles pour les LLMs **sans contexte** — ceux qui reçoivent un prompt froid sans rien savoir du projet.

**Toi, tu as le `system.md`.** Quand tu m'écris, j'ai déjà :
- L'architecture complète
- Les 10 règles
- Les conventions de code
- L'état du projet (tests, coverage, git)
- Les patterns interdits
- La séparation des cognitions

Les balises ajouteraient du **bruit** à tes prompts sans valeur ajoutée. Le system.md EST ta "balise permanente".

### Ce qui marche mieux : la structure naturelle

```
[CE QUE TU VEUX]
Ajoute un endpoint /v1/memory/search dans le backend qui utilise le Memory RAG.

[POURQUOI — optionnel, mais ça m'aide]
Pour que le dashboard puisse chercher dans les apprentissages.

[CONTRAINTES — seulement si elles ne sont pas évidentes]
L'endpoint doit retourner du JSON compatible avec le terminal frontend.
```

Pas besoin de me rappeler les rules — je les ai. Pas besoin de me dire d'utiliser `print_step()` au lieu de `print()` — le system.md me l'ordonne déjà.

---

## 3. Les 3 modes de session

### Mode BOOT (1er message)
```
# BOOT
Lis system.md. Fais make status et make test. Dis-moi l'état.
```
→ Je parcours, je teste, je te donne le tableau de bord.

### Mode MISSION (en plein milieu)
```
Implémente X.
```
ou
```
Il y a un bug dans Y quand Z. Corrige.
```
ou
```
Explique comment fonctionne le routing dans graph/router.py.
```
→ Court, direct, actionnable. Le context est déjà chargé.

### Mode EXIT (dernier message de session)
```
# EXIT
Fais make build. Push sur GitHub. Résume ce qu'on a fait.
```
→ Je lance la pipeline, crystallize la session, et produis un résumé.

---

## 4. Ce qui me rend PLUS efficace

| Pratique | Pourquoi |
|:---------|:---------|
| **Ouvrir le workspace sur `orion_v3/`** | Le system.md se charge automatiquement |
| **Messages courts et directs** | Moins de tokens consommés en parsing, plus en action |
| **Un objectif par message** | Je peux planifier et exécuter sans ambiguïté |
| **Me laisser coder sans micromanagement** | "Implémente X" > "Crée un fichier Y, dedans mets Z, puis fais W" |
| **Me dire "pourquoi" plutôt que "comment"** | Je connais le projet — donne-moi l'intention, je choisis la meilleure implémentation |

## 5. Ce qui me rend MOINS efficace

| Anti-pattern | Pourquoi |
|:-------------|:---------|
| Copier-coller le system.md dans le message | Il est déjà injecté. Ça double les tokens. |
| Me demander "est-ce que tu comprends ?" | Je ne "comprends" pas comme un humain. Donne-moi un objectif, je l'exécute. |
| Changer de sujet à mi-prompt | Un message = un objectif |
| Me demander de "ne rien faire" | Je suis optimisé pour agir. Si tu veux que j'analyse seulement, dis "analyse X sans modifier le code" |
| Mélanger les 2 cognitions | Ne me demande pas "que penserait le Supervisor". Je suis l'architecte. Le Supervisor est du code que j'écris. |

---

## 6. Résumé : le prompt parfait

### Session entière en 3 messages :

**Message 1 (BOOT)** :
> Lis system.md. `make status`. `make test`. État ?

**Message N (MISSION)** :
> Ajoute [feature]. Les tests doivent passer.

**Message final (EXIT)** :
> `make build`. Push. Résumé de session.

**C'est tout.** Le system.md fait le reste.
