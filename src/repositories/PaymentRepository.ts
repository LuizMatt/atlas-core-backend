import { pool } from '../config/config';
import { Payment, PaymentStatus, PaymentMethod } from '../models/Payment';

export class PaymentRepository {
    async create(payment: Payment): Promise<Payment> {
        const query = `
            INSERT INTO payments (
                id, order_id, gateway, gateway_payment_id, amount, currency, 
                status, payment_method, gateway_metadata, pix_br_code, 
                pix_br_code_base64, pix_expires_at, paid_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;

        const values = [
            payment.id,
            payment.order_id,
            payment.gateway,
            payment.gateway_payment_id,
            payment.amount,
            payment.currency,
            payment.status,
            payment.payment_method,
            payment.gateway_metadata ? JSON.stringify(payment.gateway_metadata) : null,
            payment.pix_br_code ?? null,
            payment.pix_br_code_base64 ?? null,
            payment.pix_expires_at ?? null,
            payment.paid_at ?? null,
            payment.created_at,
            payment.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToPayment(result.rows[0]);
    }

    async findById(id: string): Promise<Payment | null> {
        const query = `SELECT * FROM payments WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] ? this.mapToPayment(result.rows[0]) : null;
    }

    async findByOrderId(orderId: string): Promise<Payment | null> {
        const query = `SELECT * FROM payments WHERE order_id = $1`;
        const result = await pool.query(query, [orderId]);
        return result.rows[0] ? this.mapToPayment(result.rows[0]) : null;
    }

    async findByGatewayId(gatewayPaymentId: string): Promise<Payment | null> {
        const query = `SELECT * FROM payments WHERE gateway_payment_id = $1`;
        const result = await pool.query(query, [gatewayPaymentId]);
        return result.rows[0] ? this.mapToPayment(result.rows[0]) : null;
    }

    async update(payment: Payment): Promise<Payment> {
        const query = `
            UPDATE payments 
            SET status = $1, gateway_metadata = $2, paid_at = $3, updated_at = $4
            WHERE id = $5
            RETURNING *
        `;

        const values = [
            payment.status,
            payment.gateway_metadata ? JSON.stringify(payment.gateway_metadata) : null,
            payment.paid_at ?? null,
            payment.updated_at,
            payment.id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Payment not found');
        }
        return this.mapToPayment(result.rows[0]);
    }

    private mapToPayment(row: any): Payment {
        return new Payment(
            row.id,
            row.order_id,
            row.gateway,
            row.gateway_payment_id,
            row.amount,
            row.currency,
            row.status as PaymentStatus,
            row.payment_method as PaymentMethod,
            row.created_at,
            row.updated_at,
            row.gateway_metadata,
            row.pix_br_code,
            row.pix_br_code_base64,
            row.pix_expires_at ? new Date(row.pix_expires_at) : undefined,
            row.paid_at ? new Date(row.paid_at) : null
        );
    }
}
