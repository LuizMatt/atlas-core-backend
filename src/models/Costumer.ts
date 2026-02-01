import { UUID } from "crypto";
export enum CustomerStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BLOCKED = 'blocked'
}

export class Customer {
    private _id: UUID;
    private _store_id: UUID; // ID que identifica de qual loja pertence o user
    private _name: string;
    private _taxId: string;
    private _email: string;
    private _phone: string;
    private _password_hash: string;
    private _status: CustomerStatus;
    private _created_at: Date;
    private _updated_at: Date;
    private _deleted_at?: Date | null;

    constructor(
        id: UUID,
        store_id: UUID,
        name: string,
        taxId: string,
        email: string,
        phone: string,
        password_hash: string,
        status: CustomerStatus,
        created_at: Date,
        updated_at: Date,
        deleted_at?: Date | null
    ) {
        this._id = id;
        this._store_id = store_id;
        this._name = name;
        this._taxId = taxId;
        this._email = email;
        this._phone = phone;
        this._password_hash = password_hash;
        this._status = status;
        this._created_at = created_at;
        this._updated_at = updated_at;
        this._deleted_at = deleted_at;
    }

    get id(): UUID { return this._id; }
    get store_id(): UUID { return this._store_id; }
    get created_at(): Date { return this._created_at; }
    get deleted_at(): Date | null | undefined { return this._deleted_at; }

    get name(): string { return this._name; }
    setName(name: string): void {
        if (!name?.trim()) throw new Error("Name cannot be empty");
        this._name = name.trim();
        this._updated_at = new Date();
    }

    get taxId(): string { return this._taxId; }
    setTaxId(taxId: string): void {
        if (!taxId?.trim()) throw new Error("Tax ID cannot be empty");
        this._taxId = taxId.replace(/\D/g, ''); 
        this._updated_at = new Date();
    }

    get email(): string { return this._email; }
    setEmail(email: string): void {
        if (!email?.includes('@')) throw new Error("Invalid email");
        this._email = email.toLowerCase().trim();
        this._updated_at = new Date();
    }

    get phone(): string { return this._phone; }
    setPhone(phone: string): void {
        if (!phone?.trim()) throw new Error("Phone cannot be empty");
        this._phone = phone.replace(/\D/g, ''); 
        this._updated_at = new Date();
    }

    get password_hash(): string { return this._password_hash; }
    setPasswordHash(password_hash: string): void {
        if (!password_hash) throw new Error("Password hash cannot be empty");
        this._password_hash = password_hash;
        this._updated_at = new Date();
    }

    get status(): CustomerStatus { return this._status; }
    setStatus(status: CustomerStatus): void {
        this._status = status;
        this._updated_at = new Date();
    }

    get updated_at(): Date { return this._updated_at; }

    softDelete(): void {
        this._deleted_at = new Date();
        this._updated_at = new Date();
    }
}
