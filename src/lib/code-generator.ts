/**
 * Generates secure, unambiguous participant codes for KWISATZ HADERACH.
 * Format: KH26-XXXXX (e.g., KH26-7M9WK)
 * Alphabet: 30 chars (excludes 0, O, 1, I to eliminate participant confusion)
 */

const SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateParticipantCode(prefix = "KH26"): string {
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_ALPHABET.length);
    suffix += SAFE_ALPHABET[randomIndex];
  }
  return `${prefix}-${suffix}`;
}

export function normalizeParticipantCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
