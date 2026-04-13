```json
[
  {
    "id": "TASK-001",
    "description": "Implement React components for a responsive 'Offset Masonry' grid layout using CSS Grid or a library, ensuring dynamic vertical offsets for narrative content blocks. Develop and integrate fixed `Dashboard` and `Header` React components, styled for symmetry and persistent visibility across the application.",
    "priority": "CRITICAL",
    "verification_method": "Use browser developer tools to inspect the grid layout on various viewport sizes (desktop, tablet, mobile), confirming responsiveness and irregular vertical positioning of content blocks. Scroll the page to verify `Dashboard` and `Header` components remain fixed at their intended positions without obscuring content."
  },
  {
    "id": "TASK-002",
    "description": "Develop a Markdown parsing system (e.g., using `remark` or `markdown-it` with custom plugins) to extract narrative content and specific frontmatter/inline metadata (`panel_id`, `dialogue_bubble`, `character_focus`, `narrative_beat`, `aesthetic_filter`). Define and implement a robust data model for the parsed narrative content to be consumed by UI components.",
    "priority": "HIGH",
    "verification_method": "Create a suite of test Markdown files containing diverse content and all specified metadata fields. Write a unit test or a script that processes these files and asserts that the output data structure for each file correctly contains all metadata fields with their expected values, and that the main content is parsed correctly."
  },
  {
    "id": "TASK-003",
    "description": "Design and implement the hybrid annual agenda React component. This component must display both standard calendar dates and custom 'Stardates' side-by-side. Integrate interactive 'Mini-Hologram' elements (e.g., using tooltips or modals) that display mission summaries upon user hover or click for each relevant date.",
    "priority": "HIGH",
    "verification_method": "Render the agenda component in a test environment. Verify that both standard dates and 'Stardates' are correctly displayed and synchronized. Interact with multiple 'Mini-Hologram' elements for different dates to confirm that the corresponding mission summaries appear and disappear as expected, and that the interaction is smooth and responsive."
  },
  {
    "id": "TASK-004",
    "description": "Integrate Framer Motion into key UI elements to enhance interactivity and narrative immersion. Implement a 'rocket liftoff' animation for a specific page transition or interactive element (e.g., a button click). Develop a 'looping NPC' animation component that can be placed within designated narrative content blocks.",
    "priority": "MEDIUM",
    "verification_method": "Trigger the 'rocket liftoff' animation (e.g., by navigating to a specific route or clicking a designated button) and visually confirm its smooth execution and appropriate timing. Embed the 'looping NPC' component in a test page and verify that the animation plays continuously without interruption and integrates seamlessly with the surrounding content."
  }
]
```