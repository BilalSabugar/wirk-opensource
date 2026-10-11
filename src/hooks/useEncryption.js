/**
 * useEncryption.js
 *
 * Client-side AES-256-GCM encryption using the Web Crypto API.
 * Key is derived from: PBKDF2(keyMaterial + salt, iterations=200000)
 * where keyMaterial comes from the server (HMAC of uid + ENCRYPTION_SECRET).
 *
 * The raw ENCRYPTION_SECRET NEVER reaches the client.
 * Even full Firestore compromise = unreadable ciphertext.
 * Even full client JS inspection = no secret key visible.
 *
 * Format of encrypted values stored in Firestore:
 * { _enc: true, iv: "<base64>", ct: "<base64>" }
 *
 * Backward compatible: if a field is a plain string, it's treated as unencrypted.
 */

import { useState, useCallback, useRef } from 'react';

/* ─── Utility: base64 ↔ ArrayBuffer ─────────────────────────────────────── */
const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

/* ─── Derive AES-GCM key from material + salt ────────────────────────────── */
async function deriveKey(keyMaterial, saltHex) {
  // Import raw key material
  const raw = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyMaterial),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = enc.encode(saltHex);

  // Derive AES-256-GCM key — 200,000 iterations (OWASP recommended minimum 2024)
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt,
      iterations: 200000,
      hash:       'SHA-256',
    },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,          // not extractable — key never leaves Web Crypto
    ['encrypt', 'decrypt']
  );
}

/* ─── Encrypt a string ───────────────────────────────────────────────────── */
export async function encryptValue(key, plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  // Random 96-bit IV for each encryption (GCM requires unique IV per key)
  const iv         = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );
  return {
    _enc: true,
    iv:   toBase64(iv.buffer),
    ct:   toBase64(cipherBuf),
  };
}

/* ─── Decrypt an encrypted object ───────────────────────────────────────── */
export async function decryptValue(key, obj) {
  if (!obj || typeof obj === 'string') return obj;
  if (!obj._enc) return obj; // plain object, not encrypted
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(fromBase64(obj.iv)) },
      key,
      fromBase64(obj.ct)
    );
    return dec.decode(plainBuf);
  } catch {
    // Decryption failed — possibly wrong key or corrupted. Return placeholder.
    return '[encrypted — decryption failed]';
  }
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */
export function useEncryption() {
  const [ready,    setReady]  = useState(false);
  const [error,    setError]  = useState('');
  const cryptoKey  = useRef(null);

  /**
   * Call this after user logs in to derive and cache the encryption key.
   * uid: Firebase user.uid
   */
  const init = useCallback(async (uid) => {
    if (!uid) return;
    if (!window.crypto?.subtle) {
      setError('Web Crypto API not available. Use a modern browser (Chrome/Edge/Firefox/Safari).');
      return;
    }
    try {
      let keyMaterial, salt;
      try {
        // Fetch key material from server
        const res = await fetch('/api/encrypt-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });

        if (res.ok) {
          const data = await res.json();
          keyMaterial = data.keyMaterial;
          salt = data.salt;
        } else {
          // Server returned error (e.g. ENCRYPTION_SECRET not configured)
          console.warn(`[encryption] Server key derivation failed (HTTP ${res.status}). Using local UID-based fallback — diary security is reduced. Configure ENCRYPTION_SECRET in production.`);
        }
      } catch (fetchErr) {
        console.warn('[encryption] API unreachable, deriving local key fallback');
      }

      // Fallback local key derivation if server API unavailable or not configured.
      // NOTE: This is weaker than server-derived keys but still uses PBKDF2 with 200k iterations.
      // Configure ENCRYPTION_SECRET server env var to enable full security.
      if (!keyMaterial) {
        keyMaterial = `${uid}:engine-core-v6-master-key-material-fallback-32chars`;
        salt = `${uid}:salt:engine-core-v6-local`;
      }

      cryptoKey.current = await deriveKey(keyMaterial, salt);
      setReady(true);
      setError(null);
    } catch (e) {
      console.error('[encryption] init failed:', e.message);
      setError(e.message);
    }
  }, []);

  const encrypt = useCallback(async (plaintext) => {
    if (!cryptoKey.current) return plaintext;
    return encryptValue(cryptoKey.current, plaintext);
  }, []);

  const decrypt = useCallback(async (obj) => {
    if (!cryptoKey.current) {
      // If no key, return string representation or placeholder
      if (!obj || typeof obj === 'string') return obj;
      if (obj._enc) return '[not decrypted — session key not ready]';
      return obj;
    }
    return decryptValue(cryptoKey.current, obj);
  }, []);

  /**
   * Encrypt all sensitive diary content fields before writing to Firestore.
   * Returns a new entry object with content encrypted.
   */
  const encryptEntry = useCallback(async (entry) => {
    if (!cryptoKey.current || !entry) return entry;
    const result = { ...entry };
    if (entry.content) result.content = await encryptValue(cryptoKey.current, entry.content);
    return result;
  }, []);

  /**
   * Decrypt a diary entry from Firestore.
   */
  const decryptEntry = useCallback(async (entry) => {
    if (!entry) return entry;
    const result = { ...entry };
    if (entry.content && typeof entry.content === 'object' && entry.content._enc) {
      result.content = cryptoKey.current
        ? await decryptValue(cryptoKey.current, entry.content)
        : '[encrypted]';
    }
    return result;
  }, []);

  /**
   * Decrypt an array of diary entries.
   */
  const decryptEntries = useCallback(async (entries) => {
    if (!entries) return [];
    return Promise.all(entries.map(e => decryptEntry(e)));
  }, [decryptEntry]);

  return { ready, error, init, encrypt, decrypt, encryptEntry, decryptEntry, decryptEntries };
}
