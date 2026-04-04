import { Customer, CustomerStatus } from '../models/Customer';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

interface CreateCustomerDTO {
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
        const existingCustomer = await this.repository.findByEmail(data.email);
        if (existingCustomer) {
            throw new Error('Email already registered');
        }

        const password_hash = await bcrypt.hash(data.password, 10);

        const customer = new Customer(
            randomUUID(),
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

    async getCustomerById(id: string): Promise<Customer> {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }

    async updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        if (data.name) customer.setName(data.name);
        if (data.taxId) customer.setTaxId(data.taxId);
        if (data.email) customer.setEmail(data.email);
        if (data.phone) customer.setPhone(data.phone);
        if (data.status) customer.setStatus(data.status);

        return await this.repository.update(customer);
    }

    async deleteCustomer(id: string): Promise<void> {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        await this.repository.softDelete(id);
    }

    async listCustomers(page: number = 1, limit: number = 50): Promise<Customer[]> {
        const offset = (page - 1) * limit;
        return await this.repository.findAll(limit, offset);
    }

    async validateCredentials(email: string, password: string): Promise<Customer> {
        const customer = await this.repository.findByEmail(email);
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
