import { Product, ProductStatus } from '../../../src/models/Product';
import { randomUUID } from 'crypto';

describe('Product Model', () => {
    const mockId = randomUUID();
    const mockStoreId = randomUUID();

    describe('Constructor', () => {
        it('should create a product with valid data', () => {
            const product = new Product(
                mockId,
                mockStoreId,
                'Test Product',
                'SKU-001',
                99.99,
                10,
                ProductStatus.ACTIVE,
                false,
                new Date(),
                new Date()
            );

            expect(product.id).toBe(mockId);
            expect(product.store_id).toBe(mockStoreId);
            expect(product.name).toBe('Test Product');
            expect(product.sku).toBe('SKU-001');
            expect(product.price).toBe(99.99);
            expect(product.stock_quantity).toBe(10);
            expect(product.status).toBe(ProductStatus.ACTIVE);
            expect(product.featured).toBe(false);
        });
    });

    describe('setName', () => {
        it('should update product name', () => {
            const product = createTestProduct();
            product.setName('New Name');
            expect(product.name).toBe('New Name');
        });

        it('should trim whitespace from name', () => {
            const product = createTestProduct();
            product.setName('  Trimmed Name  ');
            expect(product.name).toBe('Trimmed Name');
        });

        it('should throw error for empty name', () => {
            const product = createTestProduct();
            expect(() => product.setName('')).toThrow('Product name cannot be empty');
        });
    });

    describe('setPrice', () => {
        it('should update product price', () => {
            const product = createTestProduct();
            product.setPrice(149.99);
            expect(product.price).toBe(149.99);
        });

        it('should throw error for zero price', () => {
            const product = createTestProduct();
            expect(() => product.setPrice(0)).toThrow('Price must be greater than zero');
        });

        it('should throw error for negative price', () => {
            const product = createTestProduct();
            expect(() => product.setPrice(-10)).toThrow('Price must be greater than zero');
        });
    });

    describe('setStockQuantity', () => {
        it('should update stock quantity', () => {
            const product = createTestProduct();
            product.setStockQuantity(20);
            expect(product.stock_quantity).toBe(20);
        });

        it('should change status to OUT_OF_STOCK when quantity is zero', () => {
            const product = createTestProduct();
            product.setStockQuantity(0);
            expect(product.status).toBe(ProductStatus.OUT_OF_STOCK);
        });

        it('should change status back to ACTIVE when restocking', () => {
            const product = createTestProduct();
            product.setStockQuantity(0);
            product.setStockQuantity(10);
            expect(product.status).toBe(ProductStatus.ACTIVE);
        });

        it('should throw error for negative stock', () => {
            const product = createTestProduct();
            expect(() => product.setStockQuantity(-5)).toThrow('Stock quantity cannot be negative');
        });
    });

    describe('setSku', () => {
        it('should update SKU in uppercase', () => {
            const product = createTestProduct();
            product.setSku('new-sku-123');
            expect(product.sku).toBe('NEW-SKU-123');
        });

        it('should throw error for empty SKU', () => {
            const product = createTestProduct();
            expect(() => product.setSku('')).toThrow('SKU cannot be empty');
        });
    });

    describe('isLowStock', () => {
        it('should return true when stock is below min_stock', () => {
            const product = createTestProduct();
            product.setMinStock(10);
            product.setStockQuantity(5);
            expect(product.isLowStock()).toBe(true);
        });

        it('should return false when stock is above min_stock', () => {
            const product = createTestProduct();
            product.setMinStock(5);
            product.setStockQuantity(10);
            expect(product.isLowStock()).toBe(false);
        });

        it('should return false when min_stock is not set', () => {
            const product = createTestProduct();
            product.setStockQuantity(5);
            expect(product.isLowStock()).toBe(false);
        });
    });

    describe('softDelete', () => {
        it('should set deleted_at timestamp', () => {
            const product = createTestProduct();
            product.softDelete();
            expect(product.deleted_at).toBeInstanceOf(Date);
        });
    });
});

function createTestProduct(): Product {
    return new Product(
        randomUUID(),
        randomUUID(),
        'Test Product',
        'SKU-001',
        99.99,
        10,
        ProductStatus.ACTIVE,
        false,
        new Date(),
        new Date()
    );
}
