import { UUID } from "crypto";

export class CartItem {
    private _id: UUID;
    private _cart_id: UUID;
    private _product_id: UUID;
    private _quantity: number;
    private _unit_price: number;
    private _created_at: Date;
    private _updated_at: Date;

    constructor(
        id: UUID,
        cart_id: UUID,
        product_id: UUID,
        quantity: number,
        unit_price: number,
        created_at: Date,
        updated_at: Date
    ) {
        this._id = id;
        this._cart_id = cart_id;
        this._product_id = product_id;
        this._quantity = quantity;
        this._unit_price = unit_price;
        this._created_at = created_at;
        this._updated_at = updated_at;
    }

    get id(): UUID { return this._id; }
    get cart_id(): UUID { return this._cart_id; }
    get product_id(): UUID { return this._product_id; }
    get created_at(): Date { return this._created_at; }

    get quantity(): number { return this._quantity; }
    setQuantity(quantity: number): void {
        if (quantity <= 0) throw new Error("Quantity must be greater than zero");
        this._quantity = quantity;
        this._updated_at = new Date();
    }

    get unit_price(): number { return this._unit_price; }
    setUnitPrice(unit_price: number): void {
        if (unit_price <= 0) throw new Error("Unit price must be greater than zero");
        this._unit_price = unit_price;
        this._updated_at = new Date();
    }

    get updated_at(): Date { return this._updated_at; }

    get subtotal(): number {
        return this._quantity * this._unit_price;
    }
}

export class Cart {
    private _id: UUID;
    private _store_id: UUID;
    private _customer_id: UUID;
    private _items: CartItem[];
    private _created_at: Date;
    private _updated_at: Date;

    constructor(
        id: UUID,
        store_id: UUID,
        customer_id: UUID,
        items: CartItem[],
        created_at: Date,
        updated_at: Date
    ) {
        this._id = id;
        this._store_id = store_id;
        this._customer_id = customer_id;
        this._items = items;
        this._created_at = created_at;
        this._updated_at = updated_at;
    }

    get id(): UUID { return this._id; }
    get store_id(): UUID { return this._store_id; }
    get customer_id(): UUID { return this._customer_id; }
    get created_at(): Date { return this._created_at; }
    get updated_at(): Date { return this._updated_at; }

    get items(): CartItem[] { return this._items; }
    setItems(items: CartItem[]): void {
        this._items = items;
        this._updated_at = new Date();
    }

    get total(): number {
        return this._items.reduce((sum, item) => sum + item.subtotal, 0);
    }

    get itemCount(): number {
        return this._items.reduce((sum, item) => sum + item.quantity, 0);
    }
}