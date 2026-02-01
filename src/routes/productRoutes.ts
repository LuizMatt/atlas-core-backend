import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { uploadSingle, uploadMultiple } from '../middlewares/uploadMiddleware';

const router = Router();
const controller = new ProductController();

router.post('/products', controller.create);
router.get('/products/:id', controller.getById);
router.put('/products/:id', controller.update);
router.delete('/products/:id', controller.delete);
router.get('/products', controller.list);

router.post('/products/:id/upload-image', uploadSingle, controller.uploadImage);
router.post('/products/:id/upload-images', uploadMultiple, controller.uploadMultipleImages);

export default router;
