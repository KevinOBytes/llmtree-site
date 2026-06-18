# Tech Stack — LLM Tree of Life

## Framework & Language
- **Next.js 16** — App Router, Server Components, TypeScript-first
- **TypeScript 5** — Strict mode, no implicit any
- **React 19** — Server/Client component model

## Styling
- **Tailwind CSS v4** — Utility-first CSS framework
- **CSS Variables** — For theming (dark/light mode)
- **Geist Font** — Via `next/font/google`

## Visualization
- **D3.js** — Low-level SVG rendering for tree dendrograms and timeline
- **React Flow** (optional) — For node-based interactive graphs if needed
- **Framer Motion** — Smooth transitions and micro-animations

## Data
- **Static TypeScript data files** — Primary data source in `lib/data/`
- **Neon PostgreSQL** — If dynamic/community data is needed (preferred for relational data)
- **Redis (Upstash)** — If KV caching is needed

## Hosting & Deployment
- **Vercel** — Automatic deploys from GitHub `main` branch
- **GitHub** — Source control, issues, PRs

## Development Tools
- **ESLint** — With `eslint-config-next`
- **Prettier** (recommended) — Code formatting
- **Commitlint** (optional) — Conventional commit messages

## Testing (Future)
- **Vitest** — Unit tests
- **Playwright** — E2E browser tests
