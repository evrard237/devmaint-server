import express from 'express';
import { createPreventiveMaintenance, getPreventiveMaintenancesForDevice, getAllPreventiveReports, invalidatePreventiveReport, exportPreventiveReports } from '../controllers/preventiveController.js';
import { protect } from '../controllers/auth.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();
router.use(protect);

router.get('/', accessPermission(["admin", "user", "technician"]), getAllPreventiveReports);
router.get('/export', accessPermission(["admin", "user", "technician"]), exportPreventiveReports); // --- ADD EXPORT ROUTE ---
router.post('/create', accessPermission(["admin", "technician"]), createPreventiveMaintenance);
router.get('/device/:deviceId', accessPermission(["admin", "user", "technician"]), getPreventiveMaintenancesForDevice);
router.patch('/invalidate/:reportId', accessPermission(["admin"]), invalidatePreventiveReport); // --- ADD INVALIDATE ROUTE ---

export default router;