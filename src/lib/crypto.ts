// AES-256-GCM at-rest encryption for BYOK LLM keys (productization §3.5).
// Key derivation: sha256(BYOK_SECRET) → 32-byte AES key, so any operator-
// chosen string works. Storage format: base64(iv ‖ ciphertext ‖ tag).

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const secret = process.env.BYOK_SECRET;
  if (!secret) throw new Error("BYOK_SECRET not configured");
  return createHash("sha256").update(secret).digest();
}

export function isByokConfigured(): boolean {
  return Boolean(process.env.BYOK_SECRET);
}

export function encryptByokKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

export function decryptByokKey(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const ct = buf.subarray(12, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/// Display-only fingerprint, e.g. "sk-123…ab12".
export function keyHint(plaintext: string): string {
  const head = plaintext.slice(0, 6);
  const tail = plaintext.slice(-4);
  return `${head}…${tail}`;
}
