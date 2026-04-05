import { Order, OrderItem, OrderAddress, OrderStatus, PaymentStatus } from '../models/Order';
import { OrderRepository } from '../repositories/OrderRepository';
import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { CartStatus } from '../models/Cart';
import { randomUUID } from 'crypto';

interface AddressDTO {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
}

interface CreateFromCartDTO {
    customer_id: string;
    cart_id: string;
    address?: AddressDTO;
    notes?: string;
}

export class OrderService {
    private orderRepository: OrderRepository;
    private cartRepository: CartRepository;
    private productRepository: ProductRepository;
    private customerRepository: CustomerRepository;

    constructor() {
        this.orderRepository = new OrderRepository();
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
        this.customerRepository = new CustomerRepository();
    }

    async createFromCart(data: CreateFromCartDTO): Promise<Order> {
        const customer = await this.customerRepository.findById(data.customer_id, data.customer_id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const cart = await this.cartRepository.findById(data.cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }

        if (cart.customer_id.toString() !== data.customer_id) {
            throw new Error('Cart does not belong to this customer');
        }

        if (cart.status !== CartStatus.ACTIVE) {
            throw new Error('Cart is not active');
        }

        if (cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        
        for (const item of cart.items) {
            const product = await this.productRepository.findById(item.product_id.toString());
            if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
            }
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
        }

        const address = data.address
            ? new OrderAddress(
                data.address.street,
                data.address.number,
                data.address.complement ?? null,
                data.address.neighborhood,
                data.address.city,
                data.address.state,
                data.address.zip_code
            )
            : null;

        const orderItems = cart.items.map(item =>
            new OrderItem(
                randomUUID(),
                '' as any, 
                item.product_id,
                item.quantity,
                item.unit_price,
                new Date()
            )
        );

        const total = cart.total;

        const order = new Order(
            randomUUID(),
            data.customer_id as any,
            OrderStatus.PENDING,
            PaymentStatus.PENDING,
            orderItems,
            address,
            total,
            new Date(),
            new Date(),
            data.notes,
            null
        );

        const created = await this.orderRepository.create(order);

        
        for (const item of cart.items) {
            const product = await this.productRepository.findById(item.product_id.toString());
            if (product) {
                product.setStockQuantity(product.stock_quantity - item.quantity);
                await this.productRepository.update(product);
            }
        }

        cart.setStatus(CartStatus.CONVERTED);
        await this.cartRepository.update(cart);

        return created;
    }

    async getOrderById(id: string): Promise<Order> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        order.setStatus(status);
        return await this.orderRepository.update(order);
    }

    async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<Order> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        order.setPaymentStatus(payment_status);
        return await this.orderRepository.update(order);
    }

    async cancelOrder(id: string): Promise<Order> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
            throw new Error('Cannot cancel an order that has already been shipped or delivered');
        }

        order.setStatus(OrderStatus.CANCELLED);
        const updated = await this.orderRepository.update(order);

       
        for (const item of order.items) {
            const product = await this.productRepository.findById(item.product_id.toString());
            if (product) {
                product.setStockQuantity(product.stock_quantity + item.quantity);
                await this.productRepository.update(product);
            }
        }

        return updated;
    }

    async listByCustomer(customer_id: string, page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.orderRepository.findByCustomer(customer_id, limit, offset);
    }

    async listAll(page: number = 1, limit: number = 50): Promise<Order[]> {
        const offset = (page - 1) * limit;
        return await this.orderRepository.findAll(undefined, limit, offset);
    }
}