import { Customer, CustomerStatus } from '../models/Costumer';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

interface CreateCustomerDTO {
    store_id: string;
    name: string;
    taxId: string;
    email: string;
    phone: string;
    password: string;
}

interface UpdateCustomerDTO {
    name?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    status?: CustomerStatus;
}

export class CustomerService {
    private repository: CustomerRepository;

    constructor() {
        this.repository = new CustomerRepository();
    }

    async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
        // Validate if email already exists
        const existingCustomer = await this.repository.findByEmail(data.email, data.store_id);
        if (existingCustomer) {
            throw new Error('Email already registered');
        }

        // Hash password
        const password_hash = await bcrypt.hash(data.password, 10);

        // Create customer entity
        const customer = new Customer(
            randomUUID(),
            data.store_id as any,
            data.name,
            data.taxId,
            data.email.toLowerCase().trim(),
            data.phone,
            password_hash,
            CustomerStatus.ACTIVE,
            new Date(),
            new Date(),
            null
        );

        return await this.repository.create(customer);
    }

    async getCustomerById(id: string, store_id: string): Promise<Customer> {
        const customer = await this.repository.findById(id, store_id);
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }

    async updateCustomer(id: string, store_id: string, data: UpdateCustomerDTO): Promise<Customer> {
        const customer = await this.repository.findById(id, store_id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Update fields
        if (data.name) customer.setName(data.name);
        if (data.taxId) customer.setTaxId(data.taxId);
        if (data.email) customer.setEmail(data.email);
        if (data.phone) customer.setPhone(data.phone);
        if (data.status) customer.setStatus(data.status);

        return await this.repository.update(customer);
    }

    async deleteCustomer(id: string, store_id: string): Promise<void> {
        const customer = await this.repository.findById(id, store_id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        await this.repository.softDelete(id, store_id);
    }

    async listCustomers(store_id: string, page: number = 1, limit: number = 50): Promise<Customer[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(store_id, limit, offset);
    }

    async validateCredentials(email: string, password: string, store_id: string): Promise<Customer> {
        const customer = await this.repository.findByEmail(email, store_id);
        if (!customer) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, customer.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        if (customer.status !== CustomerStatus.ACTIVE) {
            throw new Error('Account is not active');
        }

        return customer;
    }
}
