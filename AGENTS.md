<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: LLM Tree of Life

## Purpose
An educational, single-purpose visualization site mapping the complete evolutionary lineage of large language models, foundational research papers, and enabling hardware accelerators.

## Architecture Rules
1. **App Router only** — Use the Next.js App Router. No pages directory.
2. **Server Components first** — Default to Server Components. Only use `"use client"` when interactivity requires it (event handlers, browser APIs, state).
3. **Static data** — Model/paper/hardware data lives in `lib/data/` as typed TypeScript objects. No dynamic fetching unless we add community contributions.
4. **Type safety** — All data structures use strict TypeScript types defined in `lib/types.ts`. No `any` types.
5. **Component organization** — Domain components in `components/tree/`, `components/timeline/`, shared UI in `components/ui/`.

## Styling Rules
1. **Tailwind CSS v4** — Use Tailwind utilities for all styling.
2. **Dark mode default** — Design dark-first, support light mode via `dark:` / `class` strategy.
3. **Design tokens** — Use CSS custom properties for brand colors, set in `globals.css`.
4. **Animations** — Use Framer Motion for complex animations, CSS transitions for simple ones.

## Data Rules
1. **Every model entry must have**: `id`, `name`, `family`, `releaseDate`, `description`, `parentIds`, `innovations` array.
2. **Every paper entry must have**: `id`, `title`, `authors`, `year`, `institution`, `contribution`, `arxivUrl` (if available).
3. **Every hardware entry must have**: `id`, `name`, `manufacturer`, `releaseDate`, `specs`, `enabledModels` array.
4. **Source your data** — Include citation URLs for any factual claim in the data.

## File Naming
- Components: PascalCase (`ModelNode.tsx`)
- Utilities/data: camelCase (`modelData.ts`)
- Types: camelCase with `.types.ts` or in `types.ts`
- Routes: kebab-case directories (`/tree`, `/timeline`)

## Database (if needed)
- **PostgreSQL**: Neon (serverless)
- **KV Store**: Redis via Upstash
- **ORM**: Drizzle ORM (if we add a database layer)
