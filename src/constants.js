import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

export const AVAILABLE_THEMES = [
  { id: 'dark',  name: 'Dark Mode (Obsidian)', mode: 'dark',  accentHex: '#FFFFFF', bgHex: '#000000' },
  { id: 'light', name: 'Light Mode (Studio)',  mode: 'light', accentHex: '#000000', bgHex: '#F5F5F7' },
];

export const AVAILABLE_STYLES = [
  { id: 'professional', name: 'Executive Minimal', desc: 'Refined typography, neutral glass & clean monochrome', glyph: '◈' },
  { id: 'tactical',     name: 'Titanium HUD',  desc: 'Engineered layout & telemetry borders',              glyph: '🚁' },
  { id: 'cartoonish',   name: 'Neubrutalist',  desc: 'Punchy geometric borders & shadows',                 glyph: '🎨' },
  { id: 'terminal',     name: 'Developer Mono',desc: 'Clean monospace terminal syntax',                    glyph: '🖥️' },
  { id: 'ghibli',       name: 'Studio Cozy',   desc: 'Warm organic curves & soft pastels',                 glyph: '🌸' },
  { id: 'material',     name: 'Material 3',    desc: 'Tonal surfaces & rounded pills',                    glyph: '📱' },
];

export const THEME_COLORS = [
  { name: 'white',   bg: 'bg-zinc-200',    text: 'text-zinc-200',    border: 'border-zinc-500/30',    hex: '#E4E4E7' },
  { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#30D158' },
  { name: 'amber',   bg: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/30',   hex: '#FF9F0A' },
  { name: 'rose',    bg: 'bg-rose-500',    text: 'text-rose-400',    border: 'border-rose-500/30',    hex: '#FF453A' },
  { name: 'purple',  bg: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/30',  hex: '#AF52DE' },
  { name: 'indigo',  bg: 'bg-indigo-500',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  hex: '#5856D6' },
  { name: 'blue',    bg: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/30',    hex: '#0A84FF' },
];

export const PRIORITIES = {
  CRITICAL: { label: 'CRITICAL', short: 'CRIT', color: 'text-rose-400',  bg: 'bg-rose-500/10',  border: 'border-rose-500/20',  hex: '#FF453A', leftBorder: 'border-l-rose-500', Icon: AlertCircle, order: 0 },
  HIGH:     { label: 'HIGH',     short: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hex: '#FF9F0A', leftBorder: 'border-l-amber-500', Icon: ArrowUp,     order: 1 },
  MED:      { label: 'MED',      short: 'MED',  color: 'text-zinc-300',  bg: 'bg-zinc-500/10',  border: 'border-zinc-500/20',  hex: '#D4D4D8', leftBorder: 'border-l-zinc-400', Icon: Minus,       order: 2 },
  LOW:      { label: 'LOW',      short: 'LOW',  color: 'text-zinc-400',  bg: 'bg-zinc-800/40',  border: 'border-zinc-700/30',  hex: '#71717A', leftBorder: 'border-l-zinc-600', Icon: ArrowDown,   order: 3 },
};

export const TASK_STATUSES = {
  BACKLOG:     { id: 'BACKLOG',     label: 'Backlog',     short: 'Backlog', color: 'text-zinc-400',   bg: 'bg-zinc-500/10',  border: 'border-zinc-500/20',  hex: '#71717A' },
  TODO:        { id: 'TODO',        label: 'To Do',       short: 'To Do',   color: 'text-blue-400',   bg: 'bg-blue-500/10',  border: 'border-blue-500/20',  hex: '#0A84FF' },
  IN_PROGRESS: { id: 'IN_PROGRESS', label: 'In Progress', short: 'Active',  color: 'text-amber-400',  bg: 'bg-amber-500/10', border: 'border-amber-500/20', hex: '#FF9F0A' },
  IN_REVIEW:   { id: 'IN_REVIEW',   label: 'In Review',   short: 'Review',  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hex: '#AF52DE' },
  DONE:        { id: 'DONE',        label: 'Done',        short: 'Done',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hex: '#30D158' },
};

export const getStatus = (s) => TASK_STATUSES[s] || TASK_STATUSES.TODO;

export const BOOT_LINES = [
  '> System boot: COMPLETE',
  '> Loading core modules...',
  '> Connecting database... SECURE',
  '> WIRK: Turn intent into execution — READY.',
];

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', glyph: '⌂' },
  { id: 'ARIA',      label: 'ARIA',      glyph: '✦' },
  { id: 'TODAY',     label: 'Today',     glyph: '◎' },
  { id: 'MODULES',   label: 'Projects',  glyph: '⬡' },
  { id: 'ANALYTICS', label: 'Analytics', glyph: '◈' },
  { id: 'CALENDAR',  label: 'Calendar',  glyph: '▦' },
  { id: 'DIARY',     label: 'Diary',     glyph: '✦' },
  { id: 'NOTES',     label: 'Notes',     glyph: '≡' },
  { id: 'SEARCH',    label: 'Search',    glyph: '⌕' },
  { id: 'PROFILE',   label: 'Profile',   glyph: '◉', bottom: true },
];

export const TASK_TAGS = [
  { id: 'research', label: 'Research', hex: '#5856D6', bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20'  },
  { id: 'design',   label: 'Design',   hex: '#FF453A', bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20'    },
  { id: 'build',    label: 'Build',    hex: '#D4D4D8', bg: 'bg-zinc-500/10',    text: 'text-zinc-300',    border: 'border-zinc-500/20'    },
  { id: 'review',   label: 'Review',   hex: '#FF9F0A', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  { id: 'submit',   label: 'Submit',   hex: '#30D158', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { id: 'urgent',   label: 'Urgent',   hex: '#FF453A', bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20'    },
  { id: 'waiting',  label: 'Waiting',  hex: '#71717A', bg: 'bg-zinc-700/20',   text: 'text-zinc-400',   border: 'border-zinc-600/20'   },
  { id: 'hardware', label: 'Hardware', hex: '#AF52DE', bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
];
export const getTag = (id) => TASK_TAGS.find(t => t.id === id);

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl','K'], desc: 'Open command palette' },
  { keys: ['?'],        desc: 'Show keyboard shortcuts' },
  { keys: ['Esc'],      desc: 'Close any modal' },
  { keys: ['1'],        desc: 'Go to Today view' },
  { keys: ['2'],        desc: 'Go to Dashboard view' },
  { keys: ['3'],        desc: 'Go to Projects view' },
  { keys: ['4'],        desc: 'Go to Analytics view' },
  { keys: ['5'],        desc: 'Go to Calendar view' },
  { keys: ['6'],        desc: 'Go to Notes view' },
  { keys: ['7'],        desc: 'Go to Search view' },
  { keys: ['P'],        desc: 'Open profile' },
  { keys: ['T'],        desc: 'Toggle dark/light theme' },
];

export const computeStreak = (tasks) => {
  const days = new Set(tasks.filter(t => t.completedAt).map(t => new Date(t.completedAt).toISOString().slice(0,10)));
  if (days.size === 0) return { current: 0, best: 0 };
  const sorted = [...days].sort();
  let best = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000;
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  let current = 0;
  if (days.has(today) || days.has(yesterday)) {
    let d = new Date(days.has(today) ? today : yesterday);
    while (days.has(d.toISOString().slice(0,10))) { current++; d = new Date(d.getTime()-86400000); }
  }
  return { current, best };
};

export const exportTasksCSV = (tasks, projects) => {
  const header = ['Task','Priority','Status','Due Date','Project','Created'];
  const rows   = tasks.map(t => {
    const proj = projects.find(p => p.id === t.projectId);
    return [
      `"${t.text.replace(/"/g,'""')}"`,
      t.priority ?? '',
      t.completed ? 'Done' : 'Pending',
      t.dueDate ?? '',
      proj?.title ?? '',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
    ].join(',');
  });
  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url;
  a.download = `forge-tasks-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

export const getTheme  = (n) => THEME_COLORS.find(c => c.name === n) || THEME_COLORS[0];
export const getPriority = (k) => PRIORITIES[k] || PRIORITIES.MED;

export const formatDue = (dateStr) => {
  if (!dateStr) return null;
  const d    = new Date(dateStr + 'T00:00:00');
  const now  = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, tag: 'overdue' };
  if (diff === 0) return { label: 'Due today',                  tag: 'today'   };
  if (diff === 1) return { label: 'Tomorrow',                   tag: 'soon'    };
  if (diff <= 3)  return { label: `${diff}d left`,              tag: 'soon'    };
  return               { label: `${diff}d left`,              tag: 'normal'  };
};

export const dueCls = (tag) => ({
  overdue: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  today:   'text-amber-300 bg-amber-500/10 border-amber-500/20',
  soon:    'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  normal:  'text-zinc-400 bg-white/5 border-white/5',
}[tag] || '');

/* ── Time formatting ── */
export const fmtMs = (ms) => {
  if (!ms || ms === 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin === 0) return '<1m';
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
