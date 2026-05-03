import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'fallback_admin_secret_key';

interface AdminJwtPayload {
    sub: string;
}

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.admin_token;

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, JWT_ADMIN_SECRET) as AdminJwtPayload;
        
        req.admin = {
            id: decoded.sub
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
