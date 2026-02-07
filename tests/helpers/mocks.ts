import { Product, ProductStatus } from '../../src/models/Product';
import { Customer, CustomerStatus } from '../../src/models/Costumer';
import { randomUUID } from 'crypto';

export const createMockProduct = (overrides?: Partial<Product>): Product => {
    return new Product(
        randomUUID(),
        randomUUID(),
        'Test Product',
        'TEST-SKU-001',
        99.99,
        10,
        ProductStatus.ACTIVE,
        false,
        new Date(),
        new Date(),
        'Test description',
        5,
        undefined,
        undefined,
        'Electronics',
        null
    );
};

export const createMockCustomer = (overrides?: Partial<Customer>): Customer => {
    return new Customer(
        randomUUID(),
        randomUUID(),
        'John Doe',
        '12345678900',
        'john@example.com',
        '11999999999',
        '$2b$10$hashedpassword',
        CustomerStatus.ACTIVE,
        new Date(),
        new Date(),
        null
    );
};

export const mockRepository = <T extends object>(methods: Partial<T>): T => {
    return methods as T;
};
