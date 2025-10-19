import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../controllers/auth.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();

// Protect all routes in this file (user must be logged in)
router.use(protect);

// Route to get all notifications
router.get('/', accessPermission(["admin", "user", "technician"]), getNotifications);

// Placeholder route for marking a notification as read
router.patch('/:id/read', accessPermission(["admin", "user", "technician"]), markAsRead);

export default router;