import { UUID } from "crypto";

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded'
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

export class OrderAddress {
    constructor(
        public readonly street: string,
        public readonly number: string,
        public readonly complement: string | null,
        public readonly neighborhood: string,
        public readonly city: string,
        public readonly state: string,
        public readonly zip_code: string
    ) {}
}

export class Order {
    private _id: UUID;
    private _customer_id: UUID;
    private _status: OrderStatus;
    private _payment_status: PaymentStatus;
    private _items: OrderItem[];
    private _address: OrderAddress | null;
    private _notes?: string;
    private _total: number;
    private _created_at: Date;
    private _updated_at: Date;
    private _deleted_at?: Date | null;

    constructor(
        id: UUID,
        customer_id: UUID,
        status: OrderStatus,
        payment_status: PaymentStatus,
        items: OrderItem[],
        address: OrderAddress | null,
        total: number,
        created_at: Date,
        updated_at: Date,
        notes?: string,
        deleted_at?: Date | null
    ) {
        this._id = id;
        this._customer_id = customer_id;
        this._status = status;
        this._payment_status = payment_status;
        this._items = items;
        this._address = address;
        this._total = total;
        this._created_at = created_at;
        this._updated_at = updated_at;
        this._notes = notes;
        this._deleted_at = deleted_at;
    }

    get id(): UUID { return this._id; }
    get customer_id(): UUID { return this._customer_id; }
    get items(): OrderItem[] { return this._items; }
    get address(): OrderAddress | null { return this._address; }
    get total(): number { return this._total; }
    get created_at(): Date { return this._created_at; }
    get deleted_at(): Date | null | undefined { return this._deleted_at; }
    get notes(): string | undefined { return this._notes; }

    get status(): OrderStatus { return this._status; }
    setStatus(status: OrderStatus): void {
        this._status = status;
        this._updated_at = new Date();
    }

    get payment_status(): PaymentStatus { return this._payment_status; }
    setPaymentStatus(payment_status: PaymentStatus): void {
        this._payment_status = payment_status;
        this._updated_at = new Date();
    }

    get updated_at(): Date { return this._updated_at; }

    softDelete(): void {
        this._deleted_at = new Date();
        this._updated_at = new Date();
    }
}