import { Request, Response, NextFunction } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
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
      ip,
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
  const safeMessage = statusCode === 500
    ? 'An internal error occurred. Please try again.'
    : err.message;

  res.status(statusCode).json({
    error: safeMessage,
    requestId: `req_${Date.now().toString(36)}`,
  });
}
