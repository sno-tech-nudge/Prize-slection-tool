/** Signs/verifies the session cookie using Web Crypto (`crypto.subtle`) instead of Node's
 *  `crypto` module, so this same code runs unmodified in both the Node server actions/pages
 *  AND the Edge middleware that gates every internal route. */

const SECRET = process.env.AUTH_SECRET || 'insecure-dev-secret-set-AUTH_SECRET-in-env';

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64Url(sig);
}

export async function signSession(userId: string): Promise<string> {
  const sig = await hmac(userId);
  return `${userId}.${sig}`;
}

/** Returns the userId if the token's signature is valid, otherwise null — never trust the
 *  userId portion of a cookie value without checking this first. */
export async function verifySession(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(userId);
  if (sig.length !== expected.length) return null;
  // constant-time-ish comparison — timingSafeEqual isn't available outside Node, this is a
  // reasonable Edge-compatible approximation for an internal tool's session cookie
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
