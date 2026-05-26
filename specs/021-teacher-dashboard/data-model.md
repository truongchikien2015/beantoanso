# Data Model: Trang Giáo Viên

**Feature**: 021-teacher-dashboard
**Date**: 2026-05-17
**Updated**: 2026-05-17 (v2 — clarifications applied)

---

## Entities

### 1. TeacherAuth (localStorage-persisted session)

```typescript
type TeacherAuth = {
  isLoggedIn: boolean;
  loginAt: string; // ISO timestamp
};
```

**Key**: `bats:teacher_auth`

**Storage**: localStorage

**Validation**:
- `isLoggedIn` must be `boolean`
- `loginAt` must be valid ISO timestamp string

---

### 2. StudentAggregate (computed — no deduplication)

> **Clarification v1.2**: Each `FinalResult` entry = one play session. No deduplication by playerId or nickname.

```typescript
type StudentAggregate = {
  playerId: string;
  nickname: string;
  missionScore: number;
  quizScore: number;
  totalScore: number;
  title: string;
  badge: string;
  completedAt: string; // ISO timestamp
  answerCount: number;  // from StudentAnswer[] filtered by playerId
  correctCount: number;  // from StudentAnswer[] filtered by playerId
  accuracy: number;     // correctCount / answerCount * 100 (0 if answerCount=0)
  topicsAttempted: number; // unique topicIds from StudentAnswer[]
};
```

**Computed from**: `FinalResult[]` + `StudentAnswer[]` (one-to-one by playerId)

---

### 3. TopicStats (computed — answer counts per topic)

> **Clarification v1.2**: Chart shows total answer count per topic (StudentAnswer grouped by topicId).

```typescript
type TopicStats = {
  topicId: string;
  topicLabel: string;
  totalAnswers: number;   // StudentAnswer[] filtered by topicId
  correctAnswers: number; // StudentAnswer[] filtered by topicId, where isCorrect=true
  accuracy: number;       // correctAnswers / totalAnswers * 100
};
```

**Computed from**: `StudentAnswer[]` grouped by `topicId`

---

### 4. TeacherOverviewStats (computed)

> **Clarification v1.2**: Each FinalResult entry = one session. `totalAttempts` = FinalResult[].length.

```typescript
type TeacherOverviewStats = {
  totalAttempts: number;      // FinalResult[].length (no dedup)
  averageScore: number;        // mean of all totalScore values (0 if empty)
  topScore: number;             // max totalScore (0 if empty)
  topStudent: {
    nickname: string;
    score: number;
  } | null;
};
```

**Computed from**: `FinalResult[]`

---

## Sort Options

```typescript
type SortOption = "newest" | "score" | "az" | "za";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  score: "Điểm cao nhất",
  az: "Tên A-Z",
  za: "Tên Z-A",
};
```

Applied to `StudentAggregate[]` after filter. Preserved across pagination.

---

## Filter + Sort + Pagination Flow

```
StudentAggregate[] (all)
  → filter(nickname partial match, case-insensitive)
  → sort(comparator by SortOption)
  → paginate(20/page)
```

---

## Relationships

```
TeacherAuth (localStorage)
  └── validates session before rendering dashboard

StudentAggregate[] (computed per FinalResult entry)
  ├── FinalResult[] → nickname, scores, badge, completedAt
  └── StudentAnswer[] → answerCount, correctCount, accuracy, topicsAttempted

TopicStats[] (computed from StudentAnswer[])
  └── StudentAnswer[] grouped by topicId → totalAnswers, correctAnswers, accuracy
```

---

## Existing Entities Reused

| Entity | Source | Used For |
|---|---|---|
| `FinalResult` | `lib/store.ts` | Student list, stats, CSV |
| `StudentAnswer` | `lib/store.ts` | Answer history, topic stats, accuracy |
| `AdminQuestion` | `lib/store.ts` | Topic labels via `category` field |
| `topicLabels` | `lib/store.ts` | Chart axis labels (7 topics) |

---

## Validation Rules

- `accuracy` must be 0–100 (derived, not stored)
- `totalScore` must be >= 0
- `completedAt` must be valid ISO timestamp
- `answerCount` must be >= 0

---

*Data model version: 1.1 | Feature: 021-teacher-dashboard*
