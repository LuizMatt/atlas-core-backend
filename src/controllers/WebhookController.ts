import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';

export class WebhookController {
    private service: PaymentService;

    constructor() {
        this.service = new PaymentService();
    }

    handleAbacatePay = async (req: Request, res: Response): Promise<void> => {
        try {
            const signature = req.headers['x-abacatepay-signature'] as string | undefined;
            const rawBody = (req as any).rawBody || JSON.stringify(req.body);
            
            await this.service.handleWebhook(signature, rawBody, req.body);
            
            res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error handling AbacatePay webhook:', error);
            if (error.message === 'Invalid signature') {
                res.status(401).json({ error: 'Invalid signature' });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
