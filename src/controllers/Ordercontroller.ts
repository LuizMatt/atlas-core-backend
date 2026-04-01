import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus } from '../models/Order';

export class OrderController {
    private service: OrderService;

    constructor() {
        this.service = new OrderService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, customer_id, address } = req.body;

            if (!store_id || !customer_id || !address) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const { street, number, neighborhood, city, state, zip_code } = address;
            if (!street || !number || !neighborhood || !city || !state || !zip_code) {
                res.status(400).json({ error: 'Missing required address fields' });
                return;
            }

            const order = await this.service.createFromCart({ store_id, customer_id, address });

            res.status(201).json({
                id: order.id,
                store_id: order.store_id,
                customer_id: order.customer_id,
                status: order.status,
                total: order.total,
                items: order.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                address: order.address ? {
                    id: order.address.id,
                    street: order.address.street,
                    number: order.address.number,
                    complement: order.address.complement,
                    neighborhood: order.address.neighborhood,
                    city: order.address.city,
                    state: order.address.state,
                    zip_code: order.address.zip_code
                } : null,
                created_at: order.created_at
            });
        } catch (error: any) {
            if (error.message === 'Cart is empty') {
                res.status(422).json({ error: error.message });
                return;
            }
            if (error.message.startsWith('Insufficient stock')) {
                res.status(422).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const order = await this.service.getOrderById(id, store_id as string);

            res.status(200).json({
                id: order.id,
                store_id: order.store_id,
                customer_id: order.customer_id,
                status: order.status,
                total: order.total,
                items: order.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                address: order.address ? {
                    id: order.address.id,
                    street: order.address.street,
                    number: order.address.number,
                    complement: order.address.complement,
                    neighborhood: order.address.neighborhood,
                    city: order.address.city,
                    state: order.address.state,
                    zip_code: order.address.zip_code
                } : null,
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
            const { store_id, status } = req.body;

            if (!store_id || !status) {
                res.status(400).json({ error: 'store_id and status are required' });
                return;
            }

            if (!Object.values(OrderStatus).includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }

            const order = await this.service.updateStatus(id, store_id, status as OrderStatus);

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
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    cancel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const order = await this.service.cancelOrder(id, store_id as string);

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
            if (error.message.startsWith('Cannot cancel')) {
                res.status(422).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, customer_id, page = '1', limit = '50' } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const orders = customer_id
                ? await this.service.listByCustomer(customer_id as string, store_id as string, parseInt(page as string), parseInt(limit as string))
                : await this.service.listOrders(store_id as string, parseInt(page as string), parseInt(limit as string));

            res.status(200).json({
                data: orders.map(order => ({
                    id: order.id,
                    customer_id: order.customer_id,
                    status: order.status,
                    total: order.total,
                    item_count: order.items.length,
                    created_at: order.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            await this.service.deleteOrder(id, store_id as string);

            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}