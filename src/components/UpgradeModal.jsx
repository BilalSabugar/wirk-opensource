import React from 'react';
import { 
  X, Check, Zap, Sparkles, Cloud, Shield, Heart, 
  ArrowRight, Coffee, ExternalLink, HardDrive, Cpu, Laptop
} from 'lucide-react';
import WirkLogo from './WirkLogo';

export default function UpgradeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const BUY_ME_A_COFFEE_MAIN = 'https://buymeacoffee.com/bilal07040s';
  const BUY_ME_A_COFFEE_MEMBERSHIP = 'https://buymeacoffee.com/bilal07040s/membership';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(32px) saturate(190%)',
        WebkitBackdropFilter: 'blur(32px) saturate(190%)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] border p-6 sm:p-10 animate-fade-in relative scroll glass-apple"
        style={{
          background: 'var(--modal-bg, rgba(14, 14, 17, 0.92))',
          borderColor: 'var(--border-mid, rgba(255, 255, 255, 0.12))',
          color: 'var(--text-hi, #FFFFFF)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Luminous Glow Elements */}
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/5"
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold backdrop-blur-md">
            <Cloud size={14} />
            <span>Self-Hosted vs Managed Cloud</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Choose Your Execution Setup
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-400">
            Enjoy full data ownership on your machine, or switch to WIRK Cloud for effortless zero-maintenance synchronization across all devices.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
          
          {/* Card 1: Open Source (Self-Hosted) */}
          <div className="p-7 rounded-[26px] border border-white/10 bg-zinc-900/40 backdrop-blur-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">Open Source</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">CURRENT SETUP</span>
              </div>
              <h3 className="text-xl font-bold text-white">Local-First (Community)</h3>
              <p className="text-xs text-zinc-400">100% free, runs entirely in your browser with zero server dependencies.</p>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-white">$0</span>
                <span className="text-xs ml-1 text-zinc-400">/ forever free</span>
              </div>

              <div className="h-px bg-white/5" />

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-cyan-400 shrink-0" />
                  <span>Local Storage in your browser</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-cyan-400 shrink-0" />
                  <span>Bring-Your-Own-Key (BYOK) Google Gemini AI</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-cyan-400 shrink-0" />
                  <span>AES-GCM-256 encrypted diary</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-cyan-400 shrink-0" />
                  <span>Full source code modification rights (MIT)</span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-500">
                  <span>Manual backup & API key maintenance</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-all text-center"
            >
              Continue in Local Mode
            </button>
          </div>

          {/* Card 2: WIRK Cloud (Managed) */}
          <div className="p-7 rounded-[26px] border-2 border-emerald-500 flex flex-col justify-between space-y-6 relative shadow-2xl"
               style={{
                 background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 10, 12, 0.9) 100%)'
               }}>
            
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center gap-1.5">
              <Sparkles size={11} className="fill-current" />
              <span>Hassle-Free · Instant Sync</span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Hosted SaaS</span>
                <span className="text-xs font-mono font-bold text-emerald-400">$5 / month</span>
              </div>
              <h3 className="text-xl font-bold text-white">WIRK Cloud Edition</h3>
              <p className="text-xs text-zinc-300">Don't want the hassle of managing keys and backups? Let us handle the cloud infrastructure.</p>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-emerald-400">$5</span>
                <span className="text-xs ml-1 text-zinc-300">/ mo on Buy Me a Coffee</span>
              </div>

              <div className="h-px bg-emerald-500/20" />

              <ul className="space-y-3 text-xs text-white">
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Zero Setup:</strong> Instant sync across phone, tablet & laptop</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Managed AI Intelligence:</strong> No personal API keys needed</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Automated Cloud Backups:</strong> Never lose your tasks or diary</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Priority Support:</strong> Direct founder access & feature votes</span>
                </li>
              </ul>
            </div>

            <a
              href={BUY_ME_A_COFFEE_MEMBERSHIP}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>Get WIRK Cloud ($5/mo)</span>
              <ArrowRight size={14} />
            </a>
          </div>

        </div>

        {/* Creator Support Strip */}
        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2.5">
            <Coffee size={16} className="text-amber-400" />
            <span>Love WIRK and want to support ongoing open-source development?</span>
          </div>
          <a
            href={BUY_ME_A_COFFEE_MAIN}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Buy Me a Coffee</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  );
}
