import { Model,  Schema, model, models, Document } from "mongoose";

export interface IResult {
  player_id: string;
  nickname: string;
  mission_score: number;
  quiz_score: number;
  total_score: number;
  title: string;
  badge: string;
  completed_at: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    player_id: { type: String, required: true },
    nickname: { type: String, required: true },
    mission_score: { type: Number, default: 0 },
    quiz_score: { type: Number, default: 0 },
    total_score: { type: Number, default: 0 },
    title: { type: String, default: "" },
    badge: { type: String, default: "" },
    completed_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ResultSchema.index({ player_id: 1 });
ResultSchema.index({ completed_at: -1 });
ResultSchema.index({ total_score: -1 });

export const Result: Model<IResult> = models.Result || model<IResult>("Result", ResultSchema);
