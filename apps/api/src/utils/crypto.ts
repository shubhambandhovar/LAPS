import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash plaintext password using Bcrypt with salt rounds = 12.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify plaintext password against Bcrypt hash.
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Hash raw refresh token using SHA-256 hex digest.
 */
export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generate cryptographically secure random refresh token string (64 hex characters).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Lightweight helper to parse User-Agent string into readable browser/OS summary.
 */
export function parseUserAgent(userAgentHeader?: string): string {
  if (!userAgentHeader) return 'Unknown Device';
  const ua = userAgentHeader.toLowerCase();
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/')) browser = 'Safari';

  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  return `${browser} on ${os}`;
}
