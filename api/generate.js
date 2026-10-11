// api/generate.js — Vercel serverless function
// Uses Google Gemini API with automatic fallback to secondary key.

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
const MODEL_URL = (key, model = 'gemini-2.5-flash') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

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

const SYSTEM = `You are an expert project manager and executive organizer. Given a voice note/text and a list of existing user projects, output ONLY valid JSON (no markdown, no explanation) with this exact shape:
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
      "priority": "CRITICAL | HIGH | MED | LOW",
      "dueDate": "YYYY-MM-DD or null",
      "projectRef": "existing_id_or_new_1"
    }
  ]
}

Rules:
1. Analyze all tasks mentioned or implied in the input note.
2. Check the provided existing user projects. If a task naturally belongs to an existing project (by matching topic, domain, or title), assign it to that existing project (set isNew: false, refId: existing project id, title: existing project title).
3. If tasks belong to a domain/topic not covered by any existing project, create appropriate NEW projects (set isNew: true, refId: "new_1", "new_2", etc., title: UPPERCASE max 3 words, color: cyan|purple|emerald|red|amber|blue|rose).
4. Every task MUST have projectRef set to a valid refId from the projects array.
5. DUE DATES & PRIORITIES:
   - If a deadline or timing is mentioned (e.g. "by tomorrow", "this Friday", "next Monday", "by Oct 15", "in 3 days"), calculate and set dueDate as exact ISO date string "YYYY-MM-DD". If no timing is mentioned or implied, set dueDate: null.
   - Assign appropriate priority:
     * "CRITICAL": Urgent deadlines within 24-48 hours, exam prep, critical blockers, or explicitly marked urgent.
     * "HIGH": Important deliverables, approaching milestones within this week.
     * "MED": Standard execution tasks.
     * "LOW": Backlog ideas, low-urgency maintenance, or long-term explorations.
6. Create 4-15 actionable tasks logically ordered and prioritized across all relevant projects.
7. CRITICAL: Never use unescaped double quotes inside task text string values. Use single quotes for inner quotes.`;

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

async function callGemini(apiKey, transcript, existingProjects = []) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const projSummary = existingProjects.length > 0
    ? JSON.stringify(existingProjects.map(p => ({ id: p.id, title: p.title, sub: p.sub || '', color: p.color || 'cyan' })))
    : 'None';

  const userPrompt = `Current Date: ${todayDay} (${todayISO})\nVoice note / input: "${transcript}"\n\nExisting Projects in User Workspace:\n${projSummary}\n\nAnalyze and generate the structured multi-project JSON with due dates and priorities now.`;

  const res = await fetch(MODEL_URL(apiKey, model), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });
  return res;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, existingProjects = [] } = req.body || {};
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 5) {
      return res.status(400).json({ error: 'Invalid or missing transcript' });
    }

    const text = transcript.trim();

    // 1. Direct structured text parsing check
    const directStruct = parseStructuredText(text);
    if (directStruct) {
      console.log(`[generate-api] Direct structured import parsed ${directStruct.projects.length} projects, ${directStruct.tasks.length} tasks!`);
      return res.status(200).json(directStruct);
    }

    const candidateKeys = [
      process.env.GEMINI_API_KEY_SECONDARY,
      process.env.GEMINI_API_KEY,
    ].filter(Boolean);

    if (candidateKeys.length === 0) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    let upstream = null;
    for (const key of candidateKeys) {
      for (const model of CANDIDATE_MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            upstream = await callGemini(key, text, existingProjects, model);
            if (upstream.ok) break;
            const errBody = await upstream.clone().text().catch(() => '');
            if (upstream.status === 400 && errBody.includes('API_KEY_INVALID')) {
              break; // Key invalid, try next key
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
      const errBody = upstream ? await upstream.text() : 'No response';
      console.error('[generate] All Gemini keys/models failed:', upstream?.status, errBody);
      return res.status(502).json({ error: `Gemini API returned ${upstream?.status || 502}` });
    }

    const data = await upstream.json();
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!raw) return res.status(502).json({ error: 'Empty response from Gemini' });

    let parsed = repairAndParseJSON(raw);

    if (!parsed) {
      // Emergency line-by-line fallback if raw is plain text bullet points
      const lines = raw.split('\n').map(l => l.replace(/^[-*•\d.\s]+/, '').trim()).filter(l => l.length > 3);
      if (lines.length > 0) {
        parsed = {
          projects: [{ refId: 'new_1', isNew: true, title: 'GENERAL TASKS', sub: 'Auto-Organized', color: 'cyan' }],
          tasks: lines.slice(0, 15).map(text => ({ text, priority: 'HIGH', projectRef: 'new_1' }))
        };
      } else {
        return res.status(502).json({ error: 'Unable to parse valid tasks from AI response' });
      }
    }

    // Normalize single-project format if returned by model
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

    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
      return res.status(502).json({ error: 'Unexpected JSON shape from Gemini' });
    }

    parsed._usageMetadata = data?.usageMetadata || null;
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[generate] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// Note: This file also exports an ai handler. Vercel uses filename routing,
// so create api/ai.js for the AI fix endpoint.
