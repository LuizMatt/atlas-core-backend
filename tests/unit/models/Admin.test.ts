import { Admin, AdminStatus } from '../../../src/models/Admin';
import { randomUUID } from 'crypto';

describe('Admin Model', () => {
    const validData = {
        id: randomUUID(),
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: 'hashed_pass',
        status: AdminStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date()
    };

    it('should create an admin instance successfully', () => {
        const admin = new Admin(
            validData.id,
            validData.name,
            validData.email,
            validData.password_hash,
            validData.status,
            validData.created_at,
            validData.updated_at
        );

        expect(admin.id).toBe(validData.id);
        expect(admin.name).toBe(validData.name);
        expect(admin.email).toBe(validData.email);
        expect(admin.status).toBe(validData.status);
    });

    describe('setters and validations', () => {
        let admin: Admin;

        beforeEach(() => {
            admin = new Admin(
                validData.id,
                validData.name,
                validData.email,
                validData.password_hash,
                validData.status,
                validData.created_at,
                validData.updated_at
            );
        });

        it('should update name correctly', () => {
            admin.setName('New Admin Name');
            expect(admin.name).toBe('New Admin Name');
        });

        it('should throw error for empty name', () => {
            expect(() => admin.setName('   ')).toThrow('Name cannot be empty');
            expect(() => admin.setName('')).toThrow('Name cannot be empty');
        });

        it('should update email correctly and convert to lowercase', () => {
            admin.setEmail('NEW@Example.COM');
            expect(admin.email).toBe('new@example.com');
        });

        it('should throw error for invalid email format', () => {
            expect(() => admin.setEmail('invalid-email')).toThrow('Invalid email');
        });

        it('should perform soft delete', () => {
            admin.softDelete();
            expect(admin.deleted_at).toBeInstanceOf(Date);
        });
    });
});
