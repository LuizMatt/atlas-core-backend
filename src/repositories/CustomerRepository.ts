import { pool } from '../config/config';
import { Customer, CustomerStatus } from '../models/Costumer';

export class CustomerRepository {
    async create(customer: Customer): Promise<Customer> {
        const query = `
            INSERT INTO customers (id, store_id, name, tax_id, email, phone, password_hash, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const values = [
            customer.id,
            customer.store_id,
            customer.name,
            customer.taxId,
            customer.email,
            customer.phone,
            customer.password_hash,
            customer.status,
            customer.created_at,
            customer.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToCustomer(result.rows[0]);
    }

    async findById(id: string, store_id: string): Promise<Customer | null> {
        const query = `
            SELECT * FROM customers 
            WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL
        `;
        
        const result = await pool.query(query, [id, store_id]);
        return result.rows[0] ? this.mapToCustomer(result.rows[0]) : null;
    }

    async findByEmail(email: string, store_id: string): Promise<Customer | null> {
        const query = `
            SELECT * FROM customers 
            WHERE LOWER(email) = LOWER($1) AND store_id = $2 AND deleted_at IS NULL
        `;
        
        const result = await pool.query(query, [email, store_id]);
        return result.rows[0] ? this.mapToCustomer(result.rows[0]) : null;
    }

    async update(customer: Customer): Promise<Customer> {
        const query = `
            UPDATE customers 
            SET name = $1, tax_id = $2, email = $3, phone = $4, 
                password_hash = $5, status = $6, updated_at = $7
            WHERE id = $8 AND store_id = $9 AND deleted_at IS NULL
            RETURNING *
        `;
        
        const values = [
            customer.name,
            customer.taxId,
            customer.email,
            customer.phone,
            customer.password_hash,
            customer.status,
            customer.updated_at,
            customer.id,
            customer.store_id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Customer not found');
        }
        return this.mapToCustomer(result.rows[0]);
    }

    async softDelete(id: string, store_id: string): Promise<void> {
        const query = `
            UPDATE customers 
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND store_id = $2
        `;
        
        await pool.query(query, [id, store_id]);
    }

    async findAll(store_id: string, limit: number = 50, offset: number = 0): Promise<Customer[]> {
        const query = `
            SELECT * FROM customers 
            WHERE store_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [store_id, limit, offset]);
        return result.rows.map(row => this.mapToCustomer(row));
    }

    private mapToCustomer(row: any): Customer {
        return new Customer(
            row.id,
            row.store_id,
            row.name,
            row.tax_id,
            row.email,
            row.phone,
            row.password_hash,
            row.status as CustomerStatus,
            row.created_at,
            row.updated_at,
            row.deleted_at
        );
    }
}
