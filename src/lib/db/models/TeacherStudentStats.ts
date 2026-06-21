import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherStudentStats {
  student_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_daily_completed_on: string | null;
}

const TeacherStudentStatsSchema = new Schema<ITeacherStudentStats>(
  {
    student_id: { type: String, required: true, unique: true },
    total_xp: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_daily_completed_on: { type: String, default: null },
  },
  { timestamps: false }
);

export const TeacherStudentStats: Model<ITeacherStudentStats> = models.TeacherStudentStats || model<ITeacherStudentStats>("TeacherStudentStats", TeacherStudentStatsSchema);
