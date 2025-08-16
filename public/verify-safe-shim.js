/* verify-safe-shim.js — Unicode-safe sanitize (keeps Japanese), escapes only dangerous chars.
 * Use with textContent/asText only (never innerHTML).
 */
"use strict";

/** Escape minimal HTML-dangerous characters while keeping all Unicode (NFC). */
export function sanitizeUnicode(input) {
  const str = String(input).normalize("NFC");
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;" };
  return str.replace(/[&<>"'/]/g, ch => map[ch]); // keep all Unicode, escape dangerous only
}

/** Convenience wrapper */
export function safeText(input) {
  return sanitizeUnicode(input);
}

const SafeShim = { sanitizeUnicode, safeText };
export default SafeShim;

// Optional UMD-lite exposure for non-module consumers
try {
  if (typeof window !== "undefined") {
    window.SafeShim = window.SafeShim || SafeShim;
  }
} catch (_e) { /* no-op */ }