import { Cart, CartItem } from '../models/Cart';
import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { randomUUID } from 'crypto';

interface AddItemDTO {
    store_id: string;
    customer_id: string;
    product_id: string;
    quantity: number;
}

interface UpdateItemDTO {
    store_id: string;
    customer_id: string;
    product_id: string;
    quantity: number;
}

export class CartService {
    private repository: CartRepository;
    private productRepository: ProductRepository;

    constructor() {
        this.repository = new CartRepository();
        this.productRepository = new ProductRepository();
    }

    async getOrCreateCart(customer_id: string, store_id: string): Promise<Cart> {
        const existing = await this.repository.findByCustomer(customer_id, store_id);
        if (existing) return existing;
// A
        const cart = new Cart(
            randomUUID(),
            store_id as any,
            customer_id as any,
            [],
            new Date(),
            new Date()
        );

        return await this.repository.create(cart);
    }

    async addItem(data: AddItemDTO): Promise<Cart> {
        const product = await this.productRepository.findById(data.product_id, data.store_id);
        if (!product) throw new Error('Product not found');

        if (product.stock_quantity < data.quantity) {
            throw new Error('Insufficient stock');
        }

        const cart = await this.getOrCreateCart(data.customer_id, data.store_id);

        const existingItem = await this.repository.findItem(cart.id, data.product_id);

        if (existingItem) {
            existingItem.setQuantity(existingItem.quantity + data.quantity);
            await this.repository.updateItem(existingItem);
        } else {
            const item = new CartItem(
                randomUUID(),
                cart.id,
                data.product_id as any,
                data.quantity,
                product.price,
                new Date(),
                new Date()
            );
            await this.repository.addItem(item);
        }

        return await this.getOrCreateCart(data.customer_id, data.store_id);
    }

    async updateItem(data: UpdateItemDTO): Promise<Cart> {
        const cart = await this.repository.findByCustomer(data.customer_id, data.store_id);
        if (!cart) throw new Error('Cart not found');

        const item = await this.repository.findItem(cart.id, data.product_id);
        if (!item) throw new Error('Item not found in cart');

        const product = await this.productRepository.findById(data.product_id, data.store_id);
        if (!product) throw new Error('Product not found');

        if (product.stock_quantity < data.quantity) {
            throw new Error('Insufficient stock');
        }

        item.setQuantity(data.quantity);
        await this.repository.updateItem(item);

        return await this.getOrCreateCart(data.customer_id, data.store_id);
    }
//A
async removeItem(customer_id: string, store_id: string, product_id: string): Promise<Cart> {
    const cart = await this.repository.findByCustomer(customer_id, store_id);
    if (!cart) throw new Error('Cart not found');

    const item = await this.repository.findItem(cart.id, product_id);
    if (!item) throw new Error('Item not found in cart'); 

    await this.repository.removeItem(cart.id, product_id);

    
    const updatedCart = await this.repository.findByCustomer(customer_id, store_id);
    return updatedCart!;
}

    async clearCart(customer_id: string, store_id: string): Promise<void> {
        const cart = await this.repository.findByCustomer(customer_id, store_id);
        if (!cart) return;

        await this.repository.clearItems(cart.id);
    }

    async getCart(customer_id: string, store_id: string): Promise<Cart> {
        const cart = await this.repository.findByCustomer(customer_id, store_id);
        if (!cart) throw new Error('Cart not found');
        return cart;
    }
}