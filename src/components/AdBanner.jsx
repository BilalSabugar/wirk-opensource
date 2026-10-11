import React from 'react';
import { Coffee, Cloud, ArrowRight, Sparkles } from 'lucide-react';

export default function AdBanner({ className = '' }) {
  return (
    <div className={`w-full shrink-0 my-3 p-4 rounded-2xl border glass-apple text-left relative overflow-hidden ${className}`}
         style={{
           borderColor: 'rgba(255, 255, 255, 0.1)',
           background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)'
         }}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              COMMUNITY EDITION
            </span>
            <span className="text-xs text-zinc-400 font-medium">· Zero Server Setup</span>
          </div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 pt-0.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Don't want the hassle of managing API keys & local backups?</span>
          </h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-lg">
            Switch to <strong>WIRK Cloud</strong> for instant cross-device sync, managed AI intelligence, and encrypted backups for just $5/mo. Or support development on Buy Me a Coffee!
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
          <a
            href="https://buymeacoffee.com/bilal07040s/membership"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Cloud size={13} />
            <span>WIRK Cloud</span>
            <ArrowRight size={12} />
          </a>

          <a
            href="https://buymeacoffee.com/bilal07040s"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition-all flex items-center justify-center active:scale-95"
            title="Buy Me a Coffee"
          >
            <Coffee size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
