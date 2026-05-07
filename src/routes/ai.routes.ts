import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth.middleware";
import { aiLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post("/analyze-resume", aiController.analyzeResume);
router.post("/generate-jd", aiController.generateJD);
router.post("/rank-candidates", aiController.rankCandidates);
router.post("/interview-chat", aiController.interviewChat);

export default router;
