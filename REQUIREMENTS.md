# Requirements — LLM Tree of Life

## 1. Core Views

### 1.1 Model Family Tree View (`/tree`)
- **R-001**: Display an interactive tree/dendrogram for each frontier model family:
  - OpenAI GPT series (GPT-1 → GPT-2 → GPT-3 → 3.5 → 4 → 4o → 4.1 → 5 → 5.1 → 5.2 → 5.3 → 5.4)
  - OpenAI o-series reasoning models (o1 → o3 → o4-mini)
  - Anthropic Claude series (Claude 1 → 2 → 3 → 3.5 → 4 → 4.6)
  - Google Gemini series (PaLM → PaLM 2 → Gemini 1.0 → 1.5 → 2.0 → 2.5 → 3.0 → 3.1)
  - Meta LLaMA series (LLaMA 1 → 2 → 3 → 3.1 → 4)
  - Mistral series (Mistral 7B → Mixtral → Mistral Large → Mistral Small 4)
  - xAI Grok series (Grok-1 → Grok-2 → Grok-1.5 open)
  - Cohere Command series (Command → Command R → Command R+)
  - Microsoft Phi series (Phi-1 → Phi-2 → Phi-3 → Phi-4)
  - DeepSeek series (DeepSeek V1 → V2 → V3 → R1)
- **R-002**: Each model node shows: name, release date, parameter count (if known), key innovation, and parent model.
- **R-003**: Clicking a model node expands a detail panel with full description, architecture notes, and links to papers.
- **R-004**: Users can filter by model family or view all families simultaneously.
- **R-005**: Cross-family influence lines show shared foundational techniques (e.g., both Claude and GPT series tracing back to RLHF).
- **R-006**: Visual distinction between different model tiers (e.g., flagship vs. mini/nano variants).

### 1.2 Historical Timeline View (`/timeline`)
- **R-007**: Display a scrollable, zoomable timeline from pre-Transformer era (~2013) to present.
- **R-008**: **Research Paper Track**: Show foundational papers as milestone markers:
  - Pre-Transformer: RNNs (1986), LSTMs (1997), Word2Vec (2013), Seq2Seq (2014), Attention Mechanism (2014)
  - Transformer Era: "Attention Is All You Need" (2017), GPT-1 (2018), BERT (2018), GPT-2 (2019), T5 (2019), GPT-3 (2020)
  - Scaling & Alignment: Kaplan Scaling Laws (2020), Chinchilla (2022), InstructGPT/RLHF (2022), Constitutional AI (2022), Chain-of-Thought (2022)
  - MoE: Sparse MoE (2017), Switch Transformers (2021), Mixtral (2023)
- **R-009**: **Hardware Acceleration Track**: Overlay hardware releases on the same timeline:
  - NVIDIA: V100 (2017), A100 (2020), H100 (2022), H200 (2023), B100/B200 (2024), GB200 (2024-25), Blackwell Ultra (2026)
  - Google TPU: v1 (2016), v2 (2017), v3 (2018), v4 (2020), v5e/v5p (2023), v6 (2025-26)
  - AMD: MI250 (2021), MI300X (2023), MI325X (2024), MI350 (2026)
  - Others: Cerebras CS-1/CS-2/CS-3, Groq LPU, AWS Trainium, Microsoft Maia
- **R-010**: **Model Release Track**: Every frontier model release plotted on the timeline.
- **R-011**: Clicking any marker shows a detail popover with description and relevant links.
- **R-012**: Visual connections between hardware releases and the models they enabled (e.g., A100 → GPT-3).

### 1.3 Landing Page (`/`)
- **R-013**: Hero section with project title, short description, and navigation to Tree and Timeline views.
- **R-014**: Quick stats (total models tracked, total papers, total hardware milestones).
- **R-015**: Featured spotlight for the most recent model release.

## 2. Interaction & UX

- **R-016**: Pan and zoom on tree and timeline visualizations.
- **R-017**: Search bar with autocomplete to find any model, paper, or hardware by name.
- **R-018**: Responsive design — usable on desktop, tablet, and mobile (though desktop is the primary target for visualization).
- **R-019**: Dark mode by default with light mode toggle.
- **R-020**: Smooth transitions and micro-animations for node expansion, panel slides, and view switching.
- **R-021**: Keyboard navigation support for accessibility.
- **R-022**: URL-based deep linking (e.g., `/tree?model=gpt-4` highlights GPT-4 in the tree).
- **R-023**: Share button to copy a deep link to a specific model or paper.

## 3. Data

- **R-024**: All model/paper/hardware data stored as typed TypeScript objects in `lib/data/`.
- **R-025**: Each data entity has: `id`, `name`, `type`, `date`, `description`, `parentIds`, `childIds`, `metadata`.
- **R-026**: Data is easily extensible — adding a new model should only require adding an entry to the data file.
- **R-027**: If a database is needed for community contributions or dynamic data, use Neon PostgreSQL.
- **R-028**: If caching is needed for API responses, use Redis (Upstash).

## 4. Non-Functional

- **R-029**: Page load time under 2 seconds on desktop.
- **R-030**: Lighthouse accessibility score ≥ 90.
- **R-031**: Full TypeScript strict mode — no `any` types.
- **R-032**: SEO optimized with proper meta tags, Open Graph, and Twitter cards.
- **R-033**: Hosted on Vercel with automatic deploys from `main` branch.
- **R-034**: MIT licensed, open source on GitHub as `llmtree-site`.

## 5. Future Considerations (v2)

- **R-035**: Community contribution system (submit new models/corrections via GitHub PRs or in-app form).
- **R-036**: Model comparison tool (side-by-side specs for any two models).
- **R-037**: Benchmark overlay (MMLU, HumanEval, etc. scores plotted over time).
- **R-038**: API endpoint for programmatic access to lineage data.
- **R-039**: Embed widget for external sites to display a subtree.
