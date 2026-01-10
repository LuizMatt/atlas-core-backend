import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/config';
import { User } from '../models/User';

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_ISS = process.env.JWT_ISS;
const JWT_AUD = process.env.JWT_AUD;

export class UserService {
  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private signToken(payload: { id: number; email: string; role: string }): string {
    const opts: any = { expiresIn: JWT_EXPIRES_IN };
    if (JWT_ISS) opts.issuer = JWT_ISS;
    if (JWT_AUD) opts.audience = JWT_AUD;
    return jwt.sign(payload, JWT_SECRET, opts);
  }

  async createUser({ name, email, password, role }: { 
    name: string; 
    email: string; 
    password: string; 
    role?: 'client' | 'admin' 
  }): Promise<User> {
    const normEmail = this.normalizeEmail(email);

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normEmail]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, role, created_at
    `, [name, normEmail, password_hash, role || 'client']);

    return new User({
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      password_hash,
      role: result.rows[0].role,
      created_at: result.rows[0].created_at
    });
  }

  async loginUser({ email, password }: { email: string; password: string }): Promise<{ token: string; user: any }> {
    const normEmail = this.normalizeEmail(email);

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normEmail]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const userData = result.rows[0];
    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
      throw new Error('Invalid password');
    }

    const token = this.signToken({ 
      id: userData.id, 
      email: userData.email, 
      role: userData.role 
    });

    const user = new User(userData);
    return { token, user: user.toJSON() };
  }

  async getAllUsers(): Promise<any[]> {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY id ASC
    `);

    return result.rows;
  }

  async getUserById(id: number): Promise<any> {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  async updateUser(id: number, { name, email, password, role }: { 
    name?: string; 
    email?: string; 
    password?: string; 
    role?: 'client' | 'admin' 
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email !== undefined) {
      const normEmail = this.normalizeEmail(email);
      
      // Verificar se email já existe em outro usuário
      const existing = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', 
        [normEmail, id]
      );
      if (existing.rows.length > 0) {
        throw new Error('Email already registered');
      }

      fields.push(`email = $${paramCount++}`);
      values.push(normEmail);
    }

    if (role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, created_at
    `, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  async deleteUser(id: number): Promise<void> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('User not found');
    }
  }
}