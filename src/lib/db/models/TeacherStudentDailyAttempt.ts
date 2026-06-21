import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherStudentDailyAttempt {
  student_id: string;
  attempt_date: string; // YYYY-MM-DD
  question_ids: string[];
  answers: Array<{
    question_id: string;
    selected_option: "A" | "B" | "C";
    is_correct: boolean;
  }>;
  correct_count: number;
  xp_awarded: number;
  completed_at: Date;
}

const TeacherStudentDailyAttemptSchema = new Schema<ITeacherStudentDailyAttempt>(
  {
    student_id: { type: String, required: true },
    attempt_date: { type: String, required: true },
    question_ids: [{ type: String, required: true }],
    answers: [
      {
        question_id: { type: String, required: true },
        selected_option: { type: String, required: true, enum: ["A", "B", "C"] },
        is_correct: { type: Boolean, required: true },
      },
    ],
    correct_count: { type: Number, required: true },
    xp_awarded: { type: Number, required: true },
  },
  { timestamps: { createdAt: "completed_at", updatedAt: false } }
);

TeacherStudentDailyAttemptSchema.index({ student_id: 1, attempt_date: 1 }, { unique: true });

export const TeacherStudentDailyAttempt: Model<ITeacherStudentDailyAttempt> = models.TeacherStudentDailyAttempt ||
  model<ITeacherStudentDailyAttempt>("TeacherStudentDailyAttempt", TeacherStudentDailyAttemptSchema);
