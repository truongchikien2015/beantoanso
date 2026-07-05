import { Model,  Schema, model, models, Document } from "mongoose";

export interface IStudentAnswer {
  player_id: string;
  nickname: string;
  topic_slug: string;
  topic_label: string;
  selected_option: "A" | "B" | "C";
  correct_option: "A" | "B" | "C";
  is_correct: boolean;
  timestamp: Date;
}

const StudentAnswerSchema = new Schema<IStudentAnswer>(
  {
    player_id: { type: String, required: true },
    nickname: { type: String, required: true },
    topic_slug: { type: String, required: true },
    topic_label: { type: String, required: true },
    selected_option: { type: String, required: true, enum: ["A", "B", "C"] },
    correct_option: { type: String, required: true, enum: ["A", "B", "C"] },
    is_correct: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

StudentAnswerSchema.index({ player_id: 1 });
StudentAnswerSchema.index({ timestamp: -1 });

export const StudentAnswer: Model<IStudentAnswer> =
  models.StudentAnswer || model<IStudentAnswer>("StudentAnswer", StudentAnswerSchema, "student_answers");
