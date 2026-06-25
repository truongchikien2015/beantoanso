import { Model,  Schema, model, models, Document, Types } from "mongoose";

export interface ITeacherLearningPathStep {
  path_id: Types.ObjectId;
  step_order: number;
  step_type: "topic" | "question_set";
  topic_id: string | null;
  question_set_id: Types.ObjectId | null;
  question_count: number | null;
}

const TeacherLearningPathStepSchema = new Schema<ITeacherLearningPathStep>(
  {
    path_id: { type: Schema.Types.ObjectId, ref: "TeacherLearningPath", required: true },
    step_order: { type: Number, required: true, min: 1 },
    step_type: { type: String, required: true, enum: ["topic", "question_set"] },
    topic_id: { type: String, default: null },
    question_set_id: { type: Schema.Types.ObjectId, ref: "TeacherQuestionSet", default: null },
    question_count: { type: Number, default: null },
  },
  { timestamps: false }
);

TeacherLearningPathStepSchema.index({ path_id: 1 });
TeacherLearningPathStepSchema.index({ path_id: 1, step_order: 1 }, { unique: true });

export const TeacherLearningPathStep: Model<ITeacherLearningPathStep> =
  models.TeacherLearningPathStep ||
  model<ITeacherLearningPathStep>("TeacherLearningPathStep", TeacherLearningPathStepSchema, "teacher_learning_path_steps");

