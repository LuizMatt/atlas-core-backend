import { Router } from 'express';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { loginRateLimiter } from '../middlewares/loginRateLimiter';

const router = Router();
const controller = new AdminAuthController();

router.post('/admin/auth/login', loginRateLimiter, controller.login);
router.post('/admin/auth/logout', controller.logout);
router.get('/admin/auth/me', adminAuthMiddleware, controller.me);

export default router;
