import Notification from "../db/models/notification.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";

/**
 * @desc    Get all notifications from the database
 * @route   GET /notification
 * @access  Private
 */
export const getNotifications = asyncErrorHandler(async (req, res, next) => {
    // Correctly finds all documents from the 'Notification' collection
    // and sorts them with the newest ones first.
    const notifications = await Notification.find({}).sort({ createdAt: -1 });

    res.status(200).json(notifications);
});

/**
 * @desc    (Placeholder) Mark a notification as read
 * @route   PATCH /notification/:id/read
 * @access  Private
 */
export const markAsRead = asyncErrorHandler(async (req, res, next) => {
    // In the future, you could add logic here to update a notification's status.
    // For example: await Notification.findByIdAndUpdate(req.params.id, { status: 'read' });
    
    // For now, we will just send a success message.
    res.status(200).json({ message: "This feature can be implemented in the future." });
});

// Note: A 'createNotification' function is no longer needed in this controller
// because notifications are now created automatically by the reminder system (cron job) in your main app.js file.