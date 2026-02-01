import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';

const router = Router();
const controller = new CustomerController();

router.post('/customers', controller.create);
router.get('/customers/:id', controller.getById);
router.put('/customers/:id', controller.update);
router.delete('/customers/:id', controller.delete);
router.get('/customers', controller.list);

export default router;
