import { Router, Request, Response, NextFunction } from "express";
import { savedJobController } from "../controllers/savedJob.controller";
import { authenticate } from "../middleware/auth.middleware";
import { AuthRequest } from "../types";

const requireCandidate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "CANDIDATE") {
    res.status(403).json({
      success: false,
      message: "Access denied. Candidates only.",
      data: null,
    });
    return;
  }
  next();
};

const router: Router = Router();

router.get("/", authenticate, requireCandidate, savedJobController.getSavedJobs);
router.get("/check/:jobId", authenticate, requireCandidate, savedJobController.checkSavedJob);
router.post("/:jobId", authenticate, requireCandidate, savedJobController.saveJob);
router.delete("/:jobId", authenticate, requireCandidate, savedJobController.unsaveJob);

export default router;
