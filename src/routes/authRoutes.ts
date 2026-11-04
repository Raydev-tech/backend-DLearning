import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { register, login, logout, getProfile, updateProfile } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;