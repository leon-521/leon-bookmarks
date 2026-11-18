import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Extracts tenant information from the JWT payload (set by JwtStrategy)
 * or from the subdomain of the incoming request and attaches it to the request object.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // If JWT auth has already populated the user with tenantId, use that
    if ((req as any).user?.tenantId) {
      (req as any).tenantId = (req as any).user.tenantId;
      return next();
    }

    // Otherwise, try to extract tenant from subdomain
    const host = req.headers.host || '';
    const parts = host.split('.');

    // If there are at least 3 parts (e.g., acme.example.com), the first part is the subdomain/slug
    if (parts.length >= 3) {
      (req as any).tenantSlug = parts[0];
    }

    next();
  }
}
