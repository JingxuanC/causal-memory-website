import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Alpha Desk offline license signing.
 *
 * The product verifies `ADK1.<payload>.<signature>` with an ECDSA P-256 public
 * key and falls back to Free when the signature is missing or invalid. This
 * module signs the same wire format with the private half:
 *
 *   payload   = base64url(JSON UTF-8)
 *   signature = base64url(DER ECDSA P-256 / SHA-256)
 *
 * The private key is a deployment secret. It must never be committed, logged,
 * or returned to the browser.
 */

export type AlphaPlan = "pro" | "memory";

export type AlphaLicensePayload = {
  v: 1;
  sub: string;
  plan: AlphaPlan;
  iat: number;
  exp: number;
  features: string[];
  cloud_key?: string;
};

function base64url(data: Buffer): string {
  return data.toString("base64url");
}

function readPem(inline: string | undefined, file: string | undefined, label: string): string {
  if (inline && inline.trim()) return inline.replace(/\\n/g, "\n");
  if (file) {
    try {
      return readFileSync(file, "utf8");
    } catch {
      throw new Error(`${label} 无法读取: ${file}`);
    }
  }
  throw new Error(`未配置 ${label}`);
}

export function loadSigningKey(): string {
  return readPem(
    process.env.ALPHA_LICENSE_PRIVATE_KEY,
    process.env.ALPHA_LICENSE_PRIVATE_KEY_PATH,
    "ALPHA_LICENSE_PRIVATE_KEY",
  );
}

export function loadPublicKey(): string | null {
  try {
    return readPem(
      process.env.ALPHA_LICENSE_PUBLIC_KEY,
      process.env.ALPHA_LICENSE_PUBLIC_KEY_PATH,
      "ALPHA_LICENSE_PUBLIC_KEY",
    );
  } catch {
    return null;
  }
}

/**
 * Sign one license payload. The returned string is the complete `ADK1.…` key.
 */
export function signAlphaLicense(payload: AlphaLicensePayload, privateKeyPem: string): string {
  const raw = Buffer.from(JSON.stringify(payload), "utf8");
  const signature = sign("sha256", raw, {
    key: createPrivateKey(privateKeyPem),
    dsaEncoding: "der",
  });
  return `ADK1.${base64url(raw)}.${base64url(signature)}`;
}

/**
 * Verify the just-signed key before it is returned. A deployment that supplies
 * the public key gets a hard failure instead of handing out an unusable key.
 */
export function assertLicenseVerifies(key: string, publicKeyPem: string | null): void {
  if (!publicKeyPem) return;
  const parts = key.split(".");
  if (parts.length !== 3 || parts[0] !== "ADK1") throw new Error("license 格式错误");
  const raw = Buffer.from(parts[1], "base64url");
  const signature = Buffer.from(parts[2], "base64url");
  const ok = verify("sha256", raw, { key: createPublicKey(publicKeyPem), dsaEncoding: "der" }, signature);
  if (!ok) throw new Error("license 自检失败：签名与公钥不匹配");
}

export function licenseDays(): number {
  const raw = Number(process.env.ALPHA_LICENSE_DAYS ?? 365);
  return Number.isFinite(raw) && raw > 0 ? Math.min(3650, Math.floor(raw)) : 365;
}
