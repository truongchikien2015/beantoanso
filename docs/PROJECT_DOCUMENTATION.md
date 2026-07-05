# Bé An Toàn Số — Project Technical Documentation

> **"Cùng Bé Kiên và Robot An Toàn học cách sử dụng Internet an toàn"**

A Vietnamese-language educational gamified web application targeting primary school children (ages 6–12), teaching internet safety through interactive quizzes, missions, and daily challenges.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#1-features--functionalities)
- [Technology Stack](#2-technology-stack)
- [Project Structure](#3-project-structure)
- [API Endpoints](#4-api-endpoints)
- [Database Schema](#5-database-schema-supabase)
- [Authentication](#6-authentication-mechanisms)
- [AI Integration](#7-ai-integration-architecture)
- [State Persistence](#8-state-persistence-architecture)
- [Deployment Configuration](#9-deployment--configuration)

---

## Project Overview

**Bé An Toàn Số** ("Digital Safety Kid") transforms internet safety education into an engaging game experience. The mascot characters are **Bé Kiên** (the child learner) and **Robot An Toàn** (the safety robot guide).

| Attribute | Detail |
|---|---|
| **Language** | Vietnamese (vi) |
| **Target Users** | Primary school children, ages 6–12 |
| **Domain** | Educational / Gamification |
| **Deployment** | Vercel (Next.js) |
| **Database** | Supabase PostgreSQL |
| **AI Backend** | xAI Grok / OpenRouter (switchable) |

---

## 1. Features & Functionalities

### 1.1 User-Facing Features

#### Home / Onboarding (`/`)
- **Guest quick-play**: Enter nickname, gender, birth year — no account required
- **Supabase auth**: Email/password sign-in and sign-up
- After login, profile data (`full_name`, `gender`, `birth_year`, `xp`) is synced from Supabase `profiles` table
- Redirect to `/path-select` after login/onboarding

#### Learning Path Selection (`/path-select`)
- Fetches active learning paths from Supabase `learning_paths` table
- Displays path cards with title, description, topic count
- Three default styles (Cơ bản / Nâng cao / Toàn diện) with themed colors and icons
- Selects a path and navigates to the journey map

#### Journey Map (`/map`)
- Visual map of topic nodes connected by paths
- Nodes show completion status (checkmark) per topic
- Unlocks topics sequentially based on path definition
- Score-based visual feedback

#### Missions (`/mission`)
- 5 story-based interactive missions with branching choices
- Each mission presents a scenario with 3 answer options
- Robot mascot gives feedback after each choice
- Tracks mission score and per-topic results in Zustand global store + localStorage

#### Quiz Game (`/quiz`)
- 10 random questions per round, shuffled from the active question pool
- 3-option multiple choice (A / B / C)
- AI-generated explanations via Grok/OpenRouter explain endpoint
- Voice answering via Web Speech API (`SpeechRecognition`)
- Text-to-speech read-aloud for questions
- Tracks correct answers, records per-question stats to `StudentAnswers` localStorage
- Score: `correctCount * 10`

#### Results & Badges (`/result`)
- Final score = mission_score + quiz_score
- Badge tiers:

| Badge | Condition | Emoji |
|---|---|---|
| Chiến binh an toàn số | ≥ 90 | 🏆 |
| Bạn nhỏ thông minh | ≥ 70 | 🌟 |
| Em đã hiểu cơ bản | ≥ 50 | 🎖️ |
| Luyện tập thêm | < 50 | 💪 |

- XP accumulation: every 100 XP = 1 level, with titles (Tân binh → Truyền kỳ)
- Certificate generation with print-to-PDF support (A4 landscape)
- Shareable result via URL query params (`?n=...&score=...&badge=...`)

#### Daily Challenge (`/daily`)
- One question per day from the daily question pool
- Streak counter persisted in localStorage
- Shows streak on home screen badge
- Rotates based on day-of-year modulo pool size

#### Phân loại — Classify Game (`/classify`)
- Drag-and-drop (via popover) information cards into two buckets: **"an toàn để chia sẻ"** vs **"giữ kín"**
- 14 predefined items covering personal data categories
- 10 random items per round, score tracking, reset capability

#### Lessons (`/lessons`)
- 7 educational lessons (one per topic) with emoji, intro, tips, and golden rule
- TTS read-aloud via browser Speech Synthesis API
- Sequential navigation between lessons

#### Leaderboard (`/leaderboard`)
- Ranked list from `Results` localStorage
- Top 3 podium display with medal emojis (🥇🥈🥉)
- Pagination (10 / 50), current user highlight
- CSV export

#### Share Result (`/share/result/[id]`)
- Dynamic OG image generation for social sharing
- Fetches result from Supabase `results` table by ID
- Falls back to URL search params if DB lookup fails
- Renders shareable result card

### 1.2 Admin Dashboard (`/admin`)

Accessed via password (`NEXT_PUBLIC_ADMIN_PASSWORD` env var), stored in localStorage.

| Tab | Features |
|---|---|
| **Overview** | Stats: attempts, players, avg score, top player, active questions, paths count. Bar charts for questions by topic. Active paths list from Supabase. |
| **Questions** | CRUD for quiz questions. Create/edit form with all fields (category, options, correct answer, explanation, age range, gender targeting). AI generation via `/api/grok/generate-question`. Toggle active/inactive. Reset seed data. |
| **Topics** | CRUD for custom topic slugs with slug, label, emoji, color, order, active toggle |
| **Paths** | CRUD for learning paths: title, description, ordered topic IDs, active toggle |
| **Students** | Paginated student list from `Results` localStorage. Search by nickname. CSV export. Detail modal showing answer history per student with accuracy stats and per-topic breakdown. |

### 1.3 Teacher Dashboard (`/teacher`)

Simplified dashboard (subset of admin features):
- Overview stats (attempts, players, avg, top)
- Questions-by-topic bar chart
- Learning paths list
- Students table with search, CSV export, and per-student answer history modal
- Topics and Paths sub-tabs (reuses admin sub-components)

---

## 2. Technology Stack

### 2.1 Core Framework & Runtime

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | `^16.2.4` |
| **Language** | TypeScript | `6.0.3` |
| **Runtime** | React | `18.3.1` |
| **Build Tool** | Vite (Next webpack fallback) | `6.3.5` |

### 2.2 Styling & UI

| Library | Purpose |
|---|---|
| **Tailwind CSS v4** | Utility-first CSS (dev) |
| **Emotion** (`@emotion/react`, `@emotion/styled`) | CSS-in-JS |
| **MUI v7** (`@mui/material`, `@mui/icons-material`) | Component library |
| **Radix UI** (12 packages) | Headless accessible primitives (dialog, accordion, tabs, etc.) |
| **Vaul** | Drawer component |
| **clsx**, **tailwind-merge** | Class name utility |
| **cva** (class-variance-authority) | Variant styles |
| **cmdk** | Command menu |
| **lucide-react** | Icon library |
| **next-themes** | Dark/light mode |
| **sonner** | Toast notifications |

### 2.3 Animation & Motion

| Library | Purpose |
|---|---|
| **Motion** (Framer Motion fork) | Page/component animations |
| **Embla Carousel** | Carousel component |
| **React Slick** | Slick carousel |
| **React DnD** + HTML5 backend | Drag and drop |
| **React Responsive Masonry** | Masonry layout |
| **React Resizable Panels** | Resizable split panes |
| **Tw Animate CSS** | Tailwind animation utilities |

### 2.4 Data Visualization

| Library | Purpose |
|---|---|
| **Recharts** | Charts in admin dashboard |

### 2.5 State Management

| Library | Purpose |
|---|---|
| **Zustand** | Global client-side state (persisted via `localStorage`) — `useAppStore` for session state |
| **localStorage** | Persistence for: questions, results, topics, paths, student answers, admin auth, avatar, daily state, badge/level data |

### 2.6 Backend & Database

| Layer | Technology |
|---|---|
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **AI Providers** | xAI Grok (`api.x.ai/v1/chat/completions`), OpenRouter (`openrouter.ai/api/v1/chat/completions`) |
| **AI Model Config** | `XAI_API_KEY`, `XAI_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` env vars |
| **Serverless Functions** | Supabase Edge Functions (`SUPABASE_SERVICE_ROLE_KEY`) |
| **Image Generation** | Figma API |

### 2.7 Routing & Navigation

| Library | Purpose |
|---|---|
| **Next.js App Router** | File-based routing (`app/` directory) |
| **React Router v7** | Client-side routing (also installed) |

### 2.8 Media & Utilities

| Library | Purpose |
|---|---|
| **html-to-image** | Certificate DOM-to-image conversion |
| **canvas-confetti** | Celebration confetti animation |
| **date-fns** | Date formatting |
| **react-day-picker** | Date picker components |
| **input-otp** | One-time password input (auth) |
| **react-popper** + **@popperjs/core** | Popper.js bindings |

### 2.9 Configuration

| Tool | Purpose |
|---|---|
| **pnpm** | Package manager with `vite` override to `6.3.5` |
| **PostCSS** + **@tailwindcss/postcss** | CSS processing |

---

## 3. Project Structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout (Nunito font, metadata)
│   ├── page.tsx                       # Home/landing page
│   ├── globals.css                    # Tailwind + custom CSS vars, animations
│   │
│   ├── admin/page.tsx                 # Admin route (checks localStorage auth)
│   ├── teacher/page.tsx               # Teacher dashboard route
│   │
│   ├── quiz/page.tsx                 # Quiz game route
│   ├── result/page.tsx                # Result display route
│   ├── share/result/[id]/page.tsx    # Shareable result + OG image
│   │
│   ├── mission/page.tsx               # Mission/scenario route
│   ├── path-select/page.tsx           # Learning path selection
│   ├── map/page.tsx                   # Journey map route
│   ├── classify/page.tsx               # Classify game route
│   ├── daily/page.tsx                 # Daily challenge route
│   ├── lessons/page.tsx               # Lessons route
│   ├── leaderboard/page.tsx           # Leaderboard route
│   │
│   ├── App.tsx                       # App shell/routing
│   │
│   └── api/grok/
│       ├── explain/route.ts           # POST: AI-powered question explanation
│       └── generate-question/route.ts # POST: AI-generated quiz questions
│
├── components/
│   ├── HomeScreen.tsx                 # Landing/onboarding UI
│   ├── AuthModal.tsx                  # Supabase login/signup modal
│   ├── QuizScreen.tsx                 # Core quiz game component
│   ├── ResultScreen.tsx               # Results display
│   ├── MissionScreen.tsx              # Story mission component
│   ├── LearningPathSelector.tsx        # Path selection cards
│   ├── JourneyMap.tsx                 # Visual journey map
│   ├── RobotGuide.tsx                  # AI mascot guide component
│   ├── Header.tsx                     # Shared header
│   ├── LessonsScreen.tsx              # Lesson cards + reader
│   ├── Leaderboard.tsx                # Rankings table + podium
│   ├── DailyChallenge.tsx             # Daily question widget
│   ├── ClassifyGame.tsx               # Info classification game
│   ├── Certificate.tsx                # Print-ready certificate
│   │
│   ├── ui/                            # ~40 shadcn/radix UI primitives
│   │   ├── button.tsx, input.tsx, dialog.tsx
│   │   ├── chart.tsx, carousel.tsx, accordion.tsx
│   │   ├── tabs.tsx, tooltip.tsx, popover.tsx
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── AdminDashboard.tsx         # Admin shell + sidebar + all tabs
│   │   ├── AdminLogin.tsx             # Admin password gate
│   │   ├── AdminQuestions.tsx         # Question CRUD
│   │   ├── QuestionForm.tsx          # Question create/edit form
│   │   ├── TopicManager.tsx           # Topic CRUD
│   │   └── PathManager.tsx            # Learning path CRUD
│   │
│   └── figma/
│       └── ImageWithFallback.tsx      # Figma image with fallback
│
├── lib/
│   ├── globalStore.ts                 # Zustand store (persisted session)
│   ├── store.ts                      # localStorage CRUD: Questions, Results,
│   │                                 #   Topics, Paths, StudentAnswers, Admin, Player
│   ├── supabase.ts                   # Supabase client singleton
│   ├── grokApi.ts                    # Client-side AI API wrappers
│   ├── voiceAnswer.ts                 # Web Speech API voice answering
│   ├── tts.ts                        # Text-to-speech (SpeechSynthesis)
│   ├── sound.ts                      # Sound effects (SFX) via Web Audio API
│   ├── xp.ts                         # XP/level/title calculations
│   ├── daily.ts                      # Daily challenge state management
│   ├── shareResult.ts                # Supabase-backed result fetching
│   ├── shareResultQuery.ts           # URL param-based result parsing
│   └── server/
│       └── aiProvider.ts             # Server-side AI provider abstraction
│
└── data/
    ├── quizQuestions.ts               # 56 seed questions across 7 topics
    ├── gameData.ts                   # 5 story missions + badge logic
    └── lessons.ts                    # 7 lesson content objects
```

---

## 4. API Endpoints

### `POST /api/grok/generate-question`

Generates a new quiz question using AI.

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

**Response:** `GeneratedQuestion` object or `{ error: string }`.

**Validation chain:** payload → AI call → JSON extraction → schema validation → content safety check (unsafe term filter) → response.

---

### `POST /api/grok/explain`

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
  "provider": "grok" | "openrouter"
}
```

---

## 5. Database Schema (Supabase)

### Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | id (FK auth.users), full_name, gender, birth_year, xp, level, total_score | Synced with Supabase Auth |
| `learning_paths` | id, title, description, topic_ids (JSON array), is_active, created_at | Admin-managed |
| `topics` | id, slug, label, icon, color, order, is_active | Admin-managed |
| `questions` | id, category, question, option_a/b/c, correct_option, explanation, is_active, min_age, max_age, target_gender, created_at, updated_at | Admin-managed |
| `results` | id, player_id, nickname, mission_score, quiz_score, total_score, title, badge, completed_at | Stores completed sessions |

### Row-Level Security (RLS)

| Table | Policy |
|---|---|
| `profiles` | Users can read/update their own profile |
| `learning_paths` | Public read, authenticated write |
| `topics` | Public read, authenticated write |
| `questions` | Public read, authenticated write |
| `results` | Public insert, public read |

---

## 6. Authentication Mechanisms

### 6.1 Admin Authentication
- Simple password gate: compares against `NEXT_PUBLIC_ADMIN_PASSWORD` env var
- Auth state stored in localStorage (`be_an_toan_so_admin` key)
- No server-side verification

### 6.2 User Authentication
- Supabase Auth with email/password
- Sign up creates both auth user and `profiles` record
- Sign in fetches `profiles` and hydrates Zustand store
- Optional: guest play bypasses auth entirely

### 6.3 Teacher Authentication
- Simple password gate: compares against `NEXT_PUBLIC_TEACHER_PASSWORD` env var
- Auth state stored in localStorage (`bats:teacher_auth` key)
- Teacher dashboard is read-only (no CRUD)
- Dashboard shows: stats overview, student list with search/sort, answer history, topic charts, CSV export

---

## 7. AI Integration Architecture

The app supports two AI provider backends, selected via `AI_PROVIDER` env var:

```
AI_PROVIDER=grok        → xAI Grok API (api.x.ai)
AI_PROVIDER=openrouter  → OpenRouter (proxies to nvidia/nemotron-3-super:free)
```

**Provider selection logic:**
1. Check `AI_PROVIDER` env var
2. Verify the API key is set for that provider
3. Fall back to first available provider
4. Return friendly error messages for 401 / 402 / 429 / 503 statuses

**Content safety:** The `generate-question` route includes a hardcoded blocklist of Vietnamese unsafe terms that filters AI output before returning.

---

## 8. State Persistence Architecture

```
localStorage Keys:
  bats:questions:v1         → Question[]
  bats:final_results:v1      → FinalResult[]
  bats:topics:v1            → CustomTopic[]
  bats:paths:v1             → LearningPath[]
  bats:student_answers:v1   → StudentAnswer[]
  bats:teacher_auth         → Teacher session (boolean)
  bats:avatar                → avatar id (number)
  bats:daily                 → { date, done, streak }
  bats:xp                    → number
  bats:badge                 → { title, emoji }
  be_an_toan_so_admin        → "true" | null  (admin auth)
  be-an-toan-so-storage      → Zustand persisted store
                                  (nickname, gender, birthYear, playerId,
                                   profileXp, missionResults, quiz,
                                   lastResultId, activePath, topics,
                                   activeTopic, activeQuestion)
```

---

## 9. Deployment & Configuration

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fhxycqvssizeqgbbsgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# AI
XAI_API_KEY=<xai key>
XAI_MODEL=grok-4.3
OPENROUTER_API_KEY=<openrouter key>
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
AI_PROVIDER=openrouter

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=Admin123@

# App
NEXT_PUBLIC_SITE_URL=https://betoan-sao.com
```

### Dev Commands

```bash
pnpm dev      # Next.js dev server
pnpm build    # Next.js production build
pnpm start    # Production server
pnpm preview  # Build + start preview
```

---

## 10. Topics (Internet Safety)

| # | Slug | Label | Emoji | Color |
|---|---|---|---|---|
| 1 | stranger | Người lạ trên mạng | 🔒 | blue |
| 2 | password | Bảo vệ mật khẩu | 🔑 | amber |
| 3 | personal-info | Thông tin cá nhân | 🛡️ | green |
| 4 | cyberbullying | Bắt nạt trên mạng | 💬 | red |
| 5 | scam | Lừa đảo trực tuyến | ⚠️ | purple |
| 6 | privacy | Quyền riêng tư | 🔐 | teal |
| 7 | social-media | Mạng xã hội | 📱 | pink |

---

*Document generated: May 2026*
