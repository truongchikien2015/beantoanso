import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherQuestionSet {
  created_by: string;
  title: string;
  topic_id: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherQuestionSetSchema = new Schema<ITeacherQuestionSet>(
  {
    created_by: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200, minlength: 1 },
    topic_id: { type: String, required: true },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherQuestionSetSchema.index({ created_by: 1, is_active: 1 });

export const TeacherQuestionSet: Model<ITeacherQuestionSet> = models.TeacherQuestionSet || model<ITeacherQuestionSet>("TeacherQuestionSet", TeacherQuestionSetSchema);
