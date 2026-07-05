# Hackathon Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 2-minute real-time AI Safety demo flow, personal risk profile dashboard, parent portal redirect, escape room simulation, social impact dashboard, and fix critical teacher login and hydration bugs for the hackathon presentation.

**Architecture:** Create new components `AiSafetyScanner`, `EscapeRoomSimulation`, `SocialImpactDashboard` using Bento/Stitch playground design principles (3D flat, card-kids, Nunito font, Purple Ban). Integrate them into `HomeScreen`, `StudentDashboard`, and new Next.js routes. Modify backend route files to support fallback seed login credentials, parent code parsing, and hydration fixes.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, MongoDB (Mongoose), Zustand.

## Global Constraints
- Vietnamese-first language for all student-facing copy and instructions.
- Strict compliance with the Purple Ban: do not introduce any new purple or violet color codes (`#8B5CF6`, `#7C3AED`, `bg-purple-600`, etc.) in the UI.
- Use 3D flat/playful Duolingo-style buttons and bento cards with borders and transform effects on active/hover.

---

### Task 1: Fix Teacher Login & Classify Game Hydration Mismatch
**Files:**
- Modify: `src/app/api/auth/teacher/login/route.ts`
- Modify: `src/components/ClassifyGame.tsx`

**Interfaces:**
- Teacher login route expects JSON request with email and password, and returns access token.
- ClassifyGame props: `{ onBack: () => void }`.

- [ ] **Step 1: Modify teacher login route to auto-seed/bypass for demo account**
  Open `src/app/api/auth/teacher/login/route.ts` and add logic to check for `giaovienc@gmail.com` with password `Admin123@`. If not present in database, automatically hash the password and create the Teacher and Profile documents.
  ```typescript
  // If demo credentials, ensure account exists
  if (normalizedEmail === "giaovienc@gmail.com" && password === "Admin123@") {
    let teacher = await Teacher.findOne({ email: normalizedEmail });
    if (!teacher) {
      const passwordHash = await bcrypt.hash("Admin123@", 10);
      const authUid = new mongoose.Types.ObjectId().toString();
      teacher = await Teacher.create({
        auth_uid: authUid,
        name: "Giáo viên C (Demo)",
        email: normalizedEmail,
        password_hash: passwordHash,
        is_active: true,
      });
      let prof = await Profile.findOne({ _id: authUid });
      if (!prof) {
        await Profile.create({
          _id: authUid,
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: "Giáo viên C (Demo)",
          gender: "other",
          birth_year: 1990,
          xp: 100,
          level: 1,
          total_score: 100,
        });
      }
    }
  }
  ```

- [ ] **Step 2: Modify ClassifyGame to fix client-side shuffle hydration mismatch**
  Open `src/components/ClassifyGame.tsx` and change state initialization:
  ```typescript
  const [items, setItems] = useState<Item[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(shuffle(POOL).slice(0, 10));
    setMounted(true);
  }, []);

  if (!mounted) return null;
  ```

- [ ] **Step 3: Run typescript compiler and lint check to verify**
  Run: `npm run typecheck && npm run lint`
  Expected: Successful completion with no errors.

- [ ] **Step 4: Commit bug fixes**
  ```bash
  git add src/app/api/auth/teacher/login/route.ts src/components/ClassifyGame.tsx
  git commit -m "fix: resolve teacher login 401 and classify hydration mismatch"
  ```

---

### Task 2: Implement AI Safety Scanner on Homepage & Dashboard
**Files:**
- Create: `src/components/AiSafetyScanner.tsx`
- Modify: `src/components/HomeScreen.tsx`
- Modify: `src/components/student/StudentDashboard.tsx`

**Interfaces:**
- `AiSafetyScanner` acts as a self-contained component querying `/api/student/detect-scam` and routing students to practice options based on risk outputs.

- [ ] **Step 1: Create `src/components/AiSafetyScanner.tsx`**
  Build a Bento-styled container with an input textarea, dynamic warning classification (green/yellow/red), a mascot explanation bubble, and CTA buttons suggesting targeted practice scenarios.
  ```typescript
  // Suggest corresponding practice based on scan output
  const getPracticeRoute = (text: string) => {
    const textLower = text.toLowerCase();
    if (textLower.includes("kim cương") || textLower.includes("free fire")) return "/student/escape-room";
    if (textLower.includes("mật khẩu") || textLower.includes("otp")) return "/student/escape-room";
    if (textLower.includes("link") || textLower.includes("http")) return "/classify";
    return "/chat-sim";
  };
  ```

- [ ] **Step 2: Integrate scanner into `src/components/HomeScreen.tsx`**
  Place `AiSafetyScanner` on the right side of the hero section of the landing page as a prominent interactive feature.

- [ ] **Step 3: Integrate scanner into `src/components/student/StudentDashboard.tsx`**
  Render the `AiSafetyScanner` as a widget below the mascot greeting bubble on the logged-in student dashboard, ensuring active students can scan links anytime.

- [ ] **Step 4: Verify scan classification manually**
  Input "Trúng thưởng xe máy SH click link garena-qua.com" in the input field, submit, verify red warning is shown with explanation and link to the escape room.

- [ ] **Step 5: Commit scanning feature**
  ```bash
  git add src/components/AiSafetyScanner.tsx src/components/HomeScreen.tsx src/components/student/StudentDashboard.tsx
  git commit -m "feat: implement real-time AI Safety Scanner on homepage and dashboard"
  ```

---

### Task 3: Create "Escape Room" Simulation Page
**Files:**
- Create: `src/components/EscapeRoomSimulation.tsx`
- Create: `src/app/student/escape-room/page.tsx`

- [ ] **Step 1: Create `src/components/EscapeRoomSimulation.tsx`**
  Write a multi-stage simulation component covering the 3 scenarios: Free Fire gift, Fake scholarship, and Urgent OTP request. Score responses and display an award summary screen with XP gain.
  
- [ ] **Step 2: Create page routing at `src/app/student/escape-room/page.tsx`**
  Add App Router wrapper fetching student session, triggering `/api/student/progress` updates upon completion, and providing navigation back to dashboard.

- [ ] **Step 3: Test Escape Room flow manually**
  Navigate to `/student/escape-room`, complete all 3 stages, verify explanation cards render correctly, and assert the score page displays properly.

- [ ] **Step 4: Commit escape room feature**
  ```bash
  git add src/components/EscapeRoomSimulation.tsx src/app/student/escape-room/page.tsx
  git commit -m "feat: add Escape Room simulation covering real-world security risks"
  ```

---

### Task 4: Integrate Risk Profile and Parent Portal Redirect
**Files:**
- Modify: `src/app/api/student/dashboard/route.ts`
- Modify: `src/components/student/StudentDashboard.tsx`
- Modify: `src/types/teacher-content.ts`

- [ ] **Step 1: Expose parent access code in API**
  Open `src/app/api/student/dashboard/route.ts` and ensure `parent_access_code` is fetched and returned inside the `student` data object. Update types in `src/types/teacher-content.ts` to include `parent_access_code?: string | null`.

- [ ] **Step 2: Add Risk Profile calculation and Parent Demo redirect in `StudentDashboard.tsx`**
  Compute weaknesses dynamically by parsing student progress scores per topic, displaying them in a Bento widget with targeted recommendations, and displaying the parent access code alongside a direct link button `Xem demo phụ huynh` (pointing to `/parent?code=...`).

- [ ] **Step 3: Verify parent link**
  Click the "Xem demo phụ huynh" button on the student dashboard, confirm it opens the parent dashboard, automatically logs in, and displays the correct child statistics and weaknesses.

- [ ] **Step 4: Commit updates**
  ```bash
  git add src/app/api/student/dashboard/route.ts src/components/student/StudentDashboard.tsx src/types/teacher-content.ts
  git commit -m "feat: integrate personalized risk profile and parent portal redirect"
  ```

---

### Task 5: Build Social Impact Dashboard
**Files:**
- Create: `src/components/SocialImpactDashboard.tsx`
- Create: `src/app/impact/page.tsx`
- Create: `src/app/api/student/impact-stats/route.ts`

- [ ] **Step 1: Create API route `/api/student/impact-stats`**
  Build a route that queries database numbers (such as total registered students, total completed questions) and returns them combined with baseline metrics for display.

- [ ] **Step 2: Create component `SocialImpactDashboard.tsx`**
  Design a Bento-style impact grid demonstrating active student numbers, parent interactions, and phishing identification accuracy improvement rates.

- [ ] **Step 3: Create page routing at `src/app/impact/page.tsx`**
  Add standard Page layout rendering the `SocialImpactDashboard` component.

- [ ] **Step 4: Verify Social Impact Dashboard page**
  Open `/impact`, ensure all numbers and bento layouts align correctly, and verify responsive scaling.

- [ ] **Step 5: Commit impact dashboard**
  ```bash
  git add src/components/SocialImpactDashboard.tsx src/app/impact/page.tsx src/app/api/student/impact-stats/route.ts
  git commit -m "feat: implement social impact dashboard for hackathon judges"
  ```
