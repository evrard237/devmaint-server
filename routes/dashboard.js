import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../controllers/auth.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();

router.use(protect);

router.get('/stats', accessPermission(["admin", "user", "technician"]), getDashboardStats);

export default router;