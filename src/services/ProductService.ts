import { Product, ProductStatus } from '../models/Product';
import { ProductRepository } from '../repositories/ProductRepository';
import { randomUUID } from 'crypto';

interface CreateProductDTO {
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
        const existingProduct = await this.repository.findBySku(data.sku);
        if (existingProduct) {
            throw new Error('SKU already exists');
        }

        const product = new Product(
            randomUUID(),
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

    async getProductById(id: string): Promise<Product> {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
        const product = await this.repository.findById(id);
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

    async deleteProduct(id: string): Promise<void> {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        await this.repository.softDelete(id);
    }

    async listProducts(page: number = 1, limit: number = 50): Promise<Product[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(limit, offset);
    }

    async listByCategory(category: string, page: number = 1, limit: number = 50): Promise<Product[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findByCategory(category, limit, offset);
    }

    async listFeatured(limit: number = 10): Promise<Product[]> {
        return await this.repository.findFeatured(limit);
    }

    async listLowStock(): Promise<Product[]> {
        return await this.repository.findLowStock();
    }

    async updateImage(id: string, imageUrl: string): Promise<void> {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        product.setImageUrl(imageUrl);
        await this.repository.update(product);
    }

    async updateImages(id: string, imageUrls: string[]): Promise<void> {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        product.setImages(imageUrls);
        await this.repository.update(product);
    }
}
