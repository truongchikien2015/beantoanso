const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const mongoose = require("mongoose");
const fs = require("fs");

function loadEnv() {
  try {
    const env = fs.readFileSync(".env", "utf-8");
    for (const line of env.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (err) { /* no .env file */ }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment or .env file");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined.");
  console.log("\nPlease run the migration script with environment variables set:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-supabase-to-mongodb.js\n");
  process.exit(1);
}

// Deterministic UUID to ObjectId conversion
function uuidToObjectId(uuid) {
  if (!uuid) return null;
  if (/^[0-9a-fA-F]{24}$/.test(uuid)) {
    return new mongoose.Types.ObjectId(uuid);
  }
  const hash = crypto.createHash("md5").update(uuid.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

// Inline schema definitions to run in standalone script
const schemas = {
  Profile: new mongoose.Schema({
    _id: { type: String, required: true },
    full_name: { type: String, default: null },
    gender: { type: String, default: null },
    birth_year: { type: Number, default: null },
    avatar_url: { type: String, default: null },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    total_score: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "profiles" }),

  Teacher: new mongoose.Schema({
    auth_uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    school_id: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teachers" }),

  TeacherStudent: new mongoose.Schema({
    created_by: { type: String, required: true },
    nickname: { type: String, required: true },
    email: { type: String, default: null },
    class_name: { type: String, default: null },
    student_code: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    assigned_path_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    assigned_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teacher_students" }),

  TeacherLearningPath: new mongoose.Schema({
    created_by: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teacher_learning_paths" }),

  TeacherLearningPathStep: new mongoose.Schema({
    path_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    step_order: { type: Number, required: true },
    step_type: { type: String, required: true },
    topic_id: { type: String, default: null },
    question_set_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  }, { collection: "teacher_learning_path_steps" }),

  TeacherQuestionSet: new mongoose.Schema({
    created_by: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teacher_question_sets" }),

  TeacherQuestion: new mongoose.Schema({
    set_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    question: { type: String, required: true },
    option_a: { type: String, required: true },
    option_b: { type: String, required: true },
    option_c: { type: String, required: true },
    correct_option: { type: String, required: true },
    explanation: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teacher_questions" }),

  TeacherStudentProgress: new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    path_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    step_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, default: 0 },
    completed_at: { type: Date, default: null },
  }, { collection: "teacher_student_progress" }),

  TeacherStudentStats: new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    total_xp: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_daily_completed_on: { type: String, default: null },
  }, { collection: "teacher_student_stats" }),

  TeacherStudentDailyAttempt: new mongoose.Schema({
    student_id: { type: String, required: true },
    attempt_date: { type: String, required: true },
    question_ids: [{ type: String }],
    answers: [
      {
        question_id: { type: String, required: true },
        selected_option: { type: String, required: true },
        is_correct: { type: Boolean, required: true },
      },
    ],
    correct_count: { type: Number, required: true },
    xp_awarded: { type: Number, required: true },
    completed_at: { type: Date, default: Date.now },
  }, { collection: "teacher_student_daily_attempts" }),

  TeacherXpEvent: new mongoose.Schema({
    student_id: { type: String, required: true },
    source: { type: String, required: true },
    xp: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now },
  }, { collection: "teacher_student_xp_events" }),

  TeacherTopic: new mongoose.Schema({
    created_by: { type: String, required: true },
    topic_key: { type: String, required: true },
    label: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "teacher_topics" }),

  Question: new mongoose.Schema({
    topic_slug: { type: String, required: true },
    question: { type: String, required: true },
    option_a: { type: String, required: true },
    option_b: { type: String, required: true },
    option_c: { type: String, required: true },
    correct_option: { type: String, required: true },
    explanation: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    min_age: { type: Number, default: 0 },
    max_age: { type: Number, default: 99 },
    target_gender: { type: String, default: "all" },
    image_url: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "questions" }),

  Result: new mongoose.Schema({
    player_id: { type: String, required: true },
    nickname: { type: String, required: true },
    mission_score: { type: Number, default: 0 },
    quiz_score: { type: Number, default: 0 },
    total_score: { type: Number, default: 0 },
    title: { type: String, default: "" },
    badge: { type: String, default: "" },
    completed_at: { type: Date, default: Date.now },
  }, { collection: "results" }),

  Topic: new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    icon: { type: String, default: "📚" },
    color: { type: String, default: "indigo" },
    topic_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "topics" }),

  LearningPath: new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    topic_ids: [{ type: String }],
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "learning_paths" }),

  StudentAnswer: new mongoose.Schema({
    player_id: { type: String, required: true },
    nickname: { type: String, required: true },
    topic_slug: { type: String, required: true },
    topic_label: { type: String, required: true },
    selected_option: { type: String, required: true },
    correct_option: { type: String, required: true },
    is_correct: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  }, { collection: "student_answers" }),

  UserProgress: new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    active_path_id: { type: String, default: null },
    completed_topics: { type: mongoose.Schema.Types.Mixed, default: [] },
    daily_challenges: { type: mongoose.Schema.Types.Mixed, default: {} },
    updated_at: { type: Date, default: Date.now },
  }, { collection: "user_progress" }),
};

const Profile = mongoose.model("Profile", schemas.Profile);
const Teacher = mongoose.model("Teacher", schemas.Teacher);
const TeacherStudent = mongoose.model("TeacherStudent", schemas.TeacherStudent);
const TeacherLearningPath = mongoose.model("TeacherLearningPath", schemas.TeacherLearningPath);
const TeacherLearningPathStep = mongoose.model("TeacherLearningPathStep", schemas.TeacherLearningPathStep);
const TeacherQuestionSet = mongoose.model("TeacherQuestionSet", schemas.TeacherQuestionSet);
const TeacherQuestion = mongoose.model("TeacherQuestion", schemas.TeacherQuestion);
const TeacherStudentProgress = mongoose.model("TeacherStudentProgress", schemas.TeacherStudentProgress);
const TeacherStudentStats = mongoose.model("TeacherStudentStats", schemas.TeacherStudentStats);
const TeacherStudentDailyAttempt = mongoose.model("TeacherStudentDailyAttempt", schemas.TeacherStudentDailyAttempt);
const TeacherXpEvent = mongoose.model("TeacherXpEvent", schemas.TeacherXpEvent);
const TeacherTopic = mongoose.model("TeacherTopic", schemas.TeacherTopic);
const Question = mongoose.model("Question", schemas.Question);
const Result = mongoose.model("Result", schemas.Result);
const Topic = mongoose.model("Topic", schemas.Topic);
const LearningPath = mongoose.model("LearningPath", schemas.LearningPath);
const StudentAnswer = mongoose.model("StudentAnswer", schemas.StudentAnswer);
const UserProgress = mongoose.model("UserProgress", schemas.UserProgress);

async function migrateTable(supabase, supabaseTable, Model, mapper) {
  console.log(`\n📦 Migrating ${supabaseTable} -> MongoDB...`);

  // Fetch all rows from Supabase
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase
      .from(supabaseTable)
      .select("*")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`❌ Error fetching from Supabase table ${supabaseTable}:`, error.message);
      return;
    }

    if (!data || data.length === 0) {
      keepFetching = false;
    } else {
      allRows = allRows.concat(data);
      page += 1;
      if (data.length < pageSize) {
        keepFetching = false;
      }
    }
  }

  console.log(`   Found ${allRows.length} records in Supabase.`);

  // Truncate MongoDB collection
  await Model.deleteMany({});
  console.log(`   Truncated MongoDB collection.`);

  if (allRows.length === 0) {
    return;
  }

  // Insert into MongoDB
  const mappedDocs = allRows.map(mapper);
  await Model.insertMany(mappedDocs);
  console.log(`   Successfully inserted ${mappedDocs.length} records into MongoDB.`);
}

async function run() {
  console.log("🚀 Starting data migration from Supabase to MongoDB...");

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log("🔌 Connected to MongoDB successfully.");

  // Connect to Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("🔌 Connected to Supabase successfully.");

  try {
    // 1. profiles
    await migrateTable(supabase, "profiles", Profile, (row) => ({
      _id: row.id,
      full_name: row.full_name,
      gender: row.gender,
      birth_year: row.birth_year,
      avatar_url: row.avatar_url,
      xp: row.xp || 0,
      level: row.level || 1,
      total_score: row.total_score || 0,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 2. teachers
    await migrateTable(supabase, "teachers", Teacher, (row) => ({
      _id: uuidToObjectId(row.id),
      auth_uid: row.auth_uid,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash || "legacy-auth",
      school_id: row.school_id,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 3. teacher_learning_paths
    await migrateTable(supabase, "teacher_learning_paths", TeacherLearningPath, (row) => ({
      _id: uuidToObjectId(row.id),
      created_by: row.created_by,
      title: row.title,
      description: row.description,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 4. teacher_question_sets
    await migrateTable(supabase, "teacher_question_sets", TeacherQuestionSet, (row) => ({
      _id: uuidToObjectId(row.id),
      created_by: row.created_by,
      title: row.title,
      description: row.description,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 5. teacher_students
    await migrateTable(supabase, "teacher_students", TeacherStudent, (row) => ({
      _id: uuidToObjectId(row.id),
      created_by: row.created_by,
      nickname: row.nickname,
      email: row.email,
      class_name: row.class_name,
      student_code: row.student_code,
      password_hash: row.password_hash || "legacy",
      assigned_path_id: uuidToObjectId(row.assigned_path_id),
      assigned_at: row.assigned_at ? new Date(row.assigned_at) : null,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 6. teacher_learning_path_steps
    await migrateTable(supabase, "teacher_learning_path_steps", TeacherLearningPathStep, (row) => ({
      _id: uuidToObjectId(row.id),
      path_id: uuidToObjectId(row.path_id),
      step_order: row.step_order,
      step_type: row.step_type,
      topic_id: row.topic_id,
      question_set_id: uuidToObjectId(row.question_set_id),
    }));

    // 7. teacher_questions
    await migrateTable(supabase, "teacher_questions", TeacherQuestion, (row) => ({
      _id: uuidToObjectId(row.id),
      set_id: uuidToObjectId(row.set_id),
      question: row.question,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      correct_option: row.correct_option,
      explanation: row.explanation,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 8. teacher_student_progress
    await migrateTable(supabase, "teacher_student_progress", TeacherStudentProgress, (row) => ({
      _id: uuidToObjectId(row.id),
      student_id: uuidToObjectId(row.student_id),
      path_id: uuidToObjectId(row.path_id),
      step_id: uuidToObjectId(row.step_id),
      score: row.score || 0,
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
    }));

    // 9. teacher_student_stats
    await migrateTable(supabase, "teacher_student_stats", TeacherStudentStats, (row) => ({
      student_id: row.student_id,
      total_xp: row.total_xp || 0,
      current_streak: row.current_streak || 0,
      longest_streak: row.longest_streak || 0,
      last_daily_completed_on: row.last_daily_completed_on,
    }));

    // 10. teacher_student_daily_attempts
    await migrateTable(supabase, "teacher_student_daily_attempts", TeacherStudentDailyAttempt, (row) => ({
      student_id: row.student_id,
      attempt_date: row.attempt_date,
      question_ids: row.question_ids || [],
      answers: row.answers || [],
      correct_count: row.correct_count || 0,
      xp_awarded: row.xp_awarded || 0,
      completed_at: row.completed_at ? new Date(row.completed_at) : new Date(),
    }));

    // 11. teacher_student_xp_events
    await migrateTable(supabase, "teacher_student_xp_events", TeacherXpEvent, (row) => ({
      student_id: row.student_id,
      source: row.source,
      xp: row.xp,
      metadata: row.metadata || {},
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
    }));

    // 12. teacher_topics
    await migrateTable(supabase, "teacher_topics", TeacherTopic, (row) => ({
      _id: uuidToObjectId(row.id),
      created_by: row.created_by,
      topic_key: row.topic_key,
      label: row.label,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 13. questions
    await migrateTable(supabase, "questions", Question, (row) => ({
      _id: uuidToObjectId(row.id),
      topic_slug: row.topic_slug,
      question: row.question,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      correct_option: row.correct_option,
      explanation: row.explanation || "",
      is_active: row.is_active !== false,
      min_age: row.min_age || 0,
      max_age: row.max_age || 99,
      target_gender: row.target_gender || "all",
      image_url: row.image_url || null,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 14. results
    await migrateTable(supabase, "results", Result, (row) => ({
      _id: uuidToObjectId(row.id),
      player_id: row.player_id,
      nickname: row.nickname,
      mission_score: row.mission_score,
      quiz_score: row.quiz_score,
      total_score: row.total_score,
      title: row.title,
      badge: row.badge,
      completed_at: row.completed_at ? new Date(row.completed_at) : new Date(),
    }));

    // 15. topics
    await migrateTable(supabase, "topics", Topic, (row) => ({
      slug: row.slug,
      label: row.label,
      icon: row.icon || "📚",
      color: row.color || "indigo",
      topic_order: row.topic_order || 0,
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 16. learning_paths
    await migrateTable(supabase, "learning_paths", LearningPath, (row) => ({
      _id: uuidToObjectId(row.id),
      title: row.title,
      description: row.description || "",
      topic_ids: row.topic_ids || [],
      is_active: row.is_active !== false,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    // 17. student_answers
    await migrateTable(supabase, "student_answers", StudentAnswer, (row) => ({
      _id: uuidToObjectId(row.id),
      player_id: row.player_id,
      nickname: row.nickname,
      topic_slug: row.topic_slug,
      topic_label: row.topic_label,
      selected_option: row.selected_option,
      correct_option: row.correct_option,
      is_correct: row.is_correct === true,
      timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
    }));

    // 18. user_progress
    await migrateTable(supabase, "user_progress", UserProgress, (row) => ({
      user_id: row.user_id,
      active_path_id: row.active_path_id,
      completed_topics: row.completed_topics || [],
      daily_challenges: row.daily_challenges || {},
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));

    console.log("\n✅ Migration completed successfully!");
  } catch (err) {
    console.error("\n❌ Migration failed with error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

run();
