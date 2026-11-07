
import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  image: string;
  instructor: string;
  duration: string;
  lessons: {
    title: string;
    description?: string;
    videoUrl?: string;
  }[];
  isPublished: boolean;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    image: {
      type: String,
      default: "",
    },
    instructor: {
      type: String,
      default: "Decent Learning",
    },
    duration: {
      type: String,
      default: "Self-paced",
    },
    lessons: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        videoUrl: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>("Course", courseSchema);
