import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsArticle extends Document {
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  category_id: mongoose.Types.ObjectId;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  is_published: boolean;
  author_id?: string;
  created_at: Date;
  updated_at: Date;
}

const NewsArticleSchema: Schema<INewsArticle> = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    thumbnail: { type: String },
    category_id: { type: Schema.Types.ObjectId, ref: "NewsCategory", required: true },
    meta_title: { type: String },
    meta_description: { type: String },
    keywords: [{ type: String }],
    is_published: { type: Boolean, default: false },
    author_id: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const NewsArticle: Model<INewsArticle> =
  mongoose.models.NewsArticle || mongoose.model<INewsArticle>("NewsArticle", NewsArticleSchema);
