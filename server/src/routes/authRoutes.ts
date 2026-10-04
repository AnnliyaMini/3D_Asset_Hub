import { Router } from "express";
import { login, register } from "../controllers/authController.js";

const router = Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

export default router;