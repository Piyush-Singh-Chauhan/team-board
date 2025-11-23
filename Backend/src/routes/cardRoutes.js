import express from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard.js';
import { teamGuard } from '../middleware/teamGuard.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  addCard,
  editCard,
  removeCard,
} from '../controllers/cardController.js';

const router = express.Router();

const createCardSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Please enter the title').max(50),
    description: z.string().max(200).optional().or(z.literal('')),
    columnId: z.enum(['todo', 'in-progress', 'done']).optional(),
    assignedTo: z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val))
      .refine((val) => !val || /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'Invalid assignedTo ID format',
      }),
    dueDate: z.string().optional().or(z.literal('')),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(50).optional(),
    description: z.string().max(200).optional().or(z.literal('')),
    columnId: z.enum(['todo', 'in-progress', 'done']).optional(),
    assignedTo: z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val))
      .refine((val) => !val || /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'Invalid assignedTo ID format',
      }),
    dueDate: z.string().optional().nullable().or(z.literal('')),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['todo', 'in-progress', 'done']).optional(),
  }),
});

router.post('/boards/:boardId/cards',  authGuard, teamGuard, validate(createCardSchema), addCard);
router.put('/cards/:cardId',  authGuard, teamGuard, validate(updateCardSchema), editCard);
router.delete('/cards/:cardId',  authGuard, teamGuard, removeCard);

export default router;
