import React, { useState } from 'react';
import { 
  X, Check, Zap, Sparkles, Crown, Shield, Heart, 
  ArrowRight, Flame, Layers, BarChart3, Coffee, ExternalLink,
  CreditCard, CheckCircle2, Star
} from 'lucide-react';
import ForgeLogo from './ForgeLogo';

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'starter' }) {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual' | 'lifetime'
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // External payment URLs (can be updated with user's real Stripe/LemonSqueezy/Gumroad links)
  const STRIPE_PRO_MONTHLY = 'https://buy.stripe.com/test_pro_monthly';
  const STRIPE_PRO_ANNUAL  = 'https://buy.stripe.com/test_pro_annual';
  const STRIPE_LIFETIME    = 'https://buy.stripe.com/test_founder_lifetime';
  const BUY_ME_A_COFFEE    = 'https://buymeacoffee.com/bilalsabugar';

  const handleCheckout = (planId) => {
    let targetUrl = '';
    if (planId === 'pro') {
      targetUrl = billingCycle === 'annual' ? STRIPE_PRO_ANNUAL : STRIPE_PRO_MONTHLY;
    } else if (planId === 'lifetime') {
      targetUrl = STRIPE_LIFETIME;
    }

    // If real Stripe link is not yet set up, offer friendly configuration guidance
    if (targetUrl.includes('test_')) {
      alert(`Stripe / LemonSqueezy Checkout Triggered:\n\nTo connect your live payment gateway, update the checkout links in src/components/UpgradeModal.jsx with your Stripe Payment Link, LemonSqueezy, or Gumroad URL.\n\nOpening creator support link for demonstration.`);
      window.open(BUY_ME_A_COFFEE, '_blank');
      return;
    }

    window.open(targetUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 sm:p-8 animate-fade-in relative scroll"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-mid)',
          color: 'var(--text-hi)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Close pricing modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold">
            <Crown size={14} className="fill-amber-500/20" />
            <span>WIRK Executive Membership</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
            Supercharge Your Focus & Execution Velocity
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Elevate your workspace with autonomous AI orchestration, unrestricted sprint modules, and executive analytics.
          </p>

          {/* Billing Cycle Selector */}
          <div className="pt-2 flex items-center justify-center">
            <div className="p-1 rounded-xl border flex items-center gap-1 bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">Save 27%</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'lifetime'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Sparkles size={11} />
                <span>Founder Pass</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          
          {/* Card 1: Starter (Free) */}
          <div className="p-5 rounded-2xl border flex flex-col justify-between space-y-5 bg-black/[0.02] dark:bg-white/[0.02]"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Tier 01</span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-hi)' }}>Starter Operator</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Essential productivity toolkit for individual focus.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--text-hi)' }}>$0</span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>/ forever</span>
              </div>

              <div className="h-px bg-black/5 dark:bg-white/5" />

              <ul className="space-y-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Up to 5 Active Project Modules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>5-Stage Kanban Workflow Pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Standard ARIA AI (Up to 50 daily turns)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Deep Focus Pomodoro Timer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>AES-GCM-256 Client-Side Diary Encryption</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl border text-xs font-semibold opacity-70 cursor-default"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
            >
              Current Active Plan
            </button>
          </div>

          {/* Card 2: Executive Pro (Featured) */}
          <div className="p-6 rounded-2xl border-2 flex flex-col justify-between space-y-5 relative shadow-xl"
               style={{
                 borderColor: '#10B981',
                 background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
               }}>
            
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              Most Popular · Executive Power
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-bold">Tier 02</span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-hi)' }}>Executive Pro</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Complete autonomous workspace intelligence for high performers.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-emerald-500">
                  {billingCycle === 'annual' ? '$7' : '$9'}
                </span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  {billingCycle === 'annual' ? '/ month (billed $79/yr)' : '/ month'}
                </span>
              </div>

              <div className="h-px bg-emerald-500/20" />

              <ul className="space-y-2.5 text-xs" style={{ color: 'var(--text-hi)' }}>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span><strong>Unlimited</strong> Projects & Submodules</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span><strong>Full 8,192 Token</strong> ARIA Intelligence</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Voice Companion Real-Time Audio Chat</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Autonomous Blocker Clearing & Dependency Maps</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Velocity Burndown & Executive Visual Analytics</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>1-Click PDF, CSV & JSON Executive Exports</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('pro')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Upgrade to Executive Pro</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 3: Founder Pass (Lifetime) */}
          <div className="p-5 rounded-2xl border flex flex-col justify-between space-y-5 relative bg-amber-500/[0.03] hover:border-amber-500/40 transition-all"
               style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Limited Early Access</span>
                </span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-hi)' }}>Founder Lifetime Pass</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pay once, own all Pro features forever. Zero recurring subscriptions.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-amber-400">$39</span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>/ one-time pay</span>
              </div>

              <div className="h-px bg-amber-500/20" />

              <ul className="space-y-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  <span><strong>All Executive Pro Features</strong> included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  <span>Lifetime Access — No Monthly Bills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  <span>Exclusive Founder Gold Badge in Profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  <span>Direct Priority Product Advisory Channel</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  <span>All Future AI Engine v7+ Updates Included</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('lifetime')}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Crown size={13} className="text-amber-400" />
              <span>Get Founder Pass ($39)</span>
            </button>
          </div>

        </div>

        {/* Indie Creator Support Banner */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
             style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Shield size={16} className="text-emerald-500 shrink-0" />
            <span>100% Data Sovereignty · Cancel Anytime · 14-Day Money-Back Guarantee</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={BUY_ME_A_COFFEE}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:border-amber-400/40 transition-colors text-amber-400 hover:text-amber-300 text-xs font-semibold"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Coffee size={13} />
              <span>Sponsor Creator / Buy Me a Coffee</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
