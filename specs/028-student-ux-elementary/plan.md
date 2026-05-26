# Plan: Giao Diện Thân Thiện Học Sinh Tiểu Học (028)

## 1. Technical Context

### 1.1 Tech Stack
- **Framework**: Next.js App Router (existing)
- **Styling**: Tailwind CSS v4 + custom CSS variables
- **Fonts**: Google Fonts (Nunito, Quicksand)
- **Animations**: CSS animations + optional canvas-confetti

### 1.2 Project Structure
```
src/
├── app/
│   ├── student/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── quiz/[stepId]/page.tsx
│   │   └── progress/page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── student/
│       ├── StudentLoginForm.tsx
│       ├── StudentDashboard.tsx
│       └── ...
```

### 1.3 Current State (Baseline)
- Current UI: Slate-based palette, minimal animations
- Typography: System fonts
- Components: Standard buttons and cards

## 2. Implementation Plan

### Phase 0: Setup & Fonts

**T001**: Add Google Fonts (Nunito, Quicksand) via `next/font` or CDN
- File: `src/app/layout.tsx` or `src/app/globals.css`

**T002**: Add CSS design tokens to `globals.css`
- Colors: --color-primary, --color-secondary, --color-accent, --color-purple
- Spacing: --radius-xl, --shadow-soft
- Typography: --font-display, --font-body

**T003**: Add animation keyframes
- bounce-in, wiggle, confetti-burst, fade-in-stagger

### Phase 1: Login Page Redesign (US1)

**T010**: Redesign `src/app/student/login/page.tsx`
- Hero section với mascot emoji + tagline
- Larger input fields (py-4)
- Prominent gradient CTA button
- Animated mascot on loading

**T011**: Redesign `src/components/student/StudentLoginForm.tsx`
- Add icons to input fields
- Error state với shake animation
- Success state với bounce

### Phase 2: Dashboard Adventure Map (US2)

**T020**: Add mascot avatar to dashboard header
- File: `src/components/student/StudentDashboard.tsx`
- Emoji-based avatar với welcome message

**T021**: Replace "Lộ trình" với "Hành trình"
- Adventure-themed labels

**T022**: Redesign progress bar
- Star-based or checkpoint visual
- Animated fill

**T023**: Redesign step list
- Map-like appearance với dotted line connectors
- Larger touch targets
- Friendly status badges

### Phase 3: Quiz Page Enhancement (US3)

**T030**: Redesign answer cards
- Larger size (py-5, text-lg)
- Emoji/icon prefix
- Bounce animation on selection
- Color-coded by state

**T031**: Add confetti animation on high score
- Trigger confetti when score >= 80
- CSS-based hoặc canvas-confetti

**T032**: Redesign progress bar
- Star icons
- Animated completion

**T033**: Improve answer breakdown display
- Larger cards
- Color-coded (green/red)
- Friendly icons

### Phase 4: Progress Page (US4)

**T040**: Redesign `src/app/student/progress/page.tsx`
- Achievement badges
- Animated progress rings
- Celebration for completed paths

### Phase 5: Polish

**T050**: Add loading states with mascots
**T051**: Add error states with friendly messages
**T052**: Responsive testing on tablet
**T053**: TypeScript strict check

## 3. Dependencies

### External
- Google Fonts CDN or next/font
- Tailwind CSS v4 (existing)

### Optional
- `canvas-confetti` package for celebration effects
- Custom CSS animations (preferred for simplicity)

## 4. Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| Font loading performance | Use `next/font` with display: swap |
| Animation jank | Use CSS transforms, avoid layout thrashing |
| Color contrast issues | Test with accessibility tools |
| Breaking existing functionality | Test each page after changes |

## 5. Testing Plan

### Manual Testing
1. Login flow: 6-year-old simulate
2. Quiz completion: visual feedback check
3. Score >= 70: confetti animation
4. Score < 70: gentle shake animation
5. Responsive: tablet viewport (768px)

### Accessibility Testing
- Keyboard navigation on all interactive elements
- Color contrast ratio >= 4.5:1
- Focus indicators visible

---

*Plan version: 1.0 | Created: 2026-05-17*
