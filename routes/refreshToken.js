import express from 'express';
import { handleRefreshToken } from '../controllers/refreshTokenController.js';

const router = express.Router();

// This route is the only one that doesn't use the global 'protect' middleware.
// Its security comes from verifying the httpOnly cookie inside its own controller.
router.get('/', handleRefreshToken);

export default router;