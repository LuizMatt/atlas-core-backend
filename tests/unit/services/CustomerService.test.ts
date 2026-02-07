import { CustomerService } from '../../../src/services/CustomerService';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';
import { Customer, CustomerStatus } from '../../../src/models/Costumer';
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
            store_id: randomUUID(),
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

            expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com', validCustomerData.store_id);
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

            const result = await service.getCustomerById('customer-id', 'store-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id', 'store-id');
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.getCustomerById('invalid-id', 'store-id'))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('updateCustomer', () => {
        it('should update customer successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findById.mockResolvedValue(mockCustomer);
            mockRepository.update.mockResolvedValue(mockCustomer);

            const updateData = { name: 'Jane Doe', phone: '11988888888' };
            const result = await service.updateCustomer('customer-id', 'store-id', updateData);

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id', 'store-id');
            expect(mockRepository.update).toHaveBeenCalled();
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.updateCustomer('invalid-id', 'store-id', { name: 'New Name' }))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('deleteCustomer', () => {
        it('should delete customer successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findById.mockResolvedValue(mockCustomer);
            mockRepository.softDelete.mockResolvedValue(undefined);

            await service.deleteCustomer('customer-id', 'store-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('customer-id', 'store-id');
            expect(mockRepository.softDelete).toHaveBeenCalledWith('customer-id', 'store-id');
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.deleteCustomer('invalid-id', 'store-id'))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('listCustomers', () => {
        it('should return list of customers', async () => {
            const mockCustomers = [createMockCustomer(), createMockCustomer()];
            mockRepository.findAll.mockResolvedValue(mockCustomers);

            const result = await service.listCustomers('store-id', 1, 50);

            expect(mockRepository.findAll).toHaveBeenCalledWith('store-id', 50, 0);
            expect(result).toHaveLength(2);
        });

        it('should calculate correct offset for pagination', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            await service.listCustomers('store-id', 2, 25);

            expect(mockRepository.findAll).toHaveBeenCalledWith('store-id', 25, 25);
        });
    });

    describe('validateCredentials', () => {
        const email = 'john@example.com';
        const password = 'SecurePass123!';
        const storeId = randomUUID();

        it('should validate credentials successfully', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateCredentials(email, password, storeId);

            expect(mockRepository.findByEmail).toHaveBeenCalledWith(email, storeId);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockCustomer.password_hash);
            expect(result).toBe(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);

            await expect(service.validateCredentials(email, password, storeId))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when password is invalid', async () => {
            const mockCustomer = createMockCustomer();
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.validateCredentials(email, password, storeId))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error when account is not active', async () => {
            const mockCustomer = createMockCustomer();
            mockCustomer.setStatus(CustomerStatus.BLOCKED);
            mockRepository.findByEmail.mockResolvedValue(mockCustomer);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.validateCredentials(email, password, storeId))
                .rejects.toThrow('Account is not active');
        });
    });
});

function createMockCustomer(): Customer {
    return new Customer(
        randomUUID(),
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
