# Research: Trang Giáo Viên

**Feature**: 021-teacher-dashboard
**Date**: 2026-05-17

---

## Decision: Teacher Auth Mechanism

**Chosen**: Simple shared password via `NEXT_PUBLIC_TEACHER_PASSWORD` env var, stored in localStorage (`bats:teacher_auth`).

**Rationale**: Matches the existing admin pattern (Constitution Principle VI). Teacher accounts don't need individual identification — shared device use in school contexts means any teacher can access the dashboard. This avoids building a full teacher identity system while keeping auth simple.

**Alternatives considered**:
- Individual teacher accounts with Supabase Auth: rejected — adds complexity, no requirement for per-teacher tracking
- QR code / PIN-based session: rejected — simple password is sufficient
- No auth at all: rejected — student data must be protected from casual browsing

---

## Decision: Data Source

**Chosen**: Read-only from existing localStorage keys (same as admin).

**Rationale**: The `FinalResult[]`, `StudentAnswer[]`, and `AdminQuestion[]` in localStorage already contain all data needed for the teacher dashboard. Reusing these avoids duplicating data fetching logic.

**Alternatives considered**:
- Supabase-backed teacher dashboard: rejected — adds server dependency; current app works offline
- Separate data store for teacher: rejected — unnecessary complexity; teacher sees same student data

---

## Decision: Chart Library

**Chosen**: Use the same bar chart pattern as the admin Overview tab (CSS-based horizontal bars with topic labels).

**Rationale**: Already implemented and working in admin dashboard. No need for a charting library (Recharts is already installed but the CSS-based approach is simpler and has zero bundle overhead).

**Alternatives considered**:
- Recharts BarChart: rejected — adds bundle size for a simple feature already solved with CSS
- D3.js: rejected — excessive complexity for simple bar charts

---

## Decision: Teacher Page Route vs Admin Integration

**Chosen**: Separate `/teacher` route (replaces current redirect-to-admin stub).

**Rationale**: Teacher and admin have different concerns (learning outcomes vs system management). Separate route with its own auth gate (`TEACHER_PASSWORD`) is cleaner than a mode flag on admin. Current stub redirects to admin — this plan replaces that stub with a real teacher dashboard.

---

## Decision: CSV Export Approach

**Chosen**: Client-side Blob + URL.createObjectURL (same pattern as admin StudentsTab).

**Rationale**: Works offline, no server round-trip, instant download. For up to 1000 students this is performant enough. If >10K students, we'd need chunked generation — but that's not in scope.

---

## Decision: Teacher vs Admin Auth Separation

**Chosen**: Two separate env vars: `NEXT_PUBLIC_ADMIN_PASSWORD` and `NEXT_PUBLIC_TEACHER_PASSWORD`.

**Rationale**: Admin and teacher should have different codes so admin can share admin access without exposing teacher dashboard (or vice versa). Both stored in localStorage under different keys: `be_an_toan_so_admin` and `bats:teacher_auth`.

---

*Research version: 1.0 | Feature: 021-teacher-dashboard*
