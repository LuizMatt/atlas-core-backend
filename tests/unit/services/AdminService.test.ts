import { AdminService } from '../../../src/services/AdminService';
import { AdminRepository } from '../../../src/repositories/AdminRepository';
import { Admin, AdminStatus } from '../../../src/models/Admin';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

jest.mock('../../../src/repositories/AdminRepository');
jest.mock('bcrypt');

describe('AdminService', () => {
    let service: AdminService;
    let mockRepository: jest.Mocked<AdminRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AdminService();
        mockRepository = (service as any).repository;
    });

    describe('createAdmin', () => {
        const validAdminData = {
            name: 'John Doe Admin',
            email: 'admin@example.com',
            password: 'SecurePass123!'
        };

        it('should create an admin successfully', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            mockRepository.create.mockResolvedValue(createMockAdmin());

            const result = await service.createAdmin(validAdminData);

            expect(mockRepository.findByEmail).toHaveBeenCalledWith('admin@example.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Admin);
        });

        it('should throw error if email already exists', async () => {
            mockRepository.findByEmail.mockResolvedValue(createMockAdmin());

            await expect(service.createAdmin(validAdminData))
                .rejects.toThrow('Email already registered');
        });
    });

    describe('validateCredentials', () => {
        const email = 'admin@example.com';
        const password = 'SecurePass123!';

        it('should validate credentials successfully', async () => {
            const mockAdmin = createMockAdmin();
            mockRepository.findByEmail.mockResolvedValue(mockAdmin);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateCredentials(email, password);

            expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockAdmin.password_hash);
            expect(result).toBe(mockAdmin);
        });

        it('should throw error when admin not found', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when password is invalid', async () => {
            const mockAdmin = createMockAdmin();
            mockRepository.findByEmail.mockResolvedValue(mockAdmin);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when account is not active', async () => {
            const mockAdmin = createMockAdmin();
            mockAdmin.setStatus(AdminStatus.INACTIVE);
            mockRepository.findByEmail.mockResolvedValue(mockAdmin);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Account is not active');
        });
    });
});

function createMockAdmin(): Admin {
    return new Admin(
        randomUUID(),
        'John Doe Admin',
        'admin@example.com',
        '$2b$10$hashed_password',
        AdminStatus.ACTIVE,
        new Date(),
        new Date()
    );
}
