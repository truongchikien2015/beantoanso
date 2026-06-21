import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherTopic {
  created_by: string;
  topic_key: string;
  label: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherTopicSchema = new Schema<ITeacherTopic>(
  {
    created_by: { type: String, required: true },
    topic_key: { type: String, required: true, maxlength: 50, minlength: 1 },
    label: { type: String, required: true, maxlength: 100, minlength: 1 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherTopicSchema.index({ created_by: 1, topic_key: 1 }, { unique: true });
TeacherTopicSchema.index({ created_by: 1, is_active: 1 });

export const TeacherTopic: Model<ITeacherTopic> = models.TeacherTopic || model<ITeacherTopic>("TeacherTopic", TeacherTopicSchema);
