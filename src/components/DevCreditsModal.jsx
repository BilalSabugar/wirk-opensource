import React, { useState, useEffect } from 'react';
import {
  X, Cpu, Activity, Zap, Shield, Key, RefreshCw, Terminal,
  CheckCircle2, AlertTriangle, Clock, Database, Sparkles, Sliders,
  Check, ArrowUpRight, BarChart3, Layers, Radio
} from 'lucide-react';
import {
  getAiCreditsStats,
  resetAiTelemetry,
  setCustomDailyQuota,
  pingAiEndpoint,
  DEFAULT_DAILY_QUOTA,
  SAFE_RPM_LIMIT
} from '../utils/aiCreditsTracker';

export default function DevCreditsModal({ open, onClose }) {
  const [stats, setStats] = useState(getAiCreditsStats);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'logs' | 'config'
  const [customQuotaInput, setCustomQuotaInput] = useState(stats.dailyQuota.toString());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Refresh stats helper
  const refresh = () => {
    setStats(getAiCreditsStats());
  };

  // Listen to live telemetry updates
  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener('ec6:ai-credits-updated', handleUpdate);
    return () => window.removeEventListener('ec6:ai-credits-updated', handleUpdate);
  }, []);

  // Fetch server health on open
  useEffect(() => {
    if (open) {
      refresh();
      fetchServerHealth();
    }
  }, [open]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (open && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const fetchServerHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch('/api/credits');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch (e) {
      console.warn('[DevCredits] Failed to fetch server credits health:', e);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handlePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pingAiEndpoint();
      setPingResult(res);
      refresh();
      if (res.data) setServerHealth(res.data);
    } finally {
      setIsPinging(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all local AI telemetry metrics for today? (This does not affect actual Google API usage)')) {
      resetAiTelemetry();
      refresh();
      triggerToast('Local telemetry reset successfully');
    }
  };

  const handleSaveQuota = (e) => {
    e.preventDefault();
    const val = parseInt(customQuotaInput, 10);
    if (!isNaN(val) && val > 0) {
      setCustomDailyQuota(val);
      refresh();
      triggerToast(`Daily quota budget set to ${val.toLocaleString()} requests`);
    }
  };

  if (!open) return null;

  const quotaColor = stats.percentRemaining > 50
    ? 'text-emerald-500 dark:text-emerald-400'
    : stats.percentRemaining > 20
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-rose-500 dark:text-rose-400';

  const quotaProgressBg = stats.percentRemaining > 50
    ? 'bg-emerald-500'
    : stats.percentRemaining > 20
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Developer Window */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 animate-scale-up"
        style={{
          background: 'var(--bg-card, #0f0f11)',
          borderColor: 'var(--border-subtle, rgba(255,255,255,0.12))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px 0 rgba(16, 185, 129, 0.08)'
        }}
      >
        {/* Top Developer macOS Titlebar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Cpu size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight uppercase">Developer Diagnostics & AI Quotas</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  HERMES TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Google Gemini API Free Tier & Rate Limits Monitor • WIRK v6.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              title="Refresh Stats"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01]">
          {[
            { id: 'overview', label: 'Credits & Quotas', icon: BarChart3 },
            { id: 'logs', label: `Live Audit Logs (${stats.recentLogs.length})`, icon: Terminal },
            { id: 'config', label: 'Diagnostics & Controls', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-medium border-b-2 transition-all ${
                  active
                    ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'overview' && (
            <>
              {/* Top Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Daily Requests & Credits Left */}
                <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Remaining Credits</span>
                    <span className={`text-xs font-mono font-bold ${quotaColor}`}>
                      {stats.percentRemaining}% Left
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold tracking-tight font-mono">
                      {stats.requestsRemaining.toLocaleString()}
                      <span className="text-xs font-normal text-zinc-500 ml-1.5">/ {stats.dailyQuota.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {stats.requestsUsedToday} requests consumed today ({stats.todayKey})
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div 
                      className={`h-full ${quotaProgressBg} transition-all duration-500`}
                      style={{ width: `${stats.percentRemaining}%` }}
                    />
                  </div>
                </div>

                {/* Card 2: Token Velocity */}
                <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Token Consumption</span>
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold tracking-tight font-mono text-purple-400">
                      {stats.tokensToday.total.toLocaleString()}
                      <span className="text-xs font-normal text-zinc-500 ml-1.5">tokens</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                      <span>Prompt: {stats.tokensToday.prompt.toLocaleString()}</span>
                      <span>•</span>
                      <span>Output: {stats.tokensToday.candidate.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Lifetime: {stats.lifetimeTokens.toLocaleString()} tokens across {stats.lifetimeRequests} requests
                  </p>
                </div>

                {/* Card 3: Real-Time RPM Rate Limit */}
                <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Rate Limit RPM</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live (60s)
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold tracking-tight font-mono">
                      {stats.currentRPM}
                      <span className="text-xs font-normal text-zinc-500 ml-1.5">/ {stats.maxSafeRPM} RPM</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Avg Response Latency: <span className="font-mono text-zinc-200">{stats.avgLatencyMs}ms</span>
                    </p>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Status: <span className={stats.isRateLimitWarning ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                      {stats.isRateLimitWarning ? '⚠️ Approaching RPM Ceiling' : '✓ Flow Rate Nominal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Feature Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subsystem 1: Gemini Engine & API Key Health */}
                <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Key size={14} className="text-blue-400" />
                      Engine & Key Topology
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {serverHealth?.model || 'gemini-2.5-flash'}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <div>
                          <p className="font-medium text-zinc-200">Primary Key (GEMINI_API_KEY)</p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {serverHealth?.primaryKeyMasked || 'Configured via Environment'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {serverHealth?.primaryKeyStatus || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-blue-400" />
                        <div>
                          <p className="font-medium text-zinc-200">Secondary Key (FALLBACK)</p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {serverHealth?.secondaryKeyMasked || 'Standby Automatic Failover'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {serverHealth?.secondaryKeyStatus || 'ARMED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subsystem 2: Consumption by Feature */}
                <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={14} className="text-amber-400" />
                      Usage by Subsystem
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Today's Activity
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { key: 'ARIA', label: 'ARIA Executive AI Companion', count: stats.featureBreakdown.ARIA || 0, color: 'bg-emerald-500' },
                      { key: 'TASK_CREATOR', label: 'Smart AI Task Creator', count: stats.featureBreakdown.TASK_CREATOR || 0, color: 'bg-blue-500' },
                      { key: 'QUICK_TOOLS', label: 'Quick AI Tools & Markdown', count: stats.featureBreakdown.QUICK_TOOLS || 0, color: 'bg-purple-500' },
                      { key: 'DIAGNOSTIC', label: 'Diagnostics & Latency Pings', count: stats.featureBreakdown.DIAGNOSTIC || 0, color: 'bg-zinc-500' }
                    ].map((item) => {
                      const pct = stats.requestsUsedToday > 0
                        ? Math.round((item.count / stats.requestsUsedToday) * 100)
                        : 0;
                      return (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300">{item.label}</span>
                            <span className="font-mono text-zinc-400">{item.count} reqs ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Ping Diagnostics Action Card */}
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Activity size={20} className={isPinging ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">Live AI Endpoint Latency Ping</h4>
                    <p className="text-[11px] text-zinc-400">
                      Sends a zero-token status probe to measure round-trip server latency & key validation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {pingResult && (
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${pingResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pingResult.success ? `${pingResult.latency}ms RTT` : 'Ping Failed'}
                      </span>
                      <p className="text-[10px] text-zinc-500">200 OK Response</p>
                    </div>
                  )}
                  <button
                    onClick={handlePing}
                    disabled={isPinging}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={14} />
                    <span>{isPinging ? 'Testing...' : 'Run Diagnostics Ping'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Real-Time Telemetry Audit Stream</h3>
                  <p className="text-[11px] text-zinc-500">Last 50 recorded AI client & server interactions</p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                >
                  Clear Logs
                </button>
              </div>

              {stats.recentLogs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  No AI requests recorded yet today. Interactions with ARIA, Smart Task Creator, or Diagnostics will stream here.
                </div>
              ) : (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/40 overflow-hidden font-mono text-[11px]">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-black/60 border-b border-white/5 text-zinc-500 font-semibold text-[10px] uppercase">
                    <span className="col-span-2">Timestamp</span>
                    <span className="col-span-2">Feature</span>
                    <span className="col-span-2">Endpoint</span>
                    <span className="col-span-2">Latency</span>
                    <span className="col-span-2">Tokens</span>
                    <span className="col-span-2 text-right">Status</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto custom-scrollbar">
                    {stats.recentLogs.map((log) => {
                      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      return (
                        <div key={log.id} className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-white/[0.02] items-center text-zinc-300">
                          <span className="col-span-2 text-zinc-500">{timeStr}</span>
                          <span className="col-span-2 text-zinc-300 font-medium truncate">{log.feature}</span>
                          <span className="col-span-2 text-blue-400">/{log.endpoint}</span>
                          <span className="col-span-2 text-zinc-400">{log.latencyMs}ms</span>
                          <span className="col-span-2 text-purple-400">{log.totalTokens}t</span>
                          <span className={`col-span-2 text-right ${log.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {log.statusText || (log.success ? '200 OK' : 'ERR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Custom Daily Quota Budget */}
              <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-emerald-400" />
                  Custom Daily Quota Budget Simulator
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Google Gemini Flash default free tier gives 1,500 requests/day. You can customize your alert threshold or testing budget here.
                </p>

                <form onSubmit={handleSaveQuota} className="flex items-center gap-3 pt-2">
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={customQuotaInput}
                    onChange={(e) => setCustomQuotaInput(e.target.value)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono bg-black/30 border border-white/10 text-zinc-100 focus:outline-none focus:border-emerald-500 w-44"
                    placeholder="1500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
                  >
                    Update Daily Quota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDailyQuota(DEFAULT_DAILY_QUOTA);
                      setCustomQuotaInput(DEFAULT_DAILY_QUOTA.toString());
                      refresh();
                      triggerToast('Restored default 1,500 requests/day quota');
                    }}
                    className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Reset to Default (1,500)
                  </button>
                </form>
              </div>

              {/* Developer Reset Zone */}
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] space-y-3">
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Developer Telemetry Purge
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Wipes local memory of requests sent today and recent logs. Use when testing quota warnings or fresh installations.
                </p>
                <div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                  >
                    Reset Local Telemetry & Logs
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom macOS Footer Statusbar */}
        <div className="px-6 py-3 border-t border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-4 font-mono">
            <span>Quota Target: {stats.dailyQuota} RPD</span>
            <span>•</span>
            <span>RPM Ceiling: {SAFE_RPM_LIMIT}</span>
            <span>•</span>
            <span className="hidden sm:inline">Shortcut: Ctrl+Shift+D</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-zinc-300 font-medium">Telemetry Connected</span>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="absolute bottom-16 right-6 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-2xl flex items-center gap-2 animate-slide-up">
            <Check size={14} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
