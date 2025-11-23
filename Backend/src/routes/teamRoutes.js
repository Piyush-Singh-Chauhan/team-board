import express from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard.js';
import { teamGuard } from '../middleware/teamGuard.js';
import { teamOwnerGuard } from '../middleware/teamOwnerGuard.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  addTeam,
  getTeams,
  getTeam,
  editTeam,
  deleteTeam,
} from '../controllers/teamController.js';

const router = express.Router();

const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
  }),
});

const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

router.post('/', authRateLimiter, authGuard, validate(createTeamSchema), addTeam);
router.get('/', authRateLimiter, authGuard, getTeams);
router.get('/:teamId', authGuard, teamGuard, getTeam);
router.put(
  '/:teamId',
  authRateLimiter,
  authGuard,
  teamGuard,
  teamOwnerGuard,
  validate(updateTeamSchema),
  editTeam
);
router.delete(
  '/:teamId',
  authRateLimiter,
  authGuard,
  teamGuard,
  teamOwnerGuard,
  deleteTeam
);

export default router;
