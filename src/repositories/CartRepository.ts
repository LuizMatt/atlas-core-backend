import { pool } from '../config/config';
import { Cart, CartItem, CartStatus } from '../models/Cart';
import { UUID } from 'crypto';

export class CartRepository {
    async create(cart: Cart): Promise<Cart> {
        const query = `
            INSERT INTO carts (id, customer_id, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            cart.id,
            cart.customer_id,
            cart.status,
            cart.created_at,
            cart.updated_at
        ];

        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new Cart(
            row.id,
            row.customer_id,
            row.status as CartStatus,
            [],
            row.created_at,
            row.updated_at,
            row.deleted_at
        );
    }

    async findById(id: string): Promise<Cart | null> {
        const cartResult = await pool.query(
            `SELECT * FROM carts WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );

        if (!cartResult.rows[0]) return null;

        const itemsResult = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY created_at ASC`,
            [id]
        );

        const items = itemsResult.rows.map(r => this.mapToCartItem(r));
        return this.mapToCart(cartResult.rows[0], items);
    }

    async findActiveByCustomer(customer_id: string): Promise<Cart | null> {
        const cartResult = await pool.query(
            `SELECT * FROM carts WHERE customer_id = $1 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
            [customer_id]
        );

        if (!cartResult.rows[0]) return null;

        const itemsResult = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY created_at ASC`,
            [cartResult.rows[0].id]
        );

        const items = itemsResult.rows.map(r => this.mapToCartItem(r));
        return this.mapToCart(cartResult.rows[0], items);
    }

    async findByCustomer(customer_id: string): Promise<Cart[]> {
        const cartsResult = await pool.query(
            `SELECT * FROM carts WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
            [customer_id]
        );

        if (cartsResult.rows.length === 0) return [];

        const cartIds = cartsResult.rows.map(r => r.id);

        const itemsResult = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = ANY($1) ORDER BY created_at ASC`,
            [cartIds]
        );

        const itemsByCartId = new Map<string, CartItem[]>();
        for (const row of itemsResult.rows) {
            if (!itemsByCartId.has(row.cart_id)) {
                itemsByCartId.set(row.cart_id, []);
            }
            itemsByCartId.get(row.cart_id)!.push(this.mapToCartItem(row));
        }

        return cartsResult.rows.map(row =>
            this.mapToCart(row, itemsByCartId.get(row.id) ?? [])
        );
    }

    async addItem(cartId: string, item: CartItem): Promise<CartItem> {
        const query = `
            INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            item.id,
            cartId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.created_at,
            item.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToCartItem(result.rows[0]);
    }

    async updateItem(itemId: string, quantity: number): Promise<CartItem> {
        const query = `
            UPDATE cart_items
            SET quantity = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [quantity, itemId]);

        if (result.rows.length === 0) {
            throw new Error('Cart item not found');
        }

        return this.mapToCartItem(result.rows[0]);
    }

    async removeItem(itemId: string): Promise<void> {
        await pool.query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
    }

    async clearItems(cartId: string): Promise<void> {
        await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
    }

    async update(cart: Cart): Promise<Cart> {
        const query = `
            UPDATE carts
            SET status = $1, updated_at = $2
            WHERE id = $3 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, [cart.status, cart.updated_at, cart.id]);

        if (result.rows.length === 0) {
            throw new Error('Cart not found');
        }

        const itemsResult = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY created_at ASC`,
            [cart.id]
        );

        const items = itemsResult.rows.map(r => this.mapToCartItem(r));
        return this.mapToCart(result.rows[0], items);
    }

    async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE carts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [id]
        );
    }

    private mapToCart(row: any, items: CartItem[]): Cart {
        return new Cart(
            row.id,
            row.customer_id,
            row.status as CartStatus,
            items,
            row.created_at,
            row.updated_at,
            row.deleted_at
        );
    }

    private mapToCartItem(row: any): CartItem {
        return new CartItem(
            row.id,
            row.cart_id,
            row.product_id,
            row.quantity,
            parseFloat(row.unit_price),
            row.created_at,
            row.updated_at
        );
    }
}