import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_customer_secret_key';

interface CustomerJwtPayload {
    sub: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.customer_token;

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as CustomerJwtPayload;
        
        req.customer = {
            id: decoded.sub
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
