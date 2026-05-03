import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
    private service: AdminService;

    constructor() {
        this.service = new AdminService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email) {
                res.status(400).json({ error: 'Name and email are required' });
                return;
            }

            const admin = await this.service.createAdmin({ name, email, password });

            res.status(201).json({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                status: admin.status,
                created_at: admin.created_at
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
            const admin = await this.service.getAdminById(id);

            res.status(200).json({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                status: admin.status,
                created_at: admin.created_at,
                updated_at: admin.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Admin not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const admin = await this.service.updateAdmin(id, req.body);

            res.status(200).json({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                status: admin.status,
                updated_at: admin.updated_at
            });
        } catch (error: any) {
            if (error.message === 'Admin not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            
            // Prevent self-deletion if needed (optional, assuming req.admin.id exists)
            if (req.admin?.id === id) {
                res.status(400).json({ error: 'Cannot delete yourself' });
                return;
            }

            await this.service.deleteAdmin(id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Admin not found') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const { page = '1', limit = '50' } = req.query;

            const admins = await this.service.listAdmins(
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                data: admins.map(admin => ({
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    status: admin.status,
                    created_at: admin.created_at
                })),
                page: parseInt(page as string),
                limit: parseInt(limit as string)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
