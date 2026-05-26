# SPEC.md — Bé An Toàn Số

> **Cùng Bé Kiên và Robot An Toàn học cách sử dụng Internet an toàn**

A Vietnamese-language educational gamified web application targeting primary school children (ages 6–12), teaching internet safety through interactive quizzes, missions, and daily challenges.

---

## 1. Project Overview

| Attribute | Detail |
|---|---|
| **Name** | Bé An Toàn Số ("Digital Safety Kid") |
| **Language** | Vietnamese (vi) |
| **Target Users** | Primary school children, ages 6–12 |
| **Domain** | Educational / Gamification |
| **Deployment** | Vercel (Next.js) |
| **Database** | Supabase PostgreSQL |
| **AI Backend** | xAI Grok / OpenRouter (switchable via `AI_PROVIDER` env var) |
| **Mascots** | Bé Kiên (child learner) + Robot An Toàn (safety robot guide) |

---

## 2. Pages / Routes

### 2.1 Public Routes

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Home/landing — guest quick-play or Supabase login |
| `/path-select` | `src/app/path-select/page.tsx` | Learning path selection (3 paths: Cơ bản, Nâng cao, Toàn diện) |
| `/map` | `src/app/map/page.tsx` | Visual journey map with topic nodes and unlock progression |
| `/quiz` | `src/app/quiz/page.tsx` | Core quiz game — 10 random questions, voice answering, TTS |
| `/result` | `src/app/result/page.tsx` | Results display with badge, XP, certificate generation |
| `/share/result/[id]` | `src/app/share/result/[id]/page.tsx` | Shareable result card (DB-backed + URL param fallback) |
| `/mission` | `src/app/mission/page.tsx` | 5 story-based missions with branching choices |
| `/classify` | `src/app/classify/page.tsx` | Drag-and-drop info classification game |
| `/daily` | `src/app/daily/page.tsx` | Daily challenge — 1 question per day, streak tracking |
| `/lessons` | `src/app/lessons/page.tsx` | 7 educational lessons with TTS read-aloud |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Ranked leaderboard with podium, pagination, CSV export |

### 2.2 Protected Routes

| Route | File | Description |
|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | Admin dashboard (password-gated via localStorage) |
| `/teacher` | `src/app/teacher/page.tsx` | Teacher dashboard (subset of admin features) |

### 2.3 API Routes

| Route | Method | Description |
|---|---|---|
| `/api/grok/generate-question` | `GET`, `POST` | AI-powered quiz question generation |
| `/api/grok/explain` | `GET`, `POST` | AI-enhanced question explanation |

---

## 3. Components

### 3.1 Screen Components

| Component | File | Description |
|---|---|---|
| `HomeScreen` | `src/components/HomeScreen.tsx` | Landing/onboarding UI — guest quick-play + Supabase login |
| `QuizScreen` | `src/components/QuizScreen.tsx` | Core quiz game with question card, voice answering, TTS |
| `ResultScreen` | `src/components/ResultScreen.tsx` | Results display with badge tier, XP bar, certificate button |
| `MissionScreen` | `src/components/MissionScreen.tsx` | Story mission with branching scenario and feedback |
| `LearningPathSelector` | `src/components/LearningPathSelector.tsx` | Path cards (Cơ bản / Nâng cao / Toàn diện) |
| `JourneyMap` | `src/components/JourneyMap.tsx` | Visual journey map with topic nodes and completion status |
| `RobotGuide` | `src/components/RobotGuide.tsx` | AI mascot guide (Robot An Toàn) for hints and feedback |
| `Header` | `src/components/Header.tsx` | Shared header with navigation |
| `LessonsScreen` | `src/components/LessonsScreen.tsx` | Lesson cards + reader with TTS |
| `Leaderboard` | `src/components/Leaderboard.tsx` | Rankings table with podium, pagination, CSV export |
| `DailyChallenge` | `src/components/DailyChallenge.tsx` | Daily question widget with streak badge |
| `ClassifyGame` | `src/components/ClassifyGame.tsx` | Drag-and-drop info classification game |
| `Certificate` | `src/components/Certificate.tsx` | Print-ready A4 landscape certificate |
| `AuthModal` | `src/components/AuthModal.tsx` | Supabase email/password login/signup modal |

### 3.2 Admin Components

| Component | File | Description |
|---|---|---|
| `AdminDashboard` | `src/components/admin/AdminDashboard.tsx` | Shell with sidebar and tabbed layout |
| `AdminLogin` | `src/components/admin/AdminLogin.tsx` | Password gate form |
| `AdminQuestions` | `src/components/admin/AdminQuestions.tsx` | Question CRUD with AI generation |
| `QuestionForm` | `src/components/admin/QuestionForm.tsx` | Create/edit question form |
| `TopicManager` | `src/components/admin/TopicManager.tsx` | Topic CRUD |
| `PathManager` | `src/components/admin/PathManager.tsx` | Learning path CRUD |
| `TeacherDashboard` | `src/components/admin/TeacherDashboard.tsx` | Simplified teacher view |

### 3.3 UI Primitives

Located in `src/components/ui/` — 40+ shadcn/Radix UI components:

`button`, `input`, `textarea`, `label`, `form`, `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `tabs`, `accordion`, `collapsible`, `card`, `badge`, `avatar`, `breadcrumb`, `separator`, `switch`, `toggle`, `toggle-group`, `checkbox`, `radio-group`, `select`, `slider`, `progress`, `calendar`, `date-picker`, `pagination`, `scroll-area`, `skeleton`, `chart`, `carousel`, `table`, `sidebar`, `resizable`, `command`, `alert`, `aspect-ratio`, `input-otp`, `sonner`

### 3.4 Other Components

| Component | File | Description |
|---|---|---|
| `ImageWithFallback` | `src/components/figma/ImageWithFallback.tsx` | Figma image with fallback URL support |

---

## 4. Data Models & Types

### 4.1 Quiz Questions

```typescript
type QuizTopic =
  | "stranger"        // Người lạ nhắn tin
  | "phishing"        // Link lạ và lừa đảo
  | "password"        // Mật khẩu và tài khoản
  | "privacy"         // Bảo vệ thông tin cá nhân
  | "behavior"        // Ứng xử văn minh trên mạng
  | "screentime"      // Thời gian dùng màn hình
  | "badcontent";     // Nội dung xấu và tin giả

type quizQuestion = {
  id: number;
  topic: QuizTopic;
  question: string;
  options: [string, string, string];  // A, B, C
  correctIndex: 0 | 1 | 2;
  explanation: string;
};
```

**Seed data:** 56 questions across 7 topics (8 per topic) in `src/data/quizQuestions.ts`.

### 4.2 Admin Question (CRUD type)

```typescript
type AdminQuestion = {
  id: string;
  question: string;
  category: QuizTopic;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string;
  is_active: boolean;
  min_age?: number;
  max_age?: number;
  target_gender?: "all" | "male" | "female";
  created_at: string;
  updated_at: string;
};
```

### 4.3 Missions

```typescript
type Mission = {
  id: number;
  title: string;
  icon: string;
  scene: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
};
```

**5 missions** in `src/data/gameData.ts`: Người lạ nhắn tin, Link lạ và quà tặng giả, Mật khẩu mạnh hay yếu, Thời gian dùng màn hình, Ứng xử văn minh trên mạng.

### 4.4 Lessons

```typescript
type Lesson = {
  topic: QuizTopic;
  emoji: string;
  title: string;
  intro: string;
  tips: string[];
  rule: string;
};
```

**7 lessons** in `src/data/lessons.ts` — one per topic with intro, tips, and golden rule.

### 4.5 Learning Paths

```typescript
type LearningPath = {
  id: string;
  title: string;
  description: string;
  topicIds: string[];   // ordered list of topic IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

**3 default paths:** Cơ bản (basic), Nâng cao (advanced), Toàn diện (comprehensive).

### 4.6 Custom Topics

```typescript
type CustomTopic = {
  id: string;
  slug: string;          // unique key
  label: string;          // display name
  icon: string;           // emoji
  color: string;          // Tailwind color class
  order: number;          // display order
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### 4.7 Student Answer History

```typescript
type StudentAnswer = {
  id: string;
  playerId: string;
  nickname: string;
  topicId: string;
  topicLabel: string;
  selectedOption: "A" | "B" | "C";
  correctOption: "A" | "B" | "C";
  isCorrect: boolean;
  timestamp: string;
};
```

### 4.8 Final Results

```typescript
type FinalResult = {
  id: string;
  player_id: string;
  nickname: string;
  mission_score: number;
  quiz_score: number;
  total_score: number;
  title: string;
  badge: string;
  completed_at: string;
};
```

### 4.9 AI Types

```typescript
type AiProviderId = "grok" | "openrouter";

type GrokExplanation = {
  text: string;
  imageUrl: string | null;
  videoUrl: string | null;
  provider?: AiProviderId;
};

type GeneratedQuestion = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string;
  min_age: number;
  max_age: number;
  target_gender: "all" | "male" | "female";
};
```

---

## 5. API Endpoints

### 5.1 `POST /api/grok/generate-question`

Generates a new quiz question using AI with content safety filtering.

**Request:**
```json
{
  "topicSlug": "stranger",
  "topicLabel": "Người lạ nhắn tin",
  "minAge": 6,
  "maxAge": 12,
  "targetGender": "all",
  "teacherPrompt": "optional custom prompt"
}
```

**Validation pipeline:**
1. JSON payload validation
2. AI chat completion call (Grok or OpenRouter)
3. JSON extraction from response
4. Schema validation (all required fields)
5. Content safety check (hardcoded Vietnamese unsafe-term blocklist)
6. Response

**Response:** `GeneratedQuestion` object or `{ error: string }`.

---

### 5.2 `POST /api/grok/explain`

Gets an AI-enhanced explanation for a quiz question.

**Request:**
```json
{
  "question": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "correct_option": "A",
  "explanation": "..."
}
```

**Response:**
```json
{
  "text": "...",
  "imageUrl": null,
  "videoUrl": null,
  "provider": "grok"
}
```

---

## 6. Authentication Mechanisms

### 6.1 Admin Authentication

- Password gate against `NEXT_PUBLIC_ADMIN_PASSWORD` env var
- Auth state stored in localStorage (`be_an_toan_so_admin` key)
- No server-side verification — client-side only
- Redirect to login if not authenticated

### 6.2 User Authentication

- Supabase Auth with email/password
- Sign up creates both auth user and `profiles` record
- Sign in fetches `profiles` and hydrates Zustand store
- Guest play bypasses auth entirely (quick-play mode)

### 6.3 Teacher Authentication

- **Supabase Auth** (email/password) — individual teacher accounts
- Teacher accounts **created by admin** via `/admin` → Giáo viên tab
- Auth state managed by Supabase Auth client (session stored server-side, not localStorage)
- Deactivated teachers cannot log in (`is_active = false`)
- Password reset handled by admin only (no self-service forgot password)
- `teachers` table links to `auth.users` via `auth_uid`

### 6.4 Admin Authentication

- Password gate against `NEXT_PUBLIC_ADMIN_PASSWORD` env var
- Auth state stored in localStorage (`be_an_toan_so_admin` key)
- No server-side verification — client-side only
- Redirect to login if not authenticated

---

## 7. AI Integration Architecture

### 7.1 Provider Selection

Controlled by `AI_PROVIDER` env var:
- `AI_PROVIDER=grok` → xAI Grok API (`api.x.ai/v1/chat/completions`)
- `AI_PROVIDER=openrouter` → OpenRouter (`openrouter.ai/api/v1/chat/completions`)

Fallback logic: if the configured provider's API key is not set, auto-detects the first available provider.

### 7.2 Models

| Provider | Default Model | Env Vars |
|---|---|---|
| Grok | `grok-4.3` | `XAI_API_KEY`, `XAI_MODEL` |
| OpenRouter | `openai/gpt-4o-mini` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |

### 7.3 Error Handling

- 401/403: "API key không hợp lệ"
- 402: "Tài khoản chưa có credits"
- 429: "Đang giới hạn, thử lại sau"
- 503: "Nhà cung cấp AI chưa được cấu hình"

### 7.4 Content Safety

`generate-question` route includes a hardcoded blocklist of Vietnamese unsafe terms that filters AI output before returning.

---

## 8. State Persistence Architecture

### 8.1 Zustand Global Store (`useAppStore`)

Persisted to localStorage key `be-an-toan-so-storage`:

| Field | Type | Description |
|---|---|---|
| `nickname` | `string` | Player display name |
| `gender` | `string` | Player gender |
| `birthYear` | `number \| undefined` | Birth year |
| `playerId` | `string` | Unique player ID |
| `profileXp` | `number` | Total XP accumulated |
| `missionResults` | `Record<string, {score, correct}>` | Per-topic mission results |
| `quiz` | `{correct, score, total} \| null` | Last quiz result |
| `lastResultId` | `string \| undefined` | Most recent result ID |
| `activePath` | `any \| null` | Selected learning path |
| `topics` | `any[]` | Cached topics |
| `activeTopic` | `any \| null` | Currently active topic |
| `activeQuestion` | `any \| null` | Currently active question |

### 8.2 localStorage Keys

| Key | Type | Description |
|---|---|---|
| `bats:questions:v1` | `AdminQuestion[]` | Question bank |
| `bats:final_results:v1` | `FinalResult[]` | All completed sessions |
| `bats:topics:v1` | `CustomTopic[]` | Custom topics |
| `bats:paths:v1` | `LearningPath[]` | Custom learning paths |
| `bats:student_answers:v1` | `StudentAnswer[]` | Answer history |
| `be_an_toan_so_admin` | `"true" \| null` | Admin auth flag |
| `be-an-toan-so:v2` | `object \| null` | Legacy player data |

---

## 9. Technology Stack

### 9.1 Core Framework

| Technology | Version |
|---|---|
| Next.js (App Router) | `^16.2.4` |
| TypeScript | `6.0.3` |
| React | `18.3.1` |
| Vite (Next webpack fallback) | `6.3.5` |

### 9.2 Styling & UI

| Library | Purpose |
|---|---|
| Tailwind CSS v4 | Utility-first CSS |
| Emotion (`@emotion/react`, `@emotion/styled`) | CSS-in-JS |
| MUI v7 (`@mui/material`, `@mui/icons-material`) | Component library |
| Radix UI (12 packages) | Headless accessible primitives |
| `vaul` | Drawer component |
| `clsx`, `tailwind-merge` | Class name utilities |
| `cva` (class-variance-authority) | Variant styles |
| `cmdk` | Command menu |
| `lucide-react` | Icon library |
| `next-themes` | Dark/light mode |
| `sonner` | Toast notifications |

### 9.3 Animation & Motion

| Library | Purpose |
|---|---|
| Motion (Framer Motion fork) | Page/component animations |
| Embla Carousel | Carousel component |
| React Slick | Slick carousel |
| React DnD + HTML5 backend | Drag and drop |
| React Responsive Masonry | Masonry layout |
| React Resizable Panels | Resizable split panes |
| Tw Animate CSS | Tailwind animation utilities |

### 9.4 Data Visualization

| Library | Purpose |
|---|---|
| Recharts | Charts in admin dashboard |

### 9.5 State Management

| Library | Purpose |
|---|---|
| Zustand v5 | Global client-side state with localStorage persistence |

### 9.6 Backend & Database

| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| AI | xAI Grok / OpenRouter (switchable) |
| Serverless Functions | Next.js API Routes |

### 9.7 Media & Utilities

| Library | Purpose |
|---|---|
| `html-to-image` | Certificate DOM-to-image conversion |
| `canvas-confetti` | Celebration confetti |
| `date-fns` | Date formatting |
| `react-day-picker` | Date picker |
| `input-otp` | One-time password input |
| `@popperjs/core` + `react-popper` | Popper positioning |

### 9.8 Package Manager

| Tool | Notes |
|---|---|
| pnpm | `vite` override to `6.3.5` in `pnpm.overrides` |

---

## 10. Database Schema (Supabase)

### 10.1 Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | id, full_name, gender, birth_year, xp, level, total_score | Synced with Supabase Auth |
| `learning_paths` | id, title, description, topic_ids (JSON), is_active, created_at | Admin-managed |
| `topics` | id, slug, label, icon, color, order, is_active | Admin-managed |
| `questions` | id, category, question, option_a/b/c, correct_option, explanation, is_active, min_age, max_age, target_gender, created_at, updated_at | Admin-managed |
| `results` | id, player_id, nickname, mission_score, quiz_score, total_score, title, badge, completed_at | Public insert, public read |
| `teachers` | id, auth_uid, name, email, school_id, is_active, created_at, updated_at | Supabase Auth accounts, admin-managed |

### 10.2 Row-Level Security (RLS)

| Table | Policy |
|---|---|
| `profiles` | Users can read/update their own profile |
| `teachers` | Admin-only management (service role), public read active teachers for auth lookup |
| `learning_paths` | Public read, authenticated write |
| `topics` | Public read, authenticated write |
| `questions` | Public read, authenticated write |
| `results` | Public insert, public read |

---

## 11. Admin & Teacher Features

### 11.1 Admin Dashboard (`/admin`)

Tabs: **Overview**, **Questions**, **Topics**, **Paths**, **Students**

| Tab | Features |
|---|---|
| **Overview** | Stats (attempts, players, avg score, top player, active questions, paths). Bar charts. Active paths list from Supabase. |
| **Questions** | CRUD. AI generation via `/api/grok/generate-question`. Toggle active/inactive. Reset seed data. |
| **Topics** | CRUD. Slug, label, emoji, color, order, active toggle. |
| **Paths** | CRUD. Title, description, ordered topic IDs, active toggle. |
| **Students** | Paginated student list. Search. CSV export. Detail modal with per-student answer history, accuracy stats, per-topic breakdown. |

### 11.2 Teacher Dashboard (`/teacher`)

Subset of admin features: overview stats, questions-by-topic chart, learning paths, students table with search/export/history modal, topics/paths sub-tabs.

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# AI
XAI_API_KEY=<xai key>
XAI_MODEL=grok-4.3
OPENROUTER_API_KEY=<openrouter key>
OPENROUTER_MODEL=openai/gpt-4o-mini
AI_PROVIDER=openrouter

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=Admin123@

# App
NEXT_PUBLIC_SITE_URL=https://betoan-sao.com
```

---

## 13. Badge System

| Badge | Condition | Emoji |
|---|---|---|
| Chiến binh an toàn số | total_score >= 90 | 🏆 |
| Bạn nhỏ thông minh | total_score >= 70 | 🌟 |
| Em đã hiểu cơ bản | total_score >= 50 | 🎖️ |
| Luyện tập thêm | total_score < 50 | 💪 |

### XP & Level System

- Score: 1 correct answer = 10 XP
- Every 100 XP = 1 level up
- Level titles progression: Tân binh → ... → Truyền kỳ

---

## 14. Topics (Internet Safety)

| # | Slug | Label | Emoji |
|---|---|---|---|
| 1 | stranger | Người lạ nhắn tin | 💬 |
| 2 | phishing | Link lạ và lừa đảo | 🎁 |
| 3 | password | Mật khẩu và tài khoản | 🔐 |
| 4 | privacy | Bảo vệ thông tin cá nhân | 🛡️ |
| 5 | behavior | Ứng xử văn minh trên mạng | 💖 |
| 6 | screentime | Thời gian dùng màn hình | ⏰ |
| 7 | badcontent | Nội dung xấu và tin giả | ⚠️ |

---

*Document generated: May 2026*
*Last updated: May 2026*
