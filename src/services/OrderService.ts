import { Order, OrderItem, OrderStatus, Address } from '../models/Order';
import { OrderRepository } from '../repositories/OrderRepository';
import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { randomUUID } from 'crypto';

interface CreateOrderDTO {
    store_id: string;
    customer_id: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
    };
}

export class OrderService {
    private repository: OrderRepository;
    private cartRepository: CartRepository;
    private productRepository: ProductRepository;

    constructor() {
        this.repository = new OrderRepository();
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
    }

    async createFromCart(data: CreateOrderDTO): Promise<Order> {
        const cart = await this.cartRepository.findByCustomer(data.customer_id, data.store_id);
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Validate stock for all items before creating order
        for (const cartItem of cart.items) {
            const product = await this.productRepository.findById(cartItem.product_id, data.store_id);
            if (!product) throw new Error(`Product not found: ${cartItem.product_id}`);
            if (product.stock_quantity < cartItem.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
        }

        const orderId = randomUUID();
        const now = new Date();

        const orderItems = cart.items.map(cartItem =>
            new OrderItem(
                randomUUID(),
                orderId,
                cartItem.product_id,
                cartItem.quantity,
                cartItem.unit_price,
                now
            )
        );

        const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        const order = new Order(
            orderId,
            data.store_id as any,
            data.customer_id as any,
            OrderStatus.PENDING,
            total,
            orderItems,
            now,
            now,
            undefined,
            null
        );

        const address = new Address(
            randomUUID(),
            orderId,
            data.address.street,
            data.address.number,
            data.address.neighborhood,
            data.address.city,
            data.address.state,
            data.address.zip_code,
            now,
            data.address.complement
        );

        const createdOrder = await this.repository.create(order, address);

        // Clear cart after order creation
        await this.cartRepository.clearItems(cart.id);

        return createdOrder;
    }

    async getOrderById(id: string, store_id: string): Promise<Order> {
        const order = await this.repository.findById(id, store_id);
        if (!order) throw new Error('Order not found');
        return order;
    }

    async updateStatus(id: string, store_id: string, status: OrderStatus): Promise<Order> {
        const order = await this.repository.findById(id, store_id);
        if (!order) throw new Error('Order not found');

        order.setStatus(status);
        return await this.repository.update(order);
    }

    async cancelOrder(id: string, store_id: string): Promise<Order> {
        const order = await this.repository.findById(id, store_id);
        if (!order) throw new Error('Order not found');

        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED) {
            throw new Error('Cannot cancel an order that has already been shipped or delivered');
        }

        order.setStatus(OrderStatus.CANCELLED);
        return await this.repository.update(order);
    }

    async listOrders(store_id: string, page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(store_id, limit, offset);
    }

    async listByCustomer(customer_id: string, store_id: string, page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findByCustomer(customer_id, store_id, limit, offset);
    }

    async deleteOrder(id: string, store_id: string): Promise<void> {
        const order = await this.repository.findById(id, store_id);
        if (!order) throw new Error('Order not found');

        await this.repository.softDelete(id, store_id);
    }
}