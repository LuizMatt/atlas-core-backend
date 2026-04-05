import { Router } from 'express';
import { CartController } from '../controllers/Cartcontroller';
import { validateCustomerStore } from '../middlewares/validateCustomerStore';
 
const router = Router();
const controller = new CartController();
 
router.get('/cart', validateCustomerStore, controller.get);
router.post('/cart/items', validateCustomerStore, controller.addItem);
router.put('/cart/items', validateCustomerStore, controller.updateItem);
router.delete('/cart/items/:product_id', validateCustomerStore, controller.removeItem);
router.delete('/cart', validateCustomerStore, controller.clear);
 
export default router;
 