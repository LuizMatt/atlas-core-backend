import { pool } from '../config/config';
import { Order, OrderItem, OrderStatus, Address } from '../models/Order';

export class OrderRepository {
    async create(order: Order, address: Address): Promise<Order> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const orderQuery = `
                INSERT INTO orders (id, store_id, customer_id, status, total, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const orderValues = [
                order.id,
                order.store_id,
                order.customer_id,
                order.status,
                order.total,
                order.created_at,
                order.updated_at
            ];
            const orderResult = await client.query(orderQuery, orderValues);

            const addressQuery = `
                INSERT INTO order_addresses (id, order_id, street, number, complement, neighborhood, city, state, zip_code, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;
            const addressValues = [
                address.id,
                address.order_id,
                address.street,
                address.number,
                address.complement ?? null,
                address.neighborhood,
                address.city,
                address.state,
                address.zip_code,
                address.created_at
            ];
            const addressResult = await client.query(addressQuery, addressValues);

            const itemQuery = `
                INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            for (const item of order.items) {
                await client.query(itemQuery, [
                    item.id,
                    item.order_id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.created_at
                ]);
            }

            await client.query('COMMIT');

            const mappedAddress = this.mapToAddress(addressResult.rows[0]);
            const mappedItems = order.items;
            return this.mapToOrder(orderResult.rows[0], mappedItems, mappedAddress);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async findById(id: string, store_id: string): Promise<Order | null> {
        const query = `
            SELECT * FROM orders
            WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id, store_id]);
        if (!result.rows[0]) return null;

        const items = await this.findItems(id);
        const address = await this.findAddress(id);
        return this.mapToOrder(result.rows[0], items, address ?? undefined);
    }

    async update(order: Order): Promise<Order> {
        const query = `
            UPDATE orders
            SET status = $1, total = $2, updated_at = $3
            WHERE id = $4 AND store_id = $5 AND deleted_at IS NULL
            RETURNING *
        `;
        const values = [
            order.status,
            order.total,
            order.updated_at,
            order.id,
            order.store_id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) throw new Error('Order not found');

        const items = await this.findItems(order.id);
        const address = await this.findAddress(order.id);
        return this.mapToOrder(result.rows[0], items, address ?? undefined);
    }

    async softDelete(id: string, store_id: string): Promise<void> {
        const query = `
            UPDATE orders
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND store_id = $2
        `;
        await pool.query(query, [id, store_id]);
    }

    async findAll(store_id: string, limit: number = 50, offset: number = 0): Promise<Order[]> {
        const query = `
            SELECT * FROM orders
            WHERE store_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(query, [store_id, limit, offset]);

        return Promise.all(result.rows.map(async row => {
            const items = await this.findItems(row.id);
            const address = await this.findAddress(row.id);
            return this.mapToOrder(row, items, address ?? undefined);
        }));
    }

    async findByCustomer(customer_id: string, store_id: string, limit: number = 50, offset: number = 0): Promise<Order[]> {
        const query = `
            SELECT * FROM orders
            WHERE customer_id = $1 AND store_id = $2 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const result = await pool.query(query, [customer_id, store_id, limit, offset]);

        return Promise.all(result.rows.map(async row => {
            const items = await this.findItems(row.id);
            const address = await this.findAddress(row.id);
            return this.mapToOrder(row, items, address ?? undefined);
        }));
    }

    private async findItems(order_id: string): Promise<OrderItem[]> {
        const query = `SELECT * FROM order_items WHERE order_id = $1`;
        const result = await pool.query(query, [order_id]);
        return result.rows.map(row => this.mapToOrderItem(row));
    }

    private async findAddress(order_id: string): Promise<Address | null> {
        const query = `SELECT * FROM order_addresses WHERE order_id = $1`;
        const result = await pool.query(query, [order_id]);
        return result.rows[0] ? this.mapToAddress(result.rows[0]) : null;
    }

    private mapToOrder(row: any, items: OrderItem[], address?: Address): Order {
        return new Order(
            row.id,
            row.store_id,
            row.customer_id,
            row.status as OrderStatus,
            parseFloat(row.total),
            items,
            row.created_at,
            row.updated_at,
            address,
            row.deleted_at
        );
    }

    private mapToOrderItem(row: any): OrderItem {
        return new OrderItem(
            row.id,
            row.order_id,
            row.product_id,
            row.quantity,
            parseFloat(row.unit_price),
            row.created_at
        );
    }

    private mapToAddress(row: any): Address {
        return new Address(
            row.id,
            row.order_id,
            row.street,
            row.number,
            row.neighborhood,
            row.city,
            row.state,
            row.zip_code,
            row.created_at,
            row.complement
        );
    }
}