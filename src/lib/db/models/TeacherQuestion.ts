import { Model,  Schema, model, models, Document, Types } from "mongoose";

export interface ITeacherQuestion {
  set_id: Types.ObjectId;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherQuestionSchema = new Schema<ITeacherQuestion>(
  {
    set_id: { type: Schema.Types.ObjectId, ref: "TeacherQuestionSet", required: true },
    question: { type: String, required: true, maxlength: 1000, minlength: 1 },
    option_a: { type: String, required: true, maxlength: 500 },
    option_b: { type: String, required: true, maxlength: 500 },
    option_c: { type: String, required: true, maxlength: 500 },
    correct_option: { type: String, required: true, enum: ["A", "B", "C"] },
    explanation: { type: String, maxlength: 500, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherQuestionSchema.index({ set_id: 1 });

export const TeacherQuestion: Model<ITeacherQuestion> = models.TeacherQuestion || model<ITeacherQuestion>("TeacherQuestion", TeacherQuestionSchema);
