import { UUID } from "crypto";

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    CANCELLED = 'cancelled',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered'
}

export class Address {
    private _id: UUID;
    private _order_id: UUID;
    private _street: string;
    private _number: string;
    private _complement?: string;
    private _neighborhood: string;
    private _city: string;
    private _state: string;
    private _zip_code: string;
    private _created_at: Date;

    constructor(
        id: UUID,
        order_id: UUID,
        street: string,
        number: string,
        neighborhood: string,
        city: string,
        state: string,
        zip_code: string,
        created_at: Date,
        complement?: string
    ) {
        this._id = id;
        this._order_id = order_id;
        this._street = street;
        this._number = number;
        this._neighborhood = neighborhood;
        this._city = city;
        this._state = state;
        this._zip_code = zip_code;
        this._created_at = created_at;
        this._complement = complement;
    }

    get id(): UUID { return this._id; }
    get order_id(): UUID { return this._order_id; }
    get street(): string { return this._street; }
    get number(): string { return this._number; }
    get complement(): string | undefined { return this._complement; }
    get neighborhood(): string { return this._neighborhood; }
    get city(): string { return this._city; }
    get state(): string { return this._state; }
    get zip_code(): string { return this._zip_code; }
    get created_at(): Date { return this._created_at; }
}

export class OrderItem {
    private _id: UUID;
    private _order_id: UUID;
    private _product_id: UUID;
    private _quantity: number;
    private _unit_price: number;
    private _created_at: Date;

    constructor(
        id: UUID,
        order_id: UUID,
        product_id: UUID,
        quantity: number,
        unit_price: number,
        created_at: Date
    ) {
        this._id = id;
        this._order_id = order_id;
        this._product_id = product_id;
        this._quantity = quantity;
        this._unit_price = unit_price;
        this._created_at = created_at;
    }

    get id(): UUID { return this._id; }
    get order_id(): UUID { return this._order_id; }
    get product_id(): UUID { return this._product_id; }
    get quantity(): number { return this._quantity; }
    get unit_price(): number { return this._unit_price; }
    get created_at(): Date { return this._created_at; }

    get subtotal(): number {
        return this._quantity * this._unit_price;
    }
}

export class Order {
    private _id: UUID;
    private _store_id: UUID;
    private _customer_id: UUID;
    private _status: OrderStatus;
    private _total: number;
    private _items: OrderItem[];
    private _address?: Address;
    private _created_at: Date;
    private _updated_at: Date;
    private _deleted_at?: Date | null;

    constructor(
        id: UUID,
        store_id: UUID,
        customer_id: UUID,
        status: OrderStatus,
        total: number,
        items: OrderItem[],
        created_at: Date,
        updated_at: Date,
        address?: Address,
        deleted_at?: Date | null
    ) {
        this._id = id;
        this._store_id = store_id;
        this._customer_id = customer_id;
        this._status = status;
        this._total = total;
        this._items = items;
        this._created_at = created_at;
        this._updated_at = updated_at;
        this._address = address;
        this._deleted_at = deleted_at;
    }

    get id(): UUID { return this._id; }
    get store_id(): UUID { return this._store_id; }
    get customer_id(): UUID { return this._customer_id; }
    get created_at(): Date { return this._created_at; }
    get deleted_at(): Date | null | undefined { return this._deleted_at; }
    get items(): OrderItem[] { return this._items; }
    get address(): Address | undefined { return this._address; }

    get total(): number { return this._total; }
    setTotal(total: number): void {
        if (total < 0) throw new Error("Total cannot be negative");
        this._total = total;
        this._updated_at = new Date();
    }

    get status(): OrderStatus { return this._status; }
    setStatus(status: OrderStatus): void {
        this._status = status;
        this._updated_at = new Date();
    }

    get updated_at(): Date { return this._updated_at; }

    softDelete(): void {
        this._deleted_at = new Date();
        this._updated_at = new Date();
    }
}