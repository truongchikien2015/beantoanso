import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const NewsCategorySchema: Schema<INewsCategory> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const NewsCategory: Model<INewsCategory> =
  mongoose.models.NewsCategory || mongoose.model<INewsCategory>("NewsCategory", NewsCategorySchema);
