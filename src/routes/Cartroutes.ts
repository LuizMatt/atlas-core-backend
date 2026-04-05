import { Router } from 'express';
import { CartController } from '../controllers/CartController';

const router = Router();
const controller = new CartController();

router.get('/carts', controller.getOrCreate);
router.get('/carts/:id', controller.getById);
router.post('/carts/:id/items', controller.addItem);
router.put('/carts/:id/items/:itemId', controller.updateItem);
router.delete('/carts/:id/items/:itemId', controller.removeItem);
router.delete('/carts/:id/items', controller.clearCart);
router.get('/carts/customer', controller.listByCustomer);

export default router;