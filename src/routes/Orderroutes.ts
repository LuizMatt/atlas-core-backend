import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const controller = new OrderController();

router.post('/orders', controller.createFromCart);
router.get('/orders', controller.listAll);
router.get('/orders/customer', controller.listByCustomer);
router.get('/orders/:id', controller.getById);
router.patch('/orders/:id/status', controller.updateStatus);
router.patch('/orders/:id/payment-status', controller.updatePaymentStatus);
router.post('/orders/:id/cancel', controller.cancel);

export default router;