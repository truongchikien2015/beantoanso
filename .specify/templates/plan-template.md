# Implementation Plan: [FEATURE]

> Bé An Toàn Số — Educational Internet Safety Game

**Branch**: `feat/[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

---

## Summary

[Extract from feature spec: primary requirement + technical approach]

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict mode — no `any` without comment)

**Primary Dependencies**:
- Next.js App Router (React 18, TypeScript 6)
- Zustand v5 (client state)
- Supabase (PostgreSQL + Auth)
- MUI v7 + Radix UI (UI components)
- Tailwind CSS v4 (layout/styling)
- xAI Grok / OpenRouter (AI)

**Storage**: Supabase PostgreSQL (profiles, questions, results, paths, topics) + localStorage (session state via Zustand)

**Testing**: Manual testing for UI; TypeScript type-checking (`tsc --strict`) as gate

**Target Platform**: Browser-based (Chrome, Safari, Edge) — responsive for tablet/desktop

**Project Type**: Educational web application / gamified learning platform

**Performance Goals**: Quiz page interactive within 3 seconds; AI explain timeout at 15 seconds with loading state

**Constraints**: Vietnamese children (ages 6–12) as primary users — voice answering and TTS are mandatory; school network may be constrained; localStorage must persist across refreshes

**Scale/Scope**: Single-page app with ~13 routes, ~15 screen components, ~40 UI primitives

---

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Check |
|-----------|-------|
| **I. TypeScript-First** | All types explicit? No implicit `any`? tsconfig strict enabled? |
| **II. Vietnamese-First** | All UI labels in Vietnamese? No English in user-facing text? |
| **III. Accessibility-First** | Voice answering included? TTS available? Keyboard navigation? |
| **IV. LocalStorage Resilience** | Client state persists across refresh? No server-only game state? |
| **V. AI Provider Resilience** | Fallback logic tested? Content safety filter applied? |
| **VI. Admin Simplicity** | No server secrets on client? RLS policies enforced? |
| **VII. Component Composition** | Business logic in `lib/`? Components orchestrating only? |

---

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (if needed)
└── tasks.md             # Phase 1 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home/landing
│   ├── quiz/page.tsx       # Quiz game
│   ├── mission/page.tsx    # Missions
│   ├── result/page.tsx     # Results
│   ├── admin/page.tsx      # Admin dashboard
│   ├── api/grok/           # AI API routes
│   │   ├── explain/
│   │   └── generate-question/
│   └── [other routes]
├── components/
│   ├── QuizScreen.tsx      # Screen components (orchestrate UI)
│   ├── MissionScreen.tsx
│   ├── ResultScreen.tsx
│   ├── ui/                 # ~40 shadcn/Radix primitives
│   └── admin/              # Admin-specific components
├── lib/
│   ├── globalStore.ts      # Zustand store (localStorage-persisted)
│   ├── store.ts            # localStorage CRUD utilities
│   ├── xp.ts               # Badge/XP calculations (pure function)
│   ├── tts.ts              # Text-to-speech
│   ├── voiceAnswer.ts       # Voice recognition
│   ├── supabase.ts         # Supabase client
│   └── grokApi.ts          # AI client wrappers
└── data/
    ├── quizQuestions.ts     # Seed question data
    ├── gameData.ts         # Missions + badges
    └── lessons.ts          # Educational content
```

**Structure Decision**: Single Next.js project using App Router. Screen components in `components/`, business logic in `lib/`, seed data in `data/`.

---

## Complexity Tracking

> Fill only if Constitution Check has violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |

---

## Implementation Phases

### Phase 0: Research (if needed)

- [ ] R001 Validate technology assumptions against codebase
- [ ] R002 Check existing components before creating new ones

### Phase 1: Type Definition

- [ ] T001 Define TypeScript interfaces for all new data models
- [ ] T002 Add to `lib/` if business logic involved

### Phase 2: Component Implementation

- [ ] T003 Create component in `src/components/` with props interface
- [ ] T004 Extract business logic to `src/lib/`
- [ ] T005 Wire to Zustand store if shared state needed
- [ ] T006 Add voice/TTS if new answer-display pages

### Phase 3: API Routes (if needed)

- [ ] T007 Create `/src/app/api/` route with typed request/response
- [ ] T008 Add AI content safety filter
- [ ] T009 Add error handling with user-friendly messages

### Phase 4: Integration & Testing

- [ ] T010 Verify localStorage persistence across refresh
- [ ] T011 Verify voice answering on Chrome/Safari/Edge
- [ ] T012 Run `tsc --strict` — zero errors
- [ ] T013 Test on responsive viewport (768px tablet)

---

## Key Utilities Reference

| Utility | File | Purpose |
|---------|------|---------|
| XP calculation | `lib/xp.ts` | Pure function: score → XP, XP → level, XP → title |
| Badge system | `lib/xp.ts` | Pure function: total_score → badge tier |
| Daily rotation | `lib/daily.ts` | Day-of-year modulo for daily question |
| TTS | `lib/tts.ts` | `speakVietnamese(text)`, `stopSpeaking()` |
| Voice answer | `lib/voiceAnswer.ts` | `startListening(callback)`, `stopListening()` |
| Store | `lib/globalStore.ts` | Zustand store with localStorage persistence |

---

*Plan version: 1.0 | Constitution: 1.0.0*
