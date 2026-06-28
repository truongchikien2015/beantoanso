import { Model, Schema, model, models, Document, Types } from "mongoose";

export interface IAttendanceRecord extends Document {
  session_id: Types.ObjectId;
  student_id: Types.ObjectId;
  status: "present" | "absent";
  created_at: Date;
  updated_at: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    session_id: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    student_id: { type: Schema.Types.ObjectId, ref: "TeacherStudent", required: true },
    status: { type: String, enum: ["present", "absent"], default: "present" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

AttendanceRecordSchema.index({ session_id: 1 });
AttendanceRecordSchema.index({ student_id: 1 });
AttendanceRecordSchema.index({ session_id: 1, student_id: 1 }, { unique: true });

export const AttendanceRecord: Model<IAttendanceRecord> =
  models.AttendanceRecord || model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema, "attendance_records");
