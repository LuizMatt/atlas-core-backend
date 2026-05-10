import { Cart, CartItem } from '../../../src/models/Cart';
import { randomUUID } from 'crypto';

describe('CartItem Model', () => {
    describe('Constructor', () => {
        it('should create a CartItem with valid data', () => {
            const id = randomUUID() as any;
            const cartId = randomUUID() as any;
            const productId = randomUUID() as any;

            const item = new CartItem(id, cartId, productId, 2, 49.99, new Date(), new Date());

            expect(item.id).toBe(id);
            expect(item.cart_id).toBe(cartId);
            expect(item.product_id).toBe(productId);
            expect(item.quantity).toBe(2);
            expect(item.unit_price).toBe(49.99);
        });
    });

    describe('setQuantity', () => {
        it('should update the quantity', () => {
            const item = createTestCartItem(2, 50.0);
            item.setQuantity(5);
            expect(item.quantity).toBe(5);
        });

        it('should throw error when quantity is zero', () => {
            const item = createTestCartItem(2, 50.0);
            expect(() => item.setQuantity(0)).toThrow('Quantity must be greater than zero');
        });

        it('should throw error when quantity is negative', () => {
            const item = createTestCartItem(2, 50.0);
            expect(() => item.setQuantity(-3)).toThrow('Quantity must be greater than zero');
        });
    });

    describe('setUnitPrice', () => {
        it('should update the unit price', () => {
            const item = createTestCartItem(2, 50.0);
            item.setUnitPrice(99.99);
            expect(item.unit_price).toBe(99.99);
        });

        it('should throw error when price is zero', () => {
            const item = createTestCartItem(2, 50.0);
            expect(() => item.setUnitPrice(0)).toThrow('Unit price must be greater than zero');
        });

        it('should throw error when price is negative', () => {
            const item = createTestCartItem(2, 50.0);
            expect(() => item.setUnitPrice(-10)).toThrow('Unit price must be greater than zero');
        });
    });

    describe('subtotal', () => {
        it('should calculate subtotal correctly', () => {
            const item = createTestCartItem(3, 25.0);
            expect(item.subtotal).toBe(75.0);
        });

        it('should recalculate subtotal after quantity update', () => {
            const item = createTestCartItem(2, 50.0);
            item.setQuantity(4);
            expect(item.subtotal).toBe(200.0);
        });
    });
});

describe('Cart Model', () => {
    describe('Constructor', () => {
        it('should create a Cart with valid data', () => {
            const id = randomUUID() as any;
            const customerId = randomUUID() as any;

            const cart = new Cart(id, customerId, [], new Date(), new Date());

            expect(cart.id).toBe(id);
            expect(cart.customer_id).toBe(customerId);
            expect(cart.items).toEqual([]);
        });
    });

    describe('setItems', () => {
        it('should update cart items', () => {
            const cart = createTestCart([]);
            const items = [createTestCartItem(1, 10.0), createTestCartItem(2, 20.0)];

            cart.setItems(items);

            expect(cart.items).toHaveLength(2);
            expect(cart.items).toEqual(items);
        });
    });

    describe('total', () => {
        it('should return zero total for empty cart', () => {
            const cart = createTestCart([]);
            expect(cart.total).toBe(0);
        });

        it('should calculate total correctly with multiple items', () => {
            const items = [
                createTestCartItem(2, 50.0),  // subtotal: 100
                createTestCartItem(3, 20.0),  // subtotal: 60
            ];
            const cart = createTestCart(items);
            expect(cart.total).toBe(160.0);
        });
    });

    describe('itemCount', () => {
        it('should return zero for empty cart', () => {
            const cart = createTestCart([]);
            expect(cart.itemCount).toBe(0);
        });

        it('should sum quantities of all items', () => {
            const items = [
                createTestCartItem(2, 50.0),
                createTestCartItem(3, 20.0),
            ];
            const cart = createTestCart(items);
            expect(cart.itemCount).toBe(5);
        });
    });
});

function createTestCartItem(quantity: number, unitPrice: number): CartItem {
    return new CartItem(
        randomUUID() as any,
        randomUUID() as any,
        randomUUID() as any,
        quantity,
        unitPrice,
        new Date(),
        new Date()
    );
}

function createTestCart(items: CartItem[]): Cart {
    return new Cart(
        randomUUID() as any,
        randomUUID() as any,
        items,
        new Date(),
        new Date()
    );
}
