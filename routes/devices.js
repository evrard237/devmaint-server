import express from 'express';
import {
    createDevice,
    deleteDevice,
    getDevice,
    getDevices,
    getDevicesPerDept,
    updateDevice
} from '../controllers/device.js';
import { protect } from '../controllers/auth.js';
import { accessPermission } from '../permissions/user.js';
import { uploadDeviceFiles } from '../middleware/s3Upload.js';

const router = express.Router();

// This middleware ensures all routes below require the user to be logged in.
router.use(protect);

// Routes for getting device information
router.get('/', accessPermission(["admin", "user", "technician"]), getDevices);
router.get('/:id', accessPermission(["admin", "user", "technician"]), getDevice);
router.get('/specific/:id', accessPermission(["admin", "guest"]), getDevicesPerDept);

// Route for deleting a device (restricted to admin)
router.delete('/:id', accessPermission(["admin"]), deleteDevice);

// Routes that handle file uploads
// The 'uploadDeviceFiles' middleware runs first to process the files,
// then passes control to the corresponding controller function.
router.post('/create', accessPermission(["admin", "user"]), uploadDeviceFiles, createDevice);
router.patch('/update/:id', accessPermission(["admin", "user"]), uploadDeviceFiles, updateDevice);

export default router;