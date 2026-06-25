import { Model,  Schema, model, models, Document, Types } from "mongoose";

export interface ITeacherStudent {
  created_by: string;
  nickname: string;
  email: string | null;
  class_name: string | null;
  student_code: string;
  parent_access_code: string | null;
  password_hash: string;
  assigned_path_ids: Types.ObjectId[];
  assigned_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherStudentSchema = new Schema<ITeacherStudent>(
  {
    created_by: { type: String, required: true },
    nickname: { type: String, required: true, maxlength: 100, minlength: 1 },
    email: { type: String, default: null },
    class_name: { type: String, default: null },
    student_code: { type: String, required: true, unique: true },
    parent_access_code: { type: String, default: null },
    password_hash: { type: String, required: true },
    assigned_path_ids: [{ type: Schema.Types.ObjectId, ref: "TeacherLearningPath" }],
    assigned_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherStudentSchema.index({ created_by: 1 });
TeacherStudentSchema.index({ parent_access_code: 1 }, { unique: true, sparse: true });

export const TeacherStudent: Model<ITeacherStudent> =
  models.TeacherStudent || model<ITeacherStudent>("TeacherStudent", TeacherStudentSchema, "teacher_students");
