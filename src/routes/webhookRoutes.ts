import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = Router();
const controller = new WebhookController();

router.post('/webhooks/abacatepay', controller.handleAbacatePay);

export default router;
