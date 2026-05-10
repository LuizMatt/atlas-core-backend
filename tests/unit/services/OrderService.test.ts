import { OrderService } from '../../../src/services/OrderService';
import { OrderRepository } from '../../../src/repositories/OrderRepository';
import { CartRepository } from '../../../src/repositories/CartRepository';
import { ProductRepository } from '../../../src/repositories/ProductRepository';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';
import { Order, OrderItem, OrderStatus, Address } from '../../../src/models/Order';
import { Cart, CartItem } from '../../../src/models/Cart';
import { Product, ProductStatus } from '../../../src/models/Product';
import { Customer, CustomerStatus } from '../../../src/models/Customer';
import { randomUUID } from 'crypto';

jest.mock('../../../src/repositories/OrderRepository');
jest.mock('../../../src/repositories/CartRepository');
jest.mock('../../../src/repositories/ProductRepository');
jest.mock('../../../src/repositories/CustomerRepository');

describe('OrderService', () => {
    let service: OrderService;
    let mockOrderRepository: jest.Mocked<OrderRepository>;
    let mockCartRepository: jest.Mocked<CartRepository>;
    let mockProductRepository: jest.Mocked<ProductRepository>;
    let mockCustomerRepository: jest.Mocked<CustomerRepository>;

    const validAddress = {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 4',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OrderService();
        mockOrderRepository = (service as any).repository;
        mockCartRepository = (service as any).cartRepository;
        mockProductRepository = (service as any).productRepository;
        mockCustomerRepository = (service as any).customerRepository;
    });

    describe('createFromCart', () => {
        it('should create an order from cart successfully', async () => {
            const productId = randomUUID();
            const mockProduct = createMockProduct(productId, 10);
            const mockCartItem = createMockCartItem('cart-id', productId, 2, 99.99);
            const mockCart = createMockCart([mockCartItem]);
            const mockOrder = createMockOrder();

            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockOrderRepository.create.mockResolvedValue(mockOrder);
            mockProductRepository.update.mockResolvedValue(mockProduct);
            mockCartRepository.clearItems.mockResolvedValue(undefined);

            const result = await service.createFromCart({ customer_id: 'customer-id', address: validAddress });

            expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-id');
            expect(mockCartRepository.findByCustomer).toHaveBeenCalledWith('customer-id');
            expect(mockOrderRepository.create).toHaveBeenCalled();
            expect(mockProductRepository.update).toHaveBeenCalled();
            expect(mockCartRepository.clearItems).toHaveBeenCalledWith(mockCart.id);
            expect(result).toBeInstanceOf(Order);
        });

        it('should deduct stock for each product when creating order', async () => {
            const productId = randomUUID();
            const mockProduct = createMockProduct(productId, 10);
            const mockCartItem = createMockCartItem('cart-id', productId, 3, 99.99);
            const mockCart = createMockCart([mockCartItem]);
            const mockOrder = createMockOrder();

            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockOrderRepository.create.mockResolvedValue(mockOrder);
            mockProductRepository.update.mockResolvedValue(mockProduct);
            mockCartRepository.clearItems.mockResolvedValue(undefined);

            await service.createFromCart({ customer_id: 'customer-id', address: validAddress });

            // Stock should be set to 10 - 3 = 7
            expect(mockProduct.stock_quantity).toBe(7);
            expect(mockProductRepository.update).toHaveBeenCalledWith(mockProduct);
        });

        it('should clear the cart after creating the order', async () => {
            const productId = randomUUID();
            const mockProduct = createMockProduct(productId, 10);
            const mockCartItem = createMockCartItem('cart-id', productId, 1, 99.99);
            const mockCart = createMockCart([mockCartItem]);
            const mockOrder = createMockOrder();

            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockOrderRepository.create.mockResolvedValue(mockOrder);
            mockProductRepository.update.mockResolvedValue(mockProduct);
            mockCartRepository.clearItems.mockResolvedValue(undefined);

            await service.createFromCart({ customer_id: 'customer-id', address: validAddress });

            expect(mockCartRepository.clearItems).toHaveBeenCalledWith(mockCart.id);
        });

        it('should throw error when customer not found', async () => {
            mockCustomerRepository.findById.mockResolvedValue(null);

            await expect(service.createFromCart({ customer_id: 'invalid-id', address: validAddress }))
                .rejects.toThrow('Customer not found');
        });

        it('should throw error when cart is empty', async () => {
            const mockCart = createMockCart([]);
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);

            await expect(service.createFromCart({ customer_id: 'customer-id', address: validAddress }))
                .rejects.toThrow('Cart is empty');
        });

        it('should throw error when cart does not exist', async () => {
            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(null);

            await expect(service.createFromCart({ customer_id: 'customer-id', address: validAddress }))
                .rejects.toThrow('Cart is empty');
        });

        it('should throw error when product in cart is not found', async () => {
            const mockCartItem = createMockCartItem('cart-id', 'product-id', 2, 99.99);
            const mockCart = createMockCart([mockCartItem]);

            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockProductRepository.findById.mockResolvedValue(null);

            await expect(service.createFromCart({ customer_id: 'customer-id', address: validAddress }))
                .rejects.toThrow('Product not found');
        });

        it('should throw error when stock is insufficient for an item', async () => {
            const productId = randomUUID();
            const mockProduct = createMockProduct(productId, 1); // Only 1 in stock
            const mockCartItem = createMockCartItem('cart-id', productId, 5, 99.99); // Requesting 5
            const mockCart = createMockCart([mockCartItem]);

            mockCustomerRepository.findById.mockResolvedValue(createMockCustomer());
            mockCartRepository.findByCustomer.mockResolvedValue(mockCart);
            mockProductRepository.findById.mockResolvedValue(mockProduct);

            await expect(service.createFromCart({ customer_id: 'customer-id', address: validAddress }))
                .rejects.toThrow('Insufficient stock for product');
        });
    });

    describe('getOrderById', () => {
        it('should return order when found', async () => {
            const mockOrder = createMockOrder();
            mockOrderRepository.findById.mockResolvedValue(mockOrder);

            const result = await service.getOrderById('order-id');

            expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-id');
            expect(result).toBe(mockOrder);
        });

        it('should throw error when order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.getOrderById('invalid-id'))
                .rejects.toThrow('Order not found');
        });
    });

    describe('updateStatus', () => {
        it('should update order status successfully', async () => {
            const mockOrder = createMockOrder();
            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.update.mockResolvedValue(mockOrder);

            const result = await service.updateStatus('order-id', OrderStatus.PAID);

            expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-id');
            expect(mockOrderRepository.update).toHaveBeenCalled();
            expect(result).toBe(mockOrder);
        });

        it('should throw error when order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.updateStatus('invalid-id', OrderStatus.PAID))
                .rejects.toThrow('Order not found');
        });
    });

    describe('cancelOrder', () => {
        it('should cancel a pending order and restore stock', async () => {
            const productId = randomUUID();
            const mockProduct = createMockProduct(productId, 5);
            const orderItem = createMockOrderItem('order-id', productId, 3, 99.99);
            const mockOrder = createMockOrder([orderItem], OrderStatus.PENDING);

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.update.mockResolvedValue(mockOrder);
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockProductRepository.update.mockResolvedValue(mockProduct);

            const result = await service.cancelOrder('order-id');

            // Stock should be restored: 5 + 3 = 8
            expect(mockProduct.stock_quantity).toBe(8);
            expect(mockProductRepository.update).toHaveBeenCalledWith(mockProduct);
            expect(result).toBe(mockOrder);
        });

        it('should throw error when order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.cancelOrder('invalid-id'))
                .rejects.toThrow('Order not found');
        });

        it('should throw error when canceling a shipped order', async () => {
            const mockOrder = createMockOrder([], OrderStatus.SHIPPED);
            mockOrderRepository.findById.mockResolvedValue(mockOrder);

            await expect(service.cancelOrder('order-id'))
                .rejects.toThrow('Cannot cancel an order that has already been shipped or delivered');
        });

        it('should throw error when canceling a delivered order', async () => {
            const mockOrder = createMockOrder([], OrderStatus.DELIVERED);
            mockOrderRepository.findById.mockResolvedValue(mockOrder);

            await expect(service.cancelOrder('order-id'))
                .rejects.toThrow('Cannot cancel an order that has already been shipped or delivered');
        });

        it('should not restore stock if product is not found during cancellation', async () => {
            const orderItem = createMockOrderItem('order-id', 'product-id', 3, 99.99);
            const mockOrder = createMockOrder([orderItem], OrderStatus.PENDING);

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.update.mockResolvedValue(mockOrder);
            mockProductRepository.findById.mockResolvedValue(null);

            // Should not throw, just skip stock restore
            await expect(service.cancelOrder('order-id')).resolves.toBe(mockOrder);
            expect(mockProductRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('listOrders', () => {
        it('should return list of orders with default pagination', async () => {
            const mockOrders = [createMockOrder(), createMockOrder()];
            mockOrderRepository.findAll.mockResolvedValue(mockOrders);

            const result = await service.listOrders(1, 50);

            expect(mockOrderRepository.findAll).toHaveBeenCalledWith(50, 0);
            expect(result).toHaveLength(2);
        });

        it('should calculate correct offset for pagination', async () => {
            mockOrderRepository.findAll.mockResolvedValue([]);

            await service.listOrders(3, 20);

            expect(mockOrderRepository.findAll).toHaveBeenCalledWith(20, 40);
        });
    });

    describe('listByCustomer', () => {
        it('should return orders for a specific customer', async () => {
            const mockOrders = [createMockOrder()];
            mockOrderRepository.findByCustomer.mockResolvedValue(mockOrders);

            const result = await service.listByCustomer('customer-id', 1, 10);

            expect(mockOrderRepository.findByCustomer).toHaveBeenCalledWith('customer-id', 10, 0);
            expect(result).toHaveLength(1);
        });

        it('should calculate correct offset for customer order pagination', async () => {
            mockOrderRepository.findByCustomer.mockResolvedValue([]);

            await service.listByCustomer('customer-id', 2, 25);

            expect(mockOrderRepository.findByCustomer).toHaveBeenCalledWith('customer-id', 25, 25);
        });
    });

    describe('deleteOrder', () => {
        it('should soft delete an order successfully', async () => {
            const mockOrder = createMockOrder();
            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.softDelete.mockResolvedValue(undefined);

            await service.deleteOrder('order-id');

            expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-id');
            expect(mockOrderRepository.softDelete).toHaveBeenCalledWith('order-id');
        });

        it('should throw error when order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.deleteOrder('invalid-id'))
                .rejects.toThrow('Order not found');
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

function createMockProduct(id: string, stockQuantity: number = 10): Product {
    return new Product(
        id as any,
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

function createMockOrderItem(orderId: string, productId: string, quantity: number, unitPrice: number): OrderItem {
    return new OrderItem(
        randomUUID() as any,
        orderId as any,
        productId as any,
        quantity,
        unitPrice,
        new Date()
    );
}

function createMockOrder(items: OrderItem[] = [], status: OrderStatus = OrderStatus.PENDING): Order {
    return new Order(
        randomUUID() as any,
        randomUUID() as any,
        status,
        299.97,
        items,
        new Date(),
        new Date(),
        undefined,
        null
    );
}
