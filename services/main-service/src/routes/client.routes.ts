import { Router } from "express";
import { AccountRole } from "@prisma/client";
import * as clientController from "../controllers/client.controller";
import * as jobPostingController from "../controllers/jobPosting.controller";
import * as teamController from "../controllers/team.controller";
import * as billingController from "../controllers/billing.controller";
import { authenticate, requireRole } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { updateClientSettingsSchema, createApiKeySchema, createJobPostingSchema, updateJobPostingSchema } from "../validators/resume.validators";
import { inviteTeamMemberSchema } from "../validators/team.validators";

const router = Router();

router.use(authenticate, requireRole(AccountRole.CLIENT_OWNER, AccountRole.CLIENT_MEMBER));

router.get("/profile", clientController.getClientProfile);
router.patch("/settings", validate(updateClientSettingsSchema), clientController.updateClientSettings);
router.get("/usage", clientController.getUsageStats);
router.post("/api-keys", validate(createApiKeySchema), clientController.createApiKey);
router.delete("/api-keys/:id", clientController.revokeApiKey);

// Job postings + candidate ranking (Greenhouse-style middleman feature)
router.post("/job-postings", validate(createJobPostingSchema), jobPostingController.createJobPosting);
router.get("/job-postings", jobPostingController.listJobPostings);
router.get("/job-postings/:id", jobPostingController.getJobPostingDetail);
router.patch("/job-postings/:id", validate(updateJobPostingSchema), jobPostingController.updateJobPosting);
router.delete("/job-postings/:id", jobPostingController.deleteJobPosting);
router.post("/job-postings/:id/compute-matches", jobPostingController.computeMatches);

// Team management — inviting teammates into this client workspace
router.get("/team", teamController.listTeam);
router.post("/team/invite", requireRole(AccountRole.CLIENT_OWNER), validate(inviteTeamMemberSchema), teamController.inviteTeamMember);
router.delete("/team/invites/:id", requireRole(AccountRole.CLIENT_OWNER), teamController.revokeInvite);

// Billing — Stripe when configured, manual/admin-assisted fallback otherwise
router.get("/billing", billingController.getBillingInfo);
router.post("/billing/checkout", requireRole(AccountRole.CLIENT_OWNER), billingController.startCheckout);

export default router;
