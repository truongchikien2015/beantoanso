import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITeacherXpEvent {
  student_id: string;
  source: "daily_quiz" | "step_quiz" | "topic_complete";
  xp: number;
  metadata: Record<string, unknown>;
  created_at: Date;
}

const TeacherXpEventSchema = new Schema<ITeacherXpEvent>(
  {
    student_id: { type: String, required: true },
    source: { type: String, required: true, enum: ["daily_quiz", "step_quiz", "topic_complete"] },
    xp: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

TeacherXpEventSchema.index({ student_id: 1 });

export const TeacherXpEvent: Model<ITeacherXpEvent> = models.TeacherXpEvent || model<ITeacherXpEvent>("TeacherXpEvent", TeacherXpEventSchema);
