# 🎨 Orion V3 — Stitch Generation Prompts
> Tous les prompts envoyés à Stitch MCP pour la génération des assets du portail.  
> Référence visuelle : `docs/design/ORION_V3_VIBE.md`  
> Version : 22.0.0

---

## 📋 RÉCAPITULATIF DES ASSETS À GÉNÉRER

| ID | Type | Layer | Page | Statut |
|:---|:-----|:------|:-----|:-------|
| L0-VISTA | Image | 0 | Toutes | ⬜ À générer |
| L1-D | Image | 1 | Dashboard | ⬜ À générer |
| L1-S | Image | 1 | Superviseur | ⬜ À générer |
| L1-M | Image | 1 | Mémoire | ⬜ À générer |
| L2-ORION | Image | 2 | Toutes | ⬜ À générer |
| L2-VEGA | Image | 2 | Toutes | ⬜ À générer |
| L2-BUTTON | Image | 2 | Toutes | ⬜ À générer |
| UI-DASH | Interface | 3 | Dashboard | ⬜ À générer |
| UI-SUPER | Interface | 3 | Superviseur | ⬜ À générer |
| UI-MEM | Interface | 3 | Mémoire | ⬜ À générer |

---

## 🌊 L0 — THE VISTA (Background Master)

**Asset ID** : `l0_vista`  
**Type** : Image (Photo-réaliste)  
**Ratio** : 16:9  

```
Aerial view of a pristine tropical paradise from inside a spaceship cockpit window. 
Crystal-clear emerald turquoise ocean below, white sandy beaches, lush tropical islands in the distance. 
Bright natural daylight, soft atmospheric haze, a faint coastal horizon line. 
No UI elements. No people. No text. No aircraft. Pure nature photography style, hyper-real, 8K resolution.
Wide cinematic 16:9 composition, horizon at 30% from top. 8K
```

---

## 🛸 L1-D — Dashboard Cockpit (Chassis Page 1)

**Asset ID** : `l1_dashboard`  
**Type** : Image (Illustration 3D)  
**Ratio** : 16:9 impératif  
**Référence visuelle** : `docs/design/maquette.jpg` (Même composition, sans les props)  
**Technique** : Grande fenêtre centrale remplie de Pure Green `#00ff00`

```
Interior ultra-wide cinematic view of a high-tech spaceship observation deck, Disney-Pixar 3D style. 
THE FRAME: A massive, centered panoramic front window occupies the upper 70% of the screen, with heavy structural pillars on the far left and far right sides (NO windows at the extreme edges of the screen). 
CRITICAL: The entire window area MUST be filled with a perfectly flat, solid, uniform Pure Green #00FF00 (Chroma Key). 
SIDE WALLS: Robust industrial bulkheads on the left and right, filled with detail: small technical monitors, wiring bundles, storage lockers, and aeronautical racks.
FOREGROUND: A wide, solid curved control desk made of matte-finish cream-colored composite and aluminum spans the bottom 30% of the image. 
LEFT CONSOLE AREA: A clean workspace with a glowing holographic blueprint pad and a flat ceramic shelf (Orion's spot).
RIGHT CONSOLE AREA: A laboratory-grade extension with copper cooling pipes, small glass test tubes in racks, and a heavy circular pedestal (Vega Jar's spot).
ATMOSPHERE: Warm, volumetric lighting, rich 'matte' Pixar textures, lived-in clutter. 
Quality: ILM/Disney-Pixar feature film render, 8K resolution, 16:9 ratio.
```

---

## 🔬 L1-S — Superviseur Control Room (Chassis Page 2)

**Asset ID** : `l1_supervisor`  
**Type** : Image (Illustration 3D)  
**Ratio** : 16:9 impératif  
**Technique** : Écrans/fenêtres remplies de Pure Green `#00ff00`

```
Interior view of a futuristic technical control room inside a spaceship, Disney-Pixar 3D style, bright and luminous.
Light gray walls, white ceiling with recessed lighting, clean modern aesthetic.
Multiple large flat monitors mounted on walls — each monitor screen MUST be filled with flat solid pure #00ff00 green (chroma key placeholder). No content on screens.
Central operations desk with keyboard panels, orange-lit status indicators.
One large panoramic side window showing ocean view (replace with pure #00ff00 green).
Technical atmosphere but elegant, not dark. Think Apple Store meets NASA.
High-key lighting, no harsh shadows. 16:9 ultra-wide interior perspective, Disney-Pixar quality. 8K
```

---

## 📚 L1-M — Memory Library (Chassis Page 3)

**Asset ID** : `l1_memory`  
**Type** : Image (Illustration 3D)  
**Ratio** : 16:9 impératif  
**Technique** : Fenêtres remplies de Pure Green `#00ff00`

```
Interior of a futuristic spaceship library and archive room, Disney-Pixar 3D animation style, bright and airy.
Curved white shelves rising to high ceilings, filled with glowing data-pads, binders and technical books.
Warm overhead lighting (zenithal), clean white-cream surfaces, elegant wooden accents.
One large porthole window on the side — MUST be filled with flat solid pure #00ff00 green (chroma key). 
A cozy reading desk in the foreground.
Atmosphere of a luxury private library meets space station. Peaceful, bright, inviting.
High-key lighting, Disney-Pixar quality, 16:9 wide interior perspective. 8K
```

---

## 🐱 L2-ORION — The Cat Mascot (Prop)

**Asset ID** : `l2_orion`  
**Type** : Image (Illustration 3D, transparent-ready)  
**Ratio** : Carré (1:1)  
**Fond** : Pure Blue `#0000ff` exact

```
A cute small ginger orange cat mascot, Disney-Pixar 3D character style.
Wearing a small headset astronaut accent details.
The cat is sitting, looking directly at the camera with huge expressive eyes (pure black pupils).
Slight sardonic smirk expression. Adorable but with a knowing look.
BACKGROUND: Pure Blue `#0000ff` exact — no gradients, no shadows on background, no reflections.
Character centered, slight 3/4 angle, full body visible with 10% margin all around.
Flat studio lighting from front — NO cast shadows, NO ground shadow.
Disney-Pixar feature-film quality. Square composition. 8K
```

---

### 🏺 Jar (Vessel of Vega V4) — Chroma Blue
**Asset ID** : `l2_vega_jar_v4`
**Status** : Finalized for Generation 
```text
A high-fidelity 3D render of a retro-futuristic laboratory containment jar, Pixar-style 3D prop. Industrial cream-colored matte ceramic base. The glass cylinder is perfectly neutral, crystal clear, with NO internal lighting, NO yellow tint, and NO liquid. Minimalist and transparent-looking glass for easier compositing. Background is a solid, flat, uniform Chroma Key Blue #0000FF. Orthographic front view, isolated prop.
```

---

### 🧠 Brain (Neural Core Magenta V4) — Chroma Green
**Asset ID** : `l2_vega_brain_v4`  
**Status** : Finalized for Generation 
```text
A vibrant 3D render of a human brain, neural processor. Style is matte Pixar character prop. INTENSE VIBRANT MAGENTA AND HOT-PINK colors with bright glowing internal neural paths. Soft subsurface scattering. Fine glowing cyan filaments (neural connectors) hang beneath the brain. This brain must pop with high-saturation color to remain visible behind glass. Background is a solid, flat, uniform Chroma Key Green #00FF00. Isolated prop, floating.
```


---

## 🔴 L2-BUTTON — The Sacred Button (Prop)

**Asset ID** : `l2_button`  
**Type** : Image (Illustration 3D, transparent-ready)  
**Ratio** : Carré (1:1)  
**Fond** : Pure Blue `#0000ff` exact

```
A large industrial push START button, bright red, mounted on a circular steel base.
The button itself is a large convex red dome, slightly glowing at edges.
The base is thick, solid, industrial.
BACKGROUND: Pure Blue `#0000ff` exact — no gradients, no shadows on background.
Object centered with 10% margin. Viewed front-center slightly above.
Flat studio lighting — NO cast shadows, NO ground shadow.
Hyper-detailed render, Disney-Pixar quality. Square composition. 8K
```

---

## 🖥️ UI-DASH — Dashboard Interface Template (HUD Layer 3)

**Asset ID** : `ui_dashboard_template`  
**Type** : Interface UI (Stitch screen generation)  
**Device** : Desktop  

```
A futuristic cockpit HUD interface overlay for a spaceship dashboard.
Light theme: near-white glass panels, frosted glass cards with subtle blur effect.
Neon orange (#ff5f00) accent lines and highlights — used sparingly on key elements only.
Top header: "ATLANTIS NEXUS" logo left, navigation tabs center (DASHBOARD · SUPERVISEUR · MÉMOIRE), system status right.
Center area: mostly transparent/empty (to show the cockpit background through).
Bottom-left: chat terminal panel (narrow vertical card, glass effect).
Bottom-right: mission control card with status indicators.
Minimal UI, lots of negative space. No heavy backgrounds. Clean elegant cockpit aesthetic.
```

---

## 📊 UI-SUPER — Superviseur Interface Template (HUD Layer 3)

**Asset ID** : `ui_supervisor_template`  
**Type** : Interface UI (Stitch screen generation)  
**Device** : Desktop  

```
A technical analytics HUD interface for a spaceship control room.
Light theme: frosted glass white panels. Neon orange accents on active states.
Three-column layout:
- Left narrow panel: System Pulse indicator (circular gauge, "IDLE" / "EXECUTING" status).
- Center wide panel: Teams Pipeline showing sequential steps (INTEGRITY, QUALITY, STRATEGY, DEV, MAINTENANCE) with progress indicators.
- Right panel: Telemetry metrics (Token Count, Active Agents, Session Uptime, Integrity Status).
Small lower-left panel: Live Event Bus — scrolling log lines in monospace, actor names in orange.
Minimal, technical, but elegant. Space between elements. No dense clutter.
```

---

## 📖 UI-MEM — Memory Interface Template (HUD Layer 3)

**Asset ID** : `ui_memory_template`  
**Type** : Interface UI (Stitch screen generation)  
**Device** : Desktop  

```
A document archive HUD interface for a spaceship library.
Light theme: warm white frosted cards, soft shadows.
Two-column layout:
- Left column: "Mission Archives (LangGraph)" — scrollable list of report cards with ID, title, date, and EXPAND button.
- Right column: "Technical Documents" — grid of document cards with file icon, document name, type tag.
Section headers in neon orange (#ff5f00) with a subtle emboss effect.
Calm, readable, library-like atmosphere. Generous padding. Elegant typography.
```

---

*Status : SESSION_CALIBRATED*
