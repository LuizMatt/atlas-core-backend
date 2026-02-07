import { ProductService } from '../../../src/services/ProductService';
import { ProductRepository } from '../../../src/repositories/ProductRepository';
import { Product, ProductStatus } from '../../../src/models/Product';
import { randomUUID } from 'crypto';

jest.mock('../../../src/repositories/ProductRepository');

describe('ProductService', () => {
    let service: ProductService;
    let mockRepository: jest.Mocked<ProductRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ProductService();
        mockRepository = (service as any).repository;
    });

    describe('createProduct', () => {
        const validProductData = {
            store_id: randomUUID(),
            name: 'Test Product',
            sku: 'TEST-001',
            price: 99.99,
            stock_quantity: 10,
            description: 'Test description',
            min_stock: 5,
            category: 'Electronics',
            featured: true
        };

        it('should create a product successfully', async () => {
            mockRepository.findBySku.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(createMockProduct());

            const result = await service.createProduct(validProductData);

            expect(mockRepository.findBySku).toHaveBeenCalledWith('TEST-001', validProductData.store_id);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Product);
        });

        it('should throw error if SKU already exists', async () => {
            mockRepository.findBySku.mockResolvedValue(createMockProduct());

            await expect(service.createProduct(validProductData))
                .rejects.toThrow('SKU already exists');
        });
    });

    describe('getProductById', () => {
        it('should return product when found', async () => {
            const mockProduct = createMockProduct();
            mockRepository.findById.mockResolvedValue(mockProduct);

            const result = await service.getProductById('product-id', 'store-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('product-id', 'store-id');
            expect(result).toBe(mockProduct);
        });

        it('should throw error when product not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.getProductById('invalid-id', 'store-id'))
                .rejects.toThrow('Product not found');
        });
    });

    describe('updateProduct', () => {
        it('should update product successfully', async () => {
            const mockProduct = createMockProduct();
            mockRepository.findById.mockResolvedValue(mockProduct);
            mockRepository.update.mockResolvedValue(mockProduct);

            const updateData = { name: 'Updated Name', price: 149.99 };
            const result = await service.updateProduct('product-id', 'store-id', updateData);

            expect(mockRepository.findById).toHaveBeenCalledWith('product-id', 'store-id');
            expect(mockRepository.update).toHaveBeenCalled();
            expect(result).toBe(mockProduct);
        });

        it('should throw error when product not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.updateProduct('invalid-id', 'store-id', { name: 'New Name' }))
                .rejects.toThrow('Product not found');
        });
    });

    describe('deleteProduct', () => {
        it('should delete product successfully', async () => {
            const mockProduct = createMockProduct();
            mockRepository.findById.mockResolvedValue(mockProduct);
            mockRepository.softDelete.mockResolvedValue(undefined);

            await service.deleteProduct('product-id', 'store-id');

            expect(mockRepository.findById).toHaveBeenCalledWith('product-id', 'store-id');
            expect(mockRepository.softDelete).toHaveBeenCalledWith('product-id', 'store-id');
        });

        it('should throw error when product not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.deleteProduct('invalid-id', 'store-id'))
                .rejects.toThrow('Product not found');
        });
    });

    describe('listProducts', () => {
        it('should return list of products', async () => {
            const mockProducts = [createMockProduct(), createMockProduct()];
            mockRepository.findAll.mockResolvedValue(mockProducts);

            const result = await service.listProducts('store-id', 1, 50);

            expect(mockRepository.findAll).toHaveBeenCalledWith('store-id', 50, 0);
            expect(result).toHaveLength(2);
        });

        it('should calculate correct offset for pagination', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            await service.listProducts('store-id', 3, 20);

            expect(mockRepository.findAll).toHaveBeenCalledWith('store-id', 20, 40);
        });
    });

    describe('updateImage', () => {
        it('should update product image successfully', async () => {
            const mockProduct = createMockProduct();
            mockRepository.findById.mockResolvedValue(mockProduct);
            mockRepository.update.mockResolvedValue(mockProduct);

            await service.updateImage('product-id', 'store-id', '/uploads/image.jpg');

            expect(mockRepository.findById).toHaveBeenCalledWith('product-id', 'store-id');
            expect(mockRepository.update).toHaveBeenCalled();
        });
    });

    describe('listLowStock', () => {
        it('should return products with low stock', async () => {
            const mockProducts = [createMockProduct()];
            mockRepository.findLowStock.mockResolvedValue(mockProducts);

            const result = await service.listLowStock('store-id');

            expect(mockRepository.findLowStock).toHaveBeenCalledWith('store-id');
            expect(result).toBe(mockProducts);
        });
    });
});

function createMockProduct(): Product {
    return new Product(
        randomUUID(),
        randomUUID(),
        'Test Product',
        'TEST-SKU',
        99.99,
        10,
        ProductStatus.ACTIVE,
        false,
        new Date(),
        new Date()
    );
}
