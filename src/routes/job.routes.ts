import { Router } from "express";
import { jobController } from "../controllers/job.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRecruiter, requireRecruiterOrAdmin } from "../middleware/role.middleware";

const router = Router();

router.get("/", jobController.list);
router.get("/categories", jobController.getCategories);
router.get("/stats", jobController.getStats);
router.get("/:id", jobController.getById);
router.post("/", authenticate, requireRecruiter, jobController.create);
router.put("/:id", authenticate, requireRecruiter, jobController.update);
router.delete("/:id", authenticate, requireRecruiterOrAdmin, jobController.remove);

export default router;
