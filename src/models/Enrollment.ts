
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  completedLessons: Types.ObjectId[];
  progress: number;
  status: "active" | "completed";
  enrolledAt: Date;
  completedAt?: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

export default mongoose.model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
