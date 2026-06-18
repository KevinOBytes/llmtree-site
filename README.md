# 🌳 LLM Tree of Life

**An interactive visualization of the lineage, evolution, and ancestry of every major large language model — from foundational research papers to today's frontier models.**

> [llmtree.dev](https://llmtree.dev) — Explore the complete family tree of artificial intelligence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)

---

## Overview

LLM Tree of Life is a single-purpose educational site that maps the complete evolutionary tree of large language models, tracing lineage from the original 2017 "Attention Is All You Need" transformer paper through every major frontier model release. The visualization includes:

- **Model Family Trees** — Interactive dendrograms for each frontier family (OpenAI GPT, Anthropic Claude, Google Gemini, Meta LLaMA, Mistral, xAI Grok, Cohere Command, and more) showing how each release inherits from and builds upon its predecessors.
- **Foundational Research Timeline** — A deep historical view tracing the academic lineage from RNNs, LSTMs, and word2vec through the Transformer revolution, RLHF alignment papers, scaling laws, and chain-of-thought reasoning.
- **Hardware Acceleration Timeline** — Key hardware milestones (NVIDIA V100 → A100 → H100 → Blackwell, Google TPU v1-v6, AMD Instinct, Cerebras, Groq LPU) overlaid on the model timeline, showing how compute advances drove AI breakthroughs.
- **Cross-Family Influence Map** — Connections showing where model families may have drawn foundational ideas from shared research (e.g., Constitutional AI influencing Claude, RLHF papers influencing both GPT and Claude).

## Architecture

```
llmtree-site/
├── app/                    # Next.js App Router pages & layouts
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx            # Landing page / hero
│   ├── tree/               # Model family tree view
│   ├── timeline/           # Historical research + hardware timeline
│   └── api/                # API routes (if needed)
├── components/             # Reusable React components
│   ├── tree/               # Tree visualization components
│   ├── timeline/           # Timeline visualization components  
│   └── ui/                 # Shared UI primitives
├── lib/                    # Utilities, data fetching, types
│   ├── data/               # Static model/paper/hardware data
│   └── types.ts            # TypeScript type definitions
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Visualization | D3.js / React Flow |
| Hosting | Vercel |
| Database (if needed) | Neon PostgreSQL |
| Cache (if needed) | Redis (Upstash) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **20+** (LTS recommended)
- npm (included with Node.js) or [pnpm](https://pnpm.io/)

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/KevinOBytes/llmtree-site.git
cd llmtree-site

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the site.

### Production Build

To build and serve the optimized production bundle:

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Deployment

This project is deployed automatically to Vercel on push to `main`.

## Data Sources

Model lineage data is compiled from:
- Official model announcements and papers
- [lifearchitect.ai/timeline](https://lifearchitect.ai/timeline/)
- [AI Flash Report - Model Releases](https://aiflashreport.com/model-releases.html)
- [LLM Timeline](https://llm-timeline.com)
- [Epoch AI Trends](https://epoch.ai/trends)
- ArXiv papers and conference proceedings

## License

MIT — see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! If you notice a missing model, incorrect lineage, or want to add a new visualization:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with sources for any data changes

---

Built with ❤️ for the AI research community.
