import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';

export class PaymentController {
    private service: PaymentService;

    constructor() {
        this.service = new PaymentService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { order_id } = req.body;
            if (!order_id) {
                res.status(400).json({ error: 'order_id is required' });
                return;
            }

            const payment = await this.service.createPixPayment(order_id);

            res.status(201).json({
                id: payment.id,
                order_id: payment.order_id,
                gateway: payment.gateway,
                gateway_payment_id: payment.gateway_payment_id,
                amount: payment.amount,
                status: payment.status,
                payment_method: payment.payment_method,
                pix_br_code: payment.pix_br_code,
                pix_br_code_base64: payment.pix_br_code_base64,
                pix_expires_at: payment.pix_expires_at,
                created_at: payment.created_at
            });
        } catch (error: any) {
            console.error('Error creating payment:', error);
            if (error.message.includes('not found') || error.message.includes('already paid') || error.message.includes('Cannot pay')) {
                res.status(422).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const paymentRepository = new (require('../repositories/PaymentRepository').PaymentRepository)();
            const payment = await paymentRepository.findById(id);

            if (!payment) {
                res.status(404).json({ error: 'Payment not found' });
                return;
            }

            res.status(200).json({
                id: payment.id,
                order_id: payment.order_id,
                gateway: payment.gateway,
                gateway_payment_id: payment.gateway_payment_id,
                amount: payment.amount,
                status: payment.status,
                payment_method: payment.payment_method,
                pix_br_code: payment.pix_br_code,
                pix_br_code_base64: payment.pix_br_code_base64,
                pix_expires_at: payment.pix_expires_at,
                paid_at: payment.paid_at,
                created_at: payment.created_at,
                updated_at: payment.updated_at
            });
        } catch (error) {
            console.error('Error fetching payment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getByOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const { orderId } = req.params;
            const paymentRepository = new (require('../repositories/PaymentRepository').PaymentRepository)();
            const payment = await paymentRepository.findByOrderId(orderId);

            if (!payment) {
                res.status(404).json({ error: 'Payment not found for this order' });
                return;
            }

            res.status(200).json({
                id: payment.id,
                order_id: payment.order_id,
                status: payment.status,
                pix_br_code: payment.pix_br_code,
                pix_br_code_base64: payment.pix_br_code_base64,
                pix_expires_at: payment.pix_expires_at,
                paid_at: payment.paid_at
            });
        } catch (error) {
            console.error('Error fetching payment by order:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    checkStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const payment = await this.service.checkPaymentStatus(id);

            res.status(200).json({
                id: payment.id,
                status: payment.status,
                paid_at: payment.paid_at,
                updated_at: payment.updated_at
            });
        } catch (error: any) {
            console.error('Error checking payment status:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
