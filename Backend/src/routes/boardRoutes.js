import express from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard.js';
import { teamGuard } from '../middleware/teamGuard.js';
import { teamOwnerGuard } from '../middleware/teamOwnerGuard.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  addBoard,
  getBoards,
  getBoard,
  editBoard,
  moveCards,
  deleteBoard,
} from '../controllers/boardController.js';

const router = express.Router();

const createBoardSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Board name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
  }),
});

const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

const reorderCardsSchema = z.object({
  body: z.object({
    sourceColumnId: z.string(),
    destinationColumnId: z.string(),
    sourceIndex: z.number(),
    destinationIndex: z.number(),
    cardId: z.string(),
  }),
});

router.post('/teams/:teamId/boards',  authGuard, teamGuard, validate(createBoardSchema), addBoard);
router.get('/teams/:teamId/boards', authGuard, teamGuard, getBoards);
router.get('/boards/:boardId', authGuard, teamGuard, getBoard);
router.put('/boards/:boardId',  authGuard, teamGuard, teamOwnerGuard, validate(updateBoardSchema), editBoard);
router.delete('/boards/:boardId', authGuard, teamGuard, teamOwnerGuard, deleteBoard);
router.post('/boards/:boardId/cards/order',  authGuard, teamGuard, validate(reorderCardsSchema), moveCards);

export default router;
