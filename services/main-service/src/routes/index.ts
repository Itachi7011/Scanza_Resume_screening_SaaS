import { Router } from "express";
import resumeRoutes from "./resume.routes";
import publicApiRoutes from "./publicApi.routes";
import clientRoutes from "./client.routes";
import adminRoutes from "./admin.routes";
import skillsRoutes from "./skills.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, service: "main-service", status: "healthy" }));

router.use("/resumes", resumeRoutes);
router.use("/v1", publicApiRoutes); // public SaaS API, e.g. /api/app/v1/resumes (X-API-Key protected)
router.use("/client", clientRoutes);
router.use("/admin", adminRoutes);
router.use("/skills", skillsRoutes);
router.use("/notifications", notificationRoutes);

export default router;
