import { Router } from "express";
import * as publicApiController from "../controllers/publicApi.controller";
import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { resumeUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { resumeIdParamSchema, submitResumeViaApiSchema } from "../validators/resume.validators";

const router = Router();

router.use(apiKeyAuth);

router.post("/resumes", resumeUpload.single("file"), validate(submitResumeViaApiSchema), publicApiController.submitResumeViaApi);
router.get("/resumes", publicApiController.listResumesViaApi);
router.get("/resumes/:id", validate(resumeIdParamSchema), publicApiController.getResumeResultViaApi);

export default router;
