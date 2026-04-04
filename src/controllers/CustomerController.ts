import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';

export class CustomerController {
    private service: CustomerService;

    constructor() {
        this.service = new CustomerService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, taxId, email, phone, password } = req.body;

            if (!name || !taxId || !email || !phone || !password) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const customer = await this.service.createCustomer({ name, taxId, email, phone, password });

            res.status(201).json({
                id: customer.id,
                name: customer.name,
                taxId: customer.taxId,
                email: customer.email,
                phone: customer.phone,
                status: customer.status,
                created_at: customer.created_at
            });
        } catch (error: any) {
            if (error.message === 'Email already registered') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const customer = await this.service.getCustomerById(id);

            res.status(200).json({
                id: customer.id,
                name: customer.name,
                taxId: customer.taxId,
                email: customer.email,
                phone: customer.phone,
                status: customer.status,
                created_at: customer.created_at,
                updated_at: customer.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const customer = await this.service.updateCustomer(id, req.body);

            res.status(200).json({
                id: customer.id,
                name: customer.name,
                taxId: customer.taxId,
                email: customer.email,
                phone: customer.phone,
                status: customer.status,
                updated_at: customer.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.service.deleteCustomer(id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const { page = '1', limit = '50' } = req.query;

            const customers = await this.service.listCustomers(
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                data: customers.map(customer => ({
                    id: customer.id,
                    name: customer.name,
                    taxId: customer.taxId,
                    email: customer.email,
                    phone: customer.phone,
                    status: customer.status,
                    created_at: customer.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
