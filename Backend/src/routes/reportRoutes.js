import express from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { teamGuard } from '../middleware/teamGuard.js';
import { getTaskStats, getDeadlines, getCompletion,} from '../controllers/reportController.js';

const router = express.Router();

router.get('/teams/:teamId/reports/tasks-per-member', authGuard, teamGuard, getTaskStats);
router.get('/teams/:teamId/reports/near-deadlines', authGuard, teamGuard, getDeadlines);
router.get('/teams/:teamId/reports/completion-percent', authGuard, teamGuard, getCompletion);

export default router;
