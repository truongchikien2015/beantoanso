import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherLearningPath {
  created_by: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherLearningPathSchema = new Schema<ITeacherLearningPath>(
  {
    created_by: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200, minlength: 1 },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherLearningPathSchema.index({ created_by: 1, is_active: 1 });

export const TeacherLearningPath: Model<ITeacherLearningPath> = models.TeacherLearningPath || model<ITeacherLearningPath>("TeacherLearningPath", TeacherLearningPathSchema);
