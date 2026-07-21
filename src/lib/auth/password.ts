import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/** Node-only (scrypt isn't available in the Edge runtime) — used from server actions and
 *  one-off scripts, never from middleware. See session-token.ts for the Edge-compatible
 *  session-signing half of auth. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
