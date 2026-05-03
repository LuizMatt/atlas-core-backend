import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AuthController();

router.post('/auth/register', controller.register);
router.post('/auth/login', controller.login);
router.post('/auth/logout', controller.logout);
router.get('/auth/me', authMiddleware, controller.me);

export default router;
