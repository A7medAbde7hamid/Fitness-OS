import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; font-src 'self' data:;");
  res.removeHeader('X-Powered-By');
  next();
}

function maskIp(ip: string): string {
  const v4 = ip.split('.');
  if (v4.length === 4) return `${v4[0]}.${v4[1]}.*.*`;
  const v6 = ip.split(':');
  if (v6.length > 2) return v6.slice(0, 3).join(':') + '::****';
  return ip;
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;
  const ip = req.ip || req.socket.remoteAddress;
  const ts = new Date().toISOString();

  _res.on('finish', () => {
    const duration = Date.now() - start;
    const level = _res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(JSON.stringify({
      level,
      ts,
      method,
      url,
      status: _res.statusCode,
      duration,
      ip: ip ? maskIp(ip) : undefined,
    }));
  });

  next();
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(JSON.stringify({
    level: 'ERROR',
    ts: new Date().toISOString(),
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }));

  const statusCode = (err as any).statusCode || 500;

  res.status(statusCode).json({
    error: 'An internal error occurred. Please try again.',
    requestId: 'req_' + crypto.randomUUID().slice(0, 12),
  });
}
