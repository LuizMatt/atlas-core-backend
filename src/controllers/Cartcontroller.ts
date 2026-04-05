import { Request, Response } from 'express';
import { CartService } from '../services/CartService';

export class CartController {
    private service: CartService;

    constructor() {
        this.service = new CartService();
    }

    get = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, customer_id } = req.query;

            if (!store_id || !customer_id) {
                res.status(400).json({ error: 'store_id and customer_id are required' });
                return;
            }

            const cart = await this.service.getCart(customer_id as string, store_id as string);

            res.status(200).json({
                id: cart.id,
                store_id: cart.store_id,
                customer_id: cart.customer_id,
                items: cart.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal
                })),
                total: cart.total,
                item_count: cart.itemCount
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
            const { store_id, customer_id, product_id, quantity } = req.body;

            if (!store_id || !customer_id || !product_id || quantity === undefined) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const cart = await this.service.addItem({ store_id, customer_id, product_id, quantity });

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
                item_count: cart.itemCount
            });
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message === 'Insufficient stock') {
                res.status(422).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updateItem = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, customer_id, product_id, quantity } = req.body;

            if (!store_id || !customer_id || !product_id || quantity === undefined) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const cart = await this.service.updateItem({ store_id, customer_id, product_id, quantity });

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
                item_count: cart.itemCount
            });
        } catch (error: any) {
            if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message === 'Insufficient stock') {
                res.status(422).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    removeItem = async (req: Request, res: Response): Promise<void> => {
        try {
            const { product_id } = req.params;
            const { store_id, customer_id } = req.query;

            if (!store_id || !customer_id) {
                res.status(400).json({ error: 'store_id and customer_id are required' });
                return;
            }

            const cart = await this.service.removeItem(customer_id as string, store_id as string, product_id);

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
                item_count: cart.itemCount
            });
        } catch (error: any) {
            if (error.message === 'Cart not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    clear = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, customer_id } = req.query;

            if (!store_id || !customer_id) {
                res.status(400).json({ error: 'store_id and customer_id are required' });
                return;
            }

            await this.service.clearCart(customer_id as string, store_id as string);

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}