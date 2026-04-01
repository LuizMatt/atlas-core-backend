import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../repositories/CustomerRepository';

const repository = new CustomerRepository();

export const validateCustomerStore = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const store_id = (req.body.store_id || req.query.store_id) as string;
        const customer_id = (req.body.customer_id || req.query.customer_id) as string;

        if (!store_id || !customer_id) {
            res.status(400).json({ error: 'store_id and customer_id are required' });
            return;
        }
        const customer = await repository.findById(customer_id, store_id);
        if (!customer) {
            res.status(403).json({ error: 'Customer does not belong to this store' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};