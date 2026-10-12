import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { AUTH_COOKIE, SESSION_DURATION_DAYS } from './constants';
import { claimLegacyData } from './legacy';

const SCRYPT_KEYLEN = 64;

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
};

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });

  const expected = Buffer.from(expectedHash, 'hex');
  if (expected.length !== derived.length) return false;
  return crypto.timingSafeEqual(expected, derived);
}

function toSafeUser(user: { id: string; email: string; name: string | null }): SafeUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      sessionTokenHash: sha256(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function invalidateSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionTokenHash: sha256(token) } });
  }
  cookieStore.delete(AUTH_COOKIE);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session) {
    // Cookie mutation is not permitted while rendering Server Components.
    // The invalid cookie will be replaced on the next successful login.
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    // Cookie mutation is not permitted while rendering Server Components.
    // The invalid cookie will be replaced on the next successful login.
    return null;
  }

  await claimLegacyData(session.user.id);
  return toSafeUser(session.user);
}


export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireGuest() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');
}

export async function requireApiUser() {
  return getCurrentUser();
}
