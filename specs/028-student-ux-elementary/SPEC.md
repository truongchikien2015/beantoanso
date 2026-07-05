# SPEC.md — Giao Diện Thân Thiện Học Sinh Tiểu Học (028)

## 1. Project Overview

| Field | Detail |
|---|---|
| **Feature** | Thiết kế lại giao diện student pages cho học sinh tiểu học (6-12 tuổi) |
| **Feature ID** | 028 |
| **Component** | Student login, dashboard, quiz, progress pages |
| **Target Users** | Học sinh tiểu học Việt Nam (6-12 tuổi) |

## 2. Mục tiêu & Design Direction

### Aesthetic: "Vườn Học Tập Sống Động" (Playful Garden)
- **Tone**: Warm, encouraging, game-like without being childish
- **Color Palette**: 
  - Primary: Warm coral (#FF6B6B) + Soft teal (#4ECDC4)
  - Secondary: Sunny yellow (#FFE66D) + Soft purple (#A06CD5)
  - Background: Cream white (#FFF9F0) with subtle patterns
  - Text: Deep charcoal (#2D3436) for readability
- **Typography**: 
  - Display: Nunito (rounded, friendly) 
  - Body: Quicksand (clean, legible)
- **Motion**: Bouncy, celebratory animations for positive feedback
- **Visual Elements**: Illustrated icons, soft rounded corners, subtle shadows

### Key Principles
1. **Không có text quá dài** — icons + short labels
2. **Màu sắc rõ ràng** — mỗi trạng thái có màu riêng
3. **Tương tác lớn** — buttons đủ to cho trẻ em bấm
4. **Animation vui vẻ** — confetti khi đúng, shake nhẹ khi sai
5. **Avatar/biểu tượng** — thay text bằng hình

## 3. User Stories

### US1: Login Page thân thiện
- **Priority**: P1
- **Behavior**:
  - Hero section với mascot/illustration
  - Input fields lớn với placeholder icons
  - Primary button nổi bật với gradient
  - Loading state với mascot dancing
- **Acceptance**: 
  - Trẻ 6 tuổi có thể login không cần hỗ trợ

### US2: Dashboard như "bản đồ phiêu lưu"
- **Priority**: P1
- **Behavior**:
  - Thay "Lộ trình" bằng "Hành trình"
  - Progress hiển thị như map với checkpoints
  - Avatar nhỏ ở header
  - Big friendly buttons cho các action chính
- **Acceptance**:
  - Dashboard trông như game, không phải form

### US3: Quiz page với visual feedback
- **Priority**: P1
- **Behavior**:
  - Mỗi đáp án là một "card" lớn có icon
  - Selected state với animation bounce
  - Progress bar có hình ngôi sao
  - Khi submit: confetti explosion cho điểm cao
  - Answer breakdown hiển thị với màu sắc rõ
- **Acceptance**:
  - Trẻ thấy rõ đúng/sai không cần đọc text

### US4: Progress page với achievement feel
- **Priority**: P2
- **Behavior**:
  - Hiển thị badges/stickers cho achievements
  - Progress ring animation
  - Timeline view cho lộ trình hoàn thành
- **Acceptance**:
  - Trẻ thấy được "thành tích" của mình

## 4. Technical Approach

### 4.1 Design Tokens (CSS Variables)
```css
:root {
  /* Primary palette - warm & friendly */
  --color-primary: #FF6B6B;      /* Coral - main actions */
  --color-secondary: #4ECDC4;     /* Teal - secondary */
  --color-accent: #FFE66D;       /* Yellow - highlights */
  --color-purple: #A06CD5;       /* Purple - rewards */
  
  /* Background */
  --color-bg: #FFF9F0;           /* Cream white */
  --color-bg-card: #FFFFFF;
  
  /* Text */
  --color-text: #2D3436;        /* Deep charcoal */
  --color-text-muted: #636E72;
  
  /* States */
  --color-success: #00B894;      /* Green */
  --color-error: #FF7675;         /* Soft red */
  
  /* Spacing & Border */
  --radius-xl: 1.5rem;            /* Extra rounded */
  --radius-full: 9999px;
  --shadow-soft: 0 4px 20px rgba(0,0,0,0.08);
}
```

### 4.2 Typography Scale
```css
--font-display: 'Nunito', sans-serif;
--font-body: 'Quicksand', sans-serif;
--text-hero: 2.5rem;    /* 40px - titles */
--text-xl: 1.5rem;     /* 24px - headings */
--text-lg: 1.25rem;    /* 20px - subheadings */
--text-base: 1.125rem;  /* 18px - body (larger than typical) */
--text-sm: 1rem;       /* 16px - labels */
```

### 4.3 Component Changes

#### Answer Cards (Quiz)
```tsx
// Trước: border-2, text-sm
// Sau: 
<button className={`
  w-full text-left px-6 py-5 rounded-2xl
  border-3 shadow-soft
  text-lg font-semibold
  transition-all duration-200
  ${isSelected 
    ? "border-primary bg-primary/10 scale-105" 
    : "border-slate-200 hover:border-primary/50 hover:scale-102"}
`}>
  {icon} {text}
</button>
```

#### Buttons (Primary CTA)
```tsx
<button className={`
  w-full py-4 px-6
  bg-gradient-to-r from-primary to-secondary
  text-white font-bold text-lg
  rounded-full shadow-lg
  active:scale-95 transition-transform
  flex items-center justify-center gap-2
`}>
  {icon} {label}
</button>
```

### 4.4 Animations
```css
/* Bounce on selection */
@keyframes bounce-in {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.bounce-in { animation: bounce-in 0.3s ease-out; }

/* Confetti burst */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
}

/* Wiggle for wrong answer */
@keyframes wiggle {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.wiggle { animation: wiggle 0.3s ease-in-out; }
```

## 5. Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/app/student/login/page.tsx` | Hero section, larger inputs | P1 |
| `src/app/student/dashboard/page.tsx` | Animated loading mascot | P1 |
| `src/components/student/StudentDashboard.tsx` | Adventure map UI | P1 |
| `src/app/student/quiz/[stepId]/page.tsx` | Bigger cards, confetti, animations | P1 |
| `src/components/student/StudentLoginForm.tsx` | Redesign form with icons | P1 |
| `src/app/globals.css` | Add design tokens, animations | P1 |
| `src/app/student/progress/page.tsx` | Achievement badges | P2 |

## 6. Acceptance Criteria

### Visual
- [ ] Màu sắc: 4 primary colors (coral, teal, yellow, purple) trên cream background
- [ ] Typography: Nunito + Quicksand fonts loaded
- [ ] Border radius: rounded-2xl hoặc rounded-full cho cards/buttons
- [ ] Shadows: soft shadows cho depth

### UX
- [ ] Buttons: min height 48px, min width touchable
- [ ] Answer cards: min height 60px với padding lớn
- [ ] Icons: mỗi option có emoji/icon prefix
- [ ] Progress bar: hiển thị hình ngôi sao hoặc checkpoints

### Animation
- [ ] Selected answer: bounce animation
- [ ] Submit success: confetti hoặc celebration animation
- [ ] Submit fail: gentle shake
- [ ] Page load: fade-in stagger cho elements

### Accessibility
- [ ] Font size tối thiểu 16px cho body
- [ ] Color contrast đạt WCAG AA
- [ ] Focus states visible cho keyboard navigation

## 7. Dependencies

- Google Fonts: Nunito, Quicksand (via next/font hoặc CDN)
- Tailwind CSS v4 (existing)
- Canvas-confetti hoặc CSS-based confetti

---

*Version: 1.0 | Author: Claude Sonnet 4 | Created: 2026-05-17*
