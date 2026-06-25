import { Model,  Schema, model, models, Document, Types } from "mongoose";

export interface ITeacherStudentProgress {
  student_id: Types.ObjectId;
  path_id: Types.ObjectId;
  step_id: Types.ObjectId;
  score: number;
  completed_at: Date | null;
  topic_slug?: string;
}

const TeacherStudentProgressSchema = new Schema<ITeacherStudentProgress>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: "TeacherStudent", required: true },
    path_id: { type: Schema.Types.ObjectId, ref: "TeacherLearningPath", required: true },
    step_id: { type: Schema.Types.ObjectId, ref: "TeacherLearningPathStep", required: true },
    score: { type: Number, default: 0, min: 0 },
    completed_at: { type: Date, default: null },
    topic_slug: { type: String, default: null },
  },
  { timestamps: false }
);

TeacherStudentProgressSchema.index({ student_id: 1, step_id: 1 }, { unique: true });
TeacherStudentProgressSchema.index({ path_id: 1 });
TeacherStudentProgressSchema.index({ student_id: 1 });

export const TeacherStudentProgress: Model<ITeacherStudentProgress> =
  models.TeacherStudentProgress ||
  model<ITeacherStudentProgress>("TeacherStudentProgress", TeacherStudentProgressSchema, "teacher_student_progress");
