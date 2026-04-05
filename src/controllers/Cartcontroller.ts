import { Request, Response } from 'express';
import { CartService } from '../services/CartService';

export class CartController {
    private service: CartService;

    constructor() {
        this.service = new CartService();
    }

    getOrCreate = async (req: Request, res: Response): Promise<void> => {
        try {
            const { customer_id } = req.query;

            if (!customer_id) {
                res.status(400).json({ error: 'customer_id is required' });
                return;
            }

            const cart = await this.service.getOrCreateCart(customer_id as string);

            res.status(200).json({
                id: cart.id,
                customer_id: cart.customer_id,
                status: cart.status,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                created_at: cart.created_at,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const cart = await this.service.getCart(id);

            res.status(200).json({
                id: cart.id,
                customer_id: cart.customer_id,
                status: cart.status,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                created_at: cart.created_at,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Cart not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    addItem = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { product_id, quantity } = req.body;

            if (!product_id || quantity === undefined) {
                res.status(400).json({ error: 'product_id and quantity are required' });
                return;
            }

            const cart = await this.service.addItem(id, { product_id, quantity });

            res.status(200).json({
                id: cart.id,
                customer_id: cart.customer_id,
                status: cart.status,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            const notFound = ['Cart not found', 'Product not found'];
            if (notFound.includes(error.message)) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message === 'Insufficient stock' || error.message === 'Cart is not active') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updateItem = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id, itemId } = req.params;
            const { quantity } = req.body;

            if (quantity === undefined) {
                res.status(400).json({ error: 'quantity is required' });
                return;
            }

            const cart = await this.service.updateItem(id, itemId, quantity);

            res.status(200).json({
                id: cart.id,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            const notFound = ['Cart not found', 'Item not found in cart', 'Product not found'];
            if (notFound.includes(error.message)) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message === 'Insufficient stock' || error.message === 'Cart is not active') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    removeItem = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id, itemId } = req.params;

            const cart = await this.service.removeItem(id, itemId);

            res.status(200).json({
                id: cart.id,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            const notFound = ['Cart not found', 'Item not found in cart'];
            if (notFound.includes(error.message)) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    clearCart = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const cart = await this.service.clearCart(id);

            res.status(200).json({
                id: cart.id,
                items: [],
                total: 0,
                updated_at: cart.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Cart not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    listByCustomer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { customer_id } = req.query;

            if (!customer_id) {
                res.status(400).json({ error: 'customer_id is required' });
                return;
            }

            const carts = await this.service.listByCustomer(customer_id as string);

            res.status(200).json({
                data: carts.map(cart => ({
                    id: cart.id,
                    customer_id: cart.customer_id,
                    status: cart.status,
                    total: cart.total,
                    created_at: cart.created_at
                }))
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}