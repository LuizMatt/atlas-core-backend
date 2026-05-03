import { pool } from '../config/config';
import { Admin, AdminStatus } from '../models/Admin';

export class AdminRepository {
    async create(admin: Admin): Promise<Admin> {
        const query = `
            INSERT INTO admins (id, name, email, password_hash, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            admin.id,
            admin.name,
            admin.email,
            admin.password_hash,
            admin.status,
            admin.created_at,
            admin.updated_at,
        ];

        const result = await pool.query(query, values);
        return this.mapToAdmin(result.rows[0]);
    }

    async findById(id: string): Promise<Admin | null> {
        const query = `
            SELECT * FROM admins
            WHERE id = $1 AND deleted_at IS NULL
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0] ? this.mapToAdmin(result.rows[0]) : null;
    }

    async findByEmail(email: string): Promise<Admin | null> {
        const query = `
            SELECT * FROM admins
            WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
        `;

        const result = await pool.query(query, [email]);
        return result.rows[0] ? this.mapToAdmin(result.rows[0]) : null;
    }

    async update(admin: Admin): Promise<Admin> {
        const query = `
            UPDATE admins
            SET name = $1, email = $2, password_hash = $3, status = $4, updated_at = $5
            WHERE id = $6 AND deleted_at IS NULL
            RETURNING *
        `;

        const values = [
            admin.name,
            admin.email,
            admin.password_hash,
            admin.status,
            admin.updated_at,
            admin.id,
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Admin not found');
        }
        return this.mapToAdmin(result.rows[0]);
    }

    async softDelete(id: string): Promise<void> {
        const query = `
            UPDATE admins
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1
        `;

        await pool.query(query, [id]);
    }

    async findAll(limit: number = 50, offset: number = 0): Promise<Admin[]> {
        const query = `
            SELECT * FROM admins
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(query, [limit, offset]);
        return result.rows.map((row) => this.mapToAdmin(row));
    }

    private mapToAdmin(row: any): Admin {
        return new Admin(
            row.id,
            row.name,
            row.email,
            row.password_hash,
            row.status as AdminStatus,
            row.created_at,
            row.updated_at,
            row.deleted_at
        );
    }
}
