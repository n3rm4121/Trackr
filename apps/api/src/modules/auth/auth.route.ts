import { Router, type Request, type Response } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
const router: Router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// requires auth
router.get("/me", requireAuth, authController.getCurrentUser);
router.patch("/password", requireAuth, authController.changePassword);

export { router as authRouter };
