# 🌌 GSS ORION V3.6 — PORTAL VIBE MANIFEST
> Point d'entrée unique du style visuel du portail. Remplace STYLE_v2.md, STYLE_v3.md.  
> *Version : 22.0.0 — Claude Sonnet (Thinking) · Consolidated*

---

## 🎭 1. VISION NARRATIVE : "ATLANTIS NEXUS"

L'interface raconte l'histoire de deux entités dans un cockpit spatial tropical :
- **Orion** : Un petit chat roux astronaute, style Pixar 3D. Premier Officier et mascotte. Yeux immenses, pupilles orange vibrantes. Sarcastique mais adorable.
- **Vega-Jar** : Le cerveau d'un savant fou flottant dans un bocal éclairé. Processeur central. Pulse au rythme des tokens LLM.

**Ambiance générale** : Cockpit de vaisseau spatial ultra-lumineux, spacieux, stationné au-dessus d'une mer tropicale paradisiaque. Lumière naturelle chaude, mer turquoise en arrière-plan, atmosphère douce et vivante. Style **Pixar High-Key** : hautes lumières, surfaces douces, ombres légèrement colorées.

> ⚠️ On **ne vise pas** l'ambiance sombre/industrielle. On vise la **clarté, l'élégance, la luminosité**.

---

## 🎨 2. HIÉRARCHIE CHROMATIQUE

### Couleurs Décor (L0 + L1 Backgrounds)
| Rôle | Nom | Hex | Usage |
|:-----|:----|:----|:------|
| Surface principale | Cloud White | `#f4f5f7` | Murs, plafonds, surfaces du cockpit |
| Structure portante | Cool Slate | `#2c3e50` | Cadres, bords de console, détails métal |
| Reflet / Accent doux | Sky Blue | `#74b9ff` | Hublots, reflets de lumière |
| Mer tropicale | Emerald | `#00cec9` | Vista (L0), vue par les fenêtres |

### Couleurs Interface HUD (L3)
| Rôle | Nom | Hex | Usage |
|:-----|:----|:----|:------|
| **Action critique** | **Neon Orange** | **`#ff5f00`** | Boutons actifs, alertes, nav active |
| Valeurs / Données | Electric White | `#f0f0f0` | Données numériques HUD |
| Status OK | Mint Green | `#00b894` | Indicateurs "nominal", pulses |
| Status Alerte | Warm Red | `#d63031` | Erreurs, urgences |
| Texte secondaire | Slate | `#636e72` | Labels mono, légendes |

### Règle d'or
- Fond clair → texte slate foncé.
- Neon Orange : **chirurgical**, réservé aux éléments interactifs et critiques.
- Pas de Cyan dominant. Pas de fond noir total.

---

## 🏗️ 3. MOTEUR DE COMPOSITION : L0→L3

L'interface est une superposition de 4 plans générés séparément et assemblés en React.

### Layer 0 — THE VISTA (Background fixe)
- **Sujet** : Mer tropicale émeraude (Emerald Coast), ciel lumineux, horizon dégagé.  
- **Style** : Vue depuis l'intérieur du cockpit, à travers les grandes baies vitrées. Lumière naturelle chaude.
- **Ratio** : Plein écran (couvre toute la fenêtre du navigateur).
- **Génération** : Image Stitch (photo-réaliste, pas d'UI).

### Layer 1 — THE CHASSIS (Cadre du vaisseau par page)
- **Ratio** : **16:9 impératif** (correspond au viewport web).
- **Chroma Key** : Les fenêtres/hublots/écrans intégrés au décor **DOIVENT** être remplis de **Pure Green #00ff00** exact. Aucun dégradé, aucun anti-aliasing sur le vert.
- **Éclairage** : High-Key. Surfaces blanches ou gris clair. Ambiance intérieure lumineuse.
- **3 variantes** (une par page) :
  1. **L1-D Dashboard** : Grand cockpit frontal, longue console centrale, éclairage jour.
  2. **L1-S Superviseur** : Salle de contrôle technique, murs bardés de moniteurs, style laboratoire clair.
  3. **L1-M Mémoire** : Bibliothèque de bord, étagères incurvées blanches, éclairage zénithal doux.

### Layer 2 — THE PROPS (Objets diegétiques individuels)
- **Fond de génération** : **Pure Blue `#0000ff` exact** (meilleur contraste pour objets clairs).
- **Éclairage** : Plat Pixar (flat lighting) — AUCUNE ombre portée au sol, AUCUNE occlusion ambiante.
- **Angle** : Face caméra ou légèrement de 3/4, fond neutre, objet centré avec 10% de marge.
- **3 entités** :
  - **Orion** : Chat roux Pixar / Disney, petit astronaute, combinaison blanche légère, regard expressif.
  - **Vega-Jar** : Bocal cylindrique transparent, socle inox poli, cerveau humain flottant dans liquide doré, éclairage sous-jacent.
  - **Sacré Bouton** : Gros bouton rouge "Emergency", socle industriel circulaire en acier brossé, couvercle en verre.

### Layer 3 — THE HUD (Interface React flottante)
- Composants React positionnés dans les zones libres du Chassis (sur les vitres Chroma ou les écrans intégrés).
- Style global : Glass-morphism léger sur fond clair (backdrop-filter: blur 12px, surface rgba blanche 85%).
- Le HUD ne couvre pas les Props. Les overlays (Chat, Settings) s'ouvrent latéralement.

---

## 🔡 4. TYPOGRAPHIE

| Usage | Police | Style |
|:------|:-------|:------|
| **Logo Marque [VERROUILLÉ]** | `Cinzel Decorative` | Uppercase, letter-spacing 0.3em, blanc pur |
| Sous-titre marque | `Inter 800` | Orange néon, letter-spacing 0.1em |
| Titres sections HUD | `Outfit 700` | Orange néon ou slate, size 14-18px |
| Labels techniques | `Space Grotesk 500` | Slate, uppercase, size 10-12px |
| Données brutes / mono | `JetBrains Mono` | Electric white ou slate, size 11px |

**Effet HUD** : Titres avec légère **text-shadow orange** pour l'effet "affiché sur verre". Pas de stroke plein.

---

## 🕹️ 5. NAVIGATION & INTERACTIONS DIEGÉTIQUES

### Menu Principal (Header)
Trois pages : `DASHBOARD` · `SUPERVISEUR` · `MÉMOIRE`  
La page active est soulignée d'un trait Orange Néon animé.

### Interactions par Props (Objets physiques → Actions UI)
| Objet | Interaction | Effet |
|:------|:------------|:------|
| **Orion** (chat) | Clic | Ouvre/ferme le Terminal Chat à gauche |
| **Vega-Jar** (cerveau) | Clic | Ouvre/ferme le panneau Settings LLM à droite |
| **Sacré Bouton** | Clic (lever couvercle) | Déclenche la mission Langgraph (build/sync) |

### Feedback Visuel
- Clic sur prop → animation ripple orange autour du props.
- Bouton exécution → pulse rouge + animation "pressé" (scale down + glow).
- Chat ouvert → Orion se tourne légèrement vers l'écran.

---

## 🖥️ 6. PAGES DÉTAIL

### Dashboard
- Vue principale. Cockpit frontal. Props visibles (Orion bas-gauche, Vega bas-droit, Bouton centre).
- HUD : Message de bienvenue minimaliste, statut système (OPERATIONAL).

### Superviseur
- Salle de contrôle. Vue analytique : Pipeline LangGraph, Télémétrie, Bus d'événements temps réel.
- Grille 3 colonnes : Pulse système (gauche) · Pipeline teams (centre) · Métriques (droite).

### Mémoire
- Bibliothèque de bord. Two colonnes : Archives missions LangGraph · Index documentation.
- Cartes de documents avec icône, titre, type, bouton EXPAND.

---

## 🛠️ 7. SPÉCIFICATIONS TECHNIQUES

### Chroma Key
- L1 Chassis : `#00ff00` pur dans les fenêtres → `filter: url(#chroma-key-green)` en CSS.
- Props L2 : `#0000ff` pur → `filter: url(#remove-blue)` en CSS.
- SVG filters définis une seule fois dans le composant racine.

### Assets
- L0 Vista : `assets/l0_vista.jpg`
- L1 variants : `assets/l1_dashboard.png`, `assets/l1_supervisor.png`, `assets/l1_memory.png`
- L2 Props : `assets/l2_orion.png`, `assets/l2_vega.png`, `assets/l2_button.png`
- Tous générés via **Stitch MCP** — ratio 16:9 pour L1, carré pour L2.

### Animations
- Transitions de page : `opacity` + `translateY(10px)` → 0 sur 0.4s.
- Overlays (Chat/Settings) : slide depuis le bord (X ±300px) sur 0.3s.
- Props : hover → `scale(1.03)` + `filter: brightness(1.05)`, transition 0.2s.

---

*Ce fichier remplace `STYLE_v2.md` et `STYLE_v3.md` qui sont archivés.*  
*Version : 22.0.0 — Status : SOURCE OF TRUTH*
