import { Model,  Schema, model, models, Document } from "mongoose";

export interface IDailyQuizAnswer {
  student_id: string;
  date_key: string; // YYYY-MM-DD
  question_id: string;
  selected_option: "A" | "B" | "C";
  is_correct: boolean;
  created_at: Date;
}

const DailyQuizAnswerSchema = new Schema<IDailyQuizAnswer>(
  {
    student_id: { type: String, required: true },
    date_key: { type: String, required: true },
    question_id: { type: String, required: true },
    selected_option: { type: String, required: true, enum: ["A", "B", "C"] },
    is_correct: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

DailyQuizAnswerSchema.index({ student_id: 1, date_key: 1 });

export const DailyQuizAnswer: Model<IDailyQuizAnswer> = models.DailyQuizAnswer || model<IDailyQuizAnswer>("DailyQuizAnswer", DailyQuizAnswerSchema);
