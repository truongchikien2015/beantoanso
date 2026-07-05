# Feature Specification: Trang Giáo Viên

**Feature Branch**: `feat/021-teacher-dashboard`

**Created**: 2026-05-17

**Status**: Draft

**Input**: User description: "Trang dành cho giáo viên — Giáo viên có một trang riêng, đơn giản hơn trang admin. Giáo viên có thể: Xem thống kê học sinh, Xem điểm trung bình, Xem danh sách học sinh, Tìm kiếm học sinh theo tên, Xem lịch sử trả lời câu hỏi, Xuất dữ liệu học sinh ra file, Xem biểu đồ theo chủ đề. Trang giáo viên tập trung vào việc theo dõi kết quả học tập, không quá nặng về quản lý kỹ thuật."

**Constitution Check**: All features comply with Bé An Toàn Số Constitution.
- TypeScript-First: All types explicit — ✅
- Vietnamese-First: All UI text in Vietnamese — ✅
- Accessibility-First: Teacher dashboard is desktop-focused; keyboard navigation for all tables — ✅
- LocalStorage Resilience: Data from Zustand/localStorage (same as admin) — ✅
- AI Provider: Not applicable — ✅
- Admin Simplicity: Teacher dashboard is read-only, no server secrets, no CRUD — ✅
- Component Composition: Business logic extracted to `lib/` — ✅

---

## Clarifications

### Session 2026-05-17

- Q: Student identity — deduplicate by playerId or nickname? → A: **Option A** — Mỗi FinalResult entry = một học sinh riêng biệt (không deduplicate). "Tổng HS" = tổng số lượt chơi. "Điểm TB" = mean của tất cả total_score entries. "Top HS" = entry có total_score cao nhất.
- Q: Search — exact match hay partial match? → A: **Partial** — Search lọc theo nickname chứa chuỗi tìm kiếm (case-insensitive). Filter áp dụng trên toàn bộ danh sách trước khi phân trang.
- Q: Sort mặc định của student list? → A: **Mới nhất trước** — Danh sách mặc định sort theo completed_at giảm dần (lượt chơi gần nhất lên đầu).
- Q: Topic chart — hiển thị cái gì? → A: **Số câu trả lời theo chủ đề** — Mỗi thanh = tổng số câu trả lời (StudentAnswer) thuộc chủ đề đó, không phải số học sinh hay số câu đúng.
- Q: Có cần thêm sort options khác ngoài default? → A: **Option C** — Dropdown sort: Mới nhất (default), Điểm cao nhất, Tên A-Z, Tên Z-A.

---

## 1. User Scenarios & Testing *(mandatory)*

### User Story 1 — Đăng nhập Trang Giáo Viên (Priority: P1)

Giáo viên mở trang `/teacher` và đăng nhập bằng mã giáo viên để truy cập dashboard theo dõi học sinh.

**Why this priority**: Không có đăng nhập thì không có dashboard. Đây là điểm vào bắt buộc.

**Independent Test**: Teacher navigates to `/teacher`, enters teacher code, sees dashboard — or enters wrong code and sees error message.

**Acceptance Scenarios**:

1. **Given** teacher visits `/teacher`, **When** they enter correct teacher code, **Then** dashboard loads with overview stats
2. **Given** teacher visits `/teacher`, **When** they enter wrong code, **Then** error message "Mã giáo viên không đúng" appears
3. **Given** teacher is logged in, **When** they navigate away and return to `/teacher`, **Then** dashboard loads without re-entering code (persisted)

---

### User Story 2 — Xem Tổng Quan Thống Kê (Priority: P1)

Giáo viên xem được các số liệu tổng quan: tổng lượt chơi, điểm trung bình, lượt chơi có điểm cao nhất.

**Why this priority**: Đây là thông tin quan trọng nhất mà giáo viên cần nhanh chóng nhìn thấy khi mở dashboard.

**Independent Test**: Teacher opens dashboard → sees 4 stat cards with correct values matching localStorage data.

**Acceptance Scenarios**:

1. **Given** teacher is on dashboard, **When** overview tab is active, **Then** 4 stat cards display: Tổng lượt chơi, Lượt chơi, Điểm TB, Lượt cao nhất
2. **Given** no student data exists, **When** dashboard loads, **Then** all stat cards show "0" or "—"

---

### User Story 3 — Xem Danh Sách Học Sinh, Tìm Kiếm & Sort (Priority: P1)

Giáo viên xem danh sách tất cả lượt chơi, tìm kiếm theo tên (partial, case-insensitive), và sort theo 4 tiêu chí khác nhau. Mỗi lượt chơi hiển thị như một row riêng biệt.

**Why this priority**: Core functionality — giáo viên cần tìm và sắp xếp lượt chơi của học sinh.

**Independent Test**: Teacher clicks "Học sinh" tab → sees paginated student list sorted by newest → changes sort to highest score → list re-sorts → types in search → list filters in real-time.

**Acceptance Scenarios**:

1. **Given** teacher is on "Học sinh" tab, **When** student list loads, **Then** table shows nickname, nhiệm vụ, quiz, tổng điểm, danh hiệu, thời gian — sorted by newest first (default)
2. **Given** teacher selects "Điểm cao nhất" from sort dropdown, **When** dropdown changes, **Then** list re-sorts by total_score descending
3. **Given** teacher selects "Tên A-Z" from sort dropdown, **When** dropdown changes, **Then** list re-sorts by nickname ascending (case-insensitive)
4. **Given** teacher selects "Tên Z-A" from sort dropdown, **When** dropdown changes, **Then** list re-sorts by nickname descending (case-insensitive)
5. **Given** teacher types in search box, **When** matching nickname found, **Then** list filters to show only rows where nickname contains search string (case-insensitive), keeping current sort order
6. **Given** teacher types in search box, **When** no match found, **Then** "Không tìm thấy học sinh" message displays
7. **Given** student list has >20 entries, **When** teacher clicks pagination, **Then** next page of students loads (preserving sort and filter)

---

### User Story 4 — Xem Chi Tiết Lịch Sử Trả Lời (Priority: P1)

Giáo viên nhấn "Xem chi tiết" trên một lượt chơi để xem lịch sử trả lời câu hỏi: chủ đề, đáp án đã chọn, đúng/sai, thời gian, và % chính xác theo chủ đề.

**Why this priority**: Core functionality — giáo viên cần xem chi tiết từng lượt chơi để đánh giá.

**Independent Test**: Teacher clicks "Xem chi tiết" on a row → modal opens with answer history → accuracy stats and per-topic breakdown visible → clicks close → modal closes.

**Acceptance Scenarios**:

1. **Given** teacher clicks "Xem chi tiết", **When** modal opens, **Then** it shows: student nickname, total answers, correct count, accuracy %, per-topic breakdown
2. **Given** teacher clicks "Xem chi tiết" on row with no history, **When** modal opens, **Then** "Chưa có lịch sử trả lời" message displays
3. **Given** teacher clicks ✕ or outside modal, **When** modal closes, **Then** dashboard remains visible

---

### User Story 5 — Xuất Dữ Liệu CSV (Priority: P2)

Giáo viên xuất danh sách học sinh ra file CSV để sử dụng trong Excel.

**Why this priority**: Quan trọng cho giáo viên theo dõi offline nhưng không phải là MVP.

**Independent Test**: Teacher clicks "Xuất CSV" button → browser downloads CSV file with student data → file contains correct columns and data.

**Acceptance Scenarios**:

1. **Given** teacher clicks "Xuất CSV", **When** button is clicked, **Then** CSV downloads with columns: nickname, nhiệm vụ, quiz, tổng, danh hiệu, ngày
2. **Given** no student data exists, **When** teacher clicks "Xuất CSV", **Then** empty CSV with headers only downloads

---

### User Story 6 — Xem Biểu Đồ Câu Hỏi Theo Chủ Đề (Priority: P2)

Giáo viên xem biểu đồ số câu trả lời theo từng chủ đề để hiểu học sinh mạnh/yếu ở đâu.

**Why this priority**: Cung cấp insight về điểm mạnh/yếu từng học sinh nhưng không bắt buộc cho MVP.

**Independent Test**: Teacher clicks "Biểu đồ" tab → sees bar chart or horizontal bars showing total answer count per topic → each bar labeled with topic name and count.

**Acceptance Scenarios**:

1. **Given** teacher is on "Biểu đồ" tab, **When** data exists, **Then** bars show each of 7 topics with total answer count (not student count or correct count)
2. **Given** teacher clicks on a topic bar, **When** topic is selected, **Then** student list filters to show only students who answered questions on that topic

---

### User Story 7 — Thoát Đăng Nhập Giáo Viên (Priority: P3)

Giáo viên đăng xuất khỏi trang giáo viên để bảo mật.

**Why this priority**: An toàn bảo mật — giáo viên có thể dùng chung thiết bị.

**Independent Test**: Teacher clicks "Đăng xuất" → redirected to home → returns to `/teacher` → asked to enter code again.

**Acceptance Scenarios**:

1. **Given** teacher is logged in, **When** they click "Đăng xuất", **Then** they are logged out and redirected to home
2. **Given** teacher is logged out, **When** they visit `/teacher`, **Then** they see the login form

---

### Edge Cases

- Teacher enters wrong code 3 times → show error but allow retry (no lockout)
- localStorage cleared while teacher is logged in → on next load, show login form
- Student has 0 answers → show "Chưa có lịch sử trả lời" gracefully in modal
- CSV export with 1000+ students → generate file without browser freeze (chunked generation)
- Teacher shares URL with colleague → colleague sees login form (not the dashboard)
- localStorage unavailable (private browsing blocked) → show warning message in Vietnamese: "Trình duyệt không cho phép lưu trữ. Vui lòng bật cookies."
- Very long nickname in student list → truncate with ellipsis at 20 characters, full name in modal

---

## 2. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display teacher login form on `/teacher` route
- **FR-002**: System MUST authenticate with teacher code matching `NEXT_PUBLIC_TEACHER_PASSWORD` env var
- **FR-003**: System MUST persist teacher auth in localStorage (`bats:teacher_auth`)
- **FR-004**: System MUST display 4 stat cards on overview: Tổng lượt chơi, Lượt chơi, Điểm TB, Lượt cao nhất
- **FR-005**: System MUST display paginated student table (20/page) with columns: nickname, nhiệm vụ, quiz, tổng, danh hiệu, ngày
- **FR-006**: System MUST provide sort dropdown with 4 options: Mới nhất (default), Điểm cao nhất, Tên A-Z, Tên Z-A
- **FR-007**: Sort and filter MUST be composable — filter applies to full list first, then sort applies to filtered results
- **FR-008**: System MUST filter student list by nickname partial-match (case-insensitive) in real-time as teacher types
- **FR-009**: System MUST open detail modal when "Xem chi tiết" is clicked, showing answer history
- **FR-010**: Detail modal MUST show: total answers, correct count, accuracy %, per-topic breakdown
- **FR-011**: System MUST generate and download CSV with columns: nickname, nhiệm vụ, quiz, tổng, danh hiệu, ngày
- **FR-012**: System MUST display topic answer distribution chart showing total answer count per topic (7 topics)
- **FR-013**: System MUST allow logout which clears localStorage auth and redirects to home
- **FR-014**: All UI text MUST be in Vietnamese
- **FR-015**: No CRUD operations (create/edit/delete questions, topics, paths) — this is admin only
- **FR-016**: System MUST handle localStorage unavailable gracefully with warning message
- **FR-017**: Sort MUST persist across pagination — changing pages preserves current sort order

### Key Entities

- **StudentAggregate**: One row per FinalResult entry (no deduplication). Fields: playerId, nickname, missionScore, quizScore, totalScore, title, badge, completedAt, answerCount, correctCount, accuracy, topicsAttempted.
- **AnswerHistoryItem**: From `StudentAnswer[]` — topic, selected option, correct/incorrect, timestamp
- **TopicStats**: Computed from `StudentAnswer[]` — topicId, topicLabel, totalAnswers, correctAnswers, accuracy, studentCount

---

## 3. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teacher can log in with correct code in under 2 seconds
- **SC-002**: Stat cards display correct values matching localStorage data (totalAttempts = FinalResult[].length, avgScore = mean(total_score), topScore = max(total_score))
- **SC-003**: Search filters student list within 100ms of keystroke
- **SC-004**: CSV download completes in under 3 seconds for up to 1000 students
- **SC-005**: All 7 topics visible in topic chart with total answer counts
- **SC-006**: Teacher dashboard has NO create/edit/delete buttons for questions, topics, or paths
- **SC-007**: Table default sort: completedAt descending. All 4 sort options work correctly.
- **SC-008**: Sort and filter are composable — pagination preserves both

---

## 4. Assumptions

- Teacher code is stored in `NEXT_PUBLIC_TEACHER_PASSWORD` env var (separate from admin password)
- Teacher dashboard reads from the same localStorage keys as admin (`bats:final_results:v1`, `bats:student_answers:v1`, `bats:questions:v1`)
- Teacher dashboard does NOT require Supabase authentication — localStorage-based auth only
- No separate teacher account system — simple shared code is sufficient
- Teacher dashboard is desktop-first (768px+ viewport)
- Each FinalResult entry = one play session (no deduplication)

---

## 5. Difference from Admin Dashboard

| Feature | Admin | Teacher |
|---|---|---|
| Auth | `NEXT_PUBLIC_ADMIN_PASSWORD` | `NEXT_PUBLIC_TEACHER_PASSWORD` |
| Create/Edit/Delete questions | ✅ | ❌ |
| Create/Edit/Delete topics | ✅ | ❌ |
| Create/Edit/Delete paths | ✅ | ❌ |
| Student answer history | ✅ | ✅ |
| Stats overview | ✅ | ✅ |
| Student search | ✅ | ✅ |
| Sort options | ✅ | ✅ (4 options: newest, score, A-Z, Z-A) |
| CSV export | ✅ | ✅ |
| Topic chart | Questions by topic | Answer counts by topic |
| Supabase auth | ✅ | ❌ (localStorage only) |
| Voice/TTS | N/A | N/A |

---

*Spec version: 1.2 | Feature branch: feat/021-teacher-dashboard | Created: 2026-05-17 | Updated: 2026-05-17*
