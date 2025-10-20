import { protect } from '../controllers/auth.js';
import express from "express";
import { 
    createMaintenanceCall, 
    getListMaintenanceCall, 
    getMaintenanceCallsPerUser, 
    getSingleMaintenanceCall 
} from '../controllers/maintenanceCall.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();

// This middleware ensures all routes below require the user to be logged in.
router.use(protect);

// Route for getting the list of all maintenance calls.
router.get('/', accessPermission(["admin", "user"]), getListMaintenanceCall);

// --- THIS IS THE CRITICAL FIX ---
// The specific, static route '/peruser' is now defined BEFORE the dynamic '/:id' route.
router.get("/peruser", accessPermission(["guest"]), getMaintenanceCallsPerUser);

// The dynamic '/:id' route is now second. It will only match if the path is not '/peruser'.
router.get("/:id", accessPermission(["admin", "user"]), getSingleMaintenanceCall);

// Route for creating a new maintenance call, accessible by guests.
router.post('/create', accessPermission(["guest"]), createMaintenanceCall);

export default router;