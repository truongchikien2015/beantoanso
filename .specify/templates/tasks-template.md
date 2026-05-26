---
description: "Task list template for Bé An Toàn Số feature implementation"
---

# Tasks: [FEATURE NAME]

> Bé An Toàn Số — Educational Internet Safety Game

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Constitution**: All tasks MUST comply with Bé An Toàn Số Constitution:
- TypeScript strict (no implicit `any`)
- Vietnamese UI text only
- Voice/TTS included where answers are displayed
- localStorage persistence for client game state
- AI content safety filter

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths for the Bé An Toàn Số project:

- **Pages**: `src/app/[route]/page.tsx`
- **Components**: `src/components/[Name].tsx` or `src/components/admin/[Name].tsx`
- **Lib utilities**: `src/lib/[name].ts`
- **Data**: `src/data/[name].ts`
- **Types**: Define inline in the file using the file, or in `src/lib/types.ts`

---

<!--
  ============================================================================
  IMPORTANT: Replace sample tasks below with actual tasks based on:
  - User stories from spec.md (with priorities P1, P2, P3)
  - Requirements from plan.md
  - Bé An Toàn Số Constitution principles

  Tasks MUST be organized by user story so each story can be
  implemented and tested independently.
  ============================================================================
-->

## Phase 1: Foundation

**Purpose**: Type definitions and shared utilities that all user stories depend on.

- [ ] T001 [P] Define TypeScript interfaces for new data models in `src/lib/types.ts` or inline
- [ ] T002 [P] Add pure business logic to `src/lib/` (badge calculation, score logic, etc.)
- [ ] T003 Update `src/lib/globalStore.ts` Zustand store if shared state needed

**Checkpoint**: Types and utilities ready — user story implementation can begin.

---

## Phase 2: User Story 1 — [Title] (Priority: P1)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Implementation

- [ ] T010 [P] [US1] Create component `src/components/[Name].tsx` with props interface
- [ ] T011 [P] [US1] Implement [specific feature] in `src/lib/[name].ts`
- [ ] T012 [US1] Wire component to Zustand store if shared state needed
- [ ] T013 [US1] Add Vietnamese UI labels — all text in Vietnamese
- [ ] T014 [US1] Add voice answering button (if answer-display page) via `src/lib/voiceAnswer.ts`
- [ ] T015 [US1] Add TTS for content reading (if content-display page) via `src/lib/tts.ts`
- [ ] T016 [US1] Verify localStorage persistence works across page refresh
- [ ] T017 [US1] Run `tsc --strict` — zero errors

**Checkpoint**: User Story 1 independently testable and working.

---

## Phase 3: User Story 2 — [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Implementation

- [ ] T020 [P] [US2] Create component `src/components/[Name].tsx` with props interface
- [ ] T021 [P] [US2] Implement [specific feature] in `src/lib/[name].ts`
- [ ] T022 [US2] Add Vietnamese UI labels — all text in Vietnamese
- [ ] T023 [US2] Add accessibility features (voice/TTS) if displaying answers
- [ ] T024 [US2] Verify localStorage persistence
- [ ] T025 [US2] Run `tsc --strict` — zero errors

**Checkpoint**: User Stories 1 AND 2 both independently testable.

---

## Phase 4: User Story 3 — [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Implementation

- [ ] T030 [P] [US3] Create component `src/components/[Name].tsx` with props interface
- [ ] T031 [US3] Add Vietnamese UI labels
- [ ] T032 [US3] Add accessibility features if needed
- [ ] T033 [US3] Run `tsc --strict` — zero errors

**Checkpoint**: All user stories independently testable.

---

## Phase 5: API Routes (if needed)

**Purpose**: Server-side endpoints for AI or Supabase operations.

- [ ] T040 [P] Create `src/app/api/[name]/route.ts` with typed request/response
- [ ] T041 Add AI content safety filter (hardcoded blocklist in the route)
- [ ] T042 Add error handling with user-friendly Vietnamese error messages
- [ ] T043 Add 15-second timeout for AI calls with loading state

---

## Phase 6: Polish

- [ ] T050 [P] Update SPEC.md with new feature documentation
- [ ] T051 [P] Update PROJECT_DOCUMENTATION.md
- [ ] T052 Responsive test on tablet viewport (768px)
- [ ] T053 Keyboard navigation test (Tab, Enter, Escape)
- [ ] T054 Final `tsc --strict` check — zero errors

---

## Dependencies & Execution Order

| Phase | Depends On | Blocking |
|-------|-----------|---------|
| Foundation (Phase 1) | None | All user stories |
| User Story 1 (Phase 2) | Foundation | — |
| User Story 2 (Phase 3) | Foundation | — |
| User Story 3 (Phase 4) | Foundation | — |
| API Routes (Phase 5) | Foundation | If needed by user stories |
| Polish (Phase 6) | All user stories | — |

### Within Each User Story

- Types/interfaces first
- Business logic in `lib/` (pure functions)
- Components last (orchestration only)
- Voice/TTS before polish pass

### Parallel Opportunities

- [P] tasks within same phase can run in parallel
- User stories can run in parallel after Foundation (if team allows)
- Different components in same story can run in parallel

---

## Key Utility Reference

| Task | Utility File | Notes |
|------|-------------|-------|
| Badge/XP | `src/lib/xp.ts` | Pure function — testable |
| Voice answer | `src/lib/voiceAnswer.ts` | `startListening(callback)` |
| TTS | `src/lib/tts.ts` | `speakVietnamese(text)` |
| Store | `src/lib/globalStore.ts` | Zustand + localStorage |
| Daily | `src/lib/daily.ts` | Day rotation logic |
| Supabase | `src/lib/supabase.ts` | Client singleton |

---

*Tasks version: 1.0 | Constitution: 1.0.0*
