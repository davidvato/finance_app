import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, changePassword, updateProfile } from '../controllers/authController';
import { verifyTurnstile } from '../middlewares/turnstile';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, verifyTurnstile, login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, me);
router.post('/change-password', authenticateJWT, changePassword);
router.put('/profile', authenticateJWT, updateProfile);

export default router;
