import React, { useState, useEffect, useRef, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Search, ArrowRight, Check, Plus, Folder, 
  Sparkles, Keyboard, LogOut, Sun, Moon, 
  Target, Calendar, Layers, Activity, AlertOctagon, CheckSquare, Clock, Cpu
} from 'lucide-react';
import { TASK_STATUSES, PRIORITIES, getTheme, getPriority } from '../constants';

export default function CommandPalette({ 
  open, 
  onClose, 
  setView, 
  tasks = [], 
  projects = [],
  onNewProject, 
  onShortcuts, 
  onProfile, 
  onThemeToggle, 
  onVoiceImport,
  onOpenTask,
  onDevCredits
}) {
  const [q, setQ] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Static navigation and actions
  const NAVIGATION_ACTIONS = [
    { id: 'nav:TODAY', label: "Go to Today's Focus", category: 'Navigation', icon: Target, shortcut: '1' },
    { id: 'nav:DASHBOARD', label: 'Go to Dashboard', category: 'Navigation', icon: Activity, shortcut: '2' },
    { id: 'nav:MODULES', label: 'Go to Modules & Kanban', category: 'Navigation', icon: Layers, shortcut: '3' },
    { id: 'nav:CALENDAR', label: 'Go to Calendar', category: 'Navigation', icon: Calendar, shortcut: '4' },
    { id: 'nav:ANALYTICS', label: 'Go to Execution Analytics', category: 'Navigation', icon: CheckSquare, shortcut: '5' },
    { id: 'nav:ARIA', label: 'Go to ARIA AI Companion', category: 'Navigation', icon: Sparkles, shortcut: '0' },
    { id: 'nav:SEARCH', label: 'Search All Tasks', category: 'Navigation', icon: Search, shortcut: 'S' },
  ];

  const SYSTEM_ACTIONS = [
    { id: 'action:smartCreate', label: 'Open Smart AI Task Creator', category: 'Actions', icon: Sparkles },
    { id: 'action:devCredits', label: '[DEV] AI Credits & Quota Console', category: 'Developer', icon: Cpu, shortcut: '⇧⌘D', keywords: 'dev credits quota tokens rate limit gemini developer diagnostics api' },
    { id: 'action:newProject', label: 'Create New Project Module', category: 'Actions', icon: Plus },
    { id: 'action:shortcuts', label: 'View Keyboard Shortcuts', category: 'Actions', icon: Keyboard, shortcut: '?' },
    { id: 'action:theme', label: 'Toggle Light / Dark Mode', category: 'Actions', icon: Sun, shortcut: 'T' },
    { id: 'action:profile', label: 'Profile & Cloud Sync Settings', category: 'Actions', icon: Check, shortcut: 'P' },
    { id: 'action:logout', label: 'Sign Out Operator', category: 'System', icon: LogOut },
  ];

  // Dynamic matching tasks
  const matchedTasks = useMemo(() => {
    if (!q.trim()) return [];
    return tasks
      .filter(t => (t.text || '').toLowerCase().includes(q.toLowerCase()) || (t.description || '').toLowerCase().includes(q.toLowerCase()))
      .slice(0, 6)
      .map(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return {
          id: `task:${t.id}`,
          label: t.text,
          sub: proj?.title || 'Task',
          category: 'Tasks',
          icon: CheckSquare,
          status: t.status,
          priority: t.priority,
          taskObj: t,
        };
      });
  }, [tasks, projects, q]);

  // Combined filtered items
  const allFiltered = useMemo(() => {
    const qLower = q.toLowerCase();
    const navMatched = NAVIGATION_ACTIONS.filter(a => a.label.toLowerCase().includes(qLower));
    const sysMatched = SYSTEM_ACTIONS.filter(a => 
      a.label.toLowerCase().includes(qLower) || (a.keywords && a.keywords.toLowerCase().includes(qLower))
    );
    return [...matchedTasks, ...navMatched, ...sysMatched];
  }, [matchedTasks, q]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQ('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allFiltered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allFiltered.length - 1));
      } else if (e.key === 'Enter' && allFiltered[selectedIndex]) {
        e.preventDefault();
        execute(allFiltered[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, allFiltered, onClose]);

  const execute = (item) => {
    if (item.id.startsWith('nav:')) {
      setView(item.id.replace('nav:', ''));
    } else if (item.id.startsWith('task:')) {
      if (onOpenTask && item.taskObj) onOpenTask(item.taskObj);
      else setView('MODULES');
    } else if (item.id === 'action:newProject') {
      onNewProject?.();
    } else if (item.id === 'action:smartCreate') {
      onVoiceImport?.();
    } else if (item.id === 'action:devCredits') {
      onDevCredits?.();
    } else if (item.id === 'action:shortcuts') {
      onShortcuts?.();
    } else if (item.id === 'action:profile') {
      onProfile?.();
    } else if (item.id === 'action:theme') {
      onThemeToggle?.();
    } else if (item.id === 'action:logout') {
      signOut(auth);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        style={{
          background: 'var(--modal-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold outline-none placeholder:text-zinc-500"
            style={{ color: 'var(--text-hi)' }}
            placeholder="Type a command or search tasks…"
            value={q}
            onChange={e => { setQ(e.target.value); setSelectedIndex(0); }}
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg border text-zinc-400 border-zinc-500/20">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="py-2 overflow-y-auto scroll flex-1 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {allFiltered.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-xs font-semibold">No commands or tasks found</p>
              <p className="text-[11px] mt-0.5">Try searching with a different term</p>
            </div>
          ) : (
            allFiltered.map((item, i) => {
              const Icon = item.icon;
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-all ${
                    isSelected
                      ? 'bg-black/5 dark:bg-white/[0.08] font-bold'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/5 dark:bg-white/5 border-[var(--border-subtle)] text-zinc-400'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-hi)' }}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{item.sub}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                        {item.status}
                      </span>
                    )}
                    {item.shortcut && (
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg border text-zinc-400 border-zinc-500/20">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight size={13} className="text-blue-500 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t shrink-0 flex items-center justify-between text-[11px]"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-semibold text-blue-500">WIRK Spotlight</span>
        </div>
      </div>
    </div>
  );
}
