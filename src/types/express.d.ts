declare namespace Express {
    interface Request {
        admin?: { id: string };
        customer?: { id: string };
    }
}
