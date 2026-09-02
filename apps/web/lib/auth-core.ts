import { getAuthConfig, verifyPassword } from "@/lib/auth-store";

export const AUTH_COOKIE_NAME = "chu-ky-12-session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type AuthSession = { username: string; expiresAt: number };

const encoder = new TextEncoder();

function toBase64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index % Math.max(1, leftBytes.length)] ?? 0) ^ (rightBytes[index % Math.max(1, rightBytes.length)] ?? 0);
  }
  return difference === 0;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(username: string) {
  const session: AuthSession = {
    username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const config = await getAuthConfig();
  if (!config) throw new Error("Authentication is not configured");
  const signature = await sign(payload, config.secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<AuthSession | null> {
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  const config = await getAuthConfig();
  const expectedSignature = payload && config ? await sign(payload, config.secret) : null;
  if (!payload || !providedSignature || !expectedSignature || !constantTimeEqual(expectedSignature, providedSignature)) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AuthSession;
    if (!session.username || !Number.isInteger(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function verifyCredentials(username: string, password: string) {
  const config = await getAuthConfig();
  if (!config || !constantTimeEqual(username, config.username)) return false;
  return verifyPassword(password, config.salt, config.passwordHash);
}

export async function isAuthConfigured() {
  return Boolean(await getAuthConfig());
}

export function useSecureCookie() {
  return process.env.AUTH_COOKIE_SECURE === "true";
}
