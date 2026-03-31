/**
 * Field-level encryption service for Firestore documents
 * Uses AES-256-GCM with PBKDF2 key derivation (same as kiosk-encryption.js)
 * Encrypts sensitive fields: meeting minutes, kiosk messages
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const HASH = "sha256";
const ENC_PREFIX = "enc:";

/**
 * Encrypt a field value for an organization
 * @param {string|null} plaintext - Field value to encrypt
 * @param {string} orgId - Organization ID (used in password derivation)
 * @returns {string|null} - Encrypted value prefixed with "enc:" or null if input is null
 */
export function encryptField(plaintext, orgId) {
  if (plaintext === null || plaintext === undefined) {
    return null;
  }

  if (typeof plaintext !== "string") {
    throw new Error("Only string fields can be encrypted");
  }

  if (!orgId) {
    throw new Error("orgId is required for encryption");
  }

  // Derive password from ENCRYPTION_SEED + orgId
  const seed = process.env.ENCRYPTION_SEED ?? "default";
  const password = `${orgId}-field-${seed}`;

  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive encryption key from password using PBKDF2
  const key = pbkdf2Sync(password, salt, ITERATIONS, 32, HASH);

  // Create cipher and encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Pack: salt + iv + ciphertext + auth_tag
  const packed = Buffer.concat([salt, iv, Buffer.from(encrypted, "hex"), authTag]);

  // Return with prefix for backwards compatibility detection
  return ENC_PREFIX + packed.toString("base64");
}

/**
 * Decrypt a field value for an organization
 * @param {string|null} packed - Encrypted value (from encryptField) or plaintext
 * @param {string} orgId - Organization ID (must match encryption org)
 * @returns {string|null} - Decrypted value or plaintext (if not encrypted) or null
 */
export function decryptField(packed, orgId) {
  if (packed === null || packed === undefined) {
    return null;
  }

  if (typeof packed !== "string") {
    return null;
  }

  // Backwards compatibility: if value doesn't start with "enc:", return as-is (plaintext)
  if (!packed.startsWith(ENC_PREFIX)) {
    return packed;
  }

  if (!orgId) {
    throw new Error("orgId is required for decryption");
  }

  try {
    // Remove prefix and decode base64
    const base64Value = packed.slice(ENC_PREFIX.length);
    const buffer = Buffer.from(base64Value, "base64");

    // Extract components
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = buffer.slice(SALT_LENGTH + IV_LENGTH, buffer.length - TAG_LENGTH);
    const authTag = buffer.slice(buffer.length - TAG_LENGTH);

    // Derive decryption key using same parameters
    const seed = process.env.ENCRYPTION_SEED ?? "default";
    const password = `${orgId}-field-${seed}`;
    const key = pbkdf2Sync(password, salt, ITERATIONS, 32, HASH);

    // Create decipher and decrypt
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // If decryption fails, log and return null (compromised data)
    console.error(`Decryption failed for org ${orgId}: ${error.message}`);
    return null;
  }
}
