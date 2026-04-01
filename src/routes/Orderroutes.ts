import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
 
const router = Router();
const controller = new OrderController();
 
router.post('/orders', controller.create);
router.get('/orders', controller.list);
router.get('/orders/:id', controller.getById);
router.patch('/orders/:id/status', controller.updateStatus);
router.patch('/orders/:id/cancel', controller.cancel);
router.delete('/orders/:id', controller.delete);
 
export default router;
 