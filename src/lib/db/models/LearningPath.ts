import { Model,  Schema, model, models, Document } from "mongoose";

export interface ILearningPath {
  title: string;
  description: string;
  topic_ids: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const LearningPathSchema = new Schema<ILearningPath>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    topic_ids: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

LearningPathSchema.index({ is_active: 1 });

export const LearningPath: Model<ILearningPath> = models.LearningPath || model<ILearningPath>("LearningPath", LearningPathSchema);
