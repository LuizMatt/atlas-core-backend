import { Product, ProductStatus } from '../models/Product';
import { ProductRepository } from '../repositories/ProductRepository';
import { randomUUID } from 'crypto';

interface CreateProductDTO {
    store_id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    description?: string;
    min_stock?: number;
    category?: string;
    featured?: boolean;
}

interface UpdateProductDTO {
    name?: string;
    description?: string;
    sku?: string;
    price?: number;
    stock_quantity?: number;
    min_stock?: number;
    category?: string;
    status?: ProductStatus;
    featured?: boolean;
}

export class ProductService {
    private repository: ProductRepository;

    constructor() {
        this.repository = new ProductRepository();
    }

    async createProduct(data: CreateProductDTO): Promise<Product> {
        const existingProduct = await this.repository.findBySku(data.sku, data.store_id);
        if (existingProduct) {
            throw new Error('SKU already exists');
        }

        const product = new Product(
            randomUUID(),
            data.store_id as any,
            data.name,
            data.sku,
            data.price,
            data.stock_quantity,
            ProductStatus.ACTIVE,
            data.featured || false,
            new Date(),
            new Date(),
            data.description,
            data.min_stock,
            undefined,
            undefined,
            data.category,
            null
        );

        return await this.repository.create(product);
    }

    async getProductById(id: string, store_id: string): Promise<Product> {
        const product = await this.repository.findById(id, store_id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async updateProduct(id: string, store_id: string, data: UpdateProductDTO): Promise<Product> {
        const product = await this.repository.findById(id, store_id);
        if (!product) {
            throw new Error('Product not found');
        }

        if (data.name) product.setName(data.name);
        if (data.description !== undefined) product.setDescription(data.description);
        if (data.sku) product.setSku(data.sku);
        if (data.price) product.setPrice(data.price);
        if (data.stock_quantity !== undefined) product.setStockQuantity(data.stock_quantity);
        if (data.min_stock !== undefined) product.setMinStock(data.min_stock);
        if (data.category !== undefined) product.setCategory(data.category);
        if (data.status) product.setStatus(data.status);
        if (data.featured !== undefined) product.setFeatured(data.featured);

        return await this.repository.update(product);
    }

    async deleteProduct(id: string, store_id: string): Promise<void> {
        const product = await this.repository.findById(id, store_id);
        if (!product) {
            throw new Error('Product not found');
        }

        await this.repository.softDelete(id, store_id);
    }

    async listProducts(store_id: string, page: number = 1, limit: number = 50): Promise<Product[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(store_id, limit, offset);
    }

    async listByCategory(category: string, store_id: string, page: number = 1, limit: number = 50): Promise<Product[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findByCategory(category, store_id, limit, offset);
    }

    async listFeatured(store_id: string, limit: number = 10): Promise<Product[]> {
        return await this.repository.findFeatured(store_id, limit);
    }

    async listLowStock(store_id: string): Promise<Product[]> {
        return await this.repository.findLowStock(store_id);
    }

    async updateImage(id: string, store_id: string, imageUrl: string): Promise<void> {
        const product = await this.repository.findById(id, store_id);
        if (!product) {
            throw new Error('Product not found');
        }

        product.setImageUrl(imageUrl);
        await this.repository.update(product);
    }

    async updateImages(id: string, store_id: string, imageUrls: string[]): Promise<void> {
        const product = await this.repository.findById(id, store_id);
        if (!product) {
            throw new Error('Product not found');
        }

        product.setImages(imageUrls);
        await this.repository.update(product);
    }
}
