import { Model,  Schema, model, models, Document } from "mongoose";

export interface IUserProgress {
  user_id: string;
  active_path_id: string | null;
  completed_topics: string[];
  daily_challenges: Record<string, unknown>;
  updated_at: Date;
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    user_id: { type: String, required: true, unique: true },
    active_path_id: { type: String, default: null },
    completed_topics: { type: Schema.Types.Mixed, default: [] },
    daily_challenges: { type: Schema.Types.Mixed, default: {} },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const UserProgress: Model<IUserProgress> = models.UserProgress || model<IUserProgress>("UserProgress", UserProgressSchema);
