
import { Router, Request, Response, NextFunction } from "express";

import {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController";

import { protect } from "../middleware/authMiddleware";
import upload from "../middleware/uploadMiddleware";

const router = Router();

// Instructor and admin authorization
const authorizeInstructor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userRole = res.locals.userRole;

  if (userRole !== "instructor" && userRole !== "admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Instructor or admin privileges required.",
    });
    return;
  }

  next();
};

// PUBLIC ROUTES

// Get all published courses
router.get("/", getAllCourses);

// Get a single published course
router.get("/:slug", getCourseBySlug);

// PROTECTED ROUTES

// Create a course with an optional image
router.post(
  "/",
  protect,
  authorizeInstructor,
  upload.single("image"),
  createCourse
);

// Update a course and optionally replace its image
router.put(
  "/:id",
  protect,
  authorizeInstructor,
  upload.single("image"),
  updateCourse
);

// Delete a course
router.delete(
  "/:id",
  protect,
  authorizeInstructor,
  deleteCourse
);

export default router;
