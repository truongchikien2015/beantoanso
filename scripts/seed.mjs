/**
 * Seed script — pushes local quizQuestions + topic data to Supabase DB.
 * The canonical question source is src/data/quizQuestions.ts.
 * Run:  node scripts/seed.mjs
 * Check: node scripts/seed.mjs --dry-run
 * Pull:  node scripts/seed.mjs --pull
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import ts from "typescript";

// ── Read .env manually ────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const env = readFileSync(".env", "utf-8");
    for (const line of env.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env file */ }
}
loadEnv();

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.VITE_SUPABASE_URL  || "https://fhxycqvssizeqgbbsgmt.supabase.co";
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY  || "";

const API_KEY = SERVICE_ROLE || ANON_KEY;
if (!API_KEY) {
  console.error("❌ No API key found. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

// ── Topic metadata ─────────────────────────────────────────────────────────
const TOPIC_META = {
  stranger: { icon: "👤", color: "indigo" },
  phishing: { icon: "🎣", color: "emerald" },
  password: { icon: "🔑", color: "amber" },
  privacy: { icon: "🔒", color: "rose" },
  behavior: { icon: "🌐", color: "sky" },
  screentime: { icon: "⏰", color: "violet" },
  badcontent: { icon: "🚫", color: "orange" },
};

async function loadQuizSource() {
  const source = readFileSync("src/data/quizQuestions.ts", "utf-8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`;
  const { quizBank, topicLabels } = await import(moduleUrl);

  return {
    quizBank,
    topics: Object.entries(topicLabels).map(([slug, label], order) => ({
      slug,
      label,
      icon: TOPIC_META[slug]?.icon || "📚",
      color: TOPIC_META[slug]?.color || "indigo",
      order,
    })),
  };
}

function normalizeQuestion(q) {
  return {
    ...q,
    minAge: q.minAge ?? 6,
    maxAge: q.maxAge ?? 99,
    targetGender: q.targetGender ?? "all",
  };
}

function correctOption(idx) {
  return (["A", "B", "C"])[idx];
}

function log(msg, ok = true) {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
}

function printSourceSummary(topics, questions) {
  const counts = questions.reduce((acc, q) => {
    acc[q.topic] = (acc[q.topic] || 0) + 1;
    return acc;
  }, {});

  log(`Source has ${topics.length} topics and ${questions.length} questions`);
  for (const topic of topics) {
    console.log(`  - ${topic.slug}: ${counts[topic.slug] || 0}`);
  }
}

async function pullDbSummary(supabase) {
  const [
    { data: topics, error: topicsErr },
    { data: questions, error: questionsErr },
  ] = await Promise.all([
    supabase.from("topics").select("slug, label").order("topic_order", { ascending: true }),
    supabase.from("questions").select("topic_slug"),
  ]);

  if (topicsErr) {
    log(`Topics pull failed: ${topicsErr.message}`, false);
    process.exit(1);
  }
  if (questionsErr) {
    log(`Questions pull failed: ${questionsErr.message}`, false);
    process.exit(1);
  }

  const counts = (questions || []).reduce((acc, q) => {
    acc[q.topic_slug] = (acc[q.topic_slug] || 0) + 1;
    return acc;
  }, {});

  log(`DB has ${topics?.length || 0} topics and ${questions?.length || 0} questions`);
  for (const topic of topics || []) {
    console.log(`  - ${topic.slug}: ${counts[topic.slug] || 0}`);
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, API_KEY);
  const { quizBank, topics } = await loadQuizSource();
  const allQuestions = quizBank.map(normalizeQuestion);
  const mode = process.argv.includes("--pull")
    ? "pull"
    : process.argv.includes("--dry-run")
      ? "dry-run"
      : "push";

  console.log("\n🔄 Seeding Supabase from src/data/quizQuestions.ts...\n");
  printSourceSummary(topics, allQuestions);

  if (mode === "dry-run") {
    log("Dry run complete; no DB changes made");
    return;
  }

  if (mode === "pull") {
    await pullDbSummary(supabase);
    return;
  }

  // 1. Upsert topics
  log(`Upserting ${topics.length} topics...`);
  const topicRows = topics.map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    color: t.color,
    topic_order: t.order,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  const { error: topicErr } = await supabase.from("topics").upsert(topicRows, { onConflict: "slug" });
  if (topicErr) {
    log(`Topics upsert failed: ${topicErr.message}`, false);
    process.exit(1);
  }
  log(`Topics seeded OK`);

  // 2. Fetch topics to get their IDs
  const { data: topicsData, error: topicFetchErr } = await supabase.from("topics").select("id, slug");
  if (topicFetchErr) {
    log(`Topics fetch failed: ${topicFetchErr.message}`, false);
    process.exit(1);
  }

  const topicMap = {};
  topicsData?.forEach(t => topicMap[t.slug] = t.id);

  // 3. Clear and Insert questions
  log(`Cleaning and inserting ${allQuestions.length} questions...`);
  await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const questionRows = allQuestions.map((q) => ({
    topic_slug: q.topic,
    question: q.question,
    option_a: q.options[0],
    option_b: q.options[1],
    option_c: q.options[2],
    correct_option: correctOption(q.correctIndex),
    explanation: q.explanation,
    is_active: true,
    min_age: q.minAge,
    max_age: q.maxAge,
    target_gender: q.targetGender,
    updated_at: new Date().toISOString(),
  }));

  const missingTopic = questionRows.find((row) => !topicMap[row.topic_slug]);
  if (missingTopic) {
    log(`Missing topic id for question topic '${missingTopic.topic_slug}'`, false);
    process.exit(1);
  }

  const { error: questionErr } = await supabase.from("questions").insert(questionRows);
  if (questionErr) {
    log(`Questions insert failed: ${questionErr.message}`, false);
    process.exit(1);
  }
  log(`Questions seeded OK`);

  // 4. Seed learning paths
  log(`Seeding learning paths...`);
  const LEARNING_PATHS = [
    { title: "Cơ bản", description: "Dành cho người mới bắt đầu.", topicSlugs: ["stranger", "phishing", "password"] },
    { title: "Nâng cao", description: "Dành cho học sinh lớn tuổi.", topicSlugs: ["privacy", "behavior", "screentime"] },
    { title: "Toàn diện", description: "Đầy đủ 7 chủ đề.", topicSlugs: ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"] },
  ];

  const pathRows = LEARNING_PATHS.map((p) => ({
    title: p.title,
    description: p.description,
    topic_ids: p.topicSlugs.map((slug) => topicMap[slug]).filter(Boolean),
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("learning_paths").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: pathErr } = await supabase.from("learning_paths").insert(pathRows);
  if (pathErr) {
    log(`Learning paths failed: ${pathErr.message}`, false);
    process.exit(1);
  }
  log(`Learning paths seeded OK`);

  log(`Seeded ${topics.length} topics and ${allQuestions.length} questions from quizBank`);
  log("Seed completed successfully!");
}

main().catch(console.error);
