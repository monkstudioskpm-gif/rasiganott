import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-rasigan-secret-key-change-in-prod-123456789';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '102651788040-f80qjr6hok5b2i1nt8pcke7bnnr035j8.apps.googleusercontent.com';

function getAdminEmails(): string[] {
  const envAdmins = process.env.ADMIN_EMAILS || 'sambavangalmedia@gmail.com,monkstudioskpm@gmail.com,admin@rasigan.com';
  return envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getCreatorEmails(): string[] {
  const envCreators = process.env.CREATOR_EMAILS || 'creator@rasigan.com,cupice@rasigan.com';
  return envCreators
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Minimal, zero-dependency signed JWT functions
function signJwt(payload: Record<string, any>, secret: string, expiresInDays = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const data = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

function verifyJwt(token: string, secret: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header: rasigan_token=<token>
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('rasigan_token='));
    if (match) {
      return decodeURIComponent(match.split('=')[1]);
    }
  }

  return null;
}

/**
 * POST /api/auth/google
 * Receives Google ID Token (credential), verifies against Google OAuth API,
 * automatically detects role (ADMIN, CREATOR, or USER),
 * upserts record in PostgreSQL (Supabase) User table,
 * and returns signed JWT cookie and user info.
 */
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Google credential (ID token) is required',
        },
      });
      return;
    }

    // 1. Verify ID token with Google's official Tokeninfo API
    const googleVerifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleVerifyRes.ok) {
      const errText = await googleVerifyRes.text();
      console.warn('Google tokeninfo verification failed:', errText);
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIAL',
          message: 'Invalid or expired Google credential',
        },
      });
      return;
    }

    const tokenData = (await googleVerifyRes.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: string | boolean;
      aud?: string;
    };

    if (!tokenData.sub || !tokenData.email) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Token does not contain required user identifiers',
        },
      });
      return;
    }

    const email = tokenData.email.toLowerCase().trim();
    const name = tokenData.name || email.split('@')[0];
    const avatarUrl = tokenData.picture || null;
    const googleId = tokenData.sub;

    // 2. Automatic Role Detection
    const adminEmails = getAdminEmails();
    const creatorEmails = getCreatorEmails();

    let detectedRole: 'ADMIN' | 'CREATOR' | 'USER' = 'USER';

    if (adminEmails.includes(email)) {
      detectedRole = 'ADMIN';
    } else if (creatorEmails.includes(email)) {
      detectedRole = 'CREATOR';
    } else {
      // Check if email or name matches an existing creator payout in database
      try {
        const creatorMatch = await prisma.creatorPayout.findFirst({
          where: {
            OR: [
              { creatorName: { contains: name, mode: 'insensitive' } },
              { creatorName: { contains: email.split('@')[0], mode: 'insensitive' } },
            ],
          },
        });
        if (creatorMatch) {
          detectedRole = 'CREATOR';
        }
      } catch (dbErr) {
        console.warn('DB check for creator role skipped:', dbErr);
      }
    }

    // 3. Upsert user record in Supabase PostgreSQL database
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { googleId },
        update: {
          email,
          name,
          avatarUrl,
          role: detectedRole === 'ADMIN' ? 'ADMIN' : 'USER',
        },
        create: {
          googleId,
          email,
          name,
          avatarUrl,
          role: detectedRole === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      });
    } catch (saveErr) {
      console.warn('Could not save user to PostgreSQL DB (connection issue), proceeding with memory session:', saveErr);
      dbUser = {
        id: `usr_${googleId.slice(0, 8)}`,
        googleId,
        email,
        name,
        avatarUrl,
        role: detectedRole === 'ADMIN' ? 'ADMIN' : 'USER',
      };
    }

    // 4. Issue JWT
    const tokenPayload = {
      id: dbUser.id,
      googleId,
      email,
      name,
      avatarUrl,
      role: detectedRole,
    };

    const token = signJwt(tokenPayload, JWT_SECRET, 7);

    // Set secure cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rasigan_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        googleId,
        email,
        name,
        avatarUrl,
        role: detectedRole,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and role from JWT cookie/header
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.json({ user: null });
      return;
    }

    const payload = verifyJwt(token, JWT_SECRET);
    if (!payload) {
      res.json({ user: null });
      return;
    }

    // If user exists in DB, refresh name & avatar
    let freshUser = payload;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
      });
      if (dbUser) {
        freshUser = {
          ...payload,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role === 'ADMIN' ? 'ADMIN' : payload.role,
        };
      }
    } catch {}

    res.json({ user: freshUser });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clears authentication cookie
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('rasigan_token', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ success: true });
});

export default router;
