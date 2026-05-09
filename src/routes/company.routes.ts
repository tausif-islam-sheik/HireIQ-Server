import { Router } from "express";
import { companyController } from "../controllers/company.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRecruiter, requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.get("/", companyController.list);
router.get("/my", authenticate, requireRecruiter, companyController.getMyCompany);
router.get("/:id", companyController.getById);
router.post("/", authenticate, requireRecruiter, companyController.create);
router.put("/:id", authenticate, requireRecruiter, companyController.update);
router.put("/:id/verify", authenticate, requireAdmin, companyController.verify);

export default router;
