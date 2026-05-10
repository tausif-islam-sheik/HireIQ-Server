import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router: Router = Router();

router.get("/", authenticate, requireAdmin, userController.list);
router.get("/profile", authenticate, userController.getProfile);
router.get("/notifications", authenticate, userController.getNotifications);
router.put("/notifications/read", authenticate, userController.markNotificationsRead);
router.get("/dashboard-stats", authenticate, userController.getDashboardStats);
router.get("/:id", authenticate, userController.getById);
router.put("/profile", authenticate, userController.updateProfile);
router.put("/change-password", authenticate, userController.changePassword);
router.put("/:id/status", authenticate, requireAdmin, userController.toggleStatus);

export default router;
