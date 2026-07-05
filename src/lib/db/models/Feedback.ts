import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  user_info?: string;
  content: string;
  feature_request: boolean;
  status: "new" | "reviewed" | "in_progress" | "done";
  created_at: Date;
  updated_at: Date;
}

const FeedbackSchema: Schema<IFeedback> = new Schema(
  {
    user_info: { type: String, required: false },
    content: { type: String, required: true },
    feature_request: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["new", "reviewed", "in_progress", "done"],
      default: "new",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Tránh lỗi overwrite model khi Next.js hot reload
export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
