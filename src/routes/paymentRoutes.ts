import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const controller = new PaymentController();

router.post('/payments/create', authMiddleware, controller.create);
router.get('/payments/:id', authMiddleware, controller.getById);
router.get('/payments/order/:orderId', authMiddleware, controller.getByOrder);
router.post('/payments/:id/check', authMiddleware, controller.checkStatus);

export default router;
