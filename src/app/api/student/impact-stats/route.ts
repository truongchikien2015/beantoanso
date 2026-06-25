import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Profile } from "@/lib/db/models/Profile";
import { StudentAnswer } from "@/lib/db/models/StudentAnswer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    // 1. Get real counts from DB
    const teacherStudentsCount = await TeacherStudent.countDocuments();
    const profilesCount = await Profile.countDocuments();
    const realTotalStudents = teacherStudentsCount + profilesCount;

    const realAnswersCount = await StudentAnswer.countDocuments();

    // 2. Real metrics
    const realStudents = realTotalStudents;
    const realScans = realAnswersCount; // Assume 1 answer = 1 scan for simplicity, or we could leave it. Actually let's just use realAnswersCount
    const realAnswers = realAnswersCount;
    const realParents = profilesCount;

    // Calculate real category percentages if answers exist
    const answers = await StudentAnswer.find().lean();
    const categories = ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"];
    const categoryAccuracies: Record<string, number> = {
      stranger: 0,
      phishing: 0,
      password: 0,
      privacy: 0,
      behavior: 0,
      screentime: 0,
      badcontent: 0,
    };
    
    let overallCorrect = 0;

    if (answers && answers.length > 0) {
      const catStats: Record<string, { total: number; correct: number }> = {};
      answers.forEach((ans) => {
        const cat = ans.topic_slug;
        if (ans.is_correct) overallCorrect++;
        if (cat) {
          if (!catStats[cat]) catStats[cat] = { total: 0, correct: 0 };
          catStats[cat].total += 1;
          if (ans.is_correct) catStats[cat].correct += 1;
        }
      });

      categories.forEach((cat) => {
        const stat = catStats[cat];
        if (stat && stat.total > 0) {
          categoryAccuracies[cat] = Math.round((stat.correct / stat.total) * 100);
        }
      });
    }

    const overallAccuracy = answers.length > 0 ? Math.round((overallCorrect / answers.length) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        total_students: realStudents,
        total_scans: realScans,
        total_answers: realAnswers,
        active_parents: realParents,
        overall_accuracy: overallAccuracy,
        accuracy_improvement: 0, // Since we don't track history of improvement, default to 0
        accuracies: categoryAccuracies,
      }
    });
  } catch (err: any) {
    console.error("Impact Stats API Error:", err);
    return NextResponse.json({
      success: false,
      error: err.message
    });
  }
}
