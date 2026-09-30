import { Router } from "express";

import { ApplicationController } from "./application.controller.js";
import { ApplicationService } from "./application.service.js";
import { ApplicationRepository } from "./application.repository.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

const applicationController = new ApplicationController(
  new ApplicationService(new ApplicationRepository()),
);

router.get("/", applicationController.list);
router.post("/", applicationController.create);

router.post("/reorder", applicationController.reorder);

router.get("/:id", applicationController.get);
router.patch("/:id", applicationController.update);
router.delete("/:id", applicationController.remove);

router.post("/:id/notes", applicationController.addNote);
router.delete("/:id/notes/:noteId", applicationController.removeNote);

export default router;
