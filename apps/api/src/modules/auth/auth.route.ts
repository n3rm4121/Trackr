import { Router, type Request, type Response } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";

export type AuthRouterDependencies = {
  /**
   * Called with the new user's id after a successful registration. The
   * applications module passes its sample-board seeder here, which keeps the
   * auth module from importing the applications module and keeps registration
   * testable without a board.
   *
   * Typed as `unknown` rather than `void` so a seeder that reports how many
   * rows it wrote can be passed straight in.
   */
  onUserCreated?: ((userId: number) => Promise<unknown>) | undefined;
};

export function createAuthRouter(
  dependencies: AuthRouterDependencies = {},
): Router {
  const router: Router = Router();
  const authController = new AuthController();
  const authService = new AuthService(new AuthRepository());

  const register = async (req: Request, res: Response) => {
    await authController.register(req, res, dependencies.onUserCreated);
  };

  router.post("/register", register);
  router.post("/login", authController.login);
  router.post("/refresh", authController.refresh);
  router.post("/logout", authController.logout);
  router.post("/forgot-password", authController.forgotPassword);
  router.post("/reset-password", authController.resetPassword);

  // requires auth
  router.get("/me", requireAuth, authController.getCurrentUser);

  return router;
}

export default createAuthRouter();
