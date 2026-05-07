import { Router } from "express";
import { resumeController } from "../controllers/resume.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCandidate } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, requireCandidate, resumeController.upload);
router.get("/my", authenticate, requireCandidate, resumeController.getMyResume);
router.delete("/", authenticate, requireCandidate, resumeController.delete);

export default router;
