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
  password_hash: String,
  is_active: Boolean,
}, { collection: "teacher_students" });

const TeacherStudent = mongoose.model("TeacherStudent", TeacherStudentSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  const student = await TeacherStudent.findOne({ student_code: "GiaovienC001" });
  if (student) {
    console.log("Student GiaovienC001 document from DB:", student.toObject());
    const match = await bcrypt.compare("password123", student.password_hash);
    console.log("Does 'password123' match the hash in MongoDB?", match);
  } else {
    console.log("Student GiaovienC001 not found");
  }
  await mongoose.disconnect();
}

run();
