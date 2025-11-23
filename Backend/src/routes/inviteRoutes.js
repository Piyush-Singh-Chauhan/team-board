import express from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { teamGuard } from '../middleware/teamGuard.js';
import { validate } from '../middleware/validate.js';
import { sendTeamInvite, getMyInvites, respondToInvite } from '../controllers/inviteController.js';

const router = express.Router();

const sendInviteSchema = z.object({
  body: z.object({
    inviteeId: z.string().min(1, 'Invitee is required'),
    role: z.enum(['owner', 'admin', 'member']).optional(),
  }),
});

const respondInviteSchema = z.object({
  params: z.object({
    inviteId: z.string().min(1, 'Invite ID is required'),
  }),
  body: z.object({
    action: z.enum(['accept', 'decline']),
  }),
});

router.post(
  '/teams/:teamId/invitations',
  authGuard,
  teamGuard,
  validate(sendInviteSchema),
  sendTeamInvite
);

router.get('/invitations',  authGuard, getMyInvites);

router.patch(
  '/invitations/:inviteId',
  authGuard,
  validate(respondInviteSchema),
  respondToInvite
);

export default router;


