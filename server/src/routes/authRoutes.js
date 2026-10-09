import { Router } from 'express';
import { login, getCurrentUser, logout, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;
