import React from 'react';
import { AlertCircle, Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundView({ onReturnHome }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in"
         style={{ background: 'var(--bg-base)' }}>
      
      {/* 404 Badge */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
           style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Compass size={32} className="text-red-400 animate-spin-slow"/>
      </div>

      <p className="text-xs font-mono font-bold uppercase tracking-widest text-red-400 mb-2">
        ERROR 404 — ROUTE UNKNOWN
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
        Page Not Found
      </h1>

      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The workspace location or module view you were looking for does not exist or has been relocated.
      </p>

      {/* Return to Dashboard button */}
      <button
        onClick={onReturnHome}
        className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider rounded transition-all shadow-lg">
        <Home size={15}/> Return to Dashboard
      </button>

      <p className="text-[10px] text-slate-600 mt-12 font-mono">
        WIRK v6 · bilal.07.04.07@gmail.com
      </p>
    </div>
  );
}
