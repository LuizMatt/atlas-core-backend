import { Admin, AdminStatus } from '../models/Admin';
import { AdminRepository } from '../repositories/AdminRepository';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

interface CreateAdminDTO {
    name: string;
    email: string;
    password?: string; // Optional, might be generated
}

interface UpdateAdminDTO {
    name?: string;
    email?: string;
    status?: AdminStatus;
}

export class AdminService {
    private repository: AdminRepository;

    constructor() {
        this.repository = new AdminRepository();
    }

    async createAdmin(data: CreateAdminDTO): Promise<Admin> {
        const existingAdmin = await this.repository.findByEmail(data.email);
        if (existingAdmin) {
            throw new Error('Email already registered');
        }

        const passwordToHash = data.password || randomUUID().slice(0, 10);
        const password_hash = await bcrypt.hash(passwordToHash, 10);

        const admin = new Admin(
            randomUUID(),
            data.name,
            data.email.toLowerCase().trim(),
            password_hash,
            AdminStatus.ACTIVE,
            new Date(),
            new Date(),
            null
        );

        return await this.repository.create(admin);
    }

    async getAdminById(id: string): Promise<Admin> {
        const admin = await this.repository.findById(id);
        if (!admin) {
            throw new Error('Admin not found');
        }
        return admin;
    }

    async updateAdmin(id: string, data: UpdateAdminDTO): Promise<Admin> {
        const admin = await this.repository.findById(id);
        if (!admin) {
            throw new Error('Admin not found');
        }

        if (data.name) admin.setName(data.name);
        if (data.email) admin.setEmail(data.email);
        if (data.status) admin.setStatus(data.status);

        return await this.repository.update(admin);
    }

    async deleteAdmin(id: string): Promise<void> {
        const admin = await this.repository.findById(id);
        if (!admin) {
            throw new Error('Admin not found');
        }

        await this.repository.softDelete(id);
    }

    async listAdmins(page: number = 1, limit: number = 50): Promise<Admin[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(limit, offset);
    }

    async validateCredentials(email: string, password: string): Promise<Admin> {
        const admin = await this.repository.findByEmail(email);
        if (!admin) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        if (admin.status !== AdminStatus.ACTIVE) {
            throw new Error('Account is not active');
        }

        return admin;
    }
}
