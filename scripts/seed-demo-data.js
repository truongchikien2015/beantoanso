const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment or .env file");
  process.exit(1);
}

// Schemas matching the app
const TeacherSchema = new mongoose.Schema({
  auth_uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  school_id: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { collection: "teachers" });

const TeacherStudentSchema = new mongoose.Schema({
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
}, { collection: "teacher_students" });

const TeacherStudentStatsSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  total_xp: { type: Number, default: 0 },
  current_streak: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_daily_completed_on: { type: String, default: null },
}, { collection: "teacher_student_stats" });

const ResultSchema = new mongoose.Schema({
  player_id: { type: String, required: true },
  nickname: { type: String, required: true },
  mission_score: { type: Number, default: 0 },
  quiz_score: { type: Number, default: 0 },
  total_score: { type: Number, default: 0 },
  title: { type: String, default: "" },
  badge: { type: String, default: "" },
  completed_at: { type: Date, default: Date.now },
}, { collection: "results" });

const StudentAnswerSchema = new mongoose.Schema({
  player_id: { type: String, required: true },
  nickname: { type: String, required: true },
  topic_slug: { type: String, required: true },
  topic_label: { type: String, required: true },
  selected_option: { type: String, required: true, enum: ["A", "B", "C"] },
  correct_option: { type: String, required: true, enum: ["A", "B", "C"] },
  is_correct: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
}, { collection: "student_answers" });

const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
const TeacherStudent = mongoose.models.TeacherStudent || mongoose.model("TeacherStudent", TeacherStudentSchema);
const TeacherStudentStats = mongoose.models.TeacherStudentStats || mongoose.model("TeacherStudentStats", TeacherStudentStatsSchema);
const Result = mongoose.models.Result || mongoose.model("Result", ResultSchema);
const StudentAnswer = mongoose.models.StudentAnswer || mongoose.model("StudentAnswer", StudentAnswerSchema);

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  // 1. Create/Update Teacher
  const teacherEmail = "giaovienc@gmail.com";
  const teacherUid = "6a389791470e6ec74cdde8c6";
  const teacherPassword = "Admin123@";
  const teacherPasswordHash = await bcrypt.hash(teacherPassword, 10);

  await Teacher.deleteMany({ email: teacherEmail });
  const teacher = await Teacher.create({
    _id: teacherUid,
    auth_uid: teacherUid,
    name: "Cô Hoa",
    email: teacherEmail,
    password_hash: teacherPasswordHash,
    is_active: true,
  });
  console.log(`Teacher '${teacher.name}' seeded.`);

  // 2. Clear existing demo student records for this teacher
  const oldStudents = await TeacherStudent.find({ created_by: { $in: [teacherUid, "demo-teacher-c-uid"] } }).lean();
  const oldStudentIds = oldStudents.map(s => s._id.toString());
  if (oldStudentIds.length > 0) {
    await TeacherStudentStats.deleteMany({ student_id: { $in: oldStudentIds } });
    await Result.deleteMany({ player_id: { $in: oldStudentIds } });
    await StudentAnswer.deleteMany({ player_id: { $in: oldStudentIds } });
  }
  await TeacherStudent.deleteMany({ created_by: { $in: [teacherUid, "demo-teacher-c-uid"] } });
  
  const studentPassword = "123456";
  const studentPasswordHash = await bcrypt.hash(studentPassword, 10);

  // 32 realistic student names
  const nicknames = [
    "Bé Minh", "Bé Lan", "Bé Nam", "Bé Vy", "Bé Hoàng", 
    "Bé Trang", "Bé Tuấn", "Bé Linh", "Bé Sơn", "Bé Mai", 
    "Bé Hùng", "Bé Yến", "Bé Cường", "Bé Hạnh", "Bé Khoa", 
    "Bé Ngọc", "Bé Đăng", "Bé Quân", "Bé Thảo", "Bé Đức",
    "Bé Phát", "Bé An", "Bé Bình", "Bé Dương", "Bé Phúc", 
    "Bé Quý", "Bé Bảo", "Bé Khải", "Bé Vân", "Bé Kiên", 
    "Bé Trúc", "Bé Kim"
  ];

  const topics = ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"];
  const topicLabels = {
    stranger: "Người lạ trên mạng",
    password: "Bảo vệ mật khẩu",
    privacy: "Quyền riêng tư",
    behavior: "Ứng xử văn minh",
    screentime: "Thời gian sử dụng",
    badcontent: "Nội dung xấu",
    phishing: "Lừa đảo trực tuyến"
  };

  const todayStr = new Date().toISOString().split('T')[0];

  console.log(`Seeding 32 students in Lớp 5A...`);
  for (let idx = 0; idx < nicknames.length; idx++) {
    const nickname = nicknames[idx];
    
    // Generate clean student code (e.g. beminh1)
    const asciiName = nickname.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/đ/g, "d")
      .replace(/\s+/g, ""); // remove spaces
    const studentCode = `${asciiName}${idx + 1}`; 

    const studentId = new mongoose.Types.ObjectId();

    // Create student
    await TeacherStudent.create({
      _id: studentId,
      created_by: teacherUid,
      nickname,
      email: null,
      class_name: "Lớp 5A",
      student_code: studentCode,
      password_hash: studentPasswordHash,
      is_active: true,
    });

    // Score profile: realistic scores
    let missionScore = 80;
    let quizScore = 80;
    if (idx === 3 || idx === 6 || idx === 11 || idx === 17) { // Vy, Tuấn, Yến, Quân
      missionScore = 100 - (idx % 2) * 5;
      quizScore = 95 - (idx % 2) * 5;
    } else if (idx === 2 || idx === 8 || idx === 12 || idx === 16) { // Nam, Sơn, Cường, Đăng
      missionScore = 50 - (idx % 2) * 10;
      quizScore = 45 - (idx % 2) * 5;
    } else {
      missionScore = 70 + (idx % 5) * 5;
      quizScore = 65 + (idx % 5) * 5;
    }

    const totalScore = missionScore + quizScore;
    let title = "Tân binh";
    let badge = "🌱";
    if (totalScore >= 160) { title = "Hiệp sĩ An toàn số"; badge = "🏆"; }
    else if (totalScore >= 130) { title = "Bạn nhỏ thông minh"; badge = "🌟"; }
    else if (totalScore >= 90) { title = "Em đã hiểu cơ bản"; badge = "🎖️"; }
    else { title = "Luyện tập thêm"; badge = "💪"; }

    // Seed stats
    await TeacherStudentStats.deleteMany({ student_id: studentId.toString() });
    await TeacherStudentStats.create({
      student_id: studentId.toString(),
      total_xp: totalScore,
      current_streak: idx % 3 + 1,
      longest_streak: idx % 3 + 3,
      last_daily_completed_on: todayStr
    });

    // Seed results (test history)
    await Result.deleteMany({ player_id: studentId.toString() });
    await Result.create({
      player_id: studentId.toString(),
      nickname,
      mission_score: missionScore,
      quiz_score: quizScore,
      total_score: totalScore,
      title,
      badge,
      completed_at: new Date(Date.now() - idx * 2 * 3600000)
    });

    // Seed answer details (accurate vs wrong to highlight analytics)
    await StudentAnswer.deleteMany({ player_id: studentId.toString() });
    for (const t of topics) {
      let isCorrect = Math.random() > 0.25;
      if (t === "stranger" || t === "phishing") {
        isCorrect = Math.random() > 0.6;
      }

      await StudentAnswer.create({
        player_id: studentId.toString(),
        nickname,
        topic_slug: t,
        topic_label: topicLabels[t],
        selected_option: isCorrect ? "B" : "A",
        correct_option: "B",
        is_correct: isCorrect,
        timestamp: new Date(Date.now() - idx * 3600000)
      });
    }
  }

  console.log(`Successfully seeded 32 students in Lớp 5A for Teacher ${teacherEmail}!`);
}

run()
  .then(() => {
    console.log("✅ Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
