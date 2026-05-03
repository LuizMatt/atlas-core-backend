import { Router } from 'express';
import { CartController } from '../controllers/Cartcontroller';
import { authMiddleware } from '../middlewares/authMiddleware';
 
const router = Router();
const controller = new CartController();
 
router.use('/cart', authMiddleware);

router.get('/cart', controller.get);
router.post('/cart/items', controller.addItem);
router.put('/cart/items', controller.updateItem);
router.delete('/cart/items/:product_id', controller.removeItem);
router.delete('/cart', controller.clear);
 
export default router;
 