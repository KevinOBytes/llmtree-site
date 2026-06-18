# User Stories — LLM Tree of Life

## Exploration

### US-01: Browse Model Family Trees
**As a** curious technologist,
**I want to** browse an interactive tree showing how GPT-5.2 evolved from GPT-3.5 through intermediate releases (4.0, 4o, 5.0, 5.1),
**So that** I can understand the iterative development path of the model I use daily.

**Acceptance Criteria:**
- Tree view displays the full GPT lineage with clickable nodes
- Each node shows name, date, and key innovation
- Parent-child relationships are visually clear with connecting lines
- I can expand/collapse branches

---

### US-02: Explore Cross-Family Influences
**As an** AI researcher,
**I want to** see how foundational techniques like RLHF influenced both the GPT and Claude model families,
**So that** I can understand the shared intellectual heritage across competing model families.

**Acceptance Criteria:**
- Cross-family influence lines are displayed in a visually distinct style (dashed, colored)
- Hovering an influence line shows the shared technique/paper
- I can toggle influence lines on and off

---

### US-03: Discover Hardware Enablers
**As a** hardware enthusiast,
**I want to** see which GPU or TPU release enabled each major model breakthrough,
**So that** I can understand the relationship between compute capability and model capability.

**Acceptance Criteria:**
- Timeline view shows hardware milestones alongside model releases
- Visual connections link hardware (e.g., A100) to models it enabled (e.g., GPT-3)
- Hardware nodes include key specs (memory, compute)

---

### US-04: Trace Back to Foundational Papers
**As a** graduate student,
**I want to** click on any modern model and trace its intellectual lineage back through papers to the original Transformer paper,
**So that** I can build a reading list of the most important papers in the field.

**Acceptance Criteria:**
- Each model node links to its parent papers/models
- I can follow the chain back to "Attention Is All You Need" (2017) and further to RNNs
- Papers include author names, year, and institution

---

### US-05: Search for a Specific Model
**As a** developer comparing models,
**I want to** search by name (e.g., "Claude 3.5 Sonnet") and immediately see that model highlighted in the tree,
**So that** I don't have to manually navigate through the full tree.

**Acceptance Criteria:**
- Search bar with autocomplete that matches model names, paper titles, and hardware names
- Selected result highlights in the tree/timeline and scrolls into view
- URL updates with a deep link parameter

---

## Education

### US-06: Learn the Pre-Transformer History
**As a** newcomer to AI,
**I want to** see a clear timeline starting from early neural networks (RNNs, LSTMs) through to modern LLMs,
**So that** I can understand the full historical context, not just the last 3 years.

**Acceptance Criteria:**
- Timeline extends back to at least 2013 (Word2Vec)
- Pre-Transformer, Transformer, and Post-Transformer eras are visually distinguished
- Each era has a brief description of the paradigm shift

---

### US-07: Understand Model Size Progression
**As a** tech journalist writing about AI scaling,
**I want to** visualize how model parameter counts have grown over time across families,
**So that** I can tell the story of AI scaling to my readers.

**Acceptance Criteria:**
- Model nodes have visual size indicators proportional to parameter count
- A tooltip or side panel shows exact parameter count
- The progression from 117M (GPT-1) to 1T+ (Gemini 3.1) is visually dramatic

---

### US-08: Explore Open vs. Closed Models
**As a** open source advocate,
**I want to** filter the tree to show only open-weight models (LLaMA, Mistral, DeepSeek),
**So that** I can understand the open model ecosystem's evolution separately.

**Acceptance Criteria:**
- Filter toggle for "Open Weight" vs "Closed" vs "All"
- Open-weight models are visually tagged (badge or color)
- Filtering animates smoothly

---

### US-09: Understand Key Architectural Innovations
**As a** ML engineer,
**I want to** see a summary of which architectural innovations appeared in which model,
**So that** I can trace when techniques like MoE, RLHF, or chain-of-thought first appeared and propagated.

**Acceptance Criteria:**
- Innovation tags/badges on model nodes (e.g., "MoE", "RLHF", "Multimodal")
- Clicking an innovation tag highlights all models sharing that innovation
- An innovation legend/key is visible

---

### US-10: View All Models from One Company
**As a** developer evaluating API providers,
**I want to** view all models from a single company (e.g., Anthropic) in isolation,
**So that** I can understand their full product roadmap and evolution.

**Acceptance Criteria:**
- Family filter dropdown with company names
- Selecting a company shows only their models
- Company branding colors are used for visual distinction

---

## Research & Sharing

### US-11: Share a Model's Lineage
**As a** conference presenter,
**I want to** generate a shareable link that highlights GPT-4's lineage path,
**So that** I can embed or share it in my presentation materials.

**Acceptance Criteria:**
- Share button generates a URL with model ID parameter
- Opening the link auto-navigates to that model and highlights its ancestry chain
- Open Graph meta tags show a preview image of the lineage

---

### US-12: Compare Release Cadence Across Families
**As an** industry analyst,
**I want to** see all model families on a single timeline to compare release cadence,
**So that** I can analyze competitive dynamics in the frontier model race.

**Acceptance Criteria:**
- Timeline view shows all families with distinct color-coded tracks
- I can see clustering of releases (e.g., the March 2024 cluster)
- Hover shows model details without leaving the timeline

---

### US-13: Navigate via Keyboard
**As a** user with accessibility needs,
**I want to** navigate the tree and timeline using keyboard controls,
**So that** I can explore the data without a mouse.

**Acceptance Criteria:**
- Arrow keys navigate between nodes
- Enter/Space activates a node's detail panel
- Tab cycles through interactive elements
- Focus indicators are clearly visible

---

### US-14: Toggle Dark/Light Mode
**As a** user who prefers light backgrounds,
**I want to** toggle between dark and light mode,
**So that** I can view the visualization comfortably in bright environments.

**Acceptance Criteria:**
- Toggle button in the header
- Preference persists in localStorage
- All visualizations adapt to the selected theme
- Default is dark mode

---

### US-15: Understand the DeepSeek Disruption
**As a** tech industry observer,
**I want to** see how DeepSeek's models relate to and challenged the established frontier labs,
**So that** I can understand the open-source disruption narrative in context.

**Acceptance Criteria:**
- DeepSeek family tree is complete (V1 → V2 → V3 → R1)
- Influence connections to techniques from other families are shown
- A note about the hardware efficiency breakthrough (MI300X / reduced compute) is included
