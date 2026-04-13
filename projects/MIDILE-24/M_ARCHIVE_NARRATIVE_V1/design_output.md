# Rapport de Conception : ARCHIVE NARRATIVE — PORTAIL DES ÉPOPÉES

**Date:** 2023-10-27
**Rôle:** Design Specialist
**Mission:** ARCHIVE NARRATIVE — PORTAIL DES ÉPOPÉES
**Contexte:** Création d'un portail narratif immersif (blog JSX) fusionnant l'esthétique 'Rick & Morty' avec les mythes celtiques. Le système centralisera des récits Markdown, des vignettes BD, des vidéos et un agenda annuel interactif.

---

## 1. Vue d'Ensemble du Projet

Le "Portail des Épopées" est conçu comme une expérience narrative unique, un carrefour où la science-fiction absurde de 'Rick & Morty' rencontre la profondeur mystique des légendes celtiques. L'objectif est de créer une plateforme dynamique et engageante, invitant les utilisateurs à explorer des récits, des visuels et des événements à travers une interface à la fois familière et surprenante.

## 2. Principes Directeurs du Design

*   **Immersion & Découverte:** Encourager l'exploration continue et la surprise.
*   **Cohérence Esthétique:** Maintenir un équilibre visuel entre les deux univers fusionnés.
*   **Fluidité & Réactivité:** Assurer une expérience utilisateur sans accroc sur tous les appareils.
*   **Narration Visuelle:** Utiliser le design pour renforcer le récit et l'ambiance.
*   **Interactivité Ludique:** Intégrer des éléments interactifs qui ajoutent à l'amusement et à l'engagement.

## 3. Identité Visuelle & Esthétique

L'esthétique sera un mélange audacieux :

*   **Palette de Couleurs:** Une base de couleurs terreuses et profondes (verts forêt, bleus océan, gris pierre) pour l'ancrage celtique, rehaussée par des accents néons et vibrants (verts acides, roses fuchsia, bleus électriques) inspirés de 'Rick & Morty'. Les portails interdimensionnels et les artefacts magiques seront des opportunités pour ces touches vives.
*   **Typographie:** Une combinaison de polices. Une police sans-serif moderne et légèrement "techno" pour les titres et l'interface (rappelant la science-fiction), et une police plus lisible, potentiellement avec un léger caractère "fantasy" ou "manuscrit" pour le corps du texte narratif.
*   **Iconographie:** Des icônes stylisées fusionnant symboles celtiques (triskèles, nœuds) avec des éléments sci-fi (engrenages, circuits, portails).
*   **Imagerie:** Illustrations et vignettes BD dans un style qui emprunte aux deux univers : personnages aux expressions exagérées, créatures fantastiques, paysages à la fois anciens et futuristes.

## 4. Layout & Navigation : Offset Masonry & Navigation Fixe

### 4.1. Contenu Narratif : Layout 'Offset Masonry' Réactif

*   **Structure:** Le corps principal du contenu narratif (articles, vidéos, galeries d'images) sera présenté sous forme de grille 'Offset Masonry'. Les blocs de contenu auront des hauteurs et largeurs variables, créant un décalage vertical irrégulier et asymétrique.
*   **Esthétique:** Cette disposition évoquera l'idée d'un "mur d'archives" ou d'un "tableau d'affichage interdimensionnel" où les informations sont collectées de manière organique et non linéaire. Les blocs pourront avoir des bordures légèrement biseautées ou des ombres portées subtiles pour un effet de profondeur.
*   **Réactivité:** La grille s'adaptera fluidement aux différentes tailles d'écran. Sur mobile, les blocs pourront se réorganiser en une colonne unique ou une grille à deux colonnes, tandis que sur desktop, la complexité de l'offset masonry sera pleinement exploitée. Les images et vidéos à l'intérieur des blocs seront également responsives.
*   **Interaction:** Au survol, les blocs pourront révéler des informations supplémentaires (titre complet, auteur, date) ou déclencher une légère animation de "zoom" ou de "pulsation" pour indiquer leur interactivité.

### 4.2. Navigation : Dashboard/Header Fixe et Symétrique

*   **Header (Haut de page):**
    *   **Fixe:** Le header restera visible en permanence, ancrant l'utilisateur dans le portail.
    *   **Symétrique:** Un design équilibré avec le logo du portail au centre ou à gauche, des liens de navigation principaux (Accueil, Histoires, Calendrier, À Propos) répartis de manière égale, et potentiellement un bouton d'accès rapide au "Dashboard" ou à la recherche à droite.
    *   **Esthétique:** Le header pourrait intégrer des éléments visuels de "tableau de bord" futuriste, avec des indicateurs lumineux ou des segments graphiques. Il pourrait également avoir une légère transparence ou un effet de "verre dépoli" pour laisser entrevoir le contenu en dessous.
*   **Dashboard (Panneau latéral ou modal):**
    *   **Accès:** Un bouton dédié dans le header ouvrira un panneau latéral (ou un modal plein écran sur mobile) servant de "Dashboard" ou de "Centre de Commandement".
    *   **Contenu:** Ce dashboard regroupera des fonctionnalités secondaires mais importantes : profil utilisateur, paramètres, filtres de contenu (par mythologie, par personnage, par type de média), accès aux archives complètes, et peut-être un "journal de bord" personnel.
    *   **Esthétique:** Le dashboard aura une esthétique de "console de vaisseau spatial" ou de "laboratoire dimensionnel", avec des boutons lumineux, des graphiques stylisés et une disposition claire des informations.

## 5. Animation & Interactivité (Framer Motion)

Framer Motion sera utilisé pour injecter de la vie et du dynamisme dans le portail, renforçant l'aspect immersif et ludique.

### 5.1. Décollage de Fusée (Transition de Page/Section)

*   **Concept:** Lors du chargement initial du site, ou lors de transitions majeures entre sections (par exemple, de la page d'accueil vers une histoire spécifique), une animation de "décollage de fusée" sera déclenchée.
*   **Détails:**
    *   Une petite fusée stylisée (à la 'Rick & Morty') pourrait apparaître en bas de l'écran.
    *   Elle s'élèverait rapidement, laissant une traînée de fumée ou d'énergie colorée (néon).
    *   Au sommet de son ascension, elle pourrait "traverser un portail" (effet de distorsion ou de flash lumineux) avant que le nouveau contenu ne se charge.
    *   **Timing:** L'animation sera rapide et fluide pour ne pas entraver l'expérience utilisateur, mais suffisamment présente pour être remarquée.

### 5.2. PNJ en Boucle (Éléments de Fond/Mascottes)

*   **Concept:** Des Personnages Non Joueurs (PNJ) animés en boucle seront intégrés discrètement dans l'interface pour ajouter du caractère et de l'ambiance.
*   **Détails:**
    *   **Mascottes de Coin:** Un petit "Morty" ou un "Mr. Meeseeks" pourrait apparaître occasionnellement dans un coin de l'écran, effectuant une animation courte et répétitive (regarder autour de lui, se gratter la tête, faire un geste).
    *   **Éléments de Fond:** Des créatures celtiques stylisées (farfadets, fées) ou des gadgets sci-fi (mini-robots, drones) pourraient flotter ou se déplacer lentement en arrière-plan de certaines sections, ajoutant une couche de profondeur visuelle sans distraire du contenu principal.
    *   **Interaction:** Certains PNJ pourraient réagir au survol de la souris ou à un clic, déclenchant une animation supplémentaire ou un petit son.
    *   **Performance:** Les animations seront optimisées pour ne pas impacter les performances du site.

## 6. Affichage des Vignettes BD (Parsing Markdown)

Le système de parsing Markdown pour les vignettes BD permettra une intégration riche et interactive des éléments visuels narratifs.

### 6.1. Représentation Visuelle des Métadonnées

Chaque vignette BD sera un bloc interactif dans la grille 'Offset Masonry' ou dans une section dédiée.

*   **`panel_id`:** Affiché discrètement en bas ou en coin de la vignette, potentiellement dans une police de type "code" ou "numéro de série".
*   **`dialogue_bubble`:** Le texte du dialogue sera visible directement sur la vignette, stylisé comme une bulle de BD. Au survol, la bulle pourrait s'agrandir légèrement ou le texte devenir plus lisible si tronqué.
*   **`character_focus`:** Le personnage principal de la vignette pourrait être légèrement mis en évidence (lueur subtile, légère animation de respiration) ou son nom affiché au survol.
*   **`narrative_beat`:** Une petite icône ou un indicateur visuel (ex: une flèche pour "progression", un point d'interrogation pour "mystère") pourrait apparaître en coin pour signaler le type de "beat" narratif.
*   **`aesthetic_filter`:** Des filtres visuels dynamiques pourraient être appliqués à la vignette. Par exemple, un filtre "rétro" pour un flashback, un filtre "glitch" pour une distorsion dimensionnelle, ou un filtre "sépia" pour une ambiance plus ancienne. Ces filtres pourraient s'intensifier au survol ou au clic.

### 6.2. Interaction

*   **Survol:** Révélation d'informations contextuelles (nom du personnage, résumé du "narrative beat").
*   **Clic:** Ouverture de la séquence BD complète ou de l'article narratif associé, avec une transition fluide et immersive (ex: la vignette s'agrandit pour remplir l'écran, puis le reste de la page se charge).

## 7. Agenda Annuel Hybride & Mini-Hologramme

L'agenda sera un élément central pour suivre les publications et les événements narratifs.

### 7.1. Affichage des Dates Hybrides

*   **Layout:** Un calendrier annuel visuellement distinct, potentiellement sous forme de "roue cosmique" ou de "carte stellaire" interactive, ou une grille plus traditionnelle mais avec un design futuriste/celtique.
*   **Dates Réelles:** Les dates de publication réelles (JJ/MM/AAAA) seront affichées de manière claire et conventionnelle, mais avec une typographie et des couleurs cohérentes avec le thème.
*   **'Stardates' Narratives:** À côté ou en dessous de chaque date réelle, la 'Stardate' narrative correspondante sera affichée. Les 'Stardates' pourraient avoir une police différente, plus "numérique" ou "futuriste", et une couleur distincte (ex: néon vert).
*   **Indicateurs:** Les jours avec des événements ou des publications seront visuellement marqués (ex: un cercle lumineux, un symbole celtique, une petite icône de fusée).

### 7.2. Interaction 'Mini-Hologramme' pour les Résumés de Mission

*   **Déclenchement:** Au survol ou au clic sur une date marquée dans l'agenda, un "Mini-Hologramme" apparaîtra.
*   **Esthétique du Hologramme:**
    *   Un petit cube ou prisme translucide apparaîtra au-dessus de la date sélectionnée.
    *   À l'intérieur de ce prisme, un résumé de la "mission" ou de l'événement narratif associé à cette date sera projeté.
    *   Le texte et les images (mini-vignettes) à l'intérieur du hologramme auront un léger effet de "scintillement" ou de "glitch" pour renforcer l'illusion holographique.
    *   Les couleurs seront dans la palette néon, contrastant avec le fond.
*   **Contenu:** Le résumé de mission sera concis, incluant le titre de l'épisode/histoire, les personnages principaux impliqués, et un bref aperçu de l'intrigue. Un bouton "En savoir plus" ou "Accéder à la mission" sera présent pour naviguer vers le contenu complet.
*   **Animation:** L'apparition et la disparition du hologramme seront fluides, avec une animation de "montée" et de "dissolution" rapide.

## 8. Considérations Techniques (Brèves)

*   **Performance:** Optimisation des images, des animations Framer Motion et du parsing Markdown pour garantir une expérience fluide.
*   **Accessibilité:** Assurer un contraste suffisant, des balises ARIA et une navigation au clavier pour tous les éléments interactifs.
*   **SEO:** Structure sémantique claire pour les récits Markdown et les métadonnées.

## 9. Prochaines Étapes

1.  **Wireframing Détaillé:** Création de wireframes pour chaque section majeure (page d'accueil, page d'article, agenda) intégrant les concepts de layout et de navigation.
2.  **Maquettes Graphiques:** Développement de maquettes haute fidélité pour visualiser l'esthétique finale, la palette de couleurs et la typographie.
3.  **Prototypage d'Animations:** Création de prototypes interactifs pour les animations Framer Motion (décollage fusée, PNJ, hologramme) afin de valider le timing et l'impact.
4.  **Spécifications Techniques:** Rédaction de spécifications détaillées pour l'intégration des métadonnées Markdown et le comportement de l'agenda.

---