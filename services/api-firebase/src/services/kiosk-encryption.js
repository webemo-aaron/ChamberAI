import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const HASH = "sha256";

/**
 * Encrypt an API key using AES-256-GCM with PBKDF2 key derivation
 * Returns a packed string: base64(salt + iv + ciphertext + auth_tag)
 * @param {string} plaintext - API key to encrypt
 * @param {string} password - Encryption password (typically from env)
 * @returns {string} - Packed encrypted key
 */
export function encryptApiKey(plaintext, password) {
  if (!plaintext || !password) {
    throw new Error("plaintext and password are required");
  }

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
  return packed.toString("base64");
}

/**
 * Decrypt an API key encrypted with encryptApiKey()
 * @param {string} packed - Packed encrypted key from encryptApiKey()
 * @param {string} password - Encryption password (must match encryption password)
 * @returns {string} - Decrypted API key
 * @throws {Error} - If authentication fails or decryption fails
 */
export function decryptApiKey(packed, password) {
  if (!packed || !password) {
    throw new Error("packed and password are required");
  }

  try {
    const buffer = Buffer.from(packed, "base64");

    // Extract components
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = buffer.slice(SALT_LENGTH + IV_LENGTH, buffer.length - TAG_LENGTH);
    const authTag = buffer.slice(buffer.length - TAG_LENGTH);

    // Derive decryption key using same parameters
    const key = pbkdf2Sync(password, salt, ITERATIONS, 32, HASH);

    // Create decipher and decrypt
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Sanitize a message to remove PII patterns
 * Removes: email addresses, phone numbers, SSNs, credit card numbers
 * @param {string} message - Message to sanitize
 * @returns {string} - Sanitized message
 */
export function sanitizeMessage(message) {
  if (!message || typeof message !== "string") {
    return message;
  }

  let sanitized = message;

  // Remove email addresses
  sanitized = sanitized.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, "[EMAIL]");

  // Remove phone numbers (various formats)
  sanitized = sanitized.replace(/(\+?1?\s?)?(\(?\d{3}\)?[\s\.-]?)?\d{3}[\s\.-]?\d{4}/g, "[PHONE]");

  // Remove SSN (XXX-XX-XXXX or XXXXXXXXX)
  sanitized = sanitized.replace(/\d{3}-\d{2}-\d{4}|\d{9}/g, "[SSN]");

  // Remove credit card numbers (Visa, Mastercard, Amex, etc)
  sanitized = sanitized.replace(/\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g, "[CARD]");

  // Remove social security and passport patterns
  sanitized = sanitized.replace(/(?:SSN|Social Security|Passport)[:\s]*[\w\-]+/gi, "[PII]");

  // Remove API keys and tokens (look for common patterns)
  sanitized = sanitized.replace(/(?:api[_-]?key|token|secret|password)[:\s]*[\w\-\.]+/gi, "[SECRET]");

  return sanitized;
}

/**
 * Sanitize HTML/text to remove script tags and dangerous content
 * @param {string} text - HTML or text to sanitize
 * @returns {string} - Sanitized text with tags stripped
 */
export function sanitizeHtml(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  let sanitized = text;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove meta tags
  sanitized = sanitized.replace(/<meta[^>]*>/gi, "");

  // Remove dangerous protocols in href/src
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']javascript:[^"']*["']/gi, "");
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']data:text\/html[^"']*["']/gi, "");

  return sanitized;
}
