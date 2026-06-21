const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const SCREENSHOT_DIR = "/Users/tomnyson/.gemini/antigravity-ide/brain/593924ba-2c44-46b5-8fbf-655bb1c6394d";

async function run() {
  console.log("🚀 Starting Playwright UI Capture...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2, // Retinal high-quality screenshots
  });
  const page = await context.newPage();

  // Ensure output directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  try {
    // 1. Capture Login Page
    console.log("📸 Navigating to Student Login Page...");
    await page.goto("http://localhost:3000/student/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // Let animations settle
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "student_login.png") });
    console.log("✅ Saved student_login.png");

    // 2. Perform login
    console.log("🔑 Logging in as GiaovienC001...");
    await page.fill('input[id="student_code"]', "GiaovienC001");
    await page.fill('input[id="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    console.log("⏳ Waiting for redirection to dashboard...");
    await page.waitForURL("**/student/dashboard", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500); // Wait for animated map transition
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "student_dashboard.png") });
    console.log("✅ Saved student_dashboard.png");

    // Open Chatbot popup on Dashboard
    console.log("💬 Opening AI Chatbot popup...");
    const chatbotButton = page.locator('button[aria-label="Mở trợ lý học tập"]');
    if (await chatbotButton.isVisible()) {
      await chatbotButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "student_chatbot.png") });
      console.log("✅ Saved student_chatbot.png");
      
      // Close chatbot popup
      await page.click('button[aria-label="Đóng trợ lý học tập"]');
      await page.waitForTimeout(300);
    }

    // 3. Go to Daily Challenge Page
    console.log("📸 Navigating to Daily Challenge Page...");
    await page.goto("http://localhost:3000/student/daily", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "student_daily.png") });
    console.log("✅ Saved student_daily.png");

    // 4. Go to Lessons Page
    console.log("📸 Navigating to Lessons Page...");
    await page.goto("http://localhost:3000/lessons", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "lessons_library.png") });
    console.log("✅ Saved lessons_library.png");

    // Click on the first lesson to see detail layout
    console.log("📖 Opening the first lesson details...");
    const firstLessonButton = page.locator('button:has-text("Bài 1")').first();
    if (await firstLessonButton.isVisible()) {
      await firstLessonButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "lesson_details.png") });
      console.log("✅ Saved lesson_details.png");
    }

    // 5. Go to Leaderboard Page
    console.log("📸 Navigating to Leaderboard Page...");
    await page.goto("http://localhost:3000/leaderboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "leaderboard.png") });
    console.log("✅ Saved leaderboard.png");

    console.log("🎉 UI Capture finished successfully!");
  } catch (error) {
    console.error("❌ Error captured during browser automation:", error);
  } finally {
    await browser.close();
  }
}

run();
