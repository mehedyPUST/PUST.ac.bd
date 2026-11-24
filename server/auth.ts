import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ApprovalStatus, AuthUser, UserRole } from '../src/types/pust';

export const AUTH_COOKIE_NAME = 'pust_token';

const globalForAuth = globalThis as unknown as { __pustEphemeralJwtSecret?: string };
const EPHEMERAL_JWT_SECRET =
  globalForAuth.__pustEphemeralJwtSecret ??
  (globalForAuth.__pustEphemeralJwtSecret = crypto.randomBytes(32).toString('hex'));

function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_JWT_SECRET;
}

export interface JwtClaims {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  departmentCode: string;
  academicId: string;
  session?: string;
  hallAffiliation: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: JwtClaims;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, expectedBuf);
}

export function timingSafeStringMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signAuthToken(user: AuthUser): string {
  const claims: JwtClaims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    approvalStatus: user.approvalStatus,
    departmentCode: user.departmentCode,
    academicId: user.academicId,
    session: user.session,
    hallAffiliation: user.hallAffiliation,
  };
  return jwt.sign(claims, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

export function verifyAuthToken(token: string): JwtClaims | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });
    if (typeof decoded !== 'object' || decoded === null) return null;
    const claims = decoded as JwtClaims;
    if (!claims.sub || !claims.email || !claims.role) return null;
    return claims;
  } catch {
    return null;
  }
}

export function optionalAuth(req: AuthenticatedRequest): JwtClaims | null {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || !token) return null;
  const claims = verifyAuthToken(token);
  if (claims && claims.approvalStatus === 'approved') {
    req.authUser = claims;
    return claims;
  }
  return null;
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return false;
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isSecure = isHttpsRequest(req);
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Max-Age=604800',
  ];

  if (isSecure) {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isSecure = isHttpsRequest(req);
  const parts = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
  ];

  if (isSecure) {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function verifySameOriginMutation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      const expectedHost = host.split(',')[0].trim();
      if (originHost === expectedHost) {
        next();
        return;
      }
      res.status(403).json({ error: 'Cross-origin mutation rejected' });
      return;
    } catch {
      res.status(403).json({ error: 'Invalid Origin header' });
      return;
    }
  }

  if (hasCustomHeader) {
    next();
    return;
  }

  res.status(403).json({ error: 'Missing same-origin verification header' });
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || !token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const claims = verifyAuthToken(token);
  if (!claims) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  if (claims.approvalStatus !== 'approved') {
    res.status(403).json({ error: 'Account pending approval by university authority' });
    return;
  }
  req.authUser = claims;
  next();
}

export function requireRoles(...allowed: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (!req.authUser || !allowed.includes(req.authUser.role)) {
        res.status(403).json({
          error: `Restricted to authorized roles (${allowed.join(', ')})`,
        });
        return;
      }
      next();
    });
  };
}
