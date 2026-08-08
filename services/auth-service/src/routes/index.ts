import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, service: "auth-service", status: "healthy" }));
router.use("/", authRoutes);

export default router;
