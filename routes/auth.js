import express from "express";
import { 
    signup, 
    login, 
    logout, 
    protect, 
    forgotPassword, 
    passwordResert, 
    updatePassword 
} from "../controllers/auth.js";
import loginLimiter from "../utils/loginLimiter.js";

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/forgotpass', forgotPassword);
router.patch('/resetpassword', passwordResert);

// Logout route
router.post('/logout', logout);

// Protected routes (require a valid JWT token)
router.patch('/updatepassword', protect, updatePassword);

export default router;