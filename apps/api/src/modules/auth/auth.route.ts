import { Router, type Request, type Response } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";

const router: Router = Router();
const authController = new AuthController();
const authService = new AuthService(new AuthRepository());

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// requires auth
router.get("/me", requireAuth, authController.getCurrentUser);

export default router;
