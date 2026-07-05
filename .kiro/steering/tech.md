# Tech Stack

## Core Framework

- **Next.js** `^16.2.4` (App Router)
- **TypeScript** `6.0.3` (strict mode)
- **React** `18.3.1`
- **Node** package manager: **pnpm** (with `vite` override pinned to `6.3.5`)

## UI & Styling

- **Tailwind CSS v4** — utility-first styling
- **MUI v7** (`@mui/material`, `@mui/icons-material`)
- **Radix UI** — 20+ headless primitives
- **shadcn-style UI** in `src/components/ui/` (40+ primitives)
- **Emotion** (`@emotion/react`, `@emotion/styled`) for CSS-in-JS where needed
- **lucide-react** for icons
- **next-themes** for dark/light mode
- Class utilities: `clsx`, `tailwind-merge`, `class-variance-authority`

## Animation & Interaction

- **motion** (Framer Motion fork) — page/component animations
- **canvas-confetti** — celebration effects
- **react-dnd** + HTML5 backend — drag-and-drop (Classify game)
- **embla-carousel-react**, **react-slick** — carousels
- **react-resizable-panels**, **react-responsive-masonry**

## State & Data

- **Zustand v5** — global client state, persisted to localStorage key `be-an-toan-so-storage`
- **localStorage** for client-side data with `bats:` prefix convention
- **Supabase** (`@supabase/supabase-js` v2) — PostgreSQL + Auth
- **react-hook-form** — forms

## AI Integration

Provider switchable via `AI_PROVIDER` env var:
- **xAI Grok** — `api.x.ai/v1/chat/completions` (default model `grok-4.3`)
- **OpenRouter** — `openrouter.ai/api/v1/chat/completions` (default `openai/gpt-4o-mini`)

API routes live under `src/app/api/grok/` (`generate-question`, `explain`).

## Misc

- **html-to-image** — certificate DOM-to-image export
- **xlsx** — Excel parsing for bulk question import
- **date-fns**, **react-day-picker**
- **bcryptjs**, **jose** — auth helpers
- **recharts** — admin dashboard charts
- **sonner** — toast notifications

## Common Commands

```bash
# Install dependencies
pnpm install

# Dev server (Next.js with webpack)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Build then start (preview)
pnpm preview
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
AI_PROVIDER=openrouter            # or "grok"
XAI_API_KEY=
XAI_MODEL=grok-4.3
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=

# App
NEXT_PUBLIC_SITE_URL=
```

## Conventions

- **TypeScript strict** — no implicit any, use explicit types
- **Vietnamese for user-facing strings**, English for code identifiers
- **Business logic** lives in `src/lib/`, **UI** in `src/components/`
- **localStorage keys** use the `bats:` prefix (e.g., `bats:questions:v1`, `bats:final_results:v1`)
- **Admin auth** is client-side only via `be_an_toan_so_admin` localStorage flag
- **Path aliases** follow Next.js defaults; prefer relative imports within `src/`
- AI responses must pass content safety filtering before being returned to users
