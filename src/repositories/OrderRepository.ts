import { pool } from '../config/config';
import { Order, OrderItem, OrderAddress, OrderStatus, PaymentStatus } from '../models/Order';

export class OrderRepository {
    async create(order: Order): Promise<Order> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const orderResult = await client.query(
                `INSERT INTO orders (id, customer_id, status, payment_status, total, notes, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    order.id,
                    order.customer_id,
                    order.status,
                    order.payment_status,
                    order.total,
                    order.notes,
                    order.created_at,
                    order.updated_at
                ]
            );

            const items: OrderItem[] = [];
            for (const item of order.items) {
                const itemResult = await client.query(
                    `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING *`,
                    [item.id, order.id, item.product_id, item.quantity, item.unit_price, item.created_at]
                );
                items.push(this.mapToOrderItem(itemResult.rows[0]));
            }

            let address: OrderAddress | null = null;
            if (order.address) {
                await client.query(
                    `INSERT INTO order_addresses (order_id, street, number, complement, neighborhood, city, state, zip_code)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        order.id,
                        order.address.street,
                        order.address.number,
                        order.address.complement,
                        order.address.neighborhood,
                        order.address.city,
                        order.address.state,
                        order.address.zip_code
                    ]
                );
                address = order.address;
            }

            await client.query('COMMIT');
            return this.mapToOrder(orderResult.rows[0], items, address);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async findById(id: string): Promise<Order | null> {
        const orderResult = await pool.query(
            `SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );

        if (!orderResult.rows[0]) return null;

        const [items, address] = await Promise.all([
            this.fetchItems([id]),
            this.fetchAddresses([id])
        ]);

        return this.mapToOrder(
            orderResult.rows[0],
            items.get(id) ?? [],
            address.get(id) ?? null
        );
    }

    async update(order: Order): Promise<Order> {
        const query = `
            UPDATE orders
            SET status = $1, payment_status = $2, updated_at = $3
            WHERE id = $4 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, [
            order.status,
            order.payment_status,
            order.updated_at,
            order.id
        ]);

        if (result.rows.length === 0) {
            throw new Error('Order not found');
        }

        const [items, addresses] = await Promise.all([
            this.fetchItems([order.id]),
            this.fetchAddresses([order.id])
        ]);

        return this.mapToOrder(
            result.rows[0],
            items.get(order.id) ?? [],
            addresses.get(order.id) ?? null
        );
    }

    async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE orders SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [id]
        );
    }

    async findAll(customer_id?: string, limit: number = 50, offset: number = 0): Promise<Order[]> {
        let query = `SELECT * FROM orders WHERE deleted_at IS NULL`;
        const values: any[] = [];

        if (customer_id) {
            values.push(customer_id);
            query += ` AND customer_id = $${values.length}`;
        }

        values.push(limit, offset);
        query += ` ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

        const result = await pool.query(query, values);
        if (result.rows.length === 0) return [];

        const orderIds = result.rows.map(r => r.id);
        const [itemsMap, addressMap] = await Promise.all([
            this.fetchItems(orderIds),
            this.fetchAddresses(orderIds)
        ]);

        return result.rows.map(row =>
            this.mapToOrder(row, itemsMap.get(row.id) ?? [], addressMap.get(row.id) ?? null)
        );
    }

    async findByCustomer(customer_id: string, limit: number = 50, offset: number = 0): Promise<Order[]> {
        return this.findAll(customer_id, limit, offset);
    }

    private async fetchItems(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
        const result = await pool.query(
            `SELECT * FROM order_items WHERE order_id = ANY($1)`,
            [orderIds]
        );

        const map = new Map<string, OrderItem[]>();
        for (const row of result.rows) {
            if (!map.has(row.order_id)) map.set(row.order_id, []);
            map.get(row.order_id)!.push(this.mapToOrderItem(row));
        }
        return map;
    }

    private async fetchAddresses(orderIds: string[]): Promise<Map<string, OrderAddress>> {
        const result = await pool.query(
            `SELECT * FROM order_addresses WHERE order_id = ANY($1)`,
            [orderIds]
        );

        const map = new Map<string, OrderAddress>();
        for (const row of result.rows) {
            map.set(row.order_id, new OrderAddress(
                row.street,
                row.number,
                row.complement,
                row.neighborhood,
                row.city,
                row.state,
                row.zip_code
            ));
        }
        return map;
    }

    private mapToOrder(row: any, items: OrderItem[], address: OrderAddress | null): Order {
        return new Order(
            row.id,
            row.customer_id,
            row.status as OrderStatus,
            row.payment_status as PaymentStatus,
            items,
            address,
            parseFloat(row.total),
            row.created_at,
            row.updated_at,
            row.notes,
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
}