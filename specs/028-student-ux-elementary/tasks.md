# Tasks: Giao Diện Thân Thiện Học Sinh Tiểu Học

> Bé An Toàn Số — Educational Internet Safety Game

**Input**: Design documents from `/specs/028-student-ux-elementary/`

**Feature Summary**: Redesign student-facing pages with playful, child-friendly UI following "Vườn Học Tập Sống Động" aesthetic.

---

## Phase 1: Setup & Design Tokens

**Goal**: Add design tokens, fonts, and animations

### Implementation

- [x] T001 Add Google Fonts (Nunito, Quicksand) to `src/app/layout.tsx` via next/font
- [x] T002 Add CSS design tokens to `src/app/globals.css`:
  - Colors: --color-primary (#FF6B6B), --color-secondary (#4ECDC4), --color-accent (#FFE66D), --color-purple (#A06CD5)
  - Background: --color-bg (#FFF9F0)
  - Border radius: --radius-xl (1.5rem)
  - Shadows: --shadow-soft
- [x] T003 Add animation keyframes to `globals.css`:
  - `bounce-in`: scale 0.95 → 1.05 → 1
  - `wiggle`: translateX oscillation
  - `fade-in-up`: translateY + opacity
  - `confetti-burst`: particle animation

---

## Phase 2: Login Page (US1)

**Goal**: Child-friendly login with mascot and large touch targets

### Implementation

- [x] T010 [P] Redesign `src/app/student/login/page.tsx`:
  - Hero section with large emoji (🎓) + tagline
  - Larger padding and spacing
  - Gradient background accent
- [x] T011 [P] Redesign `src/components/student/StudentLoginForm.tsx`:
  - Input fields: py-4, text-lg, rounded-xl
  - Add icons/emoji to input labels
  - Primary button: gradient bg, rounded-full, py-4 text-lg
  - Error state: shake animation
- [x] T012 [US1] Add animated mascot on loading state

**Checkpoint**: Login page feels like a game start screen

---

## Phase 3: Dashboard Adventure Map (US2)

**Goal**: Dashboard looks like an adventure map, not a form

### Implementation

- [x] T020 [P] Update `src/components/student/StudentDashboard.tsx` header:
  - Replace plain text with emoji avatar + welcome
  - "Xin chào" → "Chào mừng bạn nhỏ!" 
- [x] T021 [P] Replace "Lộ trình học tập" → "Hành trình phiêu lưu"
- [x] T022 [US2] Redesign progress bar:
  - Star icons or checkpoint markers
  - Animated fill gradient
- [x] T023 [US2] Redesign steps list:
  - Dotted line connectors between steps
  - Larger touch targets (min-h-16)
  - Friendly badges: "✓ Hoàn thành" → "⭐ Hoàn thành"
- [x] T024 [US2] Update action buttons:
  - Gradient backgrounds
  - Larger size (py-4)
  - Rounded-full

**Checkpoint**: Dashboard looks like a game map with checkpoints

---

## Phase 4: Quiz Page Enhancement (US3)

**Goal**: Quiz feels like playing, not testing

### Implementation

- [x] T030 [P] Redesign answer cards in `src/app/student/quiz/[stepId]/page.tsx`:
  - Size: py-5, text-lg (larger than current)
  - Add emoji prefix for each option type
  - Bounce animation on selection
  - Border: border-3, rounded-2xl
- [x] T031 [P] Redesign result screen:
  - Larger score display
  - Confetti animation when score >= 80
  - Gentle shake when score < 70
  - Friendly icons (🎉 for pass, 💪 for retry)
- [x] T032 [US3] Redesign progress bar:
  - Star markers instead of dots
  - Animated fill
- [x] T033 [US3] Redesign answer breakdown:
  - Larger cards
  - Color-coded: green ✓, red ✗
  - Friendly icons

**Checkpoint**: Quiz completion triggers celebration

---

## Phase 5: Progress Page (US4)

**Goal**: Progress page shows achievements

### Implementation

- [x] T040 [P] Redesign `src/app/student/progress/page.tsx`:
  - Achievement badges with emoji
  - Animated progress rings
  - Celebration state for completed paths
- [x] T041 [P] Redesign `src/components/student/StudentProgressCard.tsx`:
  - Achievement badges with emoji
  - Larger score display
  - Friendly status text

---

## Phase 6: Polish

**Goal**: Consistent experience across all pages

- [x] T050 [P] Add mascot loading states to all pages
- [x] T051 [P] Update error states with friendly messages
- [x] T052 [P] Update all buttons to use btn-kid class variants
- [x] T053 Final TypeScript check: `tsc --noEmit` — zero errors

---

## Dependencies & Execution Order

| Phase | Depends On | Description |
|-------|-----------|-------------|
| Setup (Phase 1) | None | Design tokens foundation |
| Login (Phase 2) | Phase 1 | Login UX |
| Dashboard (Phase 3) | Phase 1 | Adventure map |
| Quiz (Phase 4) | Phase 1 | Interactive quiz |
| Progress (Phase 5) | Phase 1 | Achievements |
| Polish (Phase 6) | All | Final polish |

---

## Design Tokens Reference

```css
/* Colors */
--color-primary: #FF6B6B;   /* Coral - main CTA */
--color-secondary: #4ECDC4; /* Teal - secondary */
--color-accent: #FFE66D;    /* Yellow - highlights */
--color-purple: #A06CD5;     /* Purple - rewards */
--color-bg: #FFF9F0;        /* Cream - background */
--color-success: #00B894;    /* Green */
--color-error: #FF7675;     /* Soft red */

/* Typography */
--font-display: 'Nunito', sans-serif;
--font-body: 'Quicksand', sans-serif;

/* Spacing */
--radius-xl: 1.5rem;
--radius-full: 9999px;
--shadow-soft: 0 4px 20px rgba(0,0,0,0.08);
```

---

## Files to Modify

| File | Phase |
|------|-------|
| `src/app/globals.css` | 1 |
| `src/app/layout.tsx` | 1 |
| `src/app/student/login/page.tsx` | 2 |
| `src/components/student/StudentLoginForm.tsx` | 2 |
| `src/components/student/StudentDashboard.tsx` | 3 |
| `src/app/student/quiz/[stepId]/page.tsx` | 4 |
| `src/app/student/progress/page.tsx` | 5 |

---

*Tasks version: 1.0*
