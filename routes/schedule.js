// in /routes/schedule.js

import express from "express";
import { protect } from "../controllers/auth.js";
import { accessPermission } from "../permissions/user.js";
import { downloadSchedulePDF, generateSchedule, getSchedule } from "../controllers/scheduleController.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.post("/generate", accessPermission(["admin"]), generateSchedule);
router.get("/:year/:month", accessPermission(["admin", "user"]), getSchedule);
router.get("/download/:year/:month", accessPermission(["admin", "user"]), downloadSchedulePDF);

export default router;