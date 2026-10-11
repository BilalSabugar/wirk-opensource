/**
 * WIRK Open-Source — Direct Client-Side Gemini AI Client (BYOK Mode)
 * Allows the open-source community to use WIRK without needing a serverless backend.
 */

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

export function getStoredGeminiKey() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('wirk_custom_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setStoredGeminiKey(key) {
  if (typeof window === 'undefined') return;
  if (!key) {
    localStorage.removeItem('wirk_custom_gemini_key');
  } else {
    localStorage.setItem('wirk_custom_gemini_key', key.trim());
  }
}

export function getStoredModel() {
  if (typeof window === 'undefined') return 'gemini-2.5-flash';
  return localStorage.getItem('wirk_custom_gemini_model') || 'gemini-2.5-flash';
}

export function setStoredModel(model) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wirk_custom_gemini_model', model);
}

/**
 * Builds system prompt for ARIA in local BYOK mode
 */
export function getAriaSystemPrompt(tasks = [], projects = []) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const tasksSummary = (tasks || []).slice(0, 30).map(t =>
    `- [${t.status}] ${t.text} (ID: ${t.id}, Project: ${t.projectId || 'None'}, Priority: ${t.priority}, Due: ${t.dueDate || 'None'})`
  ).join('\n');
  const projSummary = (projects || []).map(p => `- ${p.title} (ID: ${p.id})`).join('\n');

  return `You are ARIA — the autonomous executive AI intelligence and workspace orchestrator embedded within WIRK (Workspace for Intent, Reflection & Kinetic action). Today is ${todayISO}.

## WORKSPACE CONTEXT:
Projects:
${projSummary || 'No active projects yet.'}

Active Tasks:
${tasksSummary || 'No active tasks yet.'}

## ACTION PROPOSALS:
When the user asks you to create, modify, plan, or delete tasks or projects, explain your strategic reasoning clearly and append a JSON proposal block formatted EXACTLY as:
\`\`\`json_proposal
{
  "proposals": [
    {
      "type": "CREATE_TASK",
      "label": "Create actionable task",
      "task": {
        "projectId": "exact_project_id",
        "text": "Clear description",
        "status": "TODO",
        "priority": "HIGH",
        "dueDate": "YYYY-MM-DD"
      }
    }
  ]
}
\`\`\`
Valid proposal types: CREATE_TASK, UPDATE_TASK, DELETE_TASK, MOVE_TASK_STATUS, CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, PLAN_DAY, WRITE_DIARY, SAVE_NOTE.
Be concise, proactive, strategic, and kinetic.`;
}

/**
 * Direct Gemini API invocation using user's BYOK key
 */
export async function callGeminiDirect({ prompt, systemPrompt, history = [], apiKey, model }) {
  const activeKey = apiKey || getStoredGeminiKey();
  const activeModel = model || getStoredModel() || 'gemini-2.5-flash';

  if (!activeKey) {
    throw new Error('No Gemini API Key provided. Please add your key in Settings (BYOK).');
  }

  // Format contents array for Gemini REST API
  const contents = [];

  // Add conversation history
  if (Array.isArray(history)) {
    history.forEach(msg => {
      if (msg.text && (msg.role === 'user' || msg.role === 'model')) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      }
    });
  }

  // Add latest prompt
  if (prompt) {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  // Try selected model, fallback if rate-limited or unavailable
  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter(m => m !== activeModel)];
  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${activeKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status} on ${m}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from model');

      return { text, model: m, finishReason: data.candidates?.[0]?.finishReason || 'STOP' };
    } catch (err) {
      lastError = err;
      console.warn(`[BYOK Gemini] Model ${m} failed, trying fallback: ${err.message}`);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Test user's API Key validity
 */
export async function testGeminiKey(apiKey) {
  try {
    const res = await callGeminiDirect({
      prompt: 'Ping. Reply with "pong" only.',
      apiKey,
      model: 'gemini-2.5-flash'
    });
    return { ok: true, message: 'API Key is valid and functional!' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
