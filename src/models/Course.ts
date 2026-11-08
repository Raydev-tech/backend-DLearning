
import mongoose, { Schema, Document } from "mongoose";

export interface CourseLesson {
  title: string;
  description?: string;
  videoUrl?: string;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  image: string;
  imagePublicId: string;
  instructor: string;
  duration: string;
  lessons: CourseLesson[];
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
      trim: true,
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
    imagePublicId: {
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
          trim: true,
        },
        description: {
          type: String,
          default: "",
        },
        videoUrl: {
          type: String,
          default: "",
        },
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
