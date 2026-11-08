
import { Router } from "express";

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

// Public routes
router.get("/", getAllCourses);
router.get("/:slug", getCourseBySlug);

// Protected instructor/admin routes
router.post(
  "/",
  protect,
  upload.single("image"),
  createCourse
);

router.put(
  "/:id",
  protect,
  upload.single("image"),
  updateCourse
);

router.delete(
  "/:id",
  protect,
  deleteCourse
);

export default router;
