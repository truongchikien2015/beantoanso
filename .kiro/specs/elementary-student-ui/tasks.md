# Implementation Plan: Elementary Student UI ("Paper-Craft Playground")

> Kế hoạch triển khai tầng thiết kế **Paper-Craft Playground** cho các route học
> sinh tiểu học trong ứng dụng "Bé An Toàn Số". Tài liệu này chuyển hoá
> `design.md` (8 sprints, 6 correctness properties) và `requirements.md`
> (14 requirements EARS) thành các task viết code rời rạc.

## Overview

**Phạm vi tác động:** chỉ tầng UI (`src/design-system/*`, `src/components/shell/*`,
các screen components và `src/app/share/result/[id]/*`).

**Không tác động:**

- Không sửa `useAppStore` (Zustand) shape (Req 13.4).
- Không sửa key namespace `bats:*` trong `localStorage` (Req 13.2).
- Không sửa schema của `/api/grok/generate-question` và `/api/grok/explain` (Req 13.3).
- Không thêm Supabase table mới, không đổi RLS, không đổi route paths (Req 13.5).
- Không thêm runtime dependency mới (Req 11 + design.md §Dependencies).
  Chỉ thêm **devDependencies** phục vụ test.

**Nguyên tắc xuyên suốt mọi task:**

- Mọi tap target ≥ 56×56 CSS px (Req 1).
- Mọi `Body_Text` font-size ≥ 18px, line-height ≥ 1.55 (Req 2).
- Cấm hue ∈ [260°, 300°] làm primary/brand/accent (Req 3).
- Tôn trọng `prefers-reduced-motion` (Req 4).
- Phản hồi tích cực, không trừng phạt (Req 5).
- Read-aloud có sanitize URL + blocklist + max 280 ký tự (Req 6).
- Không phá hợp đồng dữ liệu hiện hữu (Req 13).
- Mỗi task kết thúc bằng `pnpm lint && pnpm typecheck` xanh.

## Tasks

- [ ] 1. Sprint 0 — Hạ tầng test và scripts dự án
  - [-] 1.1 Bổ sung devDependencies test và scripts npm
    - Thêm `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`,
      `@testing-library/jest-dom`, `@testing-library/user-event`,
      `fast-check`, `jest-axe`, `@playwright/test`, `@axe-core/playwright`
      vào `devDependencies` (KHÔNG đụng tới runtime dependencies).
    - Thêm scripts: `"test": "vitest --run"`, `"test:watch": "vitest"`,
      `"test:e2e": "playwright test"`.
    - _Requirements: 11.2, 13_

  - [~] 1.2 Cấu hình Vitest + jsdom + setup file
    - Tạo `vitest.config.ts` với environment `jsdom`, alias `@/*` khớp
      `tsconfig.json`, globals = true.
    - Tạo `vitest.setup.ts`: import `@testing-library/jest-dom`, polyfill
      `window.matchMedia`, polyfill `window.speechSynthesis` (mock),
      polyfill `IntersectionObserver`.
    - Tạo helper `src/test/render.tsx` bọc `render()` với providers.
    - _Requirements: 4.5, 6.1, 10.6_

  - [~] 1.3 Cấu hình Playwright cho route Kid_UI
    - Tạo `playwright.config.ts` với baseURL `http://localhost:3000`,
      project `chromium-desktop` (1280×720) và `chromium-chromebook`
      (1024×600).
    - Cấu hình `webServer` chạy `pnpm build && pnpm start` cho CI.
    - Tạo `e2e/fixtures/axe.ts` wrap `@axe-core/playwright`.
    - _Requirements: 10.6, 11.1_

  - [~] 1.4 Tạo skeleton thư mục design-system
    - Tạo `src/design-system/{tokens,primitives,patterns,hooks,types,
      __tests__}/` với barrel exports.
    - Tạo `src/design-system/index.ts` re-export rỗng.
    - Tạo `src/components/shell/`.
    - Verify: `pnpm lint && pnpm typecheck` xanh.
    - _Requirements: 13.1, 13.2_

- [ ] 2. Sprint 1 — Design tokens và hooks nền tảng
  - [~] 2.1 Triển khai `tokens/colors.ts`
    - Implement `colors` object theo `design.md` §4.1: `coral`, `teal`,
      `sunny`, `success`, `error`, `info`, `surface`, `ink`, `topic`.
    - Export `FORBIDDEN_HUE_RANGE = [260, 300] as const`.
    - Export helper `hslHueOf(hex: string): number`.
    - Export type `KidPalette`.
    - _Requirements: 3.1, 3.2, 3.6, 14_

  - [~] 2.2 Property test: No-purple invariant
    - **Property 3: No-purple invariant**
    - **Validates: Requirements 3.1, 3.6**
    - File: `src/design-system/__tests__/no-purple.property.test.ts`.
    - Dùng `fast-check`: với mọi token color export làm primary/brand/
      accent, assert `hue(token) < 260 || hue(token) > 300`.
    - _Requirements: 3.1, 3.2, 3.6_

  - [~] 2.3 Triển khai `tokens/typography.ts`, `tokens/spacing.ts`,
        `tokens/motion.ts`
    - `typography.ts`: export `fontFamily`, `size` (caption=14, body=18,
      bodyLg=20, h3=24, h2=32, h1=44, hero=56), `weight`, `leading`
      (tight=1.25, normal=1.55, relaxed=1.7), `tracking`.
    - `spacing.ts`: export `spacing` (4-pt), `tapTarget` (min=56,
      recommended=64, large=72, hero=88), `radius`.
    - `motion.ts`: export `duration` (instant=0, fast=120, base=240,
      slow=420, epic=900), `easing`, `rotation.sticker`.
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1, 14.2_

  - [~] 2.4 Mirror tokens sang CSS variables trong `globals.css`
    - Thêm/đồng bộ `--kid-coral`, `--kid-teal`, `--kid-sunny`,
      `--kid-success`, `--kid-error`, `--kid-surface-cream`,
      `--kid-ink-900`, `--kid-tap-min: 56px`, `--kid-radius-md: 20px`,
      `--kid-motion-fast: 120ms`, `--kid-motion-base: 240ms`.
    - Thêm `@media (prefers-reduced-motion: reduce)` reset durations.
    - Loại bỏ tham chiếu `--kid-purple-new` ở vai trò primary/brand.
    - _Requirements: 3.1, 3.2, 4.1_

  - [~] 2.5 Hook `useReducedMotion`
    - File: `src/design-system/hooks/useReducedMotion.ts`.
    - Subscribe `matchMedia("(prefers-reduced-motion: reduce)")`,
      addEventListener `change` để cập nhật runtime (Req 4.6).
    - SSR-safe: return `false` nếu `typeof window === 'undefined'`.
    - _Requirements: 4.5, 4.6_

  - [~] 2.6 Property test + unit test cho `useReducedMotion`
    - **Property 4: Reduced-motion respect**
    - **Validates: Requirements 4.5, 4.6**
    - File: `src/design-system/__tests__/reduced-motion.property.test.tsx`.
    - Mock `matchMedia` trả `matches: true/false`, toggle runtime.
    - Property: với mọi chuỗi sự kiện toggle, hook trả về giá trị mới
      nhất sau mỗi event mà không cần rerender thủ công.
    - _Requirements: 4.5, 4.6_

  - [~] 2.7 Hook `useReadAloud` + util `lib/tts.ts` an toàn nội dung
    - Tạo/cập nhật `src/lib/tts.ts` với hàm `speakViVN(text, opts)`:
      - `lang = "vi-VN"`, `rate = 0.9` (cap ≤ 1.0).
      - Bỏ qua nếu `!('speechSynthesis' in window)` (Req 6.7).
      - Strip URL bằng regex `/https?:\/\/\S+/g` (Req 6.5).
      - Truncate input ở 280 ký tự (Req 6.4).
      - Gọi `speechSynthesis.cancel()` trước mỗi `speak` (Req 6.6).
      - Nếu text chứa từ trong blocklist → silent abort (Req 6.3).
    - Hook `useReadAloud()` (`src/design-system/hooks/useReadAloud.ts`)
      memoize callback gọi `speakViVN`.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [~] 2.8 Property test: Read-aloud safety invariant
    - **Property 6: Read-aloud safety invariant**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**
    - File: `src/design-system/__tests__/read-aloud.property.test.ts`.
    - Mock `window.speechSynthesis` để spy `speak`/`cancel`.
    - Dùng `fast-check`:
      - `fc.string({ maxLength: 1000 })` → utterance.text.length ≤ 280.
      - Chèn ngẫu nhiên URL → assert text speak không chứa `http`.
      - Chèn ngẫu nhiên `Unsafe_Term` → assert `speak` KHÔNG được gọi.
      - Mỗi lần speak đều gọi `cancel` trước.
      - `utterance.lang === "vi-VN"` và `utterance.rate <= 1.0`.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 2.9 Hook `useTapSound` + cập nhật `lib/sound.ts`
    - `lib/sound.ts`: export `playTap()`, `playCorrect()`, `playSoft()`
      (≤ 200 ms gentle wooden tap), `playComplete()`. KHÔNG có
      `playBuzzer` (Req 5.4).
    - Persist mute state ở `localStorage["bats:sound:enabled"]` (Req 13.2).
    - Hook `useTapSound()` trả callback `() => playTap()` (no-op nếu mute).
    - _Requirements: 5.4, 13.2_

  - [~] 2.10 Unit test cho `useTapSound` + `lib/sound`
    - Mock `HTMLAudioElement` để spy `play()`.
    - Test mute toggle persist đúng key `bats:sound:enabled`.
    - _Requirements: 5.4, 13.2_

- [~] 3. Checkpoint — Foundation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Sprint 2 — Primitives
  - [~] 4.1 `KidButton` primitive
    - File: `src/design-system/primitives/KidButton.tsx`.
    - 5 variants: `primary` (coral), `secondary` (teal), `success`,
      `ghost`, `danger`; 3 sizes: `lg` (min-h 64), `xl` (72), `hero` (88).
    - `whileTap`/`whileHover` chỉ kích hoạt khi `useReducedMotion()`
      false; disabled nuốt `onClick` và giữ kích thước (Req 1.6).
    - Kích hoạt `useTapSound()` trên click.
    - Yêu cầu `aria-label` nếu `children` rỗng / chỉ có icon (Req 10.5).
    - Focus ring 3px coral/teal (Req 10.2).
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 4.1, 4.5, 9.1, 9.2, 10.2, 10.5_

  - [~] 4.2 Property test: Tap target invariant cho `KidButton`
    - **Property 1: Tap target invariant**
    - **Validates: Requirements 1.1, 1.2, 1.6**
    - File: `src/design-system/__tests__/tap-target.property.test.tsx`.
    - Dùng `fast-check` × `@testing-library/react`:
      - `fc.constantFrom('lg','xl','hero')` × variants × labels × disabled.
      - Assert rendered height ≥ {64, 72, 88} theo size, width ≥ 56.
      - Assert kích thước không đổi giữa enabled/disabled.
    - _Requirements: 1.1, 1.2, 1.6_

  - [~] 4.3 `KidCard` primitive
    - File: `src/design-system/primitives/KidCard.tsx`.
    - Variant `default` (border 3px, radius `lg`, surface paper) và
      `sticker` (offset solid shadow `4px 4px 0 rgba(0,0,0,0.12)`).
    - role="group" + `aria-labelledby` optional.
    - _Requirements: 3.5, 14.2, 14.3_

  - [~] 4.4 `KidChoice` primitive
    - File: `src/design-system/primitives/KidChoice.tsx`.
    - Layout `[ô letter A/B/C 48×48] [label] [🔊]`, min-height 72.
    - 4 state: `idle`, `selected`, `correct`, `wrong`. Click khoá khi đã
      `correct`/`wrong` (Req 5).
    - `role="radio"` trong `role="radiogroup"`, hỗ trợ phím mũi tên
      (ArrowUp/Down/Left/Right) (Req 10.4).
    - Tích hợp `ReadAloudButton` compact (đọc `${letter}. ${label}`).
    - _Requirements: 1.3, 5.1, 5.2, 5.3, 9.5, 10.4_

  - [~] 4.5 Property test: `KidChoice` tap target + typography
    - **Property 1 (mở rộng) + Property 2: Tap target + typography**
    - **Validates: Requirements 1.3, 2.1, 2.3**
    - Với `fc.string({ minLength: 1, maxLength: 80 })` mô phỏng label
      tiếng Việt có dấu, render `KidChoice` ở viewport 320/768/1024.
    - Assert chiều cao ≥ 72px, label không bị truncate.
    - Assert `getComputedStyle(label).fontSize >= '20px'`.
    - _Requirements: 1.3, 2.1, 2.3_

  - [~] 4.6 `ReadAloudButton` primitive
    - File: `src/design-system/primitives/ReadAloudButton.tsx`.
    - Compact (40×40 visual, 56×56 hit area qua padding) và standalone
      (56×56). Render null nếu `!('speechSynthesis' in window)` (Req 6.7).
    - `aria-label="Nghe đọc to"` (Req 10.5).
    - Gọi `useReadAloud()` khi click; thêm `aria-pressed` toggle.
    - _Requirements: 1.4, 6.1, 6.7, 10.5_

  - [~] 4.7 `KidProgress` primitive
    - File: `src/design-system/primitives/KidProgress.tsx`.
    - Thanh XP (gradient coral → teal, animate `width` — ngoại lệ
      Req 11.4) và thanh bước (5/10) tách rời.
    - `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax`,
      `role="progressbar"`.
    - _Requirements: 11.4, 10.1_

  - [~] 4.8 `KidBadge` primitive
    - File: `src/design-system/primitives/KidBadge.tsx`.
    - Pill: `topic` (dùng `colors.topic.*` — Req 3.6), `streak`, `new`,
      `tier` (Đồng/Bạc/Vàng).
    - `text-transform: uppercase` chỉ khi label ≤ 6 ký tự (Req 2.6).
    - _Requirements: 2.6, 3.6_

  - [~] 4.9 Unit tests cho KidCard, KidProgress, KidBadge, ReadAloudButton
    - Render từng variant + state, snapshot computed style.
    - Test ReadAloudButton ẩn khi `speechSynthesis` không tồn tại.
    - Verify focus ring ≥ 3px width khi tab tới.
    - _Requirements: 1.4, 6.7, 10.2_

  - [~] 4.10 Property test: Vietnamese typography invariant
    - **Property 2: Vietnamese-friendly typography invariant**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - File: `src/design-system/__tests__/typography.property.test.tsx`.
    - Render từng primitive với label tiếng Việt sinh ngẫu nhiên (có dấu)
      ở viewport 320/768/1280.
    - Walk DOM, với mỗi text node: assert `fontSize >= 18` trừ node có
      `data-role="caption"` hoặc `data-role="metadata"` (≥ 14).
    - Assert `lineHeight / fontSize >= 1.55`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [~] 5. Checkpoint — Primitives
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Sprint 3 — Patterns + Shell layer
  - [~] 6.1 `AnchorDriftLayout` pattern
    - File: `src/design-system/patterns/AnchorDriftLayout.tsx`.
    - Hỗ trợ tỉ lệ `60-40 | 40-60 | 30-70`. Mobile (< md): stack dọc,
      anchor thu nhỏ thành ribbon 88×88 fixed bottom-right.
    - Cấm fallback về layout 3 cột đều — guard lỗi hardcode.
    - _Requirements: 3.4, 14.1_

  - [~] 6.2 `StickerCard` pattern
    - File: `src/design-system/patterns/StickerCard.tsx`.
    - Tilt rút từ tập rời rạc `{-6,-3,0,3,6}°`, deterministic theo
      `props.seed` để SSR/CSR khớp.
    - Reserve `min-height` để tránh CLS > 0.1 (Req 11.5).
    - Khi `useReducedMotion()` true: ép tilt = 0° (Req 4.3, 14.6).
    - _Requirements: 4.3, 11.5, 14.2, 14.6_

  - [~] 6.3 `ConfettiBurst` pattern
    - File: `src/design-system/patterns/ConfettiBurst.tsx`.
    - Wrap `canvas-confetti`, palette = `[coral.500, teal.500, sunny.500,
      success.base]` (KHÔNG hạt tím — Req 3.1).
    - Khi `useReducedMotion()` true: thay bằng badge "✓" fade-in ≤ 120ms
      (Req 4.4).
    - _Requirements: 3.1, 4.4_

  - [~] 6.4 `MascotDialog` pattern
    - File: `src/design-system/patterns/MascotDialog.tsx`.
    - 4 mood: `cheerful | thinking | celebrate | comfort` (Req 8.2).
    - Tích hợp `ReadAloudButton` đọc dialog text (Req 8.5).
    - Animation `bounce-in` 500ms → fade-in 120ms khi `reduced-motion`
      (Req 8.6).
    - Dùng `@radix-ui/react-dialog` cho focus trap + esc-to-close.
    - _Requirements: 4.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.5_

  - [~] 6.5 Property test: Positive feedback invariant
    - **Property 5: Positive feedback invariant (no punishment)**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    - File: `src/design-system/__tests__/positive-feedback.property.test.tsx`.
    - Dùng `fast-check` mô phỏng 1..50 lượt trả lời (đúng/sai) qua
      reducer thuần (`feedbackReducer(state, answer)`):
      - Score chỉ đơn điệu tăng hoặc giữ nguyên.
      - Sai → mood `comfort`, có `explanation`, không `playBuzzer`.
      - Đúng → mood `celebrate`, score += 10.
      - Render `MascotDialog` ở mood tương ứng, text không chứa từ
        tiêu cực (`thua`, `thất bại`, `Game Over`).
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [~] 6.6 `KidLayout` shell
    - File: `src/components/shell/KidLayout.tsx`.
    - Wrap `safe-area-inset-*`, nền `surface.cream`, render `KidTopBar`,
      tuỳ chọn `KidBottomNav` (prop `showBottomNav`, mặc định true,
      tự động `false` khi pathname `/quiz` hoặc `/mission` — Req 7.4).
    - `data-route="kid"` để E2E xác định route Kid_UI.
    - _Requirements: 7.1, 7.4, 7.5_

  - [~] 6.7 `KidTopBar` shell
    - File: `src/components/shell/KidTopBar.tsx`.
    - Bố cục trái → phải: avatar + nickname (đọc từ `useAppStore`),
      `KidProgress` (XP), nút mute toàn cục, nút Home 🏠 link `/`.
    - Mọi nút có `Tap_Target` ≥ 56×56 (Req 1.1).
    - _Requirements: 1.1, 7.1, 7.2_

  - [~] 6.8 `KidBottomNav` shell
    - File: `src/components/shell/KidBottomNav.tsx`.
    - Đúng 4 tab cố định: 🏠 Trang chủ (`/`), 🗺️ Bản đồ (`/map`),
      📚 Bài học (`/lessons`), 🏆 Bảng điểm (`/leaderboard`).
    - Active tab dùng accent coral/teal, KHÔNG hamburger (Req 7.6).
    - Ẩn hoàn toàn (return null) khi pathname ∈ {`/quiz`, `/mission`}.
    - _Requirements: 7.3, 7.4, 7.6_

  - [~] 6.9 Unit tests cho shell components
    - Mock `usePathname()` để verify `KidBottomNav` ẩn ở `/quiz`,
      `/mission`.
    - Verify `KidTopBar` render nút Home có `aria-label="Trang chủ"`.
    - Snapshot navigation depth: từ `/` đến `/quiz` ≤ 3 level (Req 7.5).
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [~] 7. Checkpoint — Patterns + Shell
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Sprint 4 — Refactor các trang nội dung tĩnh
  - [~] 8.1 Refactor `HomeScreen.tsx`
    - Bọc `KidLayout` + `AnchorDriftLayout ratio="40-60"` với anchor =
      mascot Bé Kiên + Robot An Toàn (SVG inline, KHÔNG emoji ✨🚀💎 —
      Req 14.4).
    - 1 primary CTA `KidButton variant="primary" size="hero"` label
      "Chơi ngay"; 1 secondary "Bài học hôm nay" (Req 9.1, 9.3).
    - 2 `StickerCard` (DailyChallengePreview + StreakBadge).
    - `ReadAloudButton` đọc khẩu hiệu chào.
    - Giữ nguyên props/store reads — KHÔNG sửa shape Zustand.
    - _Requirements: 9.1, 9.3, 13.1, 13.4, 14.1, 14.4, 14.5_

  - [~] 8.2 Refactor `LearningPathSelector.tsx` (`/path-select`)
    - Stacked dọc trên mobile, sticker layout trên desktop. 3 thẻ
      Cơ bản / Nâng cao / Toàn diện là `StickerCard` + `KidCard`.
    - CTA chính = 3 thẻ; không thêm CTA phụ above the fold (Req 9.4).
    - Mascot anchor render trên hero (Req 14.5).
    - _Requirements: 9.1, 9.4, 14.1, 14.5_

  - [~] 8.3 Refactor `JourneyMap.tsx` (`/map`)
    - 7 mốc topic là `StickerCard` xếp lệch, dùng `colors.topic.*`
      (KHÔNG tím — Req 3.6).
    - Trạng thái khoá/mở dùng `KidBadge`.
    - Không zoom, không mini-map.
    - _Requirements: 3.4, 3.6, 9.1, 14.2_

  - [~] 8.4 Refactor `LessonsScreen.tsx` (`/lessons`)
    - Mỗi lesson card = `KidCard` + `ReadAloudButton` đọc `intro`/`tips`.
    - `MascotDialog cheerful` ở hero, 1 CTA chính ("Bắt đầu đọc").
    - Đảm bảo `Body_Text` ≥ 18px, line-height ≥ 1.55 (Req 2).
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 14.1_

  - [~] 8.5 Refactor `DailyChallenge.tsx` (`/daily`)
    - 1 câu hỏi/ngày + nút "Hôm nay làm tiếp" (KidButton xl).
    - Streak hiển thị bằng `KidBadge`. Khi streak gãy → text trung tính
      "Hôm nay nghỉ chút cũng được" (Req 5.5).
    - Đọc câu hỏi qua `ReadAloudButton`.
    - _Requirements: 5.5, 9.1, 14.1_

  - [~] 8.6 Test E2E: Keyboard-only Journey Map → Lessons → Daily
    - Playwright: tab/arrow/enter qua các route mà không dùng chuột.
    - Verify focus ring nhìn thấy được, axe-core 0 violation
      `serious|critical`.
    - _Requirements: 10.3, 10.6_

- [ ] 9. Sprint 5 — Refactor các activity (Quiz, Mission, Classify)
  - [~] 9.1 Refactor `QuizScreen.tsx` (`/quiz`)
    - Render 1 câu hỏi + 3 `KidChoice` + 1 `ReadAloudButton` (chỉ 5
      interactive elements above bottom nav — Req 9.5).
    - Vòng lặp 10 câu theo `runQuizRound` ở `design.md` §8.5: chấm điểm
      → mascot mood → `confettiBurst` (đúng) hoặc đọc explanation (sai)
      → wait ≥ 1.2s → câu tiếp (Req 5.6).
    - Persist kết quả qua `useAppStore.setQuiz({ correct, total: 10,
      score })` đúng shape hiện tại (Req 13.4).
    - Ghi `StudentAnswer` vào `bats:student_answers:v1` đúng key cũ.
    - Ẩn `KidBottomNav` (Req 7.4).
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 7.4, 9.5, 13.1, 13.4_

  - [~] 9.2 Offline fallback cho `/quiz`
    - Detect `navigator.onLine === false`: dùng câu seed từ
      `src/data/quizQuestions.ts`, không hiển thị blocking dialog (Req 12.1).
    - Khi reconnect: enqueue `FinalResult` lên Supabase đúng 1 lần với
      retry exponential backoff ≤ 3 lần, persist vào
      `bats:final_results:v1` đến khi sync xong (Req 12.3, 12.4).
    - Mọi message offline qua `MascotDialog mood="comfort"`, không chứa
      "lỗi", "error", HTTP status (Req 12.5, 12.6).
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 13.2_

  - [~] 9.3 Refactor `MissionScreen.tsx` (`/mission`)
    - Layout `AnchorDriftLayout` với anchor = mascot kể chuyện.
    - 3 lựa chọn dùng `KidChoice` (label = `option.text`).
    - Sai → `MascotDialog comfort` + `option.feedback`, KHÔNG "thua",
      cho thử lại (Req 5).
    - Offline fallback giống Quiz (Req 12.2).
    - Ẩn `KidBottomNav` (Req 7.4).
    - _Requirements: 5.1, 5.2, 5.3, 7.4, 12.2, 14.1_

  - [~] 9.4 Refactor `ClassifyGame.tsx` (`/classify`)
    - Lazy-load `react-dnd` + `react-dnd-html5-backend` qua dynamic
      `import()` để KHÔNG vào bundle `/quiz` hoặc `/mission` (Req 11.3).
    - Cung cấp fallback "chạm để chọn" (tap-to-toggle) cho trẻ chưa
      kéo thả thạo.
    - Hộp chứa dùng `KidCard sticker`, item dùng `KidBadge topic`.
    - _Requirements: 1.1, 11.3, 14.2_

  - [~] 9.5 Unit + integration test cho Quiz reducer
    - Test `runQuizRound` với 10 câu mock; assert score = correct × 10,
      total === 10, persist đúng key Zustand `quiz`.
    - Test mọi case sai không giảm score (Req 5.3).
    - _Requirements: 5.1, 5.3, 13.4_

  - [~] 9.6 Test E2E: Offline quiz round (Playwright)
    - Block network sau câu thứ 3 bằng `page.route('**/*', r => r.abort())`.
    - Verify hoàn thành 10 câu với seed local; reconnect → result sync,
      không hiện "lỗi".
    - _Requirements: 12.1, 12.3, 12.4, 12.5_

- [~] 10. Checkpoint — Activities
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Sprint 6 — Result, Leaderboard, Share
  - [~] 11.1 Refactor `ResultScreen.tsx` (`/result`)
    - `AnchorDriftLayout` với mascot + Robot An Toàn (Req 14.5).
    - Badge tier dùng `KidBadge tier`, tựa danh hiệu tích cực:
      `total_score < 50 → "Luyện tập thêm 💪"` (Req 5.5).
    - 1 CTA chính `In giấy khen`; 1 CTA phụ `Bảng điểm` (Req 9.1, 9.2).
    - `ConfettiBurst` chỉ chạy khi `!useReducedMotion()`.
    - Mini chart per topic dùng Recharts (đã có sẵn).
    - _Requirements: 5.5, 9.1, 9.2, 14.1, 14.5_

  - [~] 11.2 Refactor `Leaderboard.tsx` (`/leaderboard`)
    - Podium 🥇🥈🥉 dùng `StickerCard` tilt -3 / 0 / +3.
    - Highlight player hiện tại bằng coral border 4px.
    - Pagination 10 dùng `KidButton ghost`.
    - KHÔNG hiển thị "thấp nhất", "thua bạn X" (Req 5.5).
    - _Requirements: 5.5, 9.1, 9.6, 14.2_

  - [~] 11.3 Refactor `app/share/result/[id]/page.tsx`
    - Render OG-friendly card (1200×630) dùng `StickerCard` + mascot.
    - KHÔNG render `MascotDialog` (Req 8.1 ngoại lệ cho route này).
    - Giữ nguyên fallback URL param khi DB không có row (Req 13.5).
    - _Requirements: 8.1, 13.5_

  - [~] 11.4 Unit test: badge tier mapping
    - `total_score >= 90 → "Chiến binh an toàn số 🏆"`,
      `>=70 → "Bạn nhỏ thông minh 🌟"`, `>=50 → "Em đã hiểu cơ bản 🎖️"`,
      `<50 → "Luyện tập thêm 💪"`.
    - Assert chuỗi không chứa từ tiêu cực (Req 5.5).
    - _Requirements: 5.5_

- [ ] 12. Sprint 7 — A11y + Performance hardening
  - [~] 12.1 Tích hợp axe-core vào CI cho mọi route Kid_UI
    - File: `e2e/axe.spec.ts`.
    - Chạy axe trên `/`, `/path-select`, `/map`, `/lessons`, `/quiz`,
      `/mission`, `/classify`, `/daily`, `/result`, `/leaderboard`,
      `/share/result/[id]` — 0 violation `serious|critical` (Req 10.6).
    - Test cả 2 chế độ: default, `prefers-reduced-motion: reduce`.
    - _Requirements: 4.1, 10.6_

  - [~] 12.2 Test contrast WCAG AA cho mọi token
    - File: `src/design-system/__tests__/contrast.test.ts`.
    - Với mọi cặp `(text token, surface token)` sử dụng trong
      design-system, assert ratio ≥ 4.5:1 (font < 18px) hoặc ≥ 3:1
      (≥ 18px) (Req 10.1).
    - _Requirements: 10.1_

  - [~] 12.3 Test keyboard-only quiz round (Playwright)
    - Hoàn thành 10 câu chỉ bằng Tab/Shift+Tab/Arrow/Enter/Space.
    - Verify focus ring ≥ 3px (Req 10.2, 10.3).
    - Verify `KidChoice` arrow-key navigation và role `radiogroup`/`radio`
      (Req 10.4).
    - _Requirements: 10.2, 10.3, 10.4_

  - [~] 12.4 Bundle size budget cho `/quiz`
    - Chạy `pnpm build`, parse `.next/build-manifest.json`.
    - Assert chunk riêng cho `/quiz` ≤ 200 KB gzipped không tính
      framework chunk (Req 11.2).
    - Verify `react-dnd` không nằm trong chunk `/quiz` hay `/mission`
      (Req 11.3).
    - Script: `scripts/check-bundle.ts` chạy trong CI.
    - _Requirements: 11.2, 11.3_

  - [~] 12.5 Audit animation chỉ dùng `transform` + `opacity`
    - File: `src/design-system/__tests__/animation-properties.test.ts`.
    - Static analysis: với mọi `framer-motion` `animate`/`transition` và
      `@keyframes` trong `globals.css`, assert chỉ chứa `transform`,
      `opacity` (ngoại lệ: `KidProgress` width — Req 11.4).
    - _Requirements: 11.4_

  - [~] 12.6 Preconnect + subset font Nunito Vietnamese
    - Trong `app/layout.tsx`: `<link rel="preconnect"
      href="https://fonts.googleapis.com">`, `<link rel="preconnect"
      href="https://fonts.gstatic.com" crossorigin>`.
    - Tải Nunito với `subset=latin,latin-ext,vietnamese` (Req 2.5, 11.6).
    - _Requirements: 2.5, 11.6_

  - [~] 12.7 Lighthouse budget cho 1024×600 + Fast 3G
    - Cấu hình Playwright + Lighthouse CI với throttling Fast 3G,
      device 1024×600 (Chromebook).
    - Mục tiêu: LCP ≤ 2.5s cho mỗi route Kid_UI (Req 11.1).
    - Output báo cáo `.lighthouse/*.json`.
    - _Requirements: 11.1_

  - [~] 12.8 Test integration: Reduced-motion end-to-end
    - Playwright với `emulateMedia({ reducedMotion: 'reduce' })`.
    - Assert mọi `transition-duration` ≤ 120ms, không có `StickerCard`
      xoay, `ConfettiBurst` không chạy canvas.
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [~] 13. Final checkpoint — Đảm bảo toàn bộ test xanh
  - Ensure all tests pass, ask the user if questions arise.
  - Chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`.
  - Đảm bảo không có route nào còn dùng tím làm primary, mọi tap target
    ≥ 56px, mọi text ≥ 18px (trừ caption/metadata), mọi mood mascot khớp
    với feedback.

## Notes

- Tasks gắn `*` (ví dụ `2.2`, `2.6`, `2.8`, `4.2`, `4.5`, `4.9`, `4.10`,
  `6.5`, `6.9`, `8.6`, `9.5`, `9.6`, `11.4`, `12.3`, `12.7`, `12.8`) là
  **optional test tasks**: được phép bỏ qua khi đẩy nhanh MVP, nhưng KHÔNG
  được bỏ ở release thật.
- Mỗi sub-task ≠ optional là implementation phải chạy. Sub-task optional
  KHÔNG được code-gen agent tự thực thi (theo quy ước workflow).
- 6 correctness properties được phủ bởi các sub-task PBT:
  - **Property 1 — Tap target invariant** → `4.2` (mở rộng `4.5`).
  - **Property 2 — Vietnamese typography invariant** → `4.10` (mở rộng `4.5`).
  - **Property 3 — No-purple invariant** → `2.2`.
  - **Property 4 — Reduced-motion respect** → `2.6` (kết hợp e2e `12.8`).
  - **Property 5 — Positive feedback (no punishment)** → `6.5`.
  - **Property 6 — Read-aloud safety invariant** → `2.8`.
- Mỗi task kết thúc bằng `pnpm lint && pnpm typecheck` xanh (verification gate).
- KHÔNG sửa: shape Zustand `useAppStore`, key `bats:*` ở localStorage,
  schema `/api/grok/*`, tables Supabase, RLS, route paths (Req 13).
- KHÔNG thêm runtime dependency mới. Chỉ thêm devDependencies test ở
  task `1.1` (vitest, fast-check, RTL, playwright, jest-axe).
- Package manager: **pnpm** (theo steering rule).
- Tham chiếu requirement ở mỗi task theo dạng `_Requirements: X.Y_`
  trỏ đến từng acceptance criterion cụ thể trong `requirements.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.3", "2.5", "2.7", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6", "2.8", "2.10"] },
    { "id": 4, "tasks": ["4.1", "4.3", "4.6", "4.7", "4.8"] },
    { "id": 5, "tasks": ["4.2", "4.4", "4.9"] },
    { "id": 6, "tasks": ["4.5", "4.10", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5", "6.6"] },
    { "id": 8, "tasks": ["6.7", "6.8"] },
    { "id": 9, "tasks": ["6.9"] },
    { "id": 10, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 11, "tasks": ["8.6", "9.1", "9.3", "9.4"] },
    { "id": 12, "tasks": ["9.2", "9.5"] },
    { "id": 13, "tasks": ["9.6", "11.1", "11.2", "11.3"] },
    { "id": 14, "tasks": ["11.4", "12.1", "12.2", "12.5", "12.6"] },
    { "id": 15, "tasks": ["12.3", "12.4", "12.7", "12.8"] }
  ]
}
```
