import { Model,  Schema, model, models, Document } from "mongoose";

export interface ITopic {
  slug: string;
  label: string;
  icon: string;
  color: string;
  topic_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    icon: { type: String, default: "📚" },
    color: { type: String, default: "indigo" },
    topic_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TopicSchema.index({ is_active: 1 });

export const Topic: Model<ITopic> = models.Topic || model<ITopic>("Topic", TopicSchema);
