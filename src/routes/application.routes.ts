import { Router } from "express";
import { applicationController } from "../controllers/application.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCandidate, requireRecruiter } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, requireCandidate, applicationController.apply);
router.get("/my", authenticate, requireCandidate, applicationController.getMyApplications);
router.get("/recruiter", authenticate, requireRecruiter, applicationController.getRecruiterApplications);
router.get("/job/:jobId", authenticate, requireRecruiter, applicationController.getJobApplicants);
router.get("/stats", authenticate, applicationController.getStats);
router.put("/:id/status", authenticate, requireRecruiter, applicationController.updateStatus);
router.delete("/:id", authenticate, requireCandidate, applicationController.withdraw);

export default router;
