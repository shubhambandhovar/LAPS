/**
 * In-memory token storage for short-lived access JWT (~15 min).
 * Prevents XSS secret theft by never writing tokens to localStorage or sessionStorage.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
