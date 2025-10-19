import express from 'express';
import { createCalibrationLog, getCalibrationLogsForDevice, getAllCalibrationLogs, uploadCertificate, invalidateCalibrationLog, exportCalibrationLogs } from '../controllers/calibrationController.js';
import { protect } from '../controllers/auth.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();
router.use(protect);

router.get('/', accessPermission(["admin", "user", "technician"]), getAllCalibrationLogs);
router.get('/export', accessPermission(["admin", "user", "technician"]), exportCalibrationLogs); // --- ADD EXPORT ROUTE ---
router.get('/device/:deviceId', accessPermission(["admin", "user", "technician"]), getCalibrationLogsForDevice);
router.patch('/invalidate/:logId', accessPermission(["admin"]), invalidateCalibrationLog); // --- ADD INVALIDATE ROUTE ---
router.post('/create', accessPermission(["admin", "technician"]), uploadCertificate.single('certificate'), createCalibrationLog);

export default router;