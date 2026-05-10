import { Order, OrderItem, OrderStatus, Address } from '../models/Order';
import { OrderRepository } from '../repositories/OrderRepository';
import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { randomUUID } from 'crypto';

interface CreateOrderDTO {
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
    private customerRepository: CustomerRepository;

    constructor() {
        this.repository = new OrderRepository();
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
        this.customerRepository = new CustomerRepository();
    }

    async createFromCart(data: CreateOrderDTO): Promise<Order> {
        const customer = await this.customerRepository.findById(data.customer_id);
        if (!customer) throw new Error('Customer not found');

        const cart = await this.cartRepository.findByCustomer(data.customer_id);
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Validate stock for all items before creating order
        const productsToUpdate = [];
        for (const cartItem of cart.items) {
            const product = await this.productRepository.findById(cartItem.product_id);
            if (!product) throw new Error(`Product not found: ${cartItem.product_id}`);
            if (product.stock_quantity < cartItem.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            productsToUpdate.push({ product, quantity: cartItem.quantity });
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

        for (const { product, quantity } of productsToUpdate) {
            product.setStockQuantity(product.stock_quantity - quantity);
            await this.productRepository.update(product);
        }

        // Clear cart after order creation
        await this.cartRepository.clearItems(cart.id);

        return createdOrder;
    }

    async getOrderById(id: string): Promise<Order> {
        const order = await this.repository.findById(id);
        if (!order) throw new Error('Order not found');
        return order;
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const order = await this.repository.findById(id);
        if (!order) throw new Error('Order not found');

        order.setStatus(status);
        return await this.repository.update(order);
    }

    async cancelOrder(id: string): Promise<Order> {
        const order = await this.repository.findById(id);
        if (!order) throw new Error('Order not found');

        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED) {
            throw new Error('Cannot cancel an order that has already been shipped or delivered');
        }

        order.setStatus(OrderStatus.CANCELLED);
        const updatedOrder = await this.repository.update(order);

        // Restore stock
        for (const item of order.items) {
            const product = await this.productRepository.findById(item.product_id);
            if (product) {
                product.setStockQuantity(product.stock_quantity + item.quantity);
                await this.productRepository.update(product);
            }
        }

        return updatedOrder;
    }

    async listOrders(page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(limit, offset);
    }

    async listByCustomer(customer_id: string, page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findByCustomer(customer_id, limit, offset);
    }

    async deleteOrder(id: string): Promise<void> {
        const order = await this.repository.findById(id);
        if (!order) throw new Error('Order not found');

        await this.repository.softDelete(id);
    }
}