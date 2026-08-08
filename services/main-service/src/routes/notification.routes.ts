import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.listMyNotifications);
router.post("/:id/read", notificationController.markNotificationRead);
router.post("/read-all", notificationController.markAllNotificationsRead);

export default router;
