import { Customer, CustomerStatus } from '../../../src/models/Costumer';
import { randomUUID } from 'crypto';

describe('Customer Model', () => {
    const mockId = randomUUID();
    const mockStoreId = randomUUID();

    describe('Constructor', () => {
        it('should create a customer with valid data', () => {
            const customer = new Customer(
                mockId,
                mockStoreId,
                'John Doe',
                '12345678900',
                'john@example.com',
                '11999999999',
                'hashed_password',
                CustomerStatus.ACTIVE,
                new Date(),
                new Date()
            );

            expect(customer.id).toBe(mockId);
            expect(customer.store_id).toBe(mockStoreId);
            expect(customer.name).toBe('John Doe');
            expect(customer.taxId).toBe('12345678900');
            expect(customer.email).toBe('john@example.com');
            expect(customer.phone).toBe('11999999999');
            expect(customer.status).toBe(CustomerStatus.ACTIVE);
        });
    });

    describe('setName', () => {
        it('should update customer name', () => {
            const customer = createTestCustomer();
            customer.setName('Jane Doe');
            expect(customer.name).toBe('Jane Doe');
        });

        it('should trim whitespace from name', () => {
            const customer = createTestCustomer();
            customer.setName('  Trimmed Name  ');
            expect(customer.name).toBe('Trimmed Name');
        });

        it('should throw error for empty name', () => {
            const customer = createTestCustomer();
            expect(() => customer.setName('')).toThrow('Name cannot be empty');
        });
    });

    describe('setEmail', () => {
        it('should update email in lowercase', () => {
            const customer = createTestCustomer();
            customer.setEmail('NEW@EXAMPLE.COM');
            expect(customer.email).toBe('new@example.com');
        });

        it('should throw error for invalid email', () => {
            const customer = createTestCustomer();
            expect(() => customer.setEmail('invalid-email')).toThrow('Invalid email');
        });
    });

    describe('setTaxId', () => {
        it('should remove non-numeric characters from taxId', () => {
            const customer = createTestCustomer();
            customer.setTaxId('123.456.789-00');
            expect(customer.taxId).toBe('12345678900');
        });

        it('should throw error for empty taxId', () => {
            const customer = createTestCustomer();
            expect(() => customer.setTaxId('')).toThrow('Tax ID cannot be empty');
        });
    });

    describe('setPhone', () => {
        it('should remove non-numeric characters from phone', () => {
            const customer = createTestCustomer();
            customer.setPhone('(11) 98888-7777');
            expect(customer.phone).toBe('11988887777');
        });

        it('should throw error for empty phone', () => {
            const customer = createTestCustomer();
            expect(() => customer.setPhone('')).toThrow('Phone cannot be empty');
        });
    });

    describe('setStatus', () => {
        it('should update customer status', () => {
            const customer = createTestCustomer();
            customer.setStatus(CustomerStatus.BLOCKED);
            expect(customer.status).toBe(CustomerStatus.BLOCKED);
        });
    });

    describe('softDelete', () => {
        it('should set deleted_at timestamp', () => {
            const customer = createTestCustomer();
            customer.softDelete();
            expect(customer.deleted_at).toBeInstanceOf(Date);
        });
    });
});

function createTestCustomer(): Customer {
    return new Customer(
        randomUUID(),
        randomUUID(),
        'John Doe',
        '12345678900',
        'john@example.com',
        '11999999999',
        'hashed_password',
        CustomerStatus.ACTIVE,
        new Date(),
        new Date()
    );
}
