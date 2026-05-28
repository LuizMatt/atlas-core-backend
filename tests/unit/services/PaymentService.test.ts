import { PaymentService } from '../../../src/services/PaymentService';
import { PaymentRepository } from '../../../src/repositories/PaymentRepository';
import { OrderRepository } from '../../../src/repositories/OrderRepository';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';
import { ProductRepository } from '../../../src/repositories/ProductRepository';
import { AbacatePayClient } from '../../../src/services/AbacatePayClient';
import { Payment, PaymentStatus, PaymentMethod } from '../../../src/models/Payment';
import { Order, OrderStatus, OrderItem } from '../../../src/models/Order';
import { Customer, CustomerStatus } from '../../../src/models/Customer';
import { Product, ProductStatus } from '../../../src/models/Product';
import { randomUUID } from 'crypto';

jest.mock('../../../src/repositories/PaymentRepository');
jest.mock('../../../src/repositories/OrderRepository');
jest.mock('../../../src/repositories/CustomerRepository');
jest.mock('../../../src/repositories/ProductRepository');
jest.mock('../../../src/services/AbacatePayClient');

describe('PaymentService', () => {
    let service: PaymentService;
    let mockPaymentRepo: jest.Mocked<PaymentRepository>;
    let mockOrderRepo: jest.Mocked<OrderRepository>;
    let mockCustomerRepo: jest.Mocked<CustomerRepository>;
    let mockProductRepo: jest.Mocked<ProductRepository>;
    let mockAbacatePayClient: jest.Mocked<AbacatePayClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentService();
        mockPaymentRepo = (service as any).paymentRepository;
        mockOrderRepo = (service as any).orderRepository;
        mockCustomerRepo = (service as any).customerRepository;
        mockProductRepo = (service as any).productRepository;
        mockAbacatePayClient = (service as any).abacatePayClient;
    });

    const createTestOrder = (status: OrderStatus = OrderStatus.PENDING): Order => {
        return new Order(
            randomUUID(),
            randomUUID(),
            status,
            150.00,
            [
                new OrderItem(randomUUID(), randomUUID(), randomUUID(), 2, 75.00, new Date())
            ],
            new Date(),
            new Date()
        );
    };

    const createTestCustomer = (): Customer => {
        return new Customer(
            randomUUID(),
            'John Doe',
            '12345678901',
            'john@example.com',
            '11999999999',
            'hash',
            CustomerStatus.ACTIVE,
            new Date(),
            new Date()
        );
    };

    const createTestPayment = (status: PaymentStatus = PaymentStatus.PENDING): Payment => {
        return new Payment(
            randomUUID(),
            randomUUID(),
            'abacatepay',
            'ext-pay-123',
            15000,
            'BRL',
            status,
            PaymentMethod.PIX,
            new Date(),
            new Date()
        );
    };

    describe('createPixPayment', () => {
        it('should create a PIX payment successfully', async () => {
            const order = createTestOrder();
            const customer = createTestCustomer();
            
            mockOrderRepo.findById.mockResolvedValue(order);
            mockPaymentRepo.findByOrderId.mockResolvedValue(null);
            mockCustomerRepo.findById.mockResolvedValue(customer);
            
            const mockCheckoutResponse = {
                id: 'ext-pay-123',
                amount: 15000,
                status: 'PENDING',
                pix: {
                    brCode: 'pix-code-123',
                    brCodeBase64: 'pix-base64-123',
                    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                }
            };
            mockAbacatePayClient.createTransparentCheckout.mockResolvedValue(mockCheckoutResponse);
            
            const expectedPayment = createTestPayment();
            mockPaymentRepo.create.mockResolvedValue(expectedPayment);

            const result = await service.createPixPayment(order.id);

            expect(mockOrderRepo.findById).toHaveBeenCalledWith(order.id);
            expect(mockCustomerRepo.findById).toHaveBeenCalledWith(order.customer_id);
            expect(mockAbacatePayClient.createTransparentCheckout).toHaveBeenCalled();
            expect(mockPaymentRepo.create).toHaveBeenCalled();
            expect(result).toBe(expectedPayment);
        });

        it('should throw error if order not found', async () => {
            mockOrderRepo.findById.mockResolvedValue(null);

            await expect(service.createPixPayment('non-existent-order'))
                .rejects.toThrow('Order not found');
        });

        it('should throw error if order is not pending', async () => {
            const order = createTestOrder(OrderStatus.PAID);
            mockOrderRepo.findById.mockResolvedValue(order);

            await expect(service.createPixPayment(order.id))
                .rejects.toThrow('Cannot pay for an order with status paid');
        });

        it('should return existing pending payment if it already exists', async () => {
            const order = createTestOrder();
            const existingPayment = createTestPayment(PaymentStatus.PENDING);
            
            mockOrderRepo.findById.mockResolvedValue(order);
            mockPaymentRepo.findByOrderId.mockResolvedValue(existingPayment);

            const result = await service.createPixPayment(order.id);

            expect(result).toBe(existingPayment);
            expect(mockAbacatePayClient.createTransparentCheckout).not.toHaveBeenCalled();
        });
    });

    describe('checkPaymentStatus', () => {
        it('should transition status to SUCCEEDED and update order status when API returns PAID', async () => {
            const payment = createTestPayment(PaymentStatus.PENDING);
            const order = createTestOrder(OrderStatus.PENDING);
            
            mockPaymentRepo.findById.mockResolvedValue(payment);
            mockOrderRepo.findById.mockResolvedValue(order);
            
            const apiResponse = {
                id: payment.gateway_payment_id,
                amount: 15000,
                status: 'PAID'
            };
            mockAbacatePayClient.checkPaymentStatus.mockResolvedValue(apiResponse);

            await service.checkPaymentStatus(payment.id);

            expect(payment.status).toBe(PaymentStatus.SUCCEEDED);
            expect(payment.paid_at).toBeInstanceOf(Date);
            expect(mockPaymentRepo.update).toHaveBeenCalledWith(payment);
            expect(order.status).toBe(OrderStatus.PAID);
            expect(mockOrderRepo.update).toHaveBeenCalledWith(order);
        });
    });

    describe('handleWebhook', () => {
        it('should update payment and order to PAID on transparent.completed', async () => {
            const payment = createTestPayment(PaymentStatus.PENDING);
            const order = createTestOrder(OrderStatus.PENDING);
            
            mockPaymentRepo.findByGatewayId.mockResolvedValue(payment);
            mockOrderRepo.findById.mockResolvedValue(order);

            const payload = {
                event: 'transparent.completed',
                data: {
                    id: payment.gateway_payment_id
                }
            };

            await service.handleWebhook(undefined, JSON.stringify(payload), payload);

            expect(payment.status).toBe(PaymentStatus.SUCCEEDED);
            expect(payment.paid_at).toBeInstanceOf(Date);
            expect(order.status).toBe(OrderStatus.PAID);
            expect(mockPaymentRepo.update).toHaveBeenCalled();
            expect(mockOrderRepo.update).toHaveBeenCalled();
        });

        it('should update payment to EXPIRED, order to CANCELLED, and restore stock on transparent.lost', async () => {
            const payment = createTestPayment(PaymentStatus.PENDING);
            
            // Set up order items and mocks
            const productId = randomUUID();
            const order = new Order(
                payment.order_id as any,
                randomUUID(),
                OrderStatus.PENDING,
                75.00,
                [
                    new OrderItem(randomUUID(), payment.order_id as any, productId as any, 2, 37.50, new Date())
                ],
                new Date(),
                new Date()
            );
            
            const product = new Product(
                productId as any,
                'Test Product',
                'SKU-1',
                37.50,
                10,
                ProductStatus.ACTIVE,
                false,
                new Date(),
                new Date()
            );

            mockPaymentRepo.findByGatewayId.mockResolvedValue(payment);
            mockOrderRepo.findById.mockResolvedValue(order);
            mockProductRepo.findById.mockResolvedValue(product);

            const payload = {
                event: 'transparent.lost',
                data: {
                    id: payment.gateway_payment_id
                }
            };

            await service.handleWebhook(undefined, JSON.stringify(payload), payload);

            expect(payment.status).toBe(PaymentStatus.EXPIRED);
            expect(order.status).toBe(OrderStatus.CANCELLED);
            expect(product.stock_quantity).toBe(12); // 10 + 2 restored
            expect(mockPaymentRepo.update).toHaveBeenCalled();
            expect(mockOrderRepo.update).toHaveBeenCalled();
            expect(mockProductRepo.update).toHaveBeenCalledWith(product);
        });
    });
});
