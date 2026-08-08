import { Router } from "express";
import * as skillsController from "../controllers/skills.controller";

const router = Router();

router.get("/", skillsController.getSkillTaxonomy);

export default router;
