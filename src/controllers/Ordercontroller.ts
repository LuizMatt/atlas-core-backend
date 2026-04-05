import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus, PaymentStatus } from '../models/Order';

export class OrderController {
    private service: OrderService;

    constructor() {
        this.service = new OrderService();
    }

    createFromCart = async (req: Request, res: Response): Promise<void> => {
        try {
            const { customer_id, cart_id, address, notes } = req.body;

            if (!customer_id || !cart_id) {
                res.status(400).json({ error: 'customer_id and cart_id are required' });
                return;
            }

            const order = await this.service.createFromCart({ customer_id, cart_id, address, notes });

            res.status(201).json({
                id: order.id,
                customer_id: order.customer_id,
                status: order.status,
                payment_status: order.payment_status,
                items: order.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                address: order.address,
                total: order.total,
                notes: order.notes,
                created_at: order.created_at
            });
        } catch (error: any) {
            const notFound = ['Customer not found', 'Cart not found'];
            if (notFound.includes(error.message)) {
                res.status(404).json({ error: error.message });
                return;
            }
            const conflict = [
                'Cart is not active',
                'Cart is empty',
                'Insufficient stock',
                'Cart does not belong to this customer'
            ];
            if (conflict.some(msg => error.message.startsWith(msg))) {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const order = await this.service.getOrderById(id);

            res.status(200).json({
                id: order.id,
                customer_id: order.customer_id,
                status: order.status,
                payment_status: order.payment_status,
                items: order.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                address: order.address,
                total: order.total,
                notes: order.notes,
                created_at: order.created_at,
                updated_at: order.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updateStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                res.status(400).json({ error: 'status is required' });
                return;
            }

            if (!Object.values(OrderStatus).includes(status)) {
                res.status(400).json({ error: 'Invalid status value' });
                return;
            }

            const order = await this.service.updateStatus(id, status as OrderStatus);

            res.status(200).json({
                id: order.id,
                status: order.status,
                payment_status: order.payment_status,
                updated_at: order.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { payment_status } = req.body;

            if (!payment_status) {
                res.status(400).json({ error: 'payment_status is required' });
                return;
            }

            if (!Object.values(PaymentStatus).includes(payment_status)) {
                res.status(400).json({ error: 'Invalid payment_status value' });
                return;
            }

            const order = await this.service.updatePaymentStatus(id, payment_status as PaymentStatus);

            res.status(200).json({
                id: order.id,
                status: order.status,
                payment_status: order.payment_status,
                updated_at: order.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    cancel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const order = await this.service.cancelOrder(id);

            res.status(200).json({
                id: order.id,
                status: order.status,
                updated_at: order.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message.includes('Cannot cancel')) {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    listByCustomer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { customer_id, page = '1', limit = '50' } = req.query;

            if (!customer_id) {
                res.status(400).json({ error: 'customer_id is required' });
                return;
            }

            const orders = await this.service.listByCustomer(
                customer_id as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                data: orders.map(order => ({
                    id: order.id,
                    customer_id: order.customer_id,
                    status: order.status,
                    payment_status: order.payment_status,
                    total: order.total,
                    created_at: order.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    listAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const { page = '1', limit = '50' } = req.query;

            const orders = await this.service.listAll(
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                data: orders.map(order => ({
                    id: order.id,
                    customer_id: order.customer_id,
                    status: order.status,
                    payment_status: order.payment_status,
                    total: order.total,
                    created_at: order.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}