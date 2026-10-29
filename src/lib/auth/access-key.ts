import crypto from "crypto";

/**
 * Prefix for human recognition of Awaz anonymous report access keys.
 * Format: awaz_ak_<32 bytes base64url encoded>
 */
const KEY_PREFIX = "awaz_ak_";

/**
 * Generate a cryptographically strong, high-entropy secret access key.
 */
export function generateAccessKey(): string {
  const randomBytes = crypto.randomBytes(32);
  const encoded = randomBytes.toString("base64url");
  return `${KEY_PREFIX}${encoded}`;
}

/**
 * Compute an irreversible cryptographic SHA-256 hash of the access key.
 * Only this hash is stored in the database.
 */
export function hashAccessKey(key: string): string {
  return crypto.createHash("sha256").update(key.trim()).digest("hex");
}

/**
 * Verify whether an access key matches the stored hash in constant time
 * to prevent timing side-channel attacks.
 */
export function verifyAccessKey(providedKey: string, storedHash: string | null | undefined): boolean {
  if (!providedKey || !storedHash) {
    return false;
  }

  const computedHash = hashAccessKey(providedKey);
  const computedBuffer = Buffer.from(computedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, storedBuffer);
}
