import express from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/', authRateLimiter, authGuard, getAllUsers);

export default router;


