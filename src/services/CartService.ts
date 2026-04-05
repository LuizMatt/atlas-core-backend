import { Cart, CartItem, CartStatus } from '../models/Cart';
import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { randomUUID } from 'crypto';

interface AddItemDTO {
    product_id: string;
    quantity: number;
}

export class CartService {
    private cartRepository: CartRepository;
    private productRepository: ProductRepository;
    private customerRepository: CustomerRepository;

    constructor() {
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
        this.customerRepository = new CustomerRepository();
    }

    async getOrCreateCart(customer_id: string): Promise<Cart> {
        const customer = await this.customerRepository.findById(customer_id, customer_id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const existing = await this.cartRepository.findActiveByCustomer(customer_id);
        if (existing) return existing;

        const cart = new Cart(
            randomUUID(),
            customer_id as any,
            CartStatus.ACTIVE,
            [],
            new Date(),
            new Date(),
            null
        );

        return await this.cartRepository.create(cart);
    }

    async getCart(cart_id: string): Promise<Cart> {
        const cart = await this.cartRepository.findById(cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }
        return cart;
    }

    async addItem(cart_id: string, data: AddItemDTO): Promise<Cart> {
        const cart = await this.cartRepository.findById(cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }

        if (cart.status !== CartStatus.ACTIVE) {
            throw new Error('Cart is not active');
        }

        const product = await this.productRepository.findById(data.product_id);
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.stock_quantity < data.quantity) {
            throw new Error('Insufficient stock');
        }

        const existingItem = cart.items.find(
            i => i.product_id.toString() === data.product_id
        );

        if (existingItem) {
            const newQty = existingItem.quantity + data.quantity;
            if (product.stock_quantity < newQty) {
                throw new Error('Insufficient stock');
            }
            await this.cartRepository.updateItem(existingItem.id.toString(), newQty);
        } else {
            const item = new CartItem(
                randomUUID(),
                cart_id as any,
                data.product_id as any,
                data.quantity,
                product.price,
                new Date(),
                new Date()
            );
            await this.cartRepository.addItem(cart_id, item);
        }

        return await this.cartRepository.findById(cart_id) as Cart;
    }

    async updateItem(cart_id: string, item_id: string, quantity: number): Promise<Cart> {
        const cart = await this.cartRepository.findById(cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }

        if (cart.status !== CartStatus.ACTIVE) {
            throw new Error('Cart is not active');
        }

        const item = cart.items.find(i => i.id.toString() === item_id);
        if (!item) {
            throw new Error('Item not found in cart');
        }

        const product = await this.productRepository.findById(item.product_id.toString());
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.stock_quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        await this.cartRepository.updateItem(item_id, quantity);
        return await this.cartRepository.findById(cart_id) as Cart;
    }

    async removeItem(cart_id: string, item_id: string): Promise<Cart> {
        const cart = await this.cartRepository.findById(cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }

        if (cart.status !== CartStatus.ACTIVE) {
            throw new Error('Cart is not active');
        }

        const item = cart.items.find(i => i.id.toString() === item_id);
        if (!item) {
            throw new Error('Item not found in cart');
        }

        await this.cartRepository.removeItem(item_id);
        return await this.cartRepository.findById(cart_id) as Cart;
    }

    async clearCart(cart_id: string): Promise<Cart> {
        const cart = await this.cartRepository.findById(cart_id);
        if (!cart) {
            throw new Error('Cart not found');
        }

        await this.cartRepository.clearItems(cart_id);
        return await this.cartRepository.findById(cart_id) as Cart;
    }

    async listByCustomer(customer_id: string): Promise<Cart[]> {
        return await this.cartRepository.findByCustomer(customer_id);
    }
}