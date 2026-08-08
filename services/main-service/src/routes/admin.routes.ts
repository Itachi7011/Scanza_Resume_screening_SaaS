import { Router } from "express";
import { AccountRole } from "@prisma/client";
import * as adminController from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  dateRangeQuerySchema,
  listUsersQuerySchema,
  idParamSchema,
  updatePlatformSettingsSchema,
  changeRoleSchema,
} from "../validators/admin.validators";

const router = Router();

// Every admin route requires an authenticated ADMIN or SUPER_ADMIN account.
router.use(authenticate, requireRole(AccountRole.ADMIN, AccountRole.SUPER_ADMIN));

router.get("/dashboard/overview", adminController.getDashboardOverview);
router.get("/dashboard/analytics", validate(dateRangeQuerySchema), adminController.getAnalytics);

router.get("/users", validate(listUsersQuerySchema), adminController.listUsers);
router.post("/users/:id/block", validate(idParamSchema), adminController.blockUser);
router.post("/users/:id/unblock", validate(idParamSchema), adminController.unblockUser);
router.patch("/users/:id/role", validate(idParamSchema), validate(changeRoleSchema), adminController.changeUserRole);

router.get("/clients", adminController.listClients);
router.post("/clients/:id/suspend", validate(idParamSchema), adminController.suspendClient);
router.post("/clients/:id/reactivate", validate(idParamSchema), adminController.reactivateClient);

router.get("/audit-logs", adminController.getAuditLogs);

router.get("/settings", adminController.getPlatformSettings);
router.patch("/settings", validate(updatePlatformSettingsSchema), adminController.updatePlatformSettings);

// SUPER_ADMIN-only: only the platform owner can promote/demote other admins.
router.patch(
  "/users/:id/promote-admin",
  requireRole(AccountRole.SUPER_ADMIN),
  validate(idParamSchema),
  adminController.changeUserRole
);

export default router;
