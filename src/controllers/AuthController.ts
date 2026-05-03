import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_customer_secret_key';

export class AuthController {
    private service: CustomerService;

    constructor() {
        this.service = new CustomerService();
    }

    register = async (req: Request, res: Response): Promise<void> => {
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
                email: customer.email,
                status: customer.status,
            });
        } catch (error: any) {
            if (error.message === 'Email already registered') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }

            const customer = await this.service.validateCredentials(email, password);

            const token = jwt.sign(
                { sub: customer.id },
                JWT_SECRET,
                { expiresIn: '7d' } // Customers usually stay logged in longer
            );

            res.cookie('customer_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(200).json({
                message: 'Login successful',
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    status: customer.status
                }
            });
        } catch (error: any) {
            if (error.message === 'Invalid credentials' || error.message === 'Account is not active') {
                res.status(401).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    logout = (req: Request, res: Response): void => {
        res.clearCookie('customer_token');
        res.status(200).json({ message: 'Logout successful' });
    };

    me = async (req: Request, res: Response): Promise<void> => {
        try {
            const customerId = req.customer?.id;
            
            if (!customerId) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const customer = await this.service.getCustomerById(customerId);

            res.status(200).json({
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    taxId: customer.taxId,
                    phone: customer.phone,
                    status: customer.status,
                    created_at: customer.created_at
                }
            });
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
