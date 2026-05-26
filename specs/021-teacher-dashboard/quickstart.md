# Quickstart: Trang Giáo Viên

**Feature**: 021-teacher-dashboard
**Date**: 2026-05-17
**Updated**: 2026-05-17 (v2 — clarifications applied)

---

## Setup

### Environment Variable

Add to `.env`:

```env
NEXT_PUBLIC_TEACHER_PASSWORD=GiaoVien2026
```

> **Note**: Separate from `NEXT_PUBLIC_ADMIN_PASSWORD`. Teacher and admin have different codes.

---

## Run Locally

```bash
pnpm dev
# Navigate to http://localhost:3000/teacher
# Login with: GiaoVien2026
```

---

## Implementation Order

1. **Phase 0**: Add `Teacher` auth + `TeacherStats` helpers to `src/lib/store.ts`
2. **Phase 1**: Replace stub at `src/app/teacher/page.tsx` with login form + dashboard
3. **Phase 2**: Build `TeacherDashboard` component in `src/components/admin/TeacherDashboard.tsx`
4. **Phase 3**: Update docs and run `pnpm build`

---

## Key Files

| Action | File |
|---|---|
| Replace route | `src/app/teacher/page.tsx` |
| Add auth + helpers | `src/lib/store.ts` (Teacher namespace + TeacherStats) |
| Create dashboard | `src/components/admin/TeacherDashboard.tsx` |
| Extract modal | `src/components/admin/StudentModal.tsx` (shared) |
| Update env example | `.env.example` |
| Update docs | `PROJECT_DOCUMENTATION.md` |

---

## TypeScript Reference

All types come from existing entities in `src/lib/store.ts`:
- `FinalResult` — student results (no dedup)
- `StudentAnswer` — answer history
- `AdminQuestion` — topic labels via `category` field
- `topicLabels` — chart axis labels (7 topics)

New computed types (defined in `data-model.md`):
- `TeacherAuth` — localStorage auth state
- `StudentAggregate` — computed per FinalResult entry
- `TopicStats` — computed from StudentAnswer[] grouped by topicId
- `TeacherOverviewStats` — computed overview
- `SortOption` — `"newest" | "score" | "az" | "za"`

---

## Test Scenarios

| # | Scenario | Expected |
|---|---|---|
| 1 | Navigate to `/teacher` → see login form | Login form renders |
| 2 | Enter wrong code → see error | "Mã giáo viên không đúng" |
| 3 | Enter correct code → see overview | 4 stat cards with values |
| 4 | Click "Học sinh" tab → see student table | 20 rows/page, sorted newest first |
| 5 | Select "Điểm cao nhất" sort → list re-sorts | Highest score at top |
| 6 | Select "Tên A-Z" sort → list re-sorts | Alphabetical ascending |
| 7 | Type in search → list filters | Partial match, case-insensitive |
| 8 | Filter + Sort together → both apply | Filter first, then sort |
| 9 | Change page → sort & filter preserved | Pagination keeps state |
| 10 | Click "Xemchi tiết" → modal opens | Answer history + accuracy stats |
| 11 | Click "Xuất CSV" → file downloads | CSV with headers |
| 12 | Click "Biểu đồ" tab → see 7 topic bars | Horizontal bars with counts |
| 13 | Click topic bar → student list filters | Only answers from that topic |
| 14 | Click "Đăng xuất" → redirected home | Login form on return |
| 15 | Clear localStorage → reload | Login form shown |

---

## Build & Type Check

```bash
pnpm build
# or
npx tsc --strict --noEmit
```

Zero TypeScript errors expected.

---

*Quickstart version: 1.1 | Feature: 021-teacher-dashboard*
