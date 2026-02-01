import { UUID } from "crypto";

export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock'
}

export class Product {
    private _id: UUID;
    private _store_id: UUID;
    private _name: string;
    private _description?: string;
    private _sku: string;
    private _price: number;
    private _stock_quantity: number;
    private _min_stock?: number;
    private _image_url?: string;
    private _images?: string[];
    private _category?: string;
    private _status: ProductStatus;
    private _featured: boolean;
    private _created_at: Date;
    private _updated_at: Date;
    private _deleted_at?: Date | null;

    constructor(
        id: UUID,
        store_id: UUID,
        name: string,
        sku: string,
        price: number,
        stock_quantity: number,
        status: ProductStatus,
        featured: boolean,
        created_at: Date,
        updated_at: Date,
        description?: string,
        min_stock?: number,
        image_url?: string,
        images?: string[],
        category?: string,
        deleted_at?: Date | null
    ) {
        this._id = id;
        this._store_id = store_id;
        this._name = name;
        this._sku = sku;
        this._price = price;
        this._stock_quantity = stock_quantity;
        this._status = status;
        this._featured = featured;
        this._created_at = created_at;
        this._updated_at = updated_at;
        this._description = description;
        this._min_stock = min_stock;
        this._image_url = image_url;
        this._images = images;
        this._category = category;
        this._deleted_at = deleted_at;
    }

    get id(): UUID { return this._id; }
    get store_id(): UUID { return this._store_id; }
    get created_at(): Date { return this._created_at; }
    get deleted_at(): Date | null | undefined { return this._deleted_at; }

    get name(): string { return this._name; }
    setName(name: string): void {
        if (!name?.trim()) throw new Error("Product name cannot be empty");
        this._name = name.trim();
        this._updated_at = new Date();
    }

    get description(): string | undefined { return this._description; }
    setDescription(description: string): void {
        this._description = description?.trim();
        this._updated_at = new Date();
    }

    get sku(): string { return this._sku; }
    setSku(sku: string): void {
        if (!sku?.trim()) throw new Error("SKU cannot be empty");
        this._sku = sku.trim().toUpperCase();
        this._updated_at = new Date();
    }

    get price(): number { return this._price; }
    setPrice(price: number): void {
        if (price <= 0) throw new Error("Price must be greater than zero");
        this._price = price;
        this._updated_at = new Date();
    }

    get stock_quantity(): number { return this._stock_quantity; }
    setStockQuantity(stock_quantity: number): void {
        if (stock_quantity < 0) throw new Error("Stock quantity cannot be negative");
        this._stock_quantity = stock_quantity;
        
        if (stock_quantity === 0) {
            this._status = ProductStatus.OUT_OF_STOCK;
        } else if (this._status === ProductStatus.OUT_OF_STOCK) {
            this._status = ProductStatus.ACTIVE;
        }
        
        this._updated_at = new Date();
    }

    get min_stock(): number | undefined { return this._min_stock; }
    setMinStock(min_stock: number): void {
        if (min_stock < 0) throw new Error("Min stock cannot be negative");
        this._min_stock = min_stock;
        this._updated_at = new Date();
    }

    get image_url(): string | undefined { return this._image_url; }
    setImageUrl(image_url: string): void {
        this._image_url = image_url?.trim();
        this._updated_at = new Date();
    }

    get images(): string[] | undefined { return this._images; }
    setImages(images: string[]): void {
        this._images = images;
        this._updated_at = new Date();
    }

    get category(): string | undefined { return this._category; }
    setCategory(category: string): void {
        this._category = category?.trim();
        this._updated_at = new Date();
    }

    get status(): ProductStatus { return this._status; }
    setStatus(status: ProductStatus): void {
        this._status = status;
        this._updated_at = new Date();
    }

    get featured(): boolean { return this._featured; }
    setFeatured(featured: boolean): void {
        this._featured = featured;
        this._updated_at = new Date();
    }

    get updated_at(): Date { return this._updated_at; }

    isLowStock(): boolean {
        if (!this._min_stock) return false;
        return this._stock_quantity <= this._min_stock;
    }

    softDelete(): void {
        this._deleted_at = new Date();
        this._updated_at = new Date();
    }
}   