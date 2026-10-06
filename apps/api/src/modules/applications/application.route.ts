import { Router } from "express";
import multer from "multer";

import { ApplicationController } from "./application.controller.js";
import { ApplicationService } from "./application.service.js";
import { ApplicationRepository } from "./application.repository.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

// Memory storage: the file is base64-encoded into Postgres so downloads work
// on serverless hosts (e.g. Vercel) where local disk is ephemeral.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.use(requireAuth);

const applicationController = new ApplicationController(
  new ApplicationService(new ApplicationRepository()),
);

router.get("/columns/labels", applicationController.getColumnLabels);
router.put("/columns/labels", applicationController.updateColumnLabels);

router.get("/", applicationController.list);
router.post("/", applicationController.create);

router.post("/reorder", applicationController.reorder);

router.get("/:id", applicationController.get);
router.patch("/:id", applicationController.update);
router.delete("/:id", applicationController.remove);

router.post("/:id/cv", upload.single("cv"), applicationController.uploadCv);
router.get("/:id/cv", applicationController.downloadCv);
router.delete("/:id/cv", applicationController.deleteCv);

router.post("/:id/notes", applicationController.addNote);
router.delete("/:id/notes/:noteId", applicationController.removeNote);

export default router;
