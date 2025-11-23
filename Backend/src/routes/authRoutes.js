import express from 'express';
import { z } from 'zod';
import { register, verifyCode, resendCode, login, forgotPassword, resendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string()
          .min(2, 'Name must be at least 2 characters')
          .max(50, 'Name cannot exceed 50 characters'),
    email: z.string()
          .email('Invalid email format'),
    password: z.string()
              .min(6, 'Password must be at least 6 characters'),
  }),
});

const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string()
          .email('Invalid email format'),
    password: z.string()
              .min(6, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
  }),
});

const verifyForgotPasswordOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string()
              .min(6, 'Password must be at least 6 characters')
              .max(15, 'Password cannot exceed 15 characters'),
  }),
});

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOTPSchema), verifyCode);
router.post('/resend-otp',  validate(resendOTPSchema), resendCode);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/resend-forgot-password-otp', authRateLimiter, validate(forgotPasswordSchema), resendForgotPasswordOTP);
router.post('/verify-forgot-password-otp', validate(verifyForgotPasswordOTPSchema), verifyForgotPasswordOTP);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
