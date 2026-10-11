import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    category: 'Global Navigation',
    shortcuts: [
      { desc: "Open Today's Focus", keys: ['1'] },
      { desc: 'Open Dashboard', keys: ['2'] },
      { desc: 'Open Modules & Kanban', keys: ['3'] },
      { desc: 'Open Calendar', keys: ['4'] },
      { desc: 'Open Flow Analytics', keys: ['5'] },
      { desc: 'Open ARIA AI Companion', keys: ['0'] },
      { desc: 'Open Search & Filter', keys: ['S'] },
      { desc: 'Command Palette', keys: ['⌘ / Ctrl', 'K'] },
    ]
  },
  {
    category: 'Workspace & Tools',
    shortcuts: [
      { desc: 'Smart AI Task Creator', keys: ['V'] },
      { desc: 'New Project Module', keys: ['N'] },
      { desc: 'Toggle Light / Dark Mode', keys: ['T'] },
      { desc: 'Profile & Cloud Sync', keys: ['P'] },
      { desc: 'Keyboard Shortcuts Help', keys: ['?'] },
      { desc: 'Close Modal / Cancel', keys: ['ESC'] },
    ]
  }
];

export default function KeyboardShortcutsModal({ onClose }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]"
        style={{
          background: 'var(--modal-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
              <Keyboard size={15} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
                Keyboard Shortcuts
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                macOS & Windows executive hotkeys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-hi)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Groups */}
        <div className="p-6 space-y-6 overflow-y-auto scroll">
          {SHORTCUT_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                {group.category}
              </h3>
              <div className="rounded-2xl border divide-y overflow-hidden"
                   style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                {group.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--text-hi)' }}>
                      {s.desc}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg border shadow-xs"
                          style={{
                            background: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-hi)'
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between text-[11px]"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)', color: 'var(--text-muted)' }}>
          <span>Press <kbd className="font-mono font-bold px-1.5 py-0.5 rounded border border-zinc-500/30 text-[var(--text-hi)]">?</kbd> anywhere to open</span>
          <button onClick={onClose} className="btn-primary px-3.5 py-1 text-xs font-semibold rounded-xl">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
