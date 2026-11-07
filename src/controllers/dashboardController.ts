
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Enrollment from "../models/Enrollment";

export const getStudentDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = res.locals.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid student authentication.",
      });
      return;
    }

    // Find the logged-in student
    const student = await User.findById(userId).select(
      "fullName email role profilePicture isVerified isActive createdAt"
    );

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student account not found.",
      });
      return;
    }

    if (!student.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
      return;
    }

    if (student.role !== "student") {
      res.status(403).json({
        success: false,
        message: "This dashboard is only available to students.",
      });
      return;
    }

    // Retrieve the student's enrolled courses
    const enrollments = await Enrollment.find({
      student: student._id,
    })
      .populate(
        "course",
        "title slug description category level image instructor duration lessons isPublished"
      )
      .sort({ enrolledAt: -1 });

    // Prepare course information
    const courses = enrollments
      .filter((enrollment) => enrollment.course)
      .map((enrollment) => {
        const course = enrollment.course as unknown as {
          _id: mongoose.Types.ObjectId;
          title: string;
          slug: string;
          description: string;
          category: string;
          level: string;
          image: string;
          instructor: string;
          duration: string;
          lessons: { _id: mongoose.Types.ObjectId; title: string }[];
          isPublished: boolean;
        };

        const totalLessons = course.lessons?.length || 0;

        // Only count lesson IDs that belong to this course
        const courseLessonIds = new Set(
          (course.lessons || []).map((lesson) =>
            lesson._id.toString()
          )
        );

        const completedLessons = enrollment.completedLessons.filter(
          (lessonId) => courseLessonIds.has(lessonId.toString())
        ).length;

        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          enrollmentId: enrollment._id,
          courseId: course._id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          category: course.category,
          level: course.level,
          image: course.image,
          instructor: course.instructor,
          duration: course.duration,
          totalLessons,
          completedLessons,
          progress,
          status: progress === 100 ? "completed" : "active",
          enrolledAt: enrollment.enrolledAt,
        };
      });

    // Calculate dashboard statistics
    const totalCourses = courses.length;

    const completedCourses = courses.filter(
      (course) => course.progress === 100
    ).length;

    const inProgressCourses = courses.filter(
      (course) => course.progress > 0 && course.progress < 100
    ).length;

    const totalLessonsCompleted = courses.reduce(
      (total, course) => total + course.completedLessons,
      0
    );

    const averageProgress =
      totalCourses > 0
        ? Math.round(
            courses.reduce((total, course) => total + course.progress, 0) /
              totalCourses
          )
        : 0;

    res.status(200).json({
      success: true,
      message: "Student dashboard retrieved successfully.",
      data: {
        student: {
          id: student._id,
          fullName: student.fullName,
          email: student.email,
          role: student.role,
          profilePicture: student.profilePicture,
          isVerified: student.isVerified,
          joinedAt: student.createdAt,
        },

        statistics: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalLessonsCompleted,
          averageProgress,
        },

        courses,

        // Activity tracking will be added in a later step.
        weeklyActivity: [],
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve student dashboard.",
    });
  }
};
