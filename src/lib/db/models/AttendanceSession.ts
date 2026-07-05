import { Model, Schema, model, models, Document } from "mongoose";

export interface IAttendanceSession extends Document {
  teacher_id: string;
  class_name: string;
  session_date: Date;
  duration_hours: number;
  total_cost: number;
  created_at: Date;
  updated_at: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    teacher_id: { type: String, required: true },
    class_name: { type: String, required: true },
    session_date: { type: Date, default: Date.now },
    duration_hours: { type: Number, default: 1 },
    total_cost: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

AttendanceSessionSchema.index({ teacher_id: 1, class_name: 1 });
AttendanceSessionSchema.index({ session_date: -1 });

export const AttendanceSession: Model<IAttendanceSession> =
  models.AttendanceSession || model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema, "attendance_sessions");
