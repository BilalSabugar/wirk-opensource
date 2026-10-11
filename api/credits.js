/**
 * FORGE v6 - AI System Health & Credits Diagnostic Endpoint
 * 
 * Reports server environment health, Google Gemini API key configuration status,
 * active model metadata, and rate limit guidelines.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.GEMINI_API_KEY_SECONDARY;

  // Masked key display for developer security
  const maskKey = (k) => {
    if (!k) return null;
    if (k.length <= 8) return '***configured***';
    return `${k.slice(0, 4)}...${k.slice(-4)}`;
  };

  const status = {
    status: primaryKey ? 'OPERATIONAL' : 'DEGRADED_NO_PRIMARY_KEY',
    model: 'gemini-2.5-flash',
    apiVersion: 'v1beta',
    timestamp: new Date().toISOString(),
    primaryKeyStatus: primaryKey ? 'ACTIVE' : 'MISSING',
    primaryKeyMasked: maskKey(primaryKey),
    secondaryKeyStatus: secondaryKey ? 'STANDBY_ARMED' : 'NONE',
    secondaryKeyMasked: maskKey(secondaryKey),
    quotas: {
      freeTierDailyLimit: 1500,
      freeTierRpmLimit: 15,
      freeTierTpmLimit: 1000000,
      notes: 'Google Gemini 2.5 Flash Free Tier standard capacity'
    },
    engine: 'FORGE v6.0 Hermes Executive'
  };

  return res.status(200).json(status);
}
