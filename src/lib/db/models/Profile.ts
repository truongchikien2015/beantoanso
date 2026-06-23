import { Model,  Schema, model, models, Document } from "mongoose";

export interface IProfile {
  _id: string; // maps to Supabase auth user id
  email?: string | null;
  password_hash?: string | null;
  full_name: string | null;
  gender: "male" | "female" | "other" | null;
  birth_year: number | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_score: number;
  created_at: Date;
  updated_at: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    _id: { type: String, required: true },
    email: { type: String, sparse: true, default: null },
    password_hash: { type: String, default: null },
    full_name: { type: String, default: null },
    gender: { type: String, enum: ["male", "female", "other", null], default: null },
    birth_year: { type: Number, default: null },
    avatar_url: { type: String, default: null },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    total_score: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ProfileSchema.index({ email: 1 }, { unique: true, sparse: true });

export const Profile: Model<IProfile> = models.Profile || model<IProfile>("Profile", ProfileSchema);
