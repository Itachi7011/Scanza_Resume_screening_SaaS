import { Router } from "express";
import * as resumeController from "../controllers/resume.controller";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate";
import { resumeUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { resumeIdParamSchema, matchJobSchema } from "../validators/resume.validators";

const router = Router();

// Public homepage upload — works logged-out (analysis only) or logged-in (saved to account).
router.post("/upload", optionalAuthenticate, resumeUpload.single("file"), resumeController.uploadResume);

router.get("/", authenticate, resumeController.getMyResumes);
router.get("/:id", authenticate, validate(resumeIdParamSchema), resumeController.getResumeById);
router.delete("/:id", authenticate, validate(resumeIdParamSchema), resumeController.deleteResume);
router.post("/:id/match-job", optionalAuthenticate, validate(resumeIdParamSchema), validate(matchJobSchema), resumeController.matchResumeAgainstJob);

export default router;
