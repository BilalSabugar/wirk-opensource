import React, { useEffect } from 'react';
import { Info } from 'lucide-react';

export default function AdBanner({ client = 'ca-pub-9972009812846408', slot = '4557639870', format = 'auto', responsive = 'true', className = '' }) {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('[AdSense] Ad push error:', err);
    }
  }, []);

  return (
    <div className={`w-full shrink-0 my-2 p-3 border bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-lg text-center space-y-2 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
        <span className="flex items-center gap-1"><Info size={10} /> Advertisement</span>
        <span>Sponsored</span>
      </div>

      {/* Google AdSense Container with layout safety bounds */}
      <div className="min-h-[100px] w-full flex items-center justify-center bg-black/20 rounded border border-dashed border-slate-800/60 p-2 overflow-hidden">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '90px' }}
             data-ad-client={client}
             data-ad-slot={slot}
             data-ad-format={format}
             data-full-width-responsive={responsive}></ins>
      </div>
    </div>
  );
}
