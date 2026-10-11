/**
 * WIRK v6 - Developer AI Credits & Quota Telemetry Tracker
 * 
 * Tracks Gemini API request counts, token consumption, rate limits (RPM / RPD),
 * and calculates remaining credits based on Google Gemini Free Tier quotas (1,500 RPD / 15 RPM).
 */

const STORAGE_KEY = 'ec6_ai_telemetry_v1';
export const DEFAULT_DAILY_QUOTA = 1500; // Standard Google Gemini Flash Free Tier requests/day
export const SAFE_RPM_LIMIT = 15;        // Standard 15 Requests Per Minute

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadTelemetry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { daily: {}, logs: [], customQuota: DEFAULT_DAILY_QUOTA };
    const parsed = JSON.parse(raw);
    return {
      daily: parsed.daily || {},
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      customQuota: typeof parsed.customQuota === 'number' ? parsed.customQuota : DEFAULT_DAILY_QUOTA
    };
  } catch (e) {
    console.warn('[AI Credits] Failed to read telemetry:', e);
    return { daily: {}, logs: [], customQuota: DEFAULT_DAILY_QUOTA };
  }
}

function saveTelemetry(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ec6:ai-credits-updated', { detail: data }));
    }
  } catch (e) {
    console.warn('[AI Credits] Failed to persist telemetry:', e);
  }
}

/**
 * Record an AI API interaction event
 * @param {Object} event
 * @param {string} event.endpoint - 'chat' | 'generate' | 'ai-action' | 'ping'
 * @param {string} event.feature - 'ARIA' | 'TASK_CREATOR' | 'QUICK_TOOLS' | 'DIAGNOSTIC'
 * @param {number} [event.latencyMs] - execution duration in ms
 * @param {boolean} [event.success] - whether request succeeded
 * @param {Object} [event.usage] - { promptTokens, candidatesTokens, totalTokens }
 * @param {string} [event.statusText] - e.g. '200 OK'
 */
export function recordAiUsage({
  endpoint = 'chat',
  feature = 'ARIA',
  latencyMs = 0,
  success = true,
  usage = null,
  statusText = '200 OK',
  note = ''
}) {
  const data = loadTelemetry();
  const today = getTodayKey();
  const now = Date.now();

  if (!data.daily[today]) {
    data.daily[today] = {
      requests: 0,
      successCount: 0,
      errorCount: 0,
      totalPromptTokens: 0,
      totalCandidateTokens: 0,
      totalTokens: 0,
      byFeature: {
        ARIA: 0,
        TASK_CREATOR: 0,
        QUICK_TOOLS: 0,
        DIAGNOSTIC: 0
      }
    };
  }

  const dayRecord = data.daily[today];
  dayRecord.requests += 1;
  if (success) dayRecord.successCount += 1;
  else dayRecord.errorCount += 1;

  if (dayRecord.byFeature[feature] !== undefined) {
    dayRecord.byFeature[feature] += 1;
  } else {
    dayRecord.byFeature[feature] = 1;
  }

  // Tokens estimation / actual
  const promptTokens = usage?.promptTokenCount || (endpoint === 'generate' ? 450 : endpoint === 'chat' ? 320 : 150);
  const candTokens = usage?.candidatesTokenCount || (endpoint === 'generate' ? 280 : endpoint === 'chat' ? 180 : 80);
  const totalTokens = usage?.totalTokenCount || (promptTokens + candTokens);

  dayRecord.totalPromptTokens += promptTokens;
  dayRecord.totalCandidateTokens += candTokens;
  dayRecord.totalTokens += totalTokens;

  // Add to recent logs (keep last 50)
  const logEntry = {
    id: `log_${now}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    endpoint,
    feature,
    latencyMs: Math.round(latencyMs),
    success,
    statusText,
    promptTokens,
    candTokens,
    totalTokens,
    note
  };

  data.logs = [logEntry, ...data.logs.slice(0, 49)];

  saveTelemetry(data);
  return logEntry;
}

/**
 * Get comprehensive AI credits, quota, and velocity stats
 */
export function getAiCreditsStats() {
  const data = loadTelemetry();
  const today = getTodayKey();
  const now = Date.now();
  const dayRecord = data.daily[today] || {
    requests: 0,
    successCount: 0,
    errorCount: 0,
    totalPromptTokens: 0,
    totalCandidateTokens: 0,
    totalTokens: 0,
    byFeature: { ARIA: 0, TASK_CREATOR: 0, QUICK_TOOLS: 0, DIAGNOSTIC: 0 }
  };

  const dailyQuota = data.customQuota || DEFAULT_DAILY_QUOTA;
  const requestsUsedToday = dayRecord.requests;
  const requestsRemaining = Math.max(0, dailyQuota - requestsUsedToday);
  const percentRemaining = Math.max(0, Math.min(100, Math.round((requestsRemaining / dailyQuota) * 100)));

  // Calculate Real-time RPM (requests in the last 60 seconds)
  const oneMinuteAgo = now - 60000;
  const recentMinuteLogs = data.logs.filter(l => l.timestamp >= oneMinuteAgo);
  const currentRPM = recentMinuteLogs.length;

  // Calculate Lifetime totals
  let lifetimeRequests = 0;
  let lifetimeTokens = 0;
  Object.values(data.daily).forEach(d => {
    lifetimeRequests += d.requests || 0;
    lifetimeTokens += d.totalTokens || 0;
  });

  // Calculate average latency
  const successfulLogs = data.logs.filter(l => l.success && l.latencyMs > 0);
  const avgLatency = successfulLogs.length > 0
    ? Math.round(successfulLogs.slice(0, 10).reduce((acc, l) => acc + l.latencyMs, 0) / Math.min(10, successfulLogs.length))
    : 0;

  return {
    todayKey: today,
    dailyQuota,
    requestsUsedToday,
    requestsRemaining,
    percentRemaining,
    currentRPM,
    maxSafeRPM: SAFE_RPM_LIMIT,
    isRateLimitWarning: currentRPM >= SAFE_RPM_LIMIT,
    tokensToday: {
      prompt: dayRecord.totalPromptTokens,
      candidate: dayRecord.totalCandidateTokens,
      total: dayRecord.totalTokens
    },
    lifetimeRequests,
    lifetimeTokens,
    avgLatencyMs: avgLatency,
    featureBreakdown: dayRecord.byFeature,
    recentLogs: data.logs,
    successRate: dayRecord.requests > 0
      ? Math.round((dayRecord.successCount / dayRecord.requests) * 100)
      : 100
  };
}

/**
 * Reset local telemetry for developer debugging
 */
export function resetAiTelemetry() {
  saveTelemetry({ daily: {}, logs: [], customQuota: DEFAULT_DAILY_QUOTA });
}

/**
 * Set custom quota for developer budget testing
 */
export function setCustomDailyQuota(quota) {
  const data = loadTelemetry();
  data.customQuota = Math.max(10, Number(quota) || DEFAULT_DAILY_QUOTA);
  saveTelemetry(data);
}

/**
 * Live latency diagnostic ping runner
 */
export async function pingAiEndpoint() {
  const t0 = performance.now();
  try {
    const res = await fetch('/api/credits', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const t1 = performance.now();
    const duration = t1 - t0;
    
    if (res.ok) {
      const serverData = await res.json();
      recordAiUsage({
        endpoint: 'ping',
        feature: 'DIAGNOSTIC',
        latencyMs: duration,
        success: true,
        statusText: `200 OK (${Math.round(duration)}ms)`,
        note: `Server Key: ${serverData.primaryKeyStatus || 'OK'}`
      });
      return { success: true, latency: Math.round(duration), data: serverData };
    } else {
      recordAiUsage({
        endpoint: 'ping',
        feature: 'DIAGNOSTIC',
        latencyMs: duration,
        success: false,
        statusText: `${res.status} Error`,
        note: 'Ping check failed'
      });
      return { success: false, latency: Math.round(duration), error: `HTTP ${res.status}` };
    }
  } catch (err) {
    const duration = performance.now() - t0;
    recordAiUsage({
      endpoint: 'ping',
      feature: 'DIAGNOSTIC',
      latencyMs: duration,
      success: false,
      statusText: 'Network Err',
      note: err.message
    });
    return { success: false, latency: Math.round(duration), error: err.message };
  }
}
