import { Model, Schema, model, models, Document } from "mongoose";

export interface ITeacherClass extends Document {
  created_by: string; // Teacher ID
  class_name: string;
  hourly_rate: number;
  created_at: Date;
  updated_at: Date;
}

const TeacherClassSchema = new Schema<ITeacherClass>(
  {
    created_by: { type: String, required: true },
    class_name: { type: String, required: true },
    hourly_rate: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TeacherClassSchema.index({ created_by: 1, class_name: 1 }, { unique: true });

export const TeacherClass: Model<ITeacherClass> =
  models.TeacherClass || model<ITeacherClass>("TeacherClass", TeacherClassSchema, "teacher_classes");
