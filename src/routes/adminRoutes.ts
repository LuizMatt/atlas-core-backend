import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';

const router = Router();
const controller = new AdminController();

// All admin routes require authentication
router.use('/admin/admins', adminAuthMiddleware);

router.post('/admin/admins', controller.create);
router.get('/admin/admins', controller.list);
router.get('/admin/admins/:id', controller.getById);
router.put('/admin/admins/:id', controller.update);
router.delete('/admin/admins/:id', controller.delete);

export default router;
