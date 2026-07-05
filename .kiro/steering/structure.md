# Project Structure

## Top-Level Layout

```
.
├── src/                  # Application source
├── supabase/             # Supabase migrations & config
├── docs/                 # Project documentation
├── guidelines/           # Project guidelines
├── plans/                # Planning artifacts
├── specs/                # Speckit feature specs
├── scripts/              # Maintenance & build scripts
├── utils/                # Shared utility scripts
├── .kiro/                # Kiro specs and steering
│   ├── specs/            # Spec workflow outputs (requirements/design/tasks)
│   └── steering/         # Steering rules (this folder)
├── .specify/             # Speckit memory (constitution, etc.)
├── next.config.js
├── tsconfig.json
├── postcss.config.js
├── package.json
├── SPEC.md               # Full project specification
├── PROJECT_DOCUMENTATION.md
└── CLAUDE.md             # AI assistant context
```

## `src/` Layout

```
src/
├── app/                  # Next.js App Router (pages + API routes)
│   ├── layout.tsx
│   ├── page.tsx          # Home (/)
│   ├── globals.css
│   ├── path-select/      # /path-select
│   ├── map/              # /map
│   ├── quiz/             # /quiz
│   ├── result/           # /result
│   ├── share/result/[id] # /share/result/[id]
│   ├── mission/          # /mission
│   ├── classify/         # /classify
│   ├── daily/            # /daily
│   ├── lessons/          # /lessons
│   ├── leaderboard/      # /leaderboard
│   ├── student/          # student-facing routes
│   ├── teacher/          # /teacher (auth-gated)
│   ├── admin/            # /admin (password-gated)
│   └── api/grok/         # AI endpoints (generate-question, explain)
│
├── components/           # React components
│   ├── ui/               # 40+ shadcn/Radix primitives (button, dialog, ...)
│   ├── admin/            # Admin dashboard components
│   ├── student/          # Student-specific components
│   ├── figma/            # Figma-imported components (e.g., ImageWithFallback)
│   └── *.tsx             # Top-level screen components (HomeScreen, QuizScreen, ...)
│
├── lib/                  # Business logic, API clients, helpers
│   ├── server/           # Server-only modules
│   ├── store.ts          # Zustand global store (useAppStore)
│   ├── globalStore.ts
│   ├── supabase.ts       # Public Supabase client
│   ├── supabase-admin.ts # Service-role client (server only)
│   ├── grokApi.ts        # AI provider integration
│   ├── studentApi.ts     # Student data access
│   ├── teacherContentStore.ts
│   ├── shareResult*.ts   # Shareable result helpers
│   ├── tts.ts            # Text-to-speech
│   ├── voiceAnswer.ts    # Voice recognition
│   ├── sound.ts
│   ├── xp.ts             # XP and level calculations
│   ├── daily.ts          # Daily challenge logic
│   ├── excelParser.ts    # Bulk question import
│   ├── auth-helpers.ts
│   └── jwt.ts
│
├── data/                 # Static seed data (questions, lessons, missions)
├── types/                # Shared TypeScript types
├── styles/               # Additional stylesheets
├── imports/              # Figma-imported assets/code
└── middleware.ts         # Next.js middleware
```

## Code Organization Rules

- **Pages and API routes** live in `src/app/` (App Router conventions)
- **Screen components** (e.g., `QuizScreen.tsx`) live at the top of `src/components/`; pages compose them
- **UI primitives** live in `src/components/ui/` — keep them generic and reusable
- **Admin** components stay in `src/components/admin/`; **student** components in `src/components/student/`
- **Business logic** (data fetching, state, side effects, calculations) belongs in `src/lib/`, never in components
- **Server-only code** (service role keys, admin operations) goes in `src/lib/server/`
- **Static seed data** lives in `src/data/`
- **Shared types** live in `src/types/` or co-located with their module

## Database (Supabase)

Tables: `profiles`, `learning_paths`, `topics`, `questions`, `results`, `teachers`. Migrations live in `supabase/`.

## Spec & Planning

- `.kiro/specs/{feature-name}/` — active spec work (requirements.md, design.md, tasks.md)
- `specs/` — Speckit feature plans
- `plans/` — additional planning docs
- `SPEC.md` — authoritative project specification (pages, components, models, schema)

## Naming Conventions

- **Components** — `PascalCase.tsx` (`HomeScreen.tsx`, `RobotGuide.tsx`)
- **UI primitives** — lowercase kebab (`button.tsx`, `alert-dialog.tsx`)
- **Hooks/utilities** — `camelCase.ts` (`grokApi.ts`, `useAppStore`)
- **Routes** — kebab-case folders (`path-select`, `share/result/[id]`)
- **localStorage keys** — `bats:` prefix, lowercase, version suffix (`bats:questions:v1`)
- **Topic slugs** — single English word (`stranger`, `phishing`, `password`)
