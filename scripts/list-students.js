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
  } catch (err) {}
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

const TeacherStudentSchema = new mongoose.Schema({
  nickname: String,
  student_code: String,
  email: String,
  is_active: Boolean,
}, { collection: "teacher_students" });

const TeacherStudent = mongoose.model("TeacherStudent", TeacherStudentSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  const students = await TeacherStudent.find({ is_active: true }).limit(5);
  console.log("Students found in DB:");
  console.log(JSON.stringify(students, null, 2));
  await mongoose.disconnect();
}

run();
