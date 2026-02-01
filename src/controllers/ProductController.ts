import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
    private service: ProductService;

    constructor() {
        this.service = new ProductService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, name, sku, price, stock_quantity, description, min_stock, category, featured } = req.body;

            if (!store_id || !name || !sku || !price || stock_quantity === undefined) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const product = await this.service.createProduct({
                store_id,
                name,
                sku,
                price,
                stock_quantity,
                description,
                min_stock,
                category,
                featured
            });

            res.status(201).json({
                id: product.id,
                store_id: product.store_id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                stock_quantity: product.stock_quantity,
                status: product.status,
                featured: product.featured,
                created_at: product.created_at
            });
        } catch (error: any) {
            if (error.message === 'SKU already exists') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const product = await this.service.getProductById(id, store_id as string);

            res.status(200).json({
                id: product.id,
                store_id: product.store_id,
                name: product.name,
                description: product.description,
                sku: product.sku,
                price: product.price,
                stock_quantity: product.stock_quantity,
                min_stock: product.min_stock,
                image_url: product.image_url,
                images: product.images,
                category: product.category,
                status: product.status,
                featured: product.featured,
                created_at: product.created_at,
                updated_at: product.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id, ...updateData } = req.body;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const product = await this.service.updateProduct(id, store_id, updateData);

            res.status(200).json({
                id: product.id,
                name: product.name,
                price: product.price,
                stock_quantity: product.stock_quantity,
                status: product.status,
                updated_at: product.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            await this.service.deleteProduct(id, store_id as string);

            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const { store_id, page = '1', limit = '50' } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const products = await this.service.listProducts(
                store_id as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                data: products.map(product => ({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    stock_quantity: product.stock_quantity,
                    image_url: product.image_url,
                    category: product.category,
                    status: product.status,
                    featured: product.featured,
                    created_at: product.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    uploadImage = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const imageUrl = `/uploads/images/${req.file.filename}`;

            await this.service.updateImage(id, store_id as string, imageUrl);

            res.status(200).json({ 
                message: 'Image uploaded successfully',
                url: imageUrl 
            });
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to upload image' });
        }
    };

    uploadMultipleImages = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.files || !Array.isArray(req.files)) {
                res.status(400).json({ error: 'No files uploaded' });
                return;
            }

            const { id } = req.params;
            const { store_id } = req.query;

            if (!store_id) {
                res.status(400).json({ error: 'store_id is required' });
                return;
            }

            const imageUrls = req.files.map(file => `/uploads/images/${file.filename}`);

            await this.service.updateImages(id, store_id as string, imageUrls);

            res.status(200).json({ 
                message: 'Images uploaded successfully',
                urls: imageUrls 
            });
        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to upload images' });
        }
    };
}
