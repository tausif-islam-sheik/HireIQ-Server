import { Router } from "express";
import { resumeController } from "../controllers/resume.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCandidate } from "../middleware/role.middleware";
import { upload } from "../services/upload.service";

const router = Router();

// File upload endpoint
router.post("/upload", authenticate, requireCandidate, upload.single("file"), resumeController.upload);

// Keep existing endpoint for backwards compatibility
router.post("/", authenticate, requireCandidate, resumeController.upload);
router.get("/my", authenticate, requireCandidate, resumeController.getMyResume);
router.delete("/", authenticate, requireCandidate, resumeController.delete);

export default router;
