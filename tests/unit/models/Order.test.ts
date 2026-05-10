import { Order, OrderItem, OrderStatus, Address } from '../../../src/models/Order';
import { randomUUID } from 'crypto';

describe('OrderItem Model', () => {
    describe('Constructor', () => {
        it('should create an OrderItem with valid data', () => {
            const id = randomUUID() as any;
            const orderId = randomUUID() as any;
            const productId = randomUUID() as any;

            const item = new OrderItem(id, orderId, productId, 2, 99.99, new Date());

            expect(item.id).toBe(id);
            expect(item.order_id).toBe(orderId);
            expect(item.product_id).toBe(productId);
            expect(item.quantity).toBe(2);
            expect(item.unit_price).toBe(99.99);
        });
    });

    describe('subtotal', () => {
        it('should calculate subtotal correctly', () => {
            const item = createTestOrderItem(3, 50.0);
            expect(item.subtotal).toBe(150.0);
        });

        it('should handle decimal prices correctly', () => {
            const item = createTestOrderItem(2, 19.99);
            expect(item.subtotal).toBeCloseTo(39.98);
        });
    });
});

describe('Address Model', () => {
    describe('Constructor', () => {
        it('should create an Address with required data', () => {
            const id = randomUUID() as any;
            const orderId = randomUUID() as any;

            const address = new Address(
                id,
                orderId,
                'Rua das Flores',
                '123',
                'Centro',
                'São Paulo',
                'SP',
                '01310-100',
                new Date()
            );

            expect(address.id).toBe(id);
            expect(address.order_id).toBe(orderId);
            expect(address.street).toBe('Rua das Flores');
            expect(address.number).toBe('123');
            expect(address.neighborhood).toBe('Centro');
            expect(address.city).toBe('São Paulo');
            expect(address.state).toBe('SP');
            expect(address.zip_code).toBe('01310-100');
            expect(address.complement).toBeUndefined();
        });

        it('should create an Address with optional complement', () => {
            const address = new Address(
                randomUUID() as any,
                randomUUID() as any,
                'Rua das Flores',
                '123',
                'Centro',
                'São Paulo',
                'SP',
                '01310-100',
                new Date(),
                'Apto 42'
            );

            expect(address.complement).toBe('Apto 42');
        });
    });
});

describe('Order Model', () => {
    describe('Constructor', () => {
        it('should create an Order with valid data', () => {
            const id = randomUUID() as any;
            const customerId = randomUUID() as any;

            const order = new Order(
                id,
                customerId,
                OrderStatus.PENDING,
                199.99,
                [],
                new Date(),
                new Date(),
                undefined,
                null
            );

            expect(order.id).toBe(id);
            expect(order.customer_id).toBe(customerId);
            expect(order.status).toBe(OrderStatus.PENDING);
            expect(order.total).toBe(199.99);
            expect(order.items).toEqual([]);
            expect(order.deleted_at).toBeNull();
        });
    });

    describe('setStatus', () => {
        it('should update order status', () => {
            const order = createTestOrder(OrderStatus.PENDING);
            order.setStatus(OrderStatus.PAID);
            expect(order.status).toBe(OrderStatus.PAID);
        });

        it('should update updated_at when status changes', () => {
            const order = createTestOrder(OrderStatus.PENDING);
            const before = order.updated_at;
            order.setStatus(OrderStatus.SHIPPED);
            expect(order.updated_at).not.toBe(before);
        });
    });

    describe('setTotal', () => {
        it('should update order total', () => {
            const order = createTestOrder();
            order.setTotal(500.0);
            expect(order.total).toBe(500.0);
        });

        it('should throw error when total is negative', () => {
            const order = createTestOrder();
            expect(() => order.setTotal(-10)).toThrow('Total cannot be negative');
        });

        it('should allow zero total', () => {
            const order = createTestOrder();
            order.setTotal(0);
            expect(order.total).toBe(0);
        });
    });

    describe('softDelete', () => {
        it('should set deleted_at timestamp', () => {
            const order = createTestOrder();
            expect(order.deleted_at).toBeNull();

            order.softDelete();

            expect(order.deleted_at).toBeInstanceOf(Date);
        });

        it('should update updated_at on soft delete', () => {
            const order = createTestOrder();
            const before = order.updated_at;
            order.softDelete();
            expect(order.updated_at).not.toBe(before);
        });
    });

    describe('OrderStatus transitions', () => {
        it('should transition from PENDING to PAID', () => {
            const order = createTestOrder(OrderStatus.PENDING);
            order.setStatus(OrderStatus.PAID);
            expect(order.status).toBe(OrderStatus.PAID);
        });

        it('should transition from PAID to SHIPPED', () => {
            const order = createTestOrder(OrderStatus.PAID);
            order.setStatus(OrderStatus.SHIPPED);
            expect(order.status).toBe(OrderStatus.SHIPPED);
        });

        it('should transition from SHIPPED to DELIVERED', () => {
            const order = createTestOrder(OrderStatus.SHIPPED);
            order.setStatus(OrderStatus.DELIVERED);
            expect(order.status).toBe(OrderStatus.DELIVERED);
        });

        it('should transition from PENDING to CANCELLED', () => {
            const order = createTestOrder(OrderStatus.PENDING);
            order.setStatus(OrderStatus.CANCELLED);
            expect(order.status).toBe(OrderStatus.CANCELLED);
        });
    });
});

function createTestOrderItem(quantity: number, unitPrice: number): OrderItem {
    return new OrderItem(
        randomUUID() as any,
        randomUUID() as any,
        randomUUID() as any,
        quantity,
        unitPrice,
        new Date()
    );
}

function createTestOrder(status: OrderStatus = OrderStatus.PENDING, items: OrderItem[] = []): Order {
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
