import { CartService } from '../../../src/services/CartService';
import { CartRepository } from '../../../src/repositories/CartRepository';
import { ProductRepository } from '../../../src/repositories/ProductRepository';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';
import { Cart, CartItem } from '../../../src/models/Cart';
import { Product, ProductStatus } from '../../../src/models/Product';
import { Customer, CustomerStatus } from '../../../src/models/Customer';
import { randomUUID } from 'crypto';

jest.mock('../../../src/repositories/CartRepository');
jest.mock('../../../src/repositories/ProductRepository');
jest.mock('../../../src/repositories/CustomerRepository');

describe('CartService', () => {
    let service: CartService;
    let mockCartRepository: jest.Mocked<CartRepository>;
    let mockProductRepository: jest.Mocked<ProductRepository>;
    let mockCustomerRepository: jest.Mocked<CustomerRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new CartService();
        mockCartRepository = (service as any).repository;
        mockProductRepository = (service as any).productRepository;
        mockCustomerRepository = (service as any).customerRepository;
    });

    describe('getOrCreateCart', () => {
        it('should return existing cart when customer already has one', async () => {
            const mockCart = createMockCart();
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);

            const result = await service.getOrCreateCart('customer-id');

            expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-id');
            expect(mockCartRepository.findByCustomer).toHaveBeenCalledWith('customer-id');
            expect(result).toBe(mockCart);
            expect(mockCartRepository.create).not.toHaveBeenCalled();
        });

        it('should create a new cart when customer has none', async () => {
            const mockCart = createMockCart();
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(null);
            mockCartRepository.create.mockResolvedValue(mockCart);

            const result = await service.getOrCreateCart('customer-id');

            expect(mockCartRepository.findByCustomer).toHaveBeenCalledWith('customer-id');
            expect(mockCartRepository.create).toHaveBeenCalled();
            expect(result).toBe(mockCart);
        });

        it('should throw error when customer not found', async () => {
            mockCustomerRepository.findById.mockResolvedValue(null);

            await expect(service.getOrCreateCart('invalid-customer'))
                .rejects.toThrow('Customer not found');
        });
    });

    describe('addItem', () => {
        const addItemData = {
            customer_id: 'customer-id',
            product_id: 'product-id',
            quantity: 2,
        };

        it('should add a new item to cart successfully', async () => {
            const mockProduct = createMockProduct(10);
            const mockCart = createMockCart();
            const mockCartWithItem = createMockCart([createMockCartItem(mockCart.id, 'product-id', 2, 99.99)]);

            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer
                .mockResolvedValueOnce(mockCart)
                .mockResolvedValueOnce(mockCartWithItem);
            mockCartRepository.findItem.mockResolvedValue(null);
            mockCartRepository.addItem.mockResolvedValue(createMockCartItem(mockCart.id, 'product-id', 2, 99.99));

            const result = await service.addItem(addItemData);

            expect(mockProductRepository.findById).toHaveBeenCalledWith('product-id');
            expect(mockCartRepository.addItem).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Cart);
        });

        it('should increment quantity when item already exists in cart', async () => {
            const mockProduct = createMockProduct(10);
            const existingItem = createMockCartItem('cart-id', 'product-id', 3, 99.99);
            const mockCart = createMockCart([existingItem]);
            const mockCartUpdated = createMockCart([createMockCartItem('cart-id', 'product-id', 5, 99.99)]);

            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer
                .mockResolvedValueOnce(mockCart)
                .mockResolvedValueOnce(mockCartUpdated);
            mockCartRepository.findItem.mockResolvedValue(existingItem);
            mockCartRepository.updateItem.mockResolvedValue(existingItem);

            const result = await service.addItem(addItemData);

            expect(mockCartRepository.updateItem).toHaveBeenCalled();
            expect(mockCartRepository.addItem).not.toHaveBeenCalled();
            expect(result).toBeInstanceOf(Cart);
        });

        it('should throw error when product not found', async () => {
            mockProductRepository.findById.mockResolvedValue(null);

            await expect(service.addItem(addItemData))
                .rejects.toThrow('Product not found');
        });

        it('should throw error when stock is insufficient', async () => {
            const mockProduct = createMockProduct(1); // Only 1 in stock
            mockProductRepository.findById.mockResolvedValue(mockProduct);

            await expect(service.addItem({ ...addItemData, quantity: 5 }))
                .rejects.toThrow('Insufficient stock');
        });
    });

    describe('updateItem', () => {
        const updateItemData = {
            customer_id: 'customer-id',
            product_id: 'product-id',
            quantity: 3,
        };

        it('should update item quantity successfully', async () => {
            const mockCart = createMockCart();
            const mockItem = createMockCartItem(mockCart.id, 'product-id', 2, 99.99);
            const mockProduct = createMockProduct(10);
            const mockCartUpdated = createMockCart([createMockCartItem(mockCart.id, 'product-id', 3, 99.99)]);

            mockCartRepository.findByCustomer
                .mockResolvedValueOnce(mockCart)
                .mockResolvedValueOnce(mockCartUpdated);
            mockCartRepository.findItem.mockResolvedValue(mockItem);
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.updateItem.mockResolvedValue(mockItem);

            const result = await service.updateItem(updateItemData);

            expect(mockCartRepository.updateItem).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Cart);
        });

        it('should throw error when cart not found', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(null);

            await expect(service.updateItem(updateItemData))
                .rejects.toThrow('Cart not found');
        });

        it('should throw error when item not found in cart', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(createMockCart());
            mockCartRepository.findItem.mockResolvedValue(null);

            await expect(service.updateItem(updateItemData))
                .rejects.toThrow('Item not found in cart');
        });

        it('should throw error when product not found', async () => {
            const mockCart = createMockCart();
            const mockItem = createMockCartItem(mockCart.id, 'product-id', 2, 99.99);

            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockCartRepository.findItem.mockResolvedValue(mockItem);
            mockProductRepository.findById.mockResolvedValue(null);

            await expect(service.updateItem(updateItemData))
                .rejects.toThrow('Product not found');
        });

        it('should throw error when stock is insufficient for updated quantity', async () => {
            const mockCart = createMockCart();
            const mockItem = createMockCartItem(mockCart.id, 'product-id', 1, 99.99);
            const mockProduct = createMockProduct(2); // Only 2 in stock

            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockCartRepository.findItem.mockResolvedValue(mockItem);
            mockProductRepository.findById.mockResolvedValue(mockProduct);

            await expect(service.updateItem({ ...updateItemData, quantity: 5 }))
                .rejects.toThrow('Insufficient stock');
        });
    });

    describe('removeItem', () => {
        it('should remove item from cart successfully', async () => {
            const mockCart = createMockCart([createMockCartItem('cart-id', 'product-id', 2, 99.99)]);
            const mockItem = createMockCartItem(mockCart.id, 'product-id', 2, 99.99);
            const mockCartUpdated = createMockCart([]);

            mockCartRepository.findByCustomer
                .mockResolvedValueOnce(mockCart)
                .mockResolvedValueOnce(mockCartUpdated);
            mockCartRepository.findItem.mockResolvedValue(mockItem);
            mockCartRepository.removeItem.mockResolvedValue(undefined);

            const result = await service.removeItem('customer-id', 'product-id');

            expect(mockCartRepository.removeItem).toHaveBeenCalledWith(mockCart.id, 'product-id');
            expect(result).toBeInstanceOf(Cart);
        });

        it('should throw error when cart not found', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(null);

            await expect(service.removeItem('customer-id', 'product-id'))
                .rejects.toThrow('Cart not found');
        });

        it('should throw error when item not found in cart', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(createMockCart());
            mockCartRepository.findItem.mockResolvedValue(null);

            await expect(service.removeItem('customer-id', 'product-id'))
                .rejects.toThrow('Item not found in cart');
        });
    });

    describe('clearCart', () => {
        it('should clear all items from cart', async () => {
            const mockCart = createMockCart([createMockCartItem('cart-id', 'product-id', 2, 99.99)]);
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockCartRepository.clearItems.mockResolvedValue(undefined);

            await service.clearCart('customer-id');

            expect(mockCartRepository.clearItems).toHaveBeenCalledWith(mockCart.id);
        });

        it('should do nothing when cart does not exist', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(null);

            await service.clearCart('customer-id');

            expect(mockCartRepository.clearItems).not.toHaveBeenCalled();
        });
    });

    describe('getCart', () => {
        it('should return cart when found', async () => {
            const mockCart = createMockCart();
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);

            const result = await service.getCart('customer-id');

            expect(mockCartRepository.findByCustomer).toHaveBeenCalledWith('customer-id');
            expect(result).toBe(mockCart);
        });

        it('should throw error when cart not found', async () => {
            mockCartRepository.findByCustomer.mockResolvedValue(null);

            await expect(service.getCart('customer-id'))
                .rejects.toThrow('Cart not found');
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

function createMockProduct(stockQuantity: number = 10): Product {
    return new Product(
        randomUUID(),
        'Test Product',
        'TEST-SKU-001',
        99.99,
        stockQuantity,
        ProductStatus.ACTIVE,
        false,
        new Date(),
        new Date()
    );
}

function createMockCartItem(cartId: string, productId: string, quantity: number, unitPrice: number): CartItem {
    return new CartItem(
        randomUUID() as any,
        cartId as any,
        productId as any,
        quantity,
        unitPrice,
        new Date(),
        new Date()
    );
}

function createMockCart(items: CartItem[] = []): Cart {
    return new Cart(
        randomUUID() as any,
        randomUUID() as any,
        items,
        new Date(),
        new Date()
    );
}
