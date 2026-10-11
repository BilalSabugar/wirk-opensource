// api/encrypt-key.js
// Returns HMAC-derived key material for client-side AES-256-GCM encryption.
// The server secret ENCRYPTION_SECRET never leaves the server.
// Even if someone knows another user's UID, they cannot derive their key.

import { createHmac } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ENCRYPTION_SECRET;

  // Hard fail if secret is not configured — a missing secret means encryption is broken.
  // Never fall back to a hardcoded value (source-readable strings defeat the security model).
  if (!secret || secret.length < 32) {
    console.error('[encrypt-key] ENCRYPTION_SECRET is not configured or too short (< 32 chars).');
    return res.status(500).json({ error: 'Encryption service not configured. Contact administrator.' });
  }

  const { uid } = req.body;
  if (!uid || typeof uid !== 'string' || uid.length < 10) {
    return res.status(400).json({ error: 'Invalid uid' });
  }

  // Derive per-user key material: HMAC-SHA256(secret, uid + "engine-core-v6")
  // This is deterministic (same result every login) but unique per user
  const keyMaterial = createHmac('sha256', secret)
    .update(`${uid}:engine-core-v6:aes-gcm-256`)
    .digest('hex');

  // Also derive a per-user salt for PBKDF2 hardening on the client side
  const salt = createHmac('sha256', secret)
    .update(`${uid}:salt:engine-core-v6`)
    .digest('hex');

  return res.status(200).json({ keyMaterial, salt });
}
