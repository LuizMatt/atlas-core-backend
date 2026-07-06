import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
    attempts: number;
    lockUntil: number;
    backoffLevel: number;
}

const failedAttemptsMap = new Map<string, RateLimitInfo>();

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    const key = `login_fail:${email.toLowerCase().trim()}:${ip}`;
    const info = failedAttemptsMap.get(key);

    if (info && info.lockUntil > Date.now()) {
        const remainingSeconds = Math.ceil((info.lockUntil - Date.now()) / 1000);
        res.status(429).json({
            error: `Muitas tentativas falhas. Aguarde ${remainingSeconds} segundos antes de tentar novamente.`,
            retryAfter: remainingSeconds
        });
        return;
    }

    next();
};

export const recordLoginFailure = (email: string, ip: string): number => {
    const key = `login_fail:${email.toLowerCase().trim()}:${ip}`;
    const info = failedAttemptsMap.get(key) || { attempts: 0, lockUntil: 0, backoffLevel: 0 };

    info.attempts += 1;
    
    let lockDuration = 0;
    if (info.attempts >= 5) {
        const backoffSeconds = [30, 60, 120, 300];
        const index = Math.min(info.backoffLevel, backoffSeconds.length - 1);
        lockDuration = backoffSeconds[index] * 1000;
        
        info.lockUntil = Date.now() + lockDuration;
        info.backoffLevel += 1;
        info.attempts = 0;
    }

    failedAttemptsMap.set(key, info);
    return lockDuration;
};

export const clearLoginAttempts = (email: string, ip: string): void => {
    const key = `login_fail:${email.toLowerCase().trim()}:${ip}`;
    failedAttemptsMap.delete(key);
};
