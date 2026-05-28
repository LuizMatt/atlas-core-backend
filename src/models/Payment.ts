import { UUID } from "crypto";

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    EXPIRED = 'expired'
}

export enum PaymentMethod {
    PIX = 'pix'
}

export class Payment {
    private _id: UUID;
    private _order_id: UUID;
    private _gateway: string;
    private _gateway_payment_id: string;
    private _amount: number; // in cents
    private _currency: string;
    private _status: PaymentStatus;
    private _payment_method: PaymentMethod;
    private _gateway_metadata?: any;
    private _pix_br_code?: string;
    private _pix_br_code_base64?: string;
    private _pix_expires_at?: Date;
    private _paid_at?: Date | null;
    private _created_at: Date;
    private _updated_at: Date;

    constructor(
        id: UUID,
        order_id: UUID,
        gateway: string,
        gateway_payment_id: string,
        amount: number,
        currency: string,
        status: PaymentStatus,
        payment_method: PaymentMethod,
        created_at: Date,
        updated_at: Date,
        gateway_metadata?: any,
        pix_br_code?: string,
        pix_br_code_base64?: string,
        pix_expires_at?: Date,
        paid_at?: Date | null
    ) {
        this._id = id;
        this._order_id = order_id;
        this._gateway = gateway;
        this._gateway_payment_id = gateway_payment_id;
        this._amount = amount;
        this._currency = currency;
        this._status = status;
        this._payment_method = payment_method;
        this._created_at = created_at;
        this._updated_at = updated_at;
        this._gateway_metadata = gateway_metadata;
        this._pix_br_code = pix_br_code;
        this._pix_br_code_base64 = pix_br_code_base64;
        this._pix_expires_at = pix_expires_at;
        this._paid_at = paid_at;
    }

    get id(): UUID { return this._id; }
    get order_id(): UUID { return this._order_id; }
    get gateway(): string { return this._gateway; }
    get gateway_payment_id(): string { return this._gateway_payment_id; }
    get amount(): number { return this._amount; }
    get currency(): string { return this._currency; }
    
    get status(): PaymentStatus { return this._status; }
    setStatus(status: PaymentStatus): void {
        this._status = status;
        this._updated_at = new Date();
    }

    get payment_method(): PaymentMethod { return this._payment_method; }
    
    get gateway_metadata(): any { return this._gateway_metadata; }
    setGatewayMetadata(metadata: any): void {
        this._gateway_metadata = metadata;
        this._updated_at = new Date();
    }

    get pix_br_code(): string | undefined { return this._pix_br_code; }
    get pix_br_code_base64(): string | undefined { return this._pix_br_code_base64; }
    get pix_expires_at(): Date | undefined { return this._pix_expires_at; }

    get paid_at(): Date | null | undefined { return this._paid_at; }
    setPaidAt(paid_at: Date | null): void {
        this._paid_at = paid_at;
        this._updated_at = new Date();
    }

    get created_at(): Date { return this._created_at; }
    get updated_at(): Date { return this._updated_at; }
}
