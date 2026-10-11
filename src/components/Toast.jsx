import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ToastCtx = createContext({ show: () => {} });

export const useToast = () => useContext(ToastCtx);

const ICONS = {
  success: <CheckCircle2 size={16} className="shrink-0 text-emerald-400"/>,
  warning: <AlertTriangle size={16} className="shrink-0 text-amber-400"/>,
  error:   <AlertCircle  size={16} className="shrink-0 text-rose-400"/>,
  info:    <Info          size={16} className="shrink-0 text-blue-400"/>,
};

let idSeq = 0;

function Toast({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 260);
  };

  return (
    <div
      className="flex items-center gap-3 px-4.5 py-3.5 glass-panel rounded-2xl shadow-2xl border border-white/12"
      style={{
        background: 'rgba(15, 20, 30, 0.92)',
        animation: leaving ? 'toastSlideOut 0.26s cubic-bezier(0.16,1,0.3,1) forwards' : 'toastSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) forwards',
        maxWidth: 400,
        minWidth: 280,
      }}>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.92); }
        }
      `}</style>
      {ICONS[toast.type] ?? ICONS.info}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-xs font-bold text-white leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-xs leading-relaxed text-gray-300">{toast.message}</p>
      </div>
      <button onClick={dismiss} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
        <X size={13}/>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const show = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = ++idSeq;
    setToasts(t => [...t, { id, title, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {/* Dynamic Island Floating Notification Container */}
      <div
        className="fixed z-[9999] flex flex-col gap-2.5"
        style={{ bottom: 24, right: 24, pointerEvents: toasts.length ? 'auto' : 'none' }}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss}/>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
