import { pool } from '../config/config';
import { Cart, CartItem } from '../models/Cart';
import { UUID } from 'crypto';

export class CartRepository {
    async findByCustomer(customer_id: string, store_id: string): Promise<Cart | null> {
        const cartQuery = `
            SELECT * FROM carts
            WHERE customer_id = $1 AND store_id = $2
        `;
        const cartResult = await pool.query(cartQuery, [customer_id, store_id]);
        if (!cartResult.rows[0]) return null;

        const items = await this.findItems(cartResult.rows[0].id);
        return this.mapToCart(cartResult.rows[0], items);
    }

    async create(cart: Cart): Promise<Cart> {
        const query = `
            INSERT INTO carts (id, store_id, customer_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [
            cart.id,
            cart.store_id,
            cart.customer_id,
            cart.created_at,
            cart.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToCart(result.rows[0], []);
    }

    async addItem(item: CartItem): Promise<CartItem> {
        const query = `
            INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            item.id,
            item.cart_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.created_at,
            item.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToCartItem(result.rows[0]);
    }

    async findItem(cart_id: string, product_id: string): Promise<CartItem | null> {
        const query = `
            SELECT * FROM cart_items
            WHERE cart_id = $1 AND product_id = $2
        `;
        const result = await pool.query(query, [cart_id, product_id]);
        return result.rows[0] ? this.mapToCartItem(result.rows[0]) : null;
    }

    async updateItem(item: CartItem): Promise<CartItem> {
        const query = `
            UPDATE cart_items
            SET quantity = $1, updated_at = $2
            WHERE id = $3
            RETURNING *
        `;
        const result = await pool.query(query, [item.quantity, item.updated_at, item.id]);
        return this.mapToCartItem(result.rows[0]);
    }

    async removeItem(cart_id: string, product_id: string): Promise<void> {
        const query = `
            DELETE FROM cart_items
            WHERE cart_id = $1 AND product_id = $2
        `;
        await pool.query(query, [cart_id, product_id]);
    }

    async clearItems(cart_id: string): Promise<void> {
        const query = `DELETE FROM cart_items WHERE cart_id = $1`;
        await pool.query(query, [cart_id]);
    }

    async delete(cart_id: string): Promise<void> {
        await this.clearItems(cart_id);
        await pool.query('DELETE FROM carts WHERE id = $1', [cart_id]);
    }

    private async findItems(cart_id: string): Promise<CartItem[]> {
        const query = `SELECT * FROM cart_items WHERE cart_id = $1`;
        const result = await pool.query(query, [cart_id]);
        return result.rows.map(row => this.mapToCartItem(row));
    }

    private mapToCart(row: any, items: CartItem[]): Cart {
        return new Cart(
            row.id,
            row.store_id,
            row.customer_id,
            items,
            row.created_at,
            row.updated_at
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