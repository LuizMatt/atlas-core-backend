import { CustomerService } from '../../../src/services/CustomerService';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';
import { Customer, CustomerStatus } from '../../../src/models/Customer';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

jest.mock('../../../src/repositories/CustomerRepository');
jest.mock('bcrypt');

describe('CustomerService', () => {
    let service: CustomerService;
    let mockRepository: jest.Mocked<CustomerRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new CustomerService();
        mockRepository = (service as any).repository;
    });

    describe('createCustomer', () => {
        const validCustomerData = {
            name: 'John Doe',
            taxId: '12345678900',
            email: 'john@example.com',
            phone: '11999999999',
            password: 'SecurePass123!'
        };

        it('should create a customer successfully', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            mockRepository.create.mockResolvedValue(createMockCustomer());

            const result = await service.createCustomer(validCustomerData);

            expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Customer);
        });

        it('should throw error if email already exists', async () => {
            mockRepository.findByEmail.mockResolvedValue(createMockCustomer());

            await expect(service.createCustomer(validCustomerData))
                .rejects.toThrow('Email already registered');
        });

        it('should normalize email to lowercase', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            mockRepository.create.mockResolvedValue(createMockCustomer());

            const dataWithUppercaseEmail = { ...validCustomerData, email: 'JOHN@EXAMPLE.COM' };
            await service.createCustomer(dataWithUppercaseEmail);

            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.email).toBe('john@example.com');
        });
    });

    describe('getCustomerById', () => {
        it('should return customer when found', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findById.mockResolvedValue(mockCustomer);

            const result = await service.getCustomerById('customer-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id');
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.getCustomerById('invalid-id'))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('updateCustomer', () => {
        it('should update customer successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findById.mockResolvedValue(mockCustomer);
            mockRepository.update.mockResolvedValue(mockCustomer);

            const updateData = { name: 'Jane Doe', phone: '11988888888' };
            const result = await service.updateCustomer('customer-id', updateData);

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id');
            expect(mockRepository.update).toHaveBeenCalled();
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.updateCustomer('invalid-id', { name: 'New Name' }))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('deleteCustomer', () => {
        it('should delete customer successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findById.mockResolvedValue(mockCustomer);
            mockRepository.softDelete.mockResolvedValue(undefined);

            await service.deleteCustomer('customer-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id');
            expect(mockRepository.softDelete).toHaveBeenCalledWith('customer-id');
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.deleteCustomer('invalid-id'))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('listCustomers', () => {
        it('should return list of customers', async () => {
            const mockCustomers = [createMockCustomer(), createMockCustomer()];
            mockRepository.findAll.mockResolvedValue(mockCustomers);

            const result = await service.listCustomers(1, 50);

            expect(mockRepository.findAll).toHaveBeenCalledWith(50, 0);
            expect(result).toHaveLength(2);
        });

        it('should calculate correct offset for pagination', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            await service.listCustomers(2, 25);

            expect(mockRepository.findAll).toHaveBeenCalledWith(25, 25);
        });
    });

    describe('validateCredentials', () => {
        const email = 'john@example.com';
        const password = 'SecurePass123!';

        it('should validate credentials successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateCredentials(email, password);

            expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockCustomer.password_hash);
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when password is invalid', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when account is not active', async () => {
            const mockCustomer = createMockCustomer();
            mockCustomer.setStatus(CustomerStatus.BLOCKED);
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.validateCredentials(email, password))
                .rejects.toThrow('Account is not active');
        });
    });
});

function createMockCustomer(): Customer {
    return new Customer(
        randomUUID(),
        'John Doe',
        '12345678900',
        'john@example.com',
        '11999999999',
        '$2b$10$hashed_password',
        CustomerStatus.ACTIVE,
        new Date(),
        new Date()
    );
}
