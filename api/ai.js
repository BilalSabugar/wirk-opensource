// api/ai.js — AI text operations: grammar fix, diary insights, etc.
// Uses Gemini with automatic fallback to secondary key.

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
const MODEL_URL = (key, model = 'gemini-2.5-flash') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

async function callGemini(apiKey, systemPrompt, userText, model = 'gemini-2.5-flash') {
  return fetch(MODEL_URL(apiKey, model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });
}

const ACTIONS = {
  fix_grammar: {
    system: `You are a precise grammar and spelling corrector. Fix all grammar, spelling, and punctuation errors in the text. 
Preserve the author's original voice, tone, emotional expression, and style completely. 
Do NOT rephrase, add content, summarize, or change meaning.
Do NOT add any commentary, explanation, or preamble.
Return ONLY the corrected text.`,
    build: (text) => `Fix grammar and spelling errors in this diary entry:\n\n${text}`,
  },
  diary_summary: {
    system: `You are an empathetic journaling assistant. Analyze this diary entry and provide:
1. A one-sentence emotional summary (what mood/state the person seems to be in)
2. 3 key themes or topics mentioned
3. One gentle, supportive insight or reflection

Be warm, non-judgmental, and brief. Format as plain text paragraphs, no markdown headers.`,
    build: (text) => `Analyze this diary entry:\n\n${text}`,
  },
  improve_clarity: {
    system: `You are a writing assistant. Improve the clarity and flow of this text while completely preserving the author's voice, emotions, and meaning.
Fix awkward sentences, improve word choice where needed, but keep the personal, raw nature of diary writing.
Return ONLY the improved text with no commentary.`,
    build: (text) => `Improve the clarity of this diary entry:\n\n${text}`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const candidateKeys = [
    process.env.GEMINI_API_KEY_SECONDARY,
    process.env.GEMINI_API_KEY,
  ].filter(Boolean);

  if (candidateKeys.length === 0) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { action, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Missing text' });
    if (!ACTIONS[action]) return res.status(400).json({ error: `Unknown action: ${action}` });

    const { system, build } = ACTIONS[action];
    const userPrompt = build(text.trim());

    let upstream = null;
    for (const key of candidateKeys) {
      for (const model of CANDIDATE_MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            upstream = await callGemini(key, system, userPrompt, model);
            if (upstream.ok) break;
            const errBody = await upstream.clone().text().catch(() => '');
            if (upstream.status === 400 && errBody.includes('API_KEY_INVALID')) {
              break;
            }
            if ((upstream.status === 503 || upstream.status === 429) && attempt === 0) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
            break;
          } catch(e) {
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
            break;
          }
        }
        if (upstream?.ok) break;
      }
      if (upstream?.ok) break;
    }

    if (!upstream || !upstream.ok) {
      const t = upstream ? await upstream.text() : 'No response';
      console.error('[ai] All keys/models failed:', upstream?.status, t);
      return res.status(502).json({ error: `Gemini API returned ${upstream?.status || 502}` });
    }

    const data = await upstream.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!result) return res.status(502).json({ error: 'Empty response from Gemini' });

    return res.status(200).json({ result: result.trim(), usageMetadata: data?.usageMetadata || null });
  } catch (err) {
    console.error('[ai] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
