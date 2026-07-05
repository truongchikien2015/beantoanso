# SPEC.md — Tự Động Chuyển Học Sinh Đến Nội Dung Học Tập (027)

## 1. Project Overview

| Field | Detail |
|---|---|
| **Feature** | Học sinh đã gán lộ trình → Tự động chuyển đến nội dung học tập |
| **Feature ID** | 027 |
| **Component** | Student dashboard pages |
| **Target Users** | Học sinh đã đăng nhập |

## 2. Mục tiêu

Khi học sinh đăng nhập và đã được gán lộ trình:
- Nếu có bước tiếp theo chưa hoàn thành → Chuyển trực tiếp đến bước đó
- Nếu hoàn thành tất cả các bước → Chuyển đến trang tiến độ

## 3. User Stories

### US1: Auto-redirect đến bước tiếp theo
- **Priority**: P1
- **Actor**: Học sinh đã đăng nhập, đã có lộ trình
- **Trigger**: Học sinh đăng nhập thành công
- **Behavior**:
  1. Fetch dashboard data (có assigned_path và progress)
  2. Tìm bước tiếp theo chưa hoàn thành
  3. Redirect đến `/student/quiz/[stepId]`
- **Acceptance**:
  - Không hiển thị dashboard trung gian
  - Redirect tức thì sau khi login thành công

### US2: Auto-redirect đến trang tiến độ khi hoàn thành
- **Priority**: P1
- **Actor**: Học sinh đã hoàn thành tất cả bước trong lộ trình
- **Trigger**: Học sinh đăng nhập
- **Behavior**:
  1. Xác định không có bước tiếp theo
  2. Redirect đến `/student/progress`
- **Acceptance**:
  - Thông báo "Hoàn thành lộ trình" vẫn hiển thị

### US3: Học sinh chưa có lộ trình
- **Priority**: P1
- **Actor**: Học sinh chưa được gán lộ trình
- **Behavior**:
  1. Hiển thị dashboard bình thường với thông báo "Chưa có lộ trình"
- **Acceptance**:
  - Không redirect

## 4. Technical Approach

### 4.1 Modify StudentDashboardPage
```typescript
// Trong StudentDashboardPage
const handleContinue = () => {
  if (nextStep) {
    router.push(`/student/quiz/${nextStep.id}`);
  } else if (assigned_path) {
    router.push("/student/progress");
  }
};

// Auto-redirect ngay sau khi data được load
useEffect(() => {
  if (data && assigned_path) {
    handleContinue();
  }
}, [data, assigned_path, nextStep, router]);
```

### 4.2 Logic Flow
```
Login Success
    ↓
Fetch Dashboard (has assigned_path + progress)
    ↓
Has nextStep? ──Yes──→ Redirect to /student/quiz/[stepId]
    │
    No
    ↓
Has assigned_path? ──Yes──→ Redirect to /student/progress
    │
    No
    ↓
Show Dashboard (no path assigned message)
```

## 5. Files to Modify

| File | Change |
|---|---|
| `src/app/student/dashboard/page.tsx` | Thêm auto-redirect logic |

## 6. Acceptance Criteria

- [ ] Học sinh đã gán lộ trình + có bước tiếp theo → Redirect đến quiz
- [ ] Học sinh đã gán lộ trình + hoàn thành tất cả → Redirect đến trang progress
- [ ] Học sinh chưa gán lộ trình → Hiển thị dashboard bình thường
- [ ] Không có flash/tr_delay trước khi redirect
