import React, { useState } from 'react';
import { 
  Zap, Shield, Sparkles, CheckCircle2, ArrowRight, 
  Lock, Cpu, Activity, Clock, Layers, Flame, Database,
  Terminal, BarChart3, ChevronRight, FileText, Cookie, 
  CreditCard, Mail, ExternalLink, Sun, Moon, Play, Check,
  Crown, BookOpen, Star
} from 'lucide-react';
import LegalView from '../views/Legal';
import ForgeLogo from './ForgeLogo';
import UpgradeModal from './UpgradeModal';
import ProductivityGuidesModal from './ProductivityGuidesModal';

export default function LandingPage({ 
  onOpenAuth, 
  onEnterLocalMode,
  onToggleTheme, 
  isDark = true,
  onLegalClick
}) {
  const [legalModal, setLegalModal] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);
  const [cookieConsentDismissed, setCookieConsentDismissed] = useState(() => {
    return localStorage.getItem('forge_cookie_notice_dismissed') === 'true';
  });

  const [activeFeatureTab, setActiveFeatureTab] = useState('pipeline');
  const [interactiveTaskDone, setInteractiveTaskDone] = useState(false);

  const handleDismissCookie = () => {
    localStorage.setItem('forge_cookie_notice_dismissed', 'true');
    setCookieConsentDismissed(true);
  };

  const openLegal = (tabId) => {
    if (onLegalClick) onLegalClick(tabId);
    else setLegalModal(tabId);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30"
         style={{ background: 'var(--bg-base)', color: 'var(--text-hi)' }}>

      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] right-[-100px] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[1800px] left-[-100px] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP EXECUTIVE NAVIGATION ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl transition-colors"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md p-1.5 transition-transform hover:scale-105"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                   border: '1px solid var(--border-mid)',
                 }}>
              <WirkLogo size={24} variant="default" glow={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
                  WIRK
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  v6.0
                </span>
              </div>
              <p className="text-[10px] font-medium hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                Turn intent into execution
              </p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
            <a href="#orchestrator" className="hover:text-emerald-500 transition-colors">ARIA AI</a>
            <button onClick={() => setShowGuidesModal(true)} className="hover:text-emerald-500 transition-colors flex items-center gap-1">
              <BookOpen size={12} />
              <span>Guides</span>
            </button>
            <button onClick={() => setShowUpgradeModal(true)} className="hover:text-amber-500 transition-colors flex items-center gap-1 text-amber-500 font-bold">
              <Crown size={12} />
              <span>Pricing</span>
            </button>
            <a href="#security" className="hover:text-emerald-500 transition-colors">Security</a>
            <button onClick={() => openLegal('privacy')} className="hover:text-emerald-500 transition-colors">
              Compliance
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all hover:scale-105 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)',
                borderColor: 'rgba(245,158,11,0.4)',
                color: '#f59e0b'
              }}
              title="View Pro Plans & Lifetime Pass"
            >
              <Crown size={13} />
              <span>Upgrade</span>
            </button>

            <button
              onClick={onToggleTheme}
              title="Toggle Theme"
              className="p-2 rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              aria-label="Toggle dark/light theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={() => onOpenAuth?.('LOGIN')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-ghost transition-all"
            >
              Sign In
            </button>

            <button
              onClick={onEnterLocalMode || (() => onOpenAuth?.('SIGNUP'))}
              className="px-4 py-2 text-xs font-bold rounded-xl btn-primary flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20 transition-all"
            >
              <span>Open Local Mode</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 text-xs font-medium backdrop-blur-md animate-fade-in shadow-sm"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-mid)', color: 'var(--text-base)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-500">Executive Workspace Intelligence</span>
          <span className="opacity-40">·</span>
          <span style={{ color: 'var(--text-muted)' }}>Zero-Knowledge Security</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
          Turn intent into <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            flawless execution.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
           style={{ color: 'var(--text-muted)' }}>
          High-performance 5-stage Kanban velocity, autonomous AI orchestration (Hermes), 
          client-side encrypted reflections, and Pomodoro deep work telemetry in one unified command center.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14">
          <button
            onClick={onEnterLocalMode || (() => onOpenAuth?.('SIGNUP'))}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold rounded-2xl btn-primary flex items-center justify-center gap-2 shadow-xl hover:shadow-cyan-500/25 transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            <Zap size={16} />
            <span>Launch Local Workspace (Zero Setup)</span>
          </button>

          <button
            onClick={() => onOpenAuth?.('LOGIN')}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-2xl btn-ghost border flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border-mid)' }}
          >
            <Play size={14} className="fill-current text-emerald-500" />
            <span>Sign In to Account</span>
          </button>
        </div>

        {/* Trust & Compliance Micro-Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          {[
            { icon: Lock, label: 'AES-GCM-256', sub: 'Zero-Knowledge Diary' },
            { icon: Cpu, label: 'ARIA Intelligence', sub: 'Gemini 2.5 Flash' },
            { icon: Shield, label: 'GDPR & CCPA', sub: 'Instant 1-Click Deletion' },
            { icon: Activity, label: '100% Free Quotas', sub: 'No Hidden Fees' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-3.5 rounded-2xl border flex items-center gap-3"
                   style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                     style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-mid)', color: 'var(--accent)' }}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-hi)' }}>{item.label}</p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* ── LIVE INTERACTIVE WORKSPACE PREVIEW ──────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full mb-24">
        <div className="rounded-3xl border shadow-2xl p-4 sm:p-6 overflow-hidden relative"
             style={{
               background: 'var(--bg-panel)',
               borderColor: 'var(--border-mid)',
               boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)'
             }}>
          
          {/* Mock Window Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-5"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <WirkLogo size={16} variant="default" glow={true} />
              <span className="text-xs font-mono font-semibold tracking-wide" style={{ color: 'var(--text-hi)' }}>
                WIRK_WORKSPACE // LIVE_RUNTIME
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          {/* Interactive Workspace Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Column 1: Today Itinerary */}
            <div className="p-4 rounded-2xl border space-y-3"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
                  <Clock size={13} className="text-emerald-500" /> Today's Focus
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>2 PENDING</span>
              </div>

              {/* Task card 1 */}
              <div 
                onClick={() => setInteractiveTaskDone(d => !d)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${interactiveTaskDone ? 'opacity-60 border-emerald-500/40 bg-emerald-500/5' : 'hover:border-zinc-500/40'}`}
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${interactiveTaskDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-500'}`}>
                    {interactiveTaskDone && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${interactiveTaskDone ? 'line-through text-zinc-500' : ''}`} style={{ color: interactiveTaskDone ? 'var(--text-muted)' : 'var(--text-hi)' }}>
                      Finalize Executive Architecture Specs
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        CRITICAL
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Due Today</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task card 2 */}
              <div className="p-3 rounded-xl border"
                   style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-md border border-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                      Verify AES-GCM Client Decryption Salt
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        HIGH
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Security Check</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: 5-Stage Kanban Visual */}
            <div className="p-4 rounded-2xl border space-y-3"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
                  <Layers size={13} className="text-cyan-400" /> 5-Stage Pipeline
                </span>
                <span className="text-[10px] font-mono text-emerald-500">AUTO-ORDERED</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {[
                  { stage: 'BACKLOG', count: 12, color: 'text-zinc-400' },
                  { stage: 'TODO', count: 5, color: 'text-blue-400' },
                  { stage: 'IN_PROGRESS', count: 3, color: 'text-amber-400', active: true },
                  { stage: 'IN_REVIEW', count: 2, color: 'text-purple-400' },
                  { stage: 'DONE', count: 48, color: 'text-emerald-400' },
                ].map((s, idx) => (
                  <div key={idx} className={`p-2 rounded-lg flex items-center justify-between border ${s.active ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
                       style={{ borderColor: 'var(--border-subtle)', background: s.active ? undefined : 'var(--bg-base)' }}>
                    <span className={`font-mono font-bold text-[10px] ${s.color}`}>{s.stage}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{s.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: ARIA Intelligence Mock */}
            <div className="p-4 rounded-2xl border space-y-3"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
                  <Sparkles size={13} className="text-emerald-400" /> ARIA Orchestrator
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                  HERMES ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl border text-xs space-y-2 leading-relaxed"
                   style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <p style={{ color: 'var(--text-base)' }}>
                  "I analyzed your 3 project deadlines for today. Would you like me to reschedule the secondary code audit to Thursday to safeguard your deep work sprint?"
                </p>
                <div className="pt-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button 
                    onClick={() => onOpenAuth?.('SIGNUP')}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg btn-primary"
                  >
                    Approve Proposal
                  </button>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Requires human consent</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── CORE PILLARS / FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500 mb-2">
            SYSTEM ARCHITECTURE
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
            Engineered for uncompromised momentum.
          </h3>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Every component in WIRK is built around speed, deterministic data ordering, and psychological focus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl border space-y-4 transition-all hover:border-emerald-500/30"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm"
                 style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-mid)', color: 'var(--accent)' }}>
              <Layers size={22} />
            </div>
            <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>
              5-Stage Kanban & Fractional Rebalancing
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Manage tasks across Backlog, Todo, In Progress, In Review, and Done. Order keys rebalance dynamically to prevent conflicts during high-speed drag-and-drop operations.
            </p>
          </div>

          {/* Pillar 2 */}
          <div id="orchestrator" className="p-6 rounded-3xl border space-y-4 transition-all hover:border-emerald-500/30"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <Sparkles size={22} />
            </div>
            <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>
              ARIA AI Workspace Orchestrator
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Hermes AI architecture capable of writing daily reflections, generating project breakdowns from natural voice prompts, and scheduling daily itineraries with explicit user approvals.
            </p>
          </div>

          {/* Pillar 3 */}
          <div id="security" className="p-6 rounded-3xl border space-y-4 transition-all hover:border-emerald-500/30"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
              <Lock size={22} />
            </div>
            <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>
              Zero-Knowledge Encrypted Reflections
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Private diary entries are encrypted on-device via Web Cryptography AES-GCM-256 before transit. Server infrastructure stores solely ciphertext.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl border space-y-4 transition-all hover:border-emerald-500/30"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-rose-500/10 border-rose-500/30 text-rose-400">
              <Flame size={22} />
            </div>
            <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>
              Pomodoro Deep Work Engine
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Bind focus sessions directly to target tasks with customized sprint intervals, audio chimes, and automatic daily streak calculation.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-6 rounded-3xl border space-y-4 transition-all hover:border-emerald-500/30"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-amber-500/10 border-amber-500/30 text-amber-400">
              <BarChart3 size={22} />
            </div>
            <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>
              Executive Velocity Analytics
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Visual charts for sprint completion rates, workload distribution, and instant 1-click CSV spreadsheet & JSON backup exports.
            </p>
          </div>

          {/* Pillar 6 */}
          <div id="pricing" className="p-6 rounded-3xl border space-y-4 transition-all hover:border-amber-500/40 relative overflow-hidden group cursor-pointer"
               style={{ background: 'var(--bg-panel)', borderColor: 'rgba(245,158,11,0.25)' }}
               onClick={() => setShowUpgradeModal(true)}>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-amber-500/10 border-amber-500/30 text-amber-400">
                <Crown size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                PLANS & TIERS
              </span>
            </div>
            <h4 className="text-base font-bold flex items-center justify-between" style={{ color: 'var(--text-hi)' }}>
              <span>Executive Pro & Free Tier</span>
              <span className="text-xs font-mono text-amber-500 font-bold">From $0</span>
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Generous free tier with 1,500 daily requests. Upgrade to Executive Pro ($9/mo) or Founder Lifetime Pass for unlimited high-speed AI models, priority Firestore synchronization, and zero telemetry.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">
              <span>View Plans & Lifetime Pass</span>
              <ArrowRight size={13} />
            </div>
          </div>

        </div>
      </section>

      {/* ── SECURITY & COMPLIANCE SECTION ───────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t"
               style={{ borderColor: 'var(--border-subtle)' }}>
        
        <div className="p-8 rounded-3xl border space-y-6"
             style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-mid)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                TRANSPARENCY & COMPLIANCE GUARANTEE
              </span>
              <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-hi)' }}>
                Your Privacy & Intellectual Property Sovereignty
              </h3>
            </div>
            <button
              onClick={() => openLegal('privacy')}
              className="px-4 py-2 text-xs font-semibold rounded-xl btn-ghost border shrink-0"
              style={{ borderColor: 'var(--border-mid)' }}
            >
              Read Full Legal Document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs" style={{ color: 'var(--text-base)' }}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>100% IP Ownership:</strong> All tasks, notes, and reflections belong entirely to you.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Zero Tracking Cookies:</strong> No invasive ad trackers or third-party behavioral scripts.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Instant Data Deletion:</strong> 1-click permanent account & Firestore removal anytime.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Transient AI Processing:</strong> Workspace data is never used to train public foundation models.</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-hi)' }}>
          Ready to command your day?
        </h2>
        <p className="text-sm max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Join high-performance engineers, founders, and creators executing with WIRK.
        </p>

        <button
          onClick={() => onOpenAuth?.('SIGNUP')}
          className="px-8 py-4 text-sm font-bold rounded-2xl btn-primary inline-flex items-center gap-2 shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105"
        >
          <span>Launch Your Free Workspace</span>
          <ArrowRight size={16} />
        </button>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8 mt-auto"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs"
             style={{ color: 'var(--text-muted)' }}>
          
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                   border: '1px solid var(--border-subtle)',
                 }}>
              <WirkLogo size={18} variant="default" glow={true} />
            </div>
            <div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-hi)' }}>
                WIRK: Turn intent into execution
              </p>
              <p className="text-[11px]">
                Engineered by Bilal Sabugar • bilal.07.04.07@gmail.com
              </p>
            </div>
          </div>

          {/* Center Legal & Compliance Links */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button onClick={() => setShowGuidesModal(true)} className="hover:underline flex items-center gap-1 text-emerald-500">
              <BookOpen size={12} />
              <span>Guides & Architecture</span>
            </button>
            <button onClick={() => setShowUpgradeModal(true)} className="hover:underline flex items-center gap-1 text-amber-500">
              <Crown size={12} />
              <span>Pro Plans</span>
            </button>
            <button onClick={() => openLegal('privacy')} className="hover:underline">Privacy Policy</button>
            <button onClick={() => openLegal('terms')} className="hover:underline">Terms of Service</button>
            <button onClick={() => openLegal('cookies')} className="hover:underline">Cookie Policy</button>
            <button onClick={() => openLegal('pricing')} className="hover:underline">Pricing & Refunds</button>
            <button onClick={() => openLegal('contact')} className="hover:underline">Developer Contact</button>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>All Systems Nominal</span>
          </div>

        </div>
      </footer>

      {/* ── COOKIE / LOCAL STORAGE NOTICE BANNER ────────────────────────────── */}
      {!cookieConsentDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-slide-up flex flex-col gap-3"
             style={{
               background: 'var(--modal-bg)',
               borderColor: 'var(--border-mid)',
               boxShadow: 'var(--shadow-modal)'
             }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                 style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-mid)', color: 'var(--accent)' }}>
              <Cookie size={16} />
            </div>
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-bold" style={{ color: 'var(--text-hi)' }}>Essential Storage Notice</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                WIRK uses strictly essential local browser storage to keep you authenticated and persist your encryption keys. We use zero third-party advertising tracking cookies.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => openLegal('cookies')}
              className="text-[11px] underline px-2 py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Read Cookie Policy
            </button>
            <button
              onClick={handleDismissCookie}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg btn-primary"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      )}

      {/* Legal Modal Popup */}
      {legalModal && (
        <LegalView initialTab={legalModal} onClose={() => setLegalModal(null)} />
      )}

      {/* Upgrade & SaaS Monetization Modal */}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Public Productivity & Engineering Guides Modal */}
      {showGuidesModal && (
        <ProductivityGuidesModal isOpen={showGuidesModal} onClose={() => setShowGuidesModal(false)} />
      )}

    </div>
  );
}
