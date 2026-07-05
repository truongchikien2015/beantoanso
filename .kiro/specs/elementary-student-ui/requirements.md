# Requirements Document

> **Feature:** Elementary Student UI ("Bé An Toàn Số" cho học sinh tiểu học 6–12 tuổi)

## Introduction

Tài liệu requirements này được dẫn xuất ngược từ `design.md` của tính năng
**Elementary Student UI** ("Bé An Toàn Số" cho học sinh tiểu học 6–12 tuổi).
Mục tiêu là chuẩn hoá toàn bộ tầng UI của các route học sinh
(`/`, `/path-select`, `/map`, `/quiz`, `/mission`, `/classify`, `/daily`,
`/lessons`, `/result`, `/leaderboard`, `/share/result/[id]`) thành một hệ
thiết kế thống nhất tên là **"Paper-Craft Playground"** — sticker-layered,
asymmetric, chống cliché SaaS, cấm tím/indigo/violet, và tôn trọng triệt để
giới hạn cảm – vận động – nhận thức của trẻ tiểu học Việt Nam.

Requirements được viết theo chuẩn **EARS** (Easy Approach to Requirements
Syntax) và được ánh xạ với 6 Correctness Properties đã khai báo trong
`design.md` (Property 1–6) ở phần "Correctness Properties".

Các requirement được thiết kế để có thể kiểm chứng bằng:

- **Property-based test** (fast-check) cho các bất biến ở phạm vi component.
- **Unit test** (Vitest + React Testing Library) cho từng primitive.
- **Accessibility test** (axe-core) trên mỗi route học sinh.
- **E2E test** (Playwright) cho luồng học sinh end-to-end.

## Glossary

- **Kid_UI**: Tầng UI dành riêng cho học sinh (mọi route công khai
  `/`, `/path-select`, `/map`, `/quiz`, `/mission`, `/classify`, `/daily`,
  `/lessons`, `/result`, `/leaderboard`, `/share/result/[id]`). Không bao
  gồm `/admin`, `/teacher`.
- **Kid_Shell**: Lớp khung gồm `KidLayout`, `KidTopBar`, `KidBottomNav`,
  `RobotGuideBar` bao bọc mọi route Kid_UI.
- **Kid_Primitives**: Tập hợp các component nguyên tử của thiết kế gồm
  `KidButton`, `KidCard`, `KidChoice`, `KidProgress`, `KidBadge`,
  `ReadAloudButton`.
- **Kid_Patterns**: Tập hợp các layout pattern gồm `AnchorDriftLayout`,
  `StickerCard`, `ConfettiBurst`, `MascotDialog`.
- **Tap_Target**: Vùng chạm tối thiểu cho mọi phần tử tương tác trong
  Kid_UI, đo bằng `boundingBox.height × boundingBox.width` ở viewport
  thực tế (CSS pixel).
- **Body_Text**: Mọi text node nằm trong cây render của Kid_UI, có vai
  trò ngữ nghĩa là "đoạn văn", "câu hỏi", "nhãn nút", "câu trả lời",
  "giải thích" (tức tất cả trừ `caption` và `metadata`).
- **Read_Aloud_Engine**: Thành phần đọc to văn bản tiếng Việt thông qua
  `SpeechSynthesis` API (wrapper ở `src/lib/tts.ts` và hook
  `useReadAloud`).
- **Reduced_Motion_Mode**: Trạng thái khi
  `matchMedia("(prefers-reduced-motion: reduce)").matches === true`.
- **Forbidden_Hue**: Dải hue HSL `[260°, 300°]` (tím / indigo / violet /
  magenta), bị cấm dùng làm primary, brand hoặc accent chính trong tokens
  của Kid_UI.
- **Quiz_Round**: Một ván quiz gồm đúng 10 câu hỏi.
- **Positive_Feedback_Mode**: Chế độ phản hồi chỉ chứa lời động viên,
  KHÔNG trừ điểm, KHÔNG dùng âm "buzzer", KHÔNG nhấp nháy đỏ chói.
- **Unsafe_Term**: Một từ/cụm từ nằm trong blocklist tiếng Việt được khai
  báo tại `/api/grok/generate-question` cho mục đích lọc nội dung không an
  toàn cho trẻ.
- **Mascot**: Nhân vật dẫn chuyện gồm "Bé Kiên" (em bé học sinh) và
  "Robot An Toàn" (robot hướng dẫn), thể hiện qua `MascotDialog`.

## Requirements

### Requirement 1: Tap target tối thiểu cho mọi phần tử tương tác

**User Story:** Là học sinh tiểu học có ngón tay nhỏ và độ chính xác chạm
chưa cao, tôi muốn mọi nút bấm trong giao diện đều đủ rộng và đủ cao, để
tôi không bấm nhầm hoặc phải zoom màn hình mới chạm trúng.

#### Acceptance Criteria

1. THE Kid_UI SHALL render every interactive element (button, link, choice,
   tab, toggle, icon button) with `Tap_Target` height ≥ 56 CSS pixels and
   width ≥ 56 CSS pixels.
2. THE Kid_Primitives `KidButton` SHALL provide three sizes whose minimum
   rendered heights are: `lg` ≥ 64px, `xl` ≥ 72px, `hero` ≥ 88px.
3. THE Kid_Primitives `KidChoice` SHALL render with minimum height ≥ 72px
   regardless of label length, viewport width, or device pixel ratio.
4. THE Kid_Primitives `ReadAloudButton` SHALL render with minimum
   `Tap_Target` 56 × 56 CSS pixels in both compact and standalone modes.
5. WHERE a touch device is used, THE Kid_UI SHALL preserve a minimum gap
   of 8 CSS pixels between adjacent `Tap_Target` regions to prevent
   accidental taps.
6. WHEN a `Tap_Target` is rendered with `disabled` state, THE Kid_UI SHALL
   keep the visual `Tap_Target` size unchanged so layout does not shift on
   state transitions.

> **Validates Correctness Property 1: Tap target invariant** (`design.md`
> §Correctness Properties — "Property 1").

---

### Requirement 2: Typography thân thiện tiếng Việt cho học sinh tiểu học

**User Story:** Là học sinh tiểu học đang học đọc tiếng Việt có dấu, tôi
muốn chữ trên màn hình đủ to và dòng đủ thoáng, để các dấu sắc/huyền/hỏi/
ngã/nặng không chen vào dòng trên dòng dưới và tôi đọc được trôi chảy.

#### Acceptance Criteria

1. THE Kid_UI SHALL render every `Body_Text` node with computed
   `font-size` ≥ 18 CSS pixels.
2. THE Kid_UI SHALL render every `Body_Text` node with computed
   `line-height` ≥ 1.55.
3. THE Kid_UI SHALL render every quiz question label with computed
   `font-size` ≥ 20 CSS pixels.
4. WHERE a text node has semantic role `caption` or `metadata`,
   THE Kid_UI SHALL allow `font-size` as low as 14 CSS pixels but SHALL
   keep `line-height` ≥ 1.5.
5. THE Kid_UI SHALL load the Nunito font family with the Vietnamese
   subset (`latin`, `latin-ext`, `vietnamese`) and SHALL preconnect to
   the font origin in `<head>`.
6. WHEN displaying any heading (h1–h3) in Kid_UI, THE Kid_UI SHALL apply
   font-weight ≥ 700 and SHALL NOT use `text-transform: uppercase` for
   strings longer than 6 characters.

> **Validates Correctness Property 2: Vietnamese-friendly typography
> invariant** (`design.md` §Correctness Properties — "Property 2").

---

### Requirement 3: Cấm tím và chống cliché SaaS trong palette

**User Story:** Là người vận hành sản phẩm muốn giao diện không bị nhầm
là "thêm một SaaS mặc định nữa", tôi muốn hệ màu cấm tuyệt đối tím/
indigo/violet làm primary và cấm các pattern cliché như mesh gradient,
glassmorphism, bento grid mặc định.

#### Acceptance Criteria

1. THE Kid_UI design tokens SHALL NOT export any color whose HSL hue
   falls within `Forbidden_Hue` (260° ≤ hue ≤ 300°) as a `primary`,
   `secondary`, `brand`, or `accent` token.
2. THE Kid_UI SHALL define `coral` (#FF6B6B) as the primary action color
   and `teal` (#4ECDC4) as the secondary action color.
3. THE Kid_UI SHALL NOT apply mesh gradient, aurora gradient, or
   `backdrop-filter: blur` (glassmorphism) as background of any hero,
   card, or full-page section.
4. THE Kid_UI SHALL NOT use a 3-column equal-width "bento grid" layout
   as the default landing layout for any of `/`, `/path-select`, `/map`,
   `/lessons`.
5. WHERE shadow is applied to a Kid_Primitives card, THE Kid_UI SHALL
   use solid offset shadow (e.g., `4px 4px 0 rgba(0,0,0,0.12)`) instead
   of Material-style blurred shadow.
6. IF a topic accent color is required, THEN THE Kid_UI SHALL pick from
   the predefined `topic` palette (`stranger`, `phishing`, `password`,
   `privacy`, `behavior`, `screentime`, `badcontent`) and SHALL NOT
   introduce purple/indigo accents.

> **Validates Correctness Property 3: No-purple invariant** (`design.md`
> §Correctness Properties — "Property 3").

---

### Requirement 4: Tôn trọng triệt để `prefers-reduced-motion`

**User Story:** Là học sinh nhạy cảm với chuyển động (hoặc dùng máy của
người có cài đặt giảm chuyển động), tôi muốn giao diện không bị xoay/
nhảy/lắc liên tục, để tôi không bị chóng mặt và vẫn dùng được mọi tính
năng.

#### Acceptance Criteria

1. WHILE `Reduced_Motion_Mode` is active, THE Kid_UI SHALL cap every CSS
   `transition-duration` and animation duration at 120 milliseconds.
2. WHILE `Reduced_Motion_Mode` is active, THE Kid_UI SHALL NOT play any
   infinitely looping animation except `mascot.wiggle`, which SHALL be
   paused.
3. WHILE `Reduced_Motion_Mode` is active, THE `StickerCard` component
   SHALL render rotation = 0 degrees instead of the random ±3°/±6° tilt.
4. WHILE `Reduced_Motion_Mode` is active, THE `ConfettiBurst` SHALL be
   suppressed and replaced with a static success badge fade-in at most
   120 ms.
5. THE Kid_UI hooks SHALL provide `useReducedMotion()` that subscribes
   to `matchMedia("(prefers-reduced-motion: reduce)")` change events and
   returns the current state.
6. WHEN `Reduced_Motion_Mode` toggles at runtime, THE Kid_UI SHALL
   update animation state without requiring a page reload.

> **Validates Correctness Property 4: Reduced-motion respect**
> (`design.md` §Correctness Properties — "Property 4").

---

### Requirement 5: Phản hồi tích cực, không trừng phạt khi trả lời sai

**User Story:** Là học sinh tiểu học rất nhạy cảm với "đúng/sai", tôi
muốn khi trả lời sai vẫn được động viên và được giải thích, để tôi không
sợ học và muốn thử tiếp.

#### Acceptance Criteria

1. WHEN a student answers a quiz question correctly, THE Kid_UI SHALL
   set feedback tone to `celebrate` and SHALL increase the round score
   by exactly 10 XP.
2. WHEN a student answers a quiz question incorrectly, THE Kid_UI SHALL
   set feedback tone to `comfort`, SHALL display the explanation text,
   AND SHALL invoke `Read_Aloud_Engine` to speak the explanation in
   Vietnamese.
3. IF a student answers a quiz question incorrectly, THEN THE Kid_UI
   SHALL NOT decrease the current XP, SHALL NOT decrease the streak by
   more than the natural rule of "missed today = streak reset to 0",
   AND SHALL NOT show a "Game Over" state.
4. THE Kid_UI SHALL NOT play a buzzer sound after an incorrect answer.
   Instead, THE Kid_UI SHALL play `soft.ogg` (≤ 200 ms, gentle wooden
   tap) defined in `lib/sound.ts`.
5. WHEN a quiz round ends, THE Kid_UI SHALL display a positive title
   based on the badge tier (e.g., "Luyện tập thêm 💪" for total_score < 50)
   and SHALL NOT display negative comparative phrasing such as "thấp
   hơn bạn X", "thua", or "thất bại".
6. WHILE waiting for the next question, THE Kid_UI SHALL pause for at
   least 1.2 seconds after revealing feedback to give the child time to
   read the explanation.

> **Validates Correctness Property 5: Positive feedback invariant
> (no punishment)** (`design.md` §Correctness Properties — "Property 5").

---

### Requirement 6: Đọc to (Read-Aloud) tiếng Việt với bộ lọc an toàn nội dung

**User Story:** Là học sinh lớp 1–2 chưa đọc thạo, tôi muốn nghe câu hỏi
và giải thích được đọc to bằng tiếng Việt, nhưng tôi muốn không bao giờ
nghe thấy nội dung không phù hợp với trẻ em.

#### Acceptance Criteria

1. THE Read_Aloud_Engine SHALL set `SpeechSynthesisUtterance.lang` to
   `"vi-VN"` for every utterance produced from Kid_UI.
2. THE Read_Aloud_Engine SHALL set `rate` to 0.9 and SHALL NOT permit
   `rate` greater than 1.0.
3. IF the input text contains any `Unsafe_Term`, THEN THE Read_Aloud_
   Engine SHALL NOT speak the text and SHALL silently abort the
   utterance.
4. THE Read_Aloud_Engine SHALL truncate every utterance to a maximum of
   280 characters before passing the text to `speechSynthesis.speak`.
5. THE Read_Aloud_Engine SHALL strip full URLs (any substring starting
   with `http://` or `https://`) from the input text before speaking.
6. WHEN a new `Read_Aloud` request arrives while a previous utterance is
   still playing, THE Read_Aloud_Engine SHALL call
   `speechSynthesis.cancel()` before issuing the new `speak` call so
   that no two utterances overlap.
7. WHERE the running browser does not expose `speechSynthesis`, THE
   Kid_UI SHALL hide the `ReadAloudButton` instead of throwing an error.

> **Validates Correctness Property 6: Read-aloud safety invariant**
> (`design.md` §Correctness Properties — "Property 6").

---

### Requirement 7: Kid Shell layer với điều hướng đơn giản và tối đa 3 cấp sâu

**User Story:** Là học sinh tiểu học chưa quen với menu phức tạp, tôi
muốn mọi trang có cùng một khung quen thuộc và luôn có nút "về Trang
chủ", để tôi không bị lạc và không phải nhớ "mình đang ở đâu".

#### Acceptance Criteria

1. THE Kid_UI SHALL wrap every Kid_UI route with `KidLayout`, which
   provides safe-area padding, `surface.cream` background, and an
   embedded `KidTopBar`.
2. THE `KidTopBar` SHALL display, from left to right: child avatar +
   nickname, XP progress bar, global sound toggle (🔊/🔇), and a "Home"
   button (🏠) that navigates to `/`.
3. THE `KidBottomNav` SHALL render exactly 4 icon-first tabs in this
   order: 🏠 Trang chủ, 🗺️ Bản đồ, 📚 Bài học, 🏆 Bảng điểm.
4. WHILE the user is on `/quiz` or `/mission`, THE `KidBottomNav` SHALL
   be hidden to remove distractions during gameplay.
5. THE Kid_UI navigation tree depth SHALL NOT exceed 3 levels from `/`
   to any activity (`/quiz`, `/mission`, `/classify`, `/daily`).
6. THE Kid_UI SHALL NOT use a hamburger / collapsed menu pattern for
   primary navigation.

---

### Requirement 8: Mascot Bé Kiên + Robot An Toàn dẫn chuyện

**User Story:** Là học sinh tiểu học, tôi muốn được hai nhân vật quen
thuộc dẫn dắt thay vì đọc các tooltip khô khan, để mỗi màn hình cảm
giác như một bạn đang nói chuyện với mình.

#### Acceptance Criteria

1. THE Kid_UI SHALL render a `MascotDialog` for hint, onboarding, and
   feedback events on every Kid_UI route except `/share/result/[id]`.
2. THE `MascotDialog` SHALL support exactly 4 mood states: `cheerful`,
   `thinking`, `celebrate`, `comfort`.
3. WHEN a student answers a quiz question correctly, THE Kid_UI SHALL
   display the mascot in `celebrate` mood with a positive Vietnamese
   praise message.
4. WHEN a student answers a quiz question incorrectly, THE Kid_UI SHALL
   display the mascot in `comfort` mood with a gentle Vietnamese hint
   message derived from the question's `explanation` field.
5. THE `MascotDialog` SHALL include an integrated `ReadAloudButton` that
   reads the dialog text aloud when activated.
6. WHILE `Reduced_Motion_Mode` is active, THE `MascotDialog` SHALL
   appear with at most a 120 ms fade-in instead of the spring "bounce-in"
   animation.

---

### Requirement 9: Một-màn-một-mục-tiêu (one-screen-one-goal)

**User Story:** Là học sinh dễ bị xao nhãng, tôi muốn mỗi màn hình chỉ
hỏi tôi đúng một việc cần làm, để tôi không bị lúng túng giữa nhiều nút
to-nhỏ khác nhau.

#### Acceptance Criteria

1. THE Kid_UI SHALL render exactly one primary CTA on each route, where
   the primary CTA is a `KidButton` with `variant="primary"` and `size`
   `xl` or `hero`.
2. THE Kid_UI SHALL render any secondary action as a `KidButton` with
   `variant="secondary"`, `variant="ghost"`, or as a text link, and
   secondary actions SHALL NOT exceed 2 per screen.
3. WHERE the route is `/`, THE primary CTA label SHALL be "Chơi ngay"
   and the secondary CTA label SHALL be "Bài học hôm nay".
4. WHERE the route is `/path-select`, THE primary action SHALL be
   selecting one of the 3 stacked path cards (Cơ bản, Nâng cao, Toàn
   diện), and no other CTA SHALL appear above the fold.
5. WHERE the route is `/quiz`, THE only interactive elements above the
   `KidBottomNav` line SHALL be: the question card, the 3 `KidChoice`
   options, and a single `ReadAloudButton`.
6. THE Kid_UI SHALL NOT display advertising banners, marketing popups,
   or third-party social-share popups on any Kid_UI route.

---

### Requirement 10: Accessibility WCAG AA cho mọi route học sinh

**User Story:** Là học sinh dùng bàn phím (Chromebook không có chuột)
hoặc screen reader, tôi muốn mọi tính năng vẫn dùng được mà không cần
chuột, để tôi không bị bỏ lại phía sau.

#### Acceptance Criteria

1. THE Kid_UI SHALL achieve a foreground/background contrast ratio
   ≥ 4.5:1 for every text node with `font-size` < 18 CSS pixels and
   ≥ 3:1 for every text node with `font-size` ≥ 18 CSS pixels (WCAG AA).
2. THE Kid_UI SHALL render a focus ring with width ≥ 3 CSS pixels and
   color `coral` or `teal` on every focusable element, visible in both
   light and dark surfaces.
3. WHEN a user navigates Kid_UI using only the keyboard (Tab, Shift+Tab,
   Enter, Space, Arrow keys), THE Kid_UI SHALL allow completion of one
   full Quiz_Round without requiring pointer input.
4. THE Kid_Primitives `KidChoice` SHALL expose `role="radio"` within a
   `role="radiogroup"` and SHALL support arrow-key navigation between
   choices.
5. IF an interactive element is rendered with only an icon (no visible
   text), THEN THE Kid_UI SHALL provide an explicit `aria-label` in
   Vietnamese.
6. THE Kid_UI SHALL pass `axe-core` automated checks with zero
   violations of severity `serious` or `critical` on every Kid_UI route
   in CI.

---

### Requirement 11: Hiệu năng đạt mục tiêu Chromebook 1GB RAM, mạng 3G nhanh

**User Story:** Là học sinh dùng máy phụ huynh đời cũ hoặc Chromebook
1GB RAM ở trường, tôi muốn trang load nhanh và không lag, để tôi không
bỏ ngang vì chờ.

#### Acceptance Criteria

1. THE Kid_UI SHALL achieve Largest Contentful Paint (LCP) ≤ 2.5
   seconds on a Chromebook with 1 GB RAM over a Fast 3G network for
   each Kid_UI route.
2. THE Kid_UI SHALL keep the JavaScript bundle for `/quiz` below 200 KB
   gzipped, excluding shared framework chunks.
3. WHERE a Kid_UI route is `/classify`, THE Kid_UI SHALL lazy-load the
   drag-and-drop runtime (`react-dnd` + HTML5 backend) so it is NOT
   bundled into `/quiz` or `/mission`.
4. THE Kid_UI SHALL only animate `transform` and `opacity` for any
   continuous animation, with the single allowed exception of the XP
   progress bar which MAY animate `width`.
5. THE Kid_UI SHALL reserve `min-height` on every `StickerCard` so that
   sticker rotation does not cause Cumulative Layout Shift (CLS) > 0.1.
6. THE Kid_UI SHALL preconnect the Nunito font origin and SHALL load
   only the Vietnamese subset (latin + latin-ext + vietnamese).

---

### Requirement 12: Offline fallback cho Quiz và Mission khi mất mạng

**User Story:** Là học sinh dùng mạng nhà trường không ổn định, tôi
muốn vẫn chơi xong được ván quiz đang dở khi mất mạng giữa chừng, để
công sức trả lời 7 câu trước không bị mất.

#### Acceptance Criteria

1. WHEN the network goes offline during a Quiz_Round, THE Kid_UI SHALL
   continue the round using locally seeded questions from
   `src/data/quizQuestions.ts` without showing a blocking error
   dialog.
2. WHEN the network goes offline during a mission, THE Kid_UI SHALL
   continue the mission using locally seeded missions from
   `src/data/gameData.ts` without showing a blocking error dialog.
3. WHEN the network reconnects after a Quiz_Round completed offline,
   THE Kid_UI SHALL synchronize the resulting `FinalResult` to Supabase
   exactly once.
4. IF synchronization to Supabase fails after the network reconnects,
   THEN THE Kid_UI SHALL retry up to 3 times with exponential backoff
   and SHALL preserve the result in `localStorage` under
   `bats:final_results:v1` until synchronization succeeds.
5. THE Kid_UI SHALL NOT display the words "lỗi", "error", numeric HTTP
   status codes, or "failed" in any user-facing offline or retry
   message.
6. WHEN displaying a network-related issue, THE Kid_UI SHALL render a
   `MascotDialog` in `comfort` mood with a child-friendly Vietnamese
   message and a single `KidButton` labelled "Thử lại".

---

### Requirement 13: Các route học sinh giữ nguyên hợp đồng dữ liệu hiện hữu

**User Story:** Là kỹ sư phụ trách backend, tôi muốn việc thêm tầng UI
mới không phá vỡ hợp đồng dữ liệu, để các Supabase tables, localStorage
keys, và `/api/grok/*` routes hiện hữu vẫn hoạt động bình thường.

#### Acceptance Criteria

1. THE Kid_UI SHALL NOT modify the shape of `AdminQuestion`, `Mission`,
   `Lesson`, `LearningPath`, `StudentAnswer`, or `FinalResult` types
   defined in `SPEC.md`.
2. THE Kid_UI SHALL NOT change the existing `localStorage` key
   namespace `bats:*` (`bats:questions:v1`, `bats:final_results:v1`,
   `bats:topics:v1`, `bats:paths:v1`, `bats:student_answers:v1`).
3. THE Kid_UI SHALL NOT alter the request or response schema of
   `POST /api/grok/generate-question` or `POST /api/grok/explain`.
4. THE Kid_UI SHALL persist a completed `Quiz_Round` to the existing
   Zustand store key `quiz` with shape `{ correct, total: 10, score }`.
5. THE Kid_UI SHALL keep the route paths exactly as listed in `SPEC.md`
   §2.1 and SHALL NOT introduce new locale prefixes.

---

### Requirement 14: Định danh thiết kế "Paper-Craft Playground" được giữ nguyên

**User Story:** Là sản phẩm muốn có "linh hồn" rõ ràng, tôi muốn mọi
màn hình đều cảm giác như "đồ chơi giấy" với layout Anchor + Drift,
không bị trượt về kiểu SaaS chung chung.

#### Acceptance Criteria

1. THE Kid_UI SHALL apply `AnchorDriftLayout` (anchor mascot trái + nội
   dung trôi phải, tỉ lệ 60/40, 40/60, hoặc 30/70) on every hero
   section of `/`, `/path-select`, `/lessons`, and `/result`.
2. THE Kid_Patterns `StickerCard` SHALL apply rotation in the discrete
   set `{-6°, -3°, 0°, +3°, +6°}` and SHALL apply a solid offset shadow
   of 4 CSS pixels.
3. THE Kid_UI SHALL apply a border width of 3–4 CSS pixels on every
   `KidCard` and `KidChoice` to evoke a "marker outline" feel.
4. THE Kid_UI SHALL NOT use generic "rocket / sparkle / gem" emojis
   (✨🚀💎) on any hero or marketing surface.
5. THE Kid_UI SHALL render the two mascots (Bé Kiên, Robot An Toàn) on
   `/` hero, `/path-select` hero, and `/result` celebration screen.
6. WHILE `Reduced_Motion_Mode` is active, THE Kid_Patterns `StickerCard`
   SHALL force rotation to 0° as required by Requirement 4.3.
