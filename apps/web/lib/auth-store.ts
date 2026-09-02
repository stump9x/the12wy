import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

type StoredAccount = {
  username: string;
  salt: string;
  passwordHash: string;
  secret: string;
  createdAt: string;
};

export type AuthConfig =
  | { username: string; secret: string; password: string }
  | { username: string; secret: string; salt: string; passwordHash: string };

function accountPath() {
  const dataDirectory = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
  return path.join(dataDirectory, "auth-account.json");
}

function validSecret(secret: string | undefined): secret is string {
  return Boolean(secret && secret.length >= 32);
}

async function readStoredAccount(): Promise<StoredAccount | null> {
  try {
    const account = JSON.parse(await readFile(accountPath(), "utf8")) as StoredAccount;
    if (!account.username || !account.salt || !account.passwordHash || !validSecret(account.secret)) return null;
    return account;
  } catch {
    return null;
  }
}

export async function getAuthConfig(): Promise<AuthConfig | null> {
  const username = process.env.AUTH_USERNAME?.trim();
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (username && password && validSecret(secret)) return { username, password, secret };

  const account = await readStoredAccount();
  return account ? { username: account.username, salt: account.salt, passwordHash: account.passwordHash, secret: account.secret } : null;
}

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, derivedKey) => error ? reject(error) : resolve(derivedKey));
  });
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = await derivePassword(password, salt);
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function createAuthAccount(username: string, password: string) {
  if (await getAuthConfig()) throw new Error("An account already exists");
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await derivePassword(password, salt)).toString("hex");
  const account: StoredAccount = { username, salt, passwordHash, secret: randomBytes(48).toString("hex"), createdAt: new Date().toISOString() };
  const destination = accountPath();
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(account, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, destination);
  return account;
}
