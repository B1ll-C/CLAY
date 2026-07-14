import { randomUUID } from 'node:crypto';

import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '@clay/shared';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';

import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { ApiError } from '../lib/errors.js';
import { redis } from '../lib/redis.js';

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function jwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

/** Redis key for an opaque refresh token → the userId it belongs to. */
function refreshTokenKey(token: string): string {
  return `refresh:${token}`;
}

async function issueAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecretKey());
}

async function issueRefreshToken(userId: string): Promise<string> {
  // Opaque random token, not a JWT — logout/rotation is then a plain Redis
  // delete rather than needing a signature-based revocation scheme.
  const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, '');
  await redis.set(refreshTokenKey(token), userId, 'EX', REFRESH_TOKEN_TTL_SECONDS);
  return token;
}

async function issueTokenPair(userId: string): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    issueAccessToken(userId),
    issueRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
}

export const AuthService = {
  async register(email: string, password: string): Promise<AuthTokens> {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();
    return issueTokenPair(user.id);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }
    return issueTokenPair(user.id);
  },

  /** Rotates a refresh token: the old one stops working the moment a new pair is issued. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const userId = await redis.get(refreshTokenKey(refreshToken));
    if (!userId) {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }
    await redis.del(refreshTokenKey(refreshToken));
    return issueTokenPair(userId);
  },

  async logout(refreshToken: string): Promise<void> {
    await redis.del(refreshTokenKey(refreshToken));
  },

  /** Verifies an access token's signature/expiry and returns the userId it was issued for. */
  async verifyAccessToken(token: string): Promise<string> {
    let sub: unknown;
    try {
      ({
        payload: { sub },
      } = await jwtVerify(token, jwtSecretKey()));
    } catch {
      throw new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired');
    }
    if (typeof sub !== 'string') {
      throw new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired');
    }
    return sub;
  },
};
