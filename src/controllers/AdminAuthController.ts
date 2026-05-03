import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import jwt from 'jsonwebtoken';

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'fallback_admin_secret_key';

export class AdminAuthController {
    private service: AdminService;

    constructor() {
        this.service = new AdminService();
    }

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }

            const admin = await this.service.validateCredentials(email, password);

            const token = jwt.sign(
                { sub: admin.id },
                JWT_ADMIN_SECRET,
                { expiresIn: '1h' }
            );

            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            res.status(200).json({
                message: 'Login successful',
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    status: admin.status
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
        res.clearCookie('admin_token');
        res.status(200).json({ message: 'Logout successful' });
    };

    me = async (req: Request, res: Response): Promise<void> => {
        try {
            const adminId = req.admin?.id;
            
            if (!adminId) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const admin = await this.service.getAdminById(adminId);

            res.status(200).json({
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    status: admin.status,
                    created_at: admin.created_at
                }
            });
        } catch (error: any) {
            if (error.message === 'Admin not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
