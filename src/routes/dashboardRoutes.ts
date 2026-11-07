
import { Router } from "express";
import { getStudentDashboard } from "../controllers/dashboardController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Protected student dashboard
router.get("/dashboard", protect, getStudentDashboard);

export default router;