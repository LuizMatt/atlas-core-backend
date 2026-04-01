import { Router } from 'express';
import { CartController } from '../controllers/CartController';
 
const router = Router();
const controller = new CartController();
 
router.get('/cart', controller.get);
router.post('/cart/items', controller.addItem);
router.put('/cart/items', controller.updateItem);
router.delete('/cart/items/:product_id', controller.removeItem);
router.delete('/cart', controller.clear);
 
export default router;
 