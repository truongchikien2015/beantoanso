import { Schema, model, models, Document, Model } from "mongoose";

export interface ITeacher {
  auth_uid: string;
  name: string;
  email: string;
  password_hash: string;
  school_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    auth_uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    school_id: { type: String, default: null },
    avatar_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherSchema.index({ is_active: 1 });

if (models.Teacher) {
  delete (models as any).Teacher;
}

export const Teacher: Model<ITeacher> = model<ITeacher>("Teacher", TeacherSchema);
