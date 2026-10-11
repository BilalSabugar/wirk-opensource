import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createHmac } from 'crypto'
import { buildSystemPrompt, buildContext } from './api/chat.js'

function repairAndParseJSON(raw) {
  if (!raw) return null;
  
  let clean = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace  = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(clean);
  } catch (e1) {}

  // 2. Clean trailing commas & raw control characters
  let sanitized = clean
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u001F]+/g, ' ');

  try {
    return JSON.parse(sanitized);
  } catch (e2) {}

  // 3. Fix unescaped double quotes inside "text" fields
  let fixQuotes = sanitized.replace(/("text"\s*:\s*")([\s\S]*?)("\s*,\s*"priority"|"\s*\})/gi, (match, p1, p2, p3) => {
    const safeText = p2.replace(/"/g, "'");
    return `${p1}${safeText}${p3}`;
  });

  try {
    return JSON.parse(fixQuotes);
  } catch (e3) {}

  // 4. Auto-close truncated JSON brackets
  let openBraces = (fixQuotes.match(/\{/g) || []).length - (fixQuotes.match(/\}/g) || []).length;
  let openBrackets = (fixQuotes.match(/\[/g) || []).length - (fixQuotes.match(/\]/g) || []).length;
  
  let autoFixed = fixQuotes;
  while (openBrackets > 0) { autoFixed += ']'; openBrackets--; }
  while (openBraces > 0) { autoFixed += '}'; openBraces--; }

  try {
    return JSON.parse(autoFixed);
  } catch (e4) {}

  // 5. Emergency regex extraction fallback
  const tasks = [];
  const taskRegex = /"text"\s*:\s*"([^"]*)"/gi;
  let m;
  while ((m = taskRegex.exec(raw)) !== null) {
    if (m[1] && m[1].length > 2) {
      tasks.push({ text: m[1], priority: 'HIGH', projectRef: 'new_1' });
    }
  }

  if (tasks.length > 0) {
    return {
      projects: [{ refId: 'new_1', isNew: true, title: 'TASKS & ACTION ITEMS', sub: 'Extracted Tasks', color: 'cyan' }],
      tasks: tasks
    };
  }

  return null;
}

function parseStructuredText(text) {
  if (!text || (text.indexOf('PROJECT') === -1 && text.indexOf('TASK') === -1)) {
    return null;
  }

  const projects = [];
  const tasks = [];
  const colorList = ['cyan', 'purple', 'emerald', 'amber', 'rose'];

  // Split transcript into sections by PROJECT markers
  const projectBlocks = text.split(/(?:==================================================\s*)?PROJECT\s+\d+|ADDITIONAL ACADEMIC TASKS/i);

  projectBlocks.forEach(block => {
    if (!block.trim()) return;

    let projRef = `proj_${projects.length + 1}`;
    const projNameMatch = block.match(/PROJECT NAME:\s*([^\n\r]+)/i);
    const projDescMatch = block.match(/PROJECT DESCRIPTION:\s*([^\n\r]+)/i);

    if (projNameMatch) {
      const title = projNameMatch[1].trim().toUpperCase();
      const sub = projDescMatch ? projDescMatch[1].trim() : 'Academic Coursework';
      projects.push({
        refId: projRef,
        isNew: true,
        title: title,
        sub: sub,
        color: colorList[projects.length % colorList.length]
      });
    }

    const activeRef = projects.length > 0 ? projects[projects.length - 1].refId : 'new_1';
    if (projects.length === 0 && block.includes('TASK')) {
      projects.push({
        refId: 'new_1',
        isNew: true,
        title: 'GENERAL TASKS',
        sub: 'Action Items',
        color: 'cyan'
      });
    }

    const taskEntries = block.split(/TASK\s+\d+:/i);
    taskEntries.forEach(tChunk => {
      const titleMatch = tChunk.match(/TITLE:\s*([^\n\r]+)/i);
      if (titleMatch) {
        const titleText = titleMatch[1].trim();
        const subtasksMatch = tChunk.match(/SUBTASKS:\s*([\s\S]*?)(?=(?:TASK|==================================================|\n\n\n|$))/i);
        let subText = '';
        if (subtasksMatch && subtasksMatch[1]) {
          const subLines = subtasksMatch[1]
            .split('\n')
            .map(s => s.replace(/^[-*•\d.\s]+/, '').trim())
            .filter(s => s.length > 2 && !s.toUpperCase().startsWith('TITLE') && !s.toUpperCase().startsWith('DESCRIPTION'));
          if (subLines.length > 0) {
            subText = ` (${subLines.slice(0, 4).join(', ')})`;
          }
        }

        const fullTaskText = `${titleText}${subText}`;
        tasks.push({
          text: fullTaskText,
          priority: tasks.length < 3 ? 'CRITICAL' : tasks.length < 8 ? 'HIGH' : 'MED',
          projectRef: activeRef
        });
      }
    });
  });

  if (projects.length > 0 && tasks.length > 0) {
    return { projects, tasks };
  }
  return null;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
  const geminiUrl = (key, model = 'gemini-2.5-flash') =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const SYSTEM = `You are an expert project manager. Given a voice note and a list of existing user projects, output ONLY valid JSON (no markdown, no explanation) with this exact shape:
{
  "projects": [
    {
      "refId": "existing_id_or_new_1",
      "isNew": false,
      "title": "UPPERCASE_TITLE",
      "sub": "short sub spec",
      "color": "cyan"
    }
  ],
  "tasks": [
    {
      "text": "specific actionable task description",
      "priority": "CRITICAL",
      "projectRef": "existing_id_or_new_1"
    }
  ]
}

Rules:
1. Analyze all tasks mentioned or implied in the input note.
2. Check the provided existing user projects. If a task naturally belongs to an existing project (by matching topic, domain, or title), assign it to that existing project (set isNew: false, refId: existing project id, title: existing project title).
3. If tasks belong to a domain/topic not covered by any existing project, create appropriate NEW projects (set isNew: true, refId: "new_1", "new_2", etc., title: UPPERCASE max 3 words, color: cyan|purple|emerald|red|amber|blue|rose).
4. Every task MUST have projectRef set to a valid refId from the projects array.
5. Create 4-20 actionable tasks logically ordered and prioritized across all relevant projects.
6. CRITICAL: Never use unescaped double quotes inside task text string values. Use single quotes for inner quotes.`;

  const AI_ACTIONS = {
    fix_grammar:      `You are a grammar corrector. Fix errors, preserve voice completely. Return ONLY corrected text.`,
    diary_summary:    `You are an empathetic journaling assistant. Give: 1) emotional summary sentence 2) 3 key themes 3) one gentle insight. Plain text, warm tone.`,
    improve_clarity:  `You are a writing assistant. Improve flow and clarity, preserve voice and emotions. Return ONLY improved text.`,
  };

  function geminiReq(key, system, userText, opts = {}, model = 'gemini-2.5-flash') {
    const generationConfig = {
      temperature: opts.temp ?? 0.3,
      maxOutputTokens: opts.tokens ?? 8192,
    };
    if (opts.json) {
      generationConfig.responseMimeType = 'application/json';
    }
    return fetch(geminiUrl(key, model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: Array.isArray(userText)
          ? userText
          : [{ parts: [{ text: userText }] }],
        generationConfig,
      }),
    });
  }

  async function withFallback(pk, sk, fn) {
    const candidateKeys = [pk, sk].filter(Boolean);
    let lastRes = null;
    for (const key of candidateKeys) {
      for (const model of CANDIDATE_MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await fn(key, model);
            if (res.ok) return res;
            lastRes = res;
            const errBody = await res.clone().text().catch(() => '');
            if (res.status === 400 && errBody.includes('API_KEY_INVALID')) {
              break; // Key invalid, move to next key
            }
            if ((res.status === 503 || res.status === 429) && attempt === 0) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
            break; // Try next model
          } catch(e) {
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
            break;
          }
        }
      }
    }
    return lastRes || new Response(JSON.stringify({ error: 'All Gemini calls failed' }), { status: 502 });
  }

  function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); }
        catch (e) { reject(e); }
      });
    });
  }

  function send(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }

  return {
    resolve: {
      preserveSymlinks: true,
    },
    plugins: [
      react(),
      {
        name: 'dev-api-server',
        configureServer(server) {

          // ── /api/generate ─────────────────────────────────────────────────
          server.middlewares.use('/api/generate', async (req, res) => {
            if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
            
            try {
              const { transcript, existingProjects = [] } = await parseBody(req);
              if (!transcript?.trim()) return send(res, 400, { error: 'Missing transcript' });
              
              // 1. Direct structured text parsing check
              const directStruct = parseStructuredText(transcript);
              if (directStruct) {
                console.log(`[vite-dev-api] Direct structured import parsed ${directStruct.projects.length} projects, ${directStruct.tasks.length} tasks!`);
                return send(res, 200, directStruct);
              }

              const pk = env.GEMINI_API_KEY, sk = env.GEMINI_API_KEY_SECONDARY;
              if (!pk) return send(res, 500, { error: 'GEMINI_API_KEY missing' });

              const projSummary = existingProjects.length > 0
                ? JSON.stringify(existingProjects.map(p => ({ id: p.id, title: p.title, sub: p.sub || '', color: p.color || 'cyan' })))
                : 'None';

              const userPrompt = `Voice note: "${transcript.trim()}"\n\nExisting Projects in User Workspace:\n${projSummary}\n\nAnalyze and generate the structured multi-project JSON now.`;

              const upstream = await withFallback(pk, sk, (k, m) =>
                geminiReq(k, SYSTEM, userPrompt, { json: true, tokens: 8192 }, m)
              );
              if (!upstream.ok) {
                const t = await upstream.text();
                console.error('[generate]', upstream.status, t.slice(0, 200));
                return send(res, 502, { error: `Gemini ${upstream.status}` });
              }
              const data   = await upstream.json();
              const raw    = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              
              let parsed   = repairAndParseJSON(raw);
              if (!parsed) {
                const lines = raw.split('\n').map(l => l.replace(/^[-*•\d.\s]+/, '').trim()).filter(l => l.length > 3);
                if (lines.length > 0) {
                  parsed = {
                    projects: [{ refId: 'new_1', isNew: true, title: 'GENERAL TASKS', sub: 'Auto-Organized', color: 'cyan' }],
                    tasks: lines.slice(0, 15).map(text => ({ text, priority: 'HIGH', projectRef: 'new_1' }))
                  };
                } else {
                  return send(res, 502, { error: 'Unable to parse valid tasks from AI response' });
                }
              }

              if (!Array.isArray(parsed.projects) && parsed.project) {
                parsed.projects = [{
                  refId: 'new_1',
                  isNew: true,
                  title: parsed.project.title || 'NEW_PROJECT',
                  sub: parsed.project.sub || '',
                  color: parsed.project.color || 'cyan',
                }];
                if (Array.isArray(parsed.tasks)) {
                  parsed.tasks.forEach(t => t.projectRef = 'new_1');
                }
              }

              parsed._usageMetadata = data?.usageMetadata || null;
              send(res, 200, parsed);
            } catch(err) { console.error('[generate]', err.message); send(res, 500, { error: err.message }); }
          });

          // ── /api/ai ───────────────────────────────────────────────────────
          server.middlewares.use('/api/ai', async (req, res) => {
            if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
            const pk = env.GEMINI_API_KEY, sk = env.GEMINI_API_KEY_SECONDARY;
            if (!pk) return send(res, 500, { error: 'GEMINI_API_KEY missing' });
            try {
              const { action, text } = await parseBody(req);
              if (!text?.trim() || !AI_ACTIONS[action]) return send(res, 400, { error: 'Invalid request' });
              const upstream = await withFallback(pk, sk, (k, m) =>
                geminiReq(k, AI_ACTIONS[action], `${text.trim()}`, { temp: 0.3, tokens: 4096 }, m)
              );
              if (!upstream.ok) return send(res, 502, { error: `Gemini ${upstream.status}` });
              const data   = await upstream.json();
              const result = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              send(res, 200, { result: result.trim(), usageMetadata: data?.usageMetadata || null });
            } catch(err) { send(res, 500, { error: err.message }); }
          });

          // ── /api/credits ──────────────────────────────────────────────────
          server.middlewares.use('/api/credits', async (req, res) => {
            const pk = env.GEMINI_API_KEY, sk = env.GEMINI_API_KEY_SECONDARY;
            const maskKey = (k) => (!k ? null : k.length <= 8 ? '***configured***' : `${k.slice(0, 4)}...${k.slice(-4)}`);
            send(res, 200, {
              status: pk ? 'OPERATIONAL' : 'DEGRADED_NO_PRIMARY_KEY',
              model: 'gemini-2.5-flash',
              apiVersion: 'v1beta',
              timestamp: new Date().toISOString(),
              primaryKeyStatus: pk ? 'ACTIVE' : 'MISSING',
              primaryKeyMasked: maskKey(pk),
              secondaryKeyStatus: sk ? 'STANDBY_ARMED' : 'NONE',
              secondaryKeyMasked: maskKey(sk),
              quotas: {
                freeTierDailyLimit: 1500,
                freeTierRpmLimit: 15,
                freeTierTpmLimit: 1000000,
                notes: 'Google Gemini 2.5 Flash Free Tier standard capacity'
              },
              engine: 'WIRK v1.0 Hermes Executive'
            });
          });

          // ── /api/encrypt-key ──────────────────────────────────────────────
          server.middlewares.use('/api/encrypt-key', async (req, res) => {
            if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
            const secret = env.ENCRYPTION_SECRET;
            if (!secret || secret.length < 32) {
              console.error('[dev-api] ENCRYPTION_SECRET not set or too short. Add it to .env');
              return send(res, 500, { error: 'ENCRYPTION_SECRET not configured in .env' });
            }
            try {
              const { uid } = await parseBody(req);
              if (!uid) return send(res, 400, { error: 'Missing uid' });
              const keyMaterial = createHmac('sha256', secret).update(`${uid}:engine-core-v6:aes-gcm-256`).digest('hex');
              const salt        = createHmac('sha256', secret).update(`${uid}:salt:engine-core-v6`).digest('hex');
              send(res, 200, { keyMaterial, salt });
            } catch(err) { send(res, 500, { error: err.message }); }
          });

          // ── /api/chat ─────────────────────────────────────────────────────
          server.middlewares.use('/api/chat', async (req, res) => {
            if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
            const pk = env.GEMINI_API_KEY, sk = env.GEMINI_API_KEY_SECONDARY;
            if (!pk && !sk) return send(res, 500, { error: 'GEMINI_API_KEY missing' });
            try {
              const { text, audioBase64, audioMimeType, history = [], contextPayload = {} } = await parseBody(req);
              const context = buildContext(contextPayload);
              const system  = buildSystemPrompt(context);

              const currentParts = audioBase64
                ? [{ inline_data: { mime_type: audioMimeType, data: audioBase64 }}, { text: 'Please respond to what I just said.' }]
                : [{ text: (text ?? '').trim() || 'Hello' }];
              const messages = [...history.slice(-20), { role: 'user', parts: currentParts }];

              const upstream = await withFallback(pk, sk, (k, m) =>
                geminiReq(k, system, messages, { temp: 0.75, tokens: 8192 }, m)
              );

              if (!upstream.ok) {
                const t = await upstream.text();
                console.error('[chat]', upstream.status, t.slice(0, 200));
                return send(res, 502, { error: `Gemini ${upstream.status}` });
              }
              const data  = await upstream.json();
              const candidate = data?.candidates?.[0];
              const reply = candidate?.content?.parts?.[0]?.text ?? '';
              const finishReason = candidate?.finishReason || 'STOP';
              send(res, 200, {
                reply: reply.trim(),
                finishReason,
                usageMetadata: data?.usageMetadata || null,
              });
            } catch(err) { console.error('[chat]', err.message); send(res, 500, { error: err.message }); }
          });

        }, // end configureServer
      },
    ],
  };
});
