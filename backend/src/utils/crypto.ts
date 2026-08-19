// backend/src/utils/crypto.ts
// Crypto utilities

import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { hash as argon2Hash, verify as argon2Verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, {
    type: 2, // argon2id
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify(hash, password);
  } catch {
    return false;
  }
}

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateNumericId(length: number = 6): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

export function hashSHA256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hmacSHA256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expected = hmacSHA256(data, secret);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function generateApiKey(prefix: string = 'amt'): Promise<{ key: string; prefix: string; hash: string }> {
  const key = `${prefix}_${randomBytes(24).toString('base64url')}`;
  const hash = await hashPassword(key);
  return { key, prefix: key.slice(0, 8), hash };
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateEnrollmentToken(): string {
  return randomBytes(32).toString('hex');
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => 
    randomBytes(4).toString('hex').toUpperCase()
  );
}