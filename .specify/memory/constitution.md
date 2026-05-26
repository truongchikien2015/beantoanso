# Bé An Toàn Số Constitution

> Governing principles for the Bé An Toàn Số educational web application.

---

## Core Principles

### I. TypeScript-First Strictness

All source code MUST be written in TypeScript with strict mode enabled. No `any` types without explicit justification comment. All components, utilities, and API routes MUST have typed inputs and outputs. The `tsconfig.json` strict flags MUST remain enabled (no disabling `strictNullChecks`, `noImplicitAny`, etc.). Rationale: Type safety is the primary defense against bugs in a Next.js App Router application where client/server boundaries are frequent sources of errors.

### II. Vietnamese-First Content

All user-facing content (UI labels, error messages, quiz questions, explanations, tips) MUST be in Vietnamese. English MAY appear in code comments, variable names, and documentation only. Rationale: The primary audience is Vietnamese primary school children (ages 6–12) and their teachers.

### III. Accessibility-First for Young Users

All interactive elements MUST support keyboard navigation, focus management, and ARIA labels. Voice answering (Web Speech API) and text-to-speech (Speech Synthesis) are mandatory features — they MUST NOT be removed or degraded. Rationale: The target demographic includes children with varying literacy levels, making voice interaction a primary accessibility feature.

### IV. LocalStorage as Primary Client State

Client-side session state (quiz progress, mission results, XP, student answers) MUST be persisted via Zustand with localStorage. Supabase is used for persistent data (profiles, leaderboard, shared results) only. No critical game state should depend solely on server round-trips. Rationale: This is a Vietnamese children's educational app that must work reliably on constrained school network environments.

### V. AI Provider Resilience

The application MUST gracefully handle AI provider failures. Both Grok and OpenRouter backends MUST be supported with automatic fallback. Content safety filtering MUST be applied to all AI-generated content before it reaches the client. Rationale: Children's educational content requires strict content safety guarantees and reliable service availability.

### VI. Admin Simplicity

Admin and teacher dashboards MUST NOT expose server-side credentials or privileged operations. All admin features operate via Supabase client with RLS policies enforcing data integrity. Rationale: The app may be administered by non-technical teachers who should not have access to infrastructure credentials.

### VII. Component Composition Over Monoliths

Screen components (QuizScreen, MissionScreen, ResultScreen, etc.) MUST be kept focused on orchestration. Complex logic (XP calculation, badge logic, daily challenge rotation) MUST be extracted into pure utility functions in `lib/`. Rationale: Maintainability of a large component codebase requires clear separation between UI orchestration and business logic.

---

## Additional Constraints

### Technology Stack Constraints

- **Framework**: Next.js App Router — App Router MUST be used for all new pages (no mixing with Pages Router conventions)
- **Styling**: Tailwind CSS v4 for layout and custom design tokens; MUI v7 for complex UI components (charts, dialogs, data tables)
- **State**: Zustand v5 for global client state; localStorage keys MUST follow the `bats:` prefix convention
- **Database**: Supabase PostgreSQL only — no additional database layers
- **AI**: xAI Grok or OpenRouter — no other AI providers without explicit architecture review
- **Package Manager**: pnpm only — no mixing with npm/yarn

### Data Integrity Constraints

- AI-generated questions MUST pass content safety filter before storage
- Supabase RLS policies MUST be the authoritative access control — client-side auth checks are supplementary only
- Seed question data in `src/data/quizQuestions.ts` MUST always be valid (all required fields present, no broken links)
- Badge calculations MUST be deterministic and testable (pure function in `lib/xp.ts`)

### Performance Constraints

- Quiz page MUST render and be interactive within 3 seconds on a typical school network connection
- No client-side API calls that block the critical rendering path
- AI explain endpoint MUST have a 15-second timeout with user-facing loading state

---

## Development Workflow

### Feature Development Process

1. **Spec** — Create/update `SPEC.md` and feature-specific documentation before any code
2. **Type First** — Define TypeScript types for all new data models before implementation
3. **Component Scaffold** — Create component file with props interface before adding logic
4. **Lib Utility** — Extract business logic into `lib/` utilities with unit-testable pure functions
5. **Integrate** — Wire components together with proper prop drilling or Zustand state
6. **Verify** — Test on both desktop and the constraints of the target environment

### Code Review Checklist

- [ ] All TypeScript types are explicit — no implicit `any`
- [ ] All Vietnamese text is user-facing — no English in UI labels
- [ ] Voice answering and TTS work on the target page
- [ ] localStorage persistence works across page refreshes
- [ ] AI content passes safety filter (for AI-related changes)
- [ ] Supabase queries use proper typing from generated types
- [ ] No server-side secrets leaked to client bundle
- [ ] Admin routes check localStorage auth before rendering

### Commit Message Convention

```
<type>(<scope>): <description>

feat(quiz): add voice answer button
fix(mission): correct mission score calculation
docs(spec): add admin dashboard section
refactor(lib): extract badge calculation to xp.ts
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

---

## Governance

### Amendment Procedure

Proposals to add, remove, or modify principles MUST:
1. Be documented with rationale and impact analysis
2. Update all affected template files (constitution.md, spec-template.md, plan-template.md)
3. Be committed with version bump in constitution header

### Compliance Verification

- All new features MUST be checked against the Core Principles before PR merge
- TypeScript strict mode MUST be verified on every build (no `any` bypasses without comment)
- AI-generated content MUST be verified against the content safety blocklist before storage

### Version Policy

- **MAJOR**: Backward-incompatible principle removals or redefinitions
- **MINOR**: New principle added or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17
