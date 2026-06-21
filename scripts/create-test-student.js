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
  } catch (err) {}
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

const TeacherStudentSchema = new mongoose.Schema({
  nickname: String,
  student_code: String,
  email: String,
  password_hash: String,
  is_active: Boolean,
  assigned_path_id: mongoose.Schema.Types.ObjectId,
}, { collection: "teacher_students" });

const TeacherStudent = mongoose.model("TeacherStudent", TeacherStudentSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  const passwordHash = await bcrypt.hash("password123", 10);
  
  // Update GiaovienC001
  const student = await TeacherStudent.findOne({ student_code: "GiaovienC001" });
  if (student) {
    student.password_hash = passwordHash;
    await student.save();
    console.log("Successfully updated GiaovienC001's password to 'password123'");
  } else {
    console.log("GiaovienC001 not found");
  }

  // Check if they have an assigned path. If not, assign one if available
  const TeacherLearningPathSchema = new mongoose.Schema({
    title: String,
    is_active: Boolean,
  }, { collection: "teacher_learning_paths" });
  const TeacherLearningPath = mongoose.model("TeacherLearningPath", TeacherLearningPathSchema);
  const path = await TeacherLearningPath.findOne({ is_active: true });
  if (path && student) {
    student.assigned_path_id = path._id;
    await student.save();
    console.log(`Assigned path '${path.title}' to student GiaovienC001`);
  }

  await mongoose.disconnect();
}

run();
