import { pool } from '../config/config';
import { Product, ProductStatus } from '../models/Product';

export class ProductRepository {
    async create(product: Product): Promise<Product> {
        const query = `
            INSERT INTO products (
                id, store_id, name, description, sku, price, stock_quantity, 
                min_stock, image_url, images, category, status, featured, 
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;
        
        const values = [
            product.id,
            product.store_id,
            product.name,
            product.description,
            product.sku,
            product.price,
            product.stock_quantity,
            product.min_stock,
            product.image_url,
            product.images ? JSON.stringify(product.images) : null,
            product.category,
            product.status,
            product.featured,
            product.created_at,
            product.updated_at
        ];

        const result = await pool.query(query, values);
        return this.mapToProduct(result.rows[0]);
    }

    async findById(id: string, store_id: string): Promise<Product | null> {
        const query = `
            SELECT * FROM products 
            WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL
        `;
        
        const result = await pool.query(query, [id, store_id]);
        return result.rows[0] ? this.mapToProduct(result.rows[0]) : null;
    }

    async findBySku(sku: string, store_id: string): Promise<Product | null> {
        const query = `
            SELECT * FROM products 
            WHERE UPPER(sku) = UPPER($1) AND store_id = $2 AND deleted_at IS NULL
        `;
        
        const result = await pool.query(query, [sku, store_id]);
        return result.rows[0] ? this.mapToProduct(result.rows[0]) : null;
    }

    async update(product: Product): Promise<Product> {
        const query = `
            UPDATE products 
            SET name = $1, description = $2, sku = $3, price = $4, 
                stock_quantity = $5, min_stock = $6, image_url = $7, 
                images = $8, category = $9, status = $10, featured = $11, 
                updated_at = $12
            WHERE id = $13 AND store_id = $14 AND deleted_at IS NULL
            RETURNING *
        `;
        
        const values = [
            product.name,
            product.description,
            product.sku,
            product.price,
            product.stock_quantity,
            product.min_stock,
            product.image_url,
            product.images ? JSON.stringify(product.images) : null,
            product.category,
            product.status,
            product.featured,
            product.updated_at,
            product.id,
            product.store_id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Product not found');
        }
        return this.mapToProduct(result.rows[0]);
    }

    async softDelete(id: string, store_id: string): Promise<void> {
        const query = `
            UPDATE products 
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND store_id = $2
        `;
        
        await pool.query(query, [id, store_id]);
    }

    async findAll(store_id: string, limit: number = 50, offset: number = 0): Promise<Product[]> {
        const query = `
            SELECT * FROM products 
            WHERE store_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [store_id, limit, offset]);
        return result.rows.map(row => this.mapToProduct(row));
    }

    async findByCategory(category: string, store_id: string, limit: number = 50, offset: number = 0): Promise<Product[]> {
        const query = `
            SELECT * FROM products 
            WHERE category = $1 AND store_id = $2 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        
        const result = await pool.query(query, [category, store_id, limit, offset]);
        return result.rows.map(row => this.mapToProduct(row));
    }

    async findFeatured(store_id: string, limit: number = 10): Promise<Product[]> {
        const query = `
            SELECT * FROM products 
            WHERE featured = true AND store_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2
        `;
        
        const result = await pool.query(query, [store_id, limit]);
        return result.rows.map(row => this.mapToProduct(row));
    }

    async findLowStock(store_id: string): Promise<Product[]> {
        const query = `
            SELECT * FROM products 
            WHERE stock_quantity <= min_stock 
            AND min_stock IS NOT NULL 
            AND store_id = $1 
            AND deleted_at IS NULL
            ORDER BY stock_quantity ASC
        `;
        
        const result = await pool.query(query, [store_id]);
        return result.rows.map(row => this.mapToProduct(row));
    }

    private mapToProduct(row: any): Product {
        return new Product(
            row.id,
            row.store_id,
            row.name,
            row.sku,
            parseFloat(row.price),
            row.stock_quantity,
            row.status as ProductStatus,
            row.featured,
            row.created_at,
            row.updated_at,
            row.description,
            row.min_stock,
            row.image_url,
            row.images ? JSON.parse(row.images) : undefined,
            row.category,
            row.deleted_at
        );
    }
}
