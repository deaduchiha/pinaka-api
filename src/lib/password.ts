// PBKDF2-SHA256 using Web Crypto (Workers-native)
// Format: pbkdf2$sha256$<iterations>$<salt-b64url>$<hash-b64url>

const ITERATIONS = 150_000; // tune as needed
const KEYLEN_BITS = 256; // 32 bytes
const ALG = "SHA-256";

const te = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  const binary = atob(s + "=".repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations = ITERATIONS
) {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: ALG },
    key,
    KEYLEN_BITS
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, iterations = ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return `pbkdf2$sha256$${iterations}$${b64url(salt.buffer)}$${b64url(
    hash.buffer
  )}`;
}

export async function verifyPassword(password: string, stored: string) {
  // Expect format defined above
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256")
    return false;

  const iterations = Number(parts[2]);
  const salt = fromB64url(parts[3]);
  const hash = fromB64url(parts[4]);

  const candidate = await derive(password, salt, iterations);
  // constant-time compare
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= candidate[i] ^ hash[i];
  return diff === 0;
}
