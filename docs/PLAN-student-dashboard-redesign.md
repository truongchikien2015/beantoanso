# Kế hoạch Thiết kế lại Giao diện Bảng học tập học sinh (Student Dashboard)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết kế lại toàn bộ giao diện Bảng học tập của học sinh (`/student/dashboard`) đồng bộ phong cách thiết kế Stitch, bảng màu Pastel Kid-friendly (Xanh ngọc `#4ECDC4`, Vàng kem `#FFF9F0`, San hô `#FF6B6B`) và cấu trúc của trang lựa chọn lộ trình học tập (`LearningPathSelector.tsx`).

**Architecture:** Sử dụng trực tiếp cấu trúc HTML semantic (`<header>`, `<main>`, `<section>`, `<footer>`) kết hợp các class Tailwind và một khối `<style>` CSS cục bộ (scoped styles) bên trong component `StudentDashboard.tsx` để tối ưu hóa hiệu suất, tránh trùng lặp class và ô nhiễm CSS toàn cục.

**Tech Stack:** Next.js (React), Tailwind CSS v4, Lucide Icons / Heroicons SVGs, Zustand Global Store.

## Global Constraints
- **Vietnamese-First:** Toàn bộ nội dung hiển thị tiếng Việt, đúng ngữ cảnh trẻ em tiểu học.
- **Purple Ban:** Tuyệt đối không dùng các màu tím, indigo, violet. Chỉ dùng Xanh ngọc (Teal), Vàng kem (Yellow/Cream), San hô (Coral/Red).
- **Responsive Layout:** Thiết kế thích ứng tốt từ màn hình điện thoại di động (mobile-first) cho đến máy tính bảng/desktop.
- **TypeScript Strict Mode:** Không dùng `any`, định nghĩa kiểu dữ liệu tường minh.

---

### Task 1: Thiết kế lại vỏ bọc trang (Layout Shell) & Tích hợp Header màu trắng

**Files:**
- Modify: [StudentDashboard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDashboard.tsx)

**Interfaces:**
- Consumes: `StudentDashboardData` từ props.
- Produces: Giao diện khung trang đồng bộ với `/path-select`, bao gồm Sticky Header màu trắng và Chân trang Footer.

- [ ] **Step 1: Cập nhật cấu trúc wrapper chính và bổ sung khối `<style scoped>`**

Đổi thẻ div ngoài cùng từ `kid-paper-page` sang lớp `sd-page` và thêm khối CSS tương ứng vào cuối file để cấu hình nền chấm lưới mịn cùng phông chữ Nunito.

```typescript
// Thêm khối CSS cục bộ vào thẻ <style> cuối file src/components/student/StudentDashboard.tsx
/* ─── Page Shell ─── */
.sd-page {
  min-height: 100dvh;
  background-color: #FFF9F0;
  background-image: radial-gradient(#e5e7eb 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  color: #2D3436;
  font-family: var(--font-nunito, 'Nunito'), var(--font-quicksand, 'Quicksand'), sans-serif;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Xây dựng Sticky Header màu trắng đồng bộ**

Thay thế header cũ (với màu gradient xanh coral) bằng header màu trắng có logo `Bé An Toàn Số`, các liên kết điều hướng và nút đăng xuất đồng bộ.

```tsx
<header className="sd-navbar">
  <div className="sd-navbar-inner">
    <div className="sd-logo" onClick={() => router.push("/")}>
      <div className="sd-logo-icon">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
        </svg>
      </div>
      <span className="sd-logo-text">Bé An Toàn Số</span>
    </div>
    <nav className="sd-nav-links">
      <button onClick={() => router.push("/path-select")} className="sd-nav-link">Khóa học</button>
      <button onClick={() => router.push("/student/daily")} className="sd-nav-link">Thử thách</button>
      <button onClick={() => router.push("/leaderboard")} className="sd-nav-link">Bảng xếp hạng</button>
      <button onClick={() => router.push("/#about")} className="sd-nav-link">Về chúng tôi</button>
    </nav>
    <div className="sd-nav-actions">
      <button onClick={onLogout} className="sd-nav-btn-outline">Đăng xuất</button>
      <button className="sd-nav-btn-filled">{student.nickname}</button>
    </div>
  </div>
</header>
```

- [ ] **Step 3: Chạy biên dịch kiểm tra lỗi**

Chạy lệnh kiểm tra TypeScript:
```bash
export PATH="/opt/homebrew/bin:$PATH" && yarn tsc --noEmit
```
Yêu cầu: Không có lỗi TypeScript phát sinh.

---

### Task 2: Redesign Profile Card & Thêm Mascot Tin Nhắn Giáo Viên

**Files:**
- Modify: [StudentDashboard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDashboard.tsx)

**Interfaces:**
- Consumes: Dữ liệu `student`, `stats` từ props.
- Produces: Thẻ Profile Card bo góc `rounded-[32px]` và bong bóng thoại mascot giáo viên robot hướng dẫn.

- [ ] **Step 1: Thay thế thẻ thông tin học sinh cũ thành Profile Card mới**

Sử dụng cấu trúc Profile Card ngang bo góc mềm mại:

```tsx
<section className="sd-profile-card">
  <div className="sd-profile-left">
    <div className="sd-profile-avatar-circle">
      <span className="text-2xl">{getAvatarEmoji()}</span>
    </div>
    <div>
      <h2 className="sd-profile-name">{student.nickname}</h2>
      <p className="sd-profile-tagline">Học sinh tích cực · Lớp {student.class_name || "Tự do"}</p>
    </div>
  </div>
  <div className="sd-profile-right">
    <div className="sd-profile-badge badge-blue">
      <span>⚡ Lv.{stats.level}</span>
    </div>
    <div className="sd-profile-badge badge-yellow">
      <span>⭐ {stats.total_xp} XP</span>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Thêm bong bóng thoại của Mascot Giáo Viên**

Thêm khu vực hội thoại hỗ trợ học sinh học tập sinh động:

```tsx
<section className="sd-chat-bubble">
  <div className="sd-chat-avatar">
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  </div>
  <div className="sd-chat-content">
    <p>
      {nextStep 
        ? `Chào ${student.nickname}! Hôm nay chúng mình cùng vượt qua bước "${
            nextStep.step_type === "topic" ? "Bài học" : "Bài kiểm tra"
          }" để hoàn thành lộ trình nhé!` 
        : `Chúc mừng ${student.nickname}! Em đã xuất sắc hoàn thành tất cả các bước của lộ trình học tập rồi!`
      }
    </p>
  </div>
</section>
```

- [ ] **Step 3: Chạy tsc kiểm tra biên dịch**
```bash
export PATH="/opt/homebrew/bin:$PATH" && yarn tsc --noEmit
```

---

### Task 3: Redesign Bảng Tiến Độ Lộ Trình & Các Bước Học Tập (Steps List)

**Files:**
- Modify: [StudentDashboard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDashboard.tsx)

**Interfaces:**
- Consumes: `assigned_path`, `progressMap`, `nextStep` từ props/state.
- Produces: Thẻ lộ trình viền Xanh ngọc (Teal) bo góc `rounded-[32px]`, nền chấm lưới và danh sách các bước học tập được thiết kế lại.

- [ ] **Step 1: Thiết kế lại khung bao ngoài của Hành trình (Path Card)**

Áp dụng phong cách viền Teal và nền chấm lưới:

```tsx
<section className="sd-path-card">
  <div className="sd-path-top-bar" />
  <div className="sd-path-inner flex-col items-stretch gap-6">
    <div className="border-b-2 border-dashed border-teal-100 pb-4">
      <span className="sd-path-badge">HÀNH TRÌNH PHIÊU LƯU CỦA EM</span>
      <h3 className="sd-path-title flex items-center gap-2">🧭 {assigned_path.title}</h3>
      {assigned_path.description && (
        <p className="sd-path-desc">{assigned_path.description}</p>
      )}
      <div className="flex justify-between items-center text-sm font-extrabold text-teal-700 mt-4 bg-teal-50/50 p-3 rounded-2xl">
        <span> Tiến trình hiện tại:</span>
        <span>{completedCount}/{totalSteps} bước ({Math.round((completedCount/totalSteps)*100)}%)</span>
      </div>
    </div>
    
    {/* Danh sách các bước học */}
    <div className="space-y-4">
      {assigned_path.steps.map((step, index) => {
        const prog = progressMap.get(step.id);
        const isCompleted = !!prog;
        const isNext = step.id === nextStep?.id;
        
        return (
          <div 
            key={step.id} 
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
              isCompleted 
                ? "bg-emerald-50/30 border-emerald-200" 
                : isNext 
                  ? "bg-teal-50/20 border-teal-300 ring-2 ring-teal-200/50" 
                  : "bg-white border-slate-100 opacity-60"
            }`}
          >
            {/* Chi tiết bước */}
          </div>
        );
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Cập nhật chi tiết hiển thị cho từng bước học tập (Step item)**

Hiển thị đẹp mắt, sử dụng các thẻ tag, điểm số học tập và nút hành động thích hợp:

```tsx
<div className="flex items-center gap-4">
  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
    isCompleted 
      ? "bg-emerald-500 text-white" 
      : isNext 
        ? "bg-teal-500 text-white animate-pulse" 
        : "bg-slate-200 text-slate-500"
  }`}>
    {isCompleted ? "✓" : index + 1}
  </div>
  <div>
    <p className={`font-bold ${isCompleted ? "text-slate-500 line-through" : "text-slate-800"}`}>
      {step.step_type === "topic"
        ? topicLabels[step.topic_id as keyof typeof topicLabels] ?? `Bài học ${index + 1}`
        : `Bài kiểm tra tổng hợp ${index + 1}`}
    </p>
    <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-md mt-1 ${
      step.step_type === "topic" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
    }`}>
      {step.step_type === "topic" ? "📖 Bài học" : "📝 Bài kiểm tra"}
    </span>
  </div>
</div>

<div className="flex items-center gap-2">
  {isCompleted ? (
    <span className="text-sm font-extrabold text-emerald-600">⭐ {prog?.score}%</span>
  ) : isNext ? (
    <button
      onClick={() => handleStartStep(step.id)}
      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-sm rounded-full shadow-sm hover:shadow active:scale-95 transition"
    >
      Bắt đầu 🎮
    </button>
  ) : (
    <span className="text-sm">🔒</span>
  )}
</div>
```

- [ ] **Step 3: Chạy tsc và linter để kiểm định code**
```bash
export PATH="/opt/homebrew/bin:$PATH" && yarn tsc --noEmit && yarn lint
```

---

### Task 4: Tinh Chỉnh Nút Thử Thách Hằng Ngày (Streak Card) & Footer

**Files:**
- Modify: [StudentDashboard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDashboard.tsx)

**Interfaces:**
- Consumes: Trạng thái stats, các hành động liên kết từ props.
- Produces: Daily Streak Card và Footer đồng bộ màu sắc.

- [ ] **Step 1: Redesign Thẻ Thử thách hằng ngày (Streak Card)**

```tsx
<section className="sd-streak-card-new">
  <div className="sd-streak-inner">
    <div className="sd-streak-details">
      <span className="sd-streak-badge">THỬ THÁCH HẰNG NGÀY</span>
      <h3 className="sd-streak-title">Chuỗi học {stats.current_streak} ngày liên tục</h3>
      <p className="sd-streak-desc">
        Học đều đặn mỗi ngày để tích lũy kiến thức an toàn mạng và nhận thêm nhiều XP nhé!
      </p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
          style={{ width: `${Math.min((stats.xp_in_level / stats.xp_for_next) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs font-bold text-amber-700 mt-2">
        Tiến độ cấp độ hiện tại: {stats.xp_in_level}/{stats.xp_for_next} XP đến cấp kế tiếp
      </p>
    </div>
    <div className="sd-streak-action">
      <button
        onClick={() => router.push("/student/daily")}
        className="sd-streak-btn"
      >
        🎯 Vào thử thách
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Thiết lập Footer cuối trang**

```tsx
<footer className="sd-footer mt-12">
  <div className="sd-footer-inner">
    <p className="sd-footer-copy">© 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt Nam trên không gian mạng.</p>
    <div className="sd-footer-links">
      <button onClick={() => router.push("/terms")} className="sd-footer-link bg-transparent border-none cursor-pointer">Điều khoản</button>
      <button onClick={() => router.push("/privacy")} className="sd-footer-link bg-transparent border-none cursor-pointer">Bảo mật</button>
      <button onClick={() => router.push("/contact")} className="sd-footer-link bg-transparent border-none cursor-pointer">Liên hệ</button>
      <button onClick={() => router.push("/help")} className="sd-footer-link bg-transparent border-none cursor-pointer">Trợ giúp</button>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Khai báo tất cả CSS cần thiết trong thẻ `<style>` của file**

Đảm bảo khai báo các class `.sd-page`, `.sd-navbar`, `.sd-navbar-inner`, `.sd-logo`, `.sd-nav-links`, `.sd-nav-link`, `.sd-nav-actions`, `.sd-profile-card`, `.sd-chat-bubble`, `.sd-chat-content`, `.sd-path-card`, `.sd-path-badge`, `.sd-streak-card-new`, `.sd-footer` giống hệt như trong `LearningPathSelector.tsx`.

---

## Verification Plan

### Automated Tests
- Biên dịch TypeScript để đảm bảo không lỗi cú pháp:
  ```bash
  export PATH="/opt/homebrew/bin:$PATH" && yarn tsc --noEmit
  ```
- Kiểm tra tính đúng đắn của ESLint linter:
  ```bash
  export PATH="/opt/homebrew/bin:$PATH" && yarn lint
  ```

### Manual Verification
- Chạy browser subagent thực hiện:
  1. Đăng nhập học sinh `bekim32` / `123456`.
  2. Điều hướng trực tiếp đến trang `/student/dashboard?view=1`.
  3. Xác thực giao diện bảng học tập mới: Đảm bảo có sticky header màu trắng, profile card bo tròn lớn, mascot robot, danh sách các bước học tập được bao bọc trong card màu Teal, và footer ở cuối trang.
  4. Chụp ảnh màn hình để đối chiếu độ nhất quán về màu sắc và bố cục so với `/path-select`.
