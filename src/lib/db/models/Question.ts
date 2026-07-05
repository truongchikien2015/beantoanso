import { Model,  Schema, model, models, Document } from "mongoose";

export interface IQuestion {
  topic_slug: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string;
  is_active: boolean;
  min_age: number;
  max_age: number;
  target_gender: "all" | "male" | "female";
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    topic_slug: { type: String, required: true },
    question: { type: String, required: true },
    option_a: { type: String, required: true },
    option_b: { type: String, required: true },
    option_c: { type: String, required: true },
    correct_option: { type: String, required: true, enum: ["A", "B", "C"] },
    explanation: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    min_age: { type: Number, default: 0 },
    max_age: { type: Number, default: 99 },
    target_gender: { type: String, default: "all", enum: ["all", "male", "female"] },
    image_url: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

QuestionSchema.index({ is_active: 1 });
QuestionSchema.index({ topic_slug: 1 });

export const Question: Model<IQuestion> = models.Question || model<IQuestion>("Question", QuestionSchema);
