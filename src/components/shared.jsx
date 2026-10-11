import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Calendar, X, ChevronDown, Check } from 'lucide-react';
import { THEME_COLORS, PRIORITIES, TASK_STATUSES, TASK_TAGS, getPriority, getStatus, getTheme, getTag, formatDue, dueCls, fmtMs } from '../constants';

/* ── PriorityBadge ─────────────────────────────────────────────────────────── */
export function PriorityBadge({ priority }) {
  const p = getPriority(priority);
  const Icon = p.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold
                      uppercase tracking-wider rounded-md border ${p.color} ${p.bg} ${p.border}`}>
      <Icon size={8} />{p.short}
    </span>
  );
}

/* ── TagBadge ──────────────────────────────────────────────────────────────── */
export function TagBadge({ tagId }) {
  const t = getTag(tagId);
  if (!t) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium
                      tracking-tight rounded-md border ${t.text} ${t.bg} ${t.border}`}>
      {t.label}
    </span>
  );
}

/* ── DueBadge ──────────────────────────────────────────────────────────────── */
export function DueBadge({ dateStr }) {
  const d = formatDue(dateStr);
  if (!d) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium rounded-md border ${dueCls(d.tag)}`}>
      <Calendar size={8} />{d.label}
    </span>
  );
}

/* ── ArcProgress Ring ──────────────────────────────────────────────────────── */
export function ArcProgress({ pct, hex, size = 42 }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(pct, 100) / 100);
  const cx   = size / 2;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={3.5} />
      <circle cx={cx} cy={cx} r={r} fill="none"
        stroke={hex || 'var(--accent)'} strokeWidth={3.5}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      <text x={cx} y={cx + 3.5} textAnchor="middle"
        fill="var(--text-hi)" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

/* ── DonutChart Progress Ring ──────────────────────────────────────────────── */
export function DonutChart({ pct, size = 150, thickness = 12 }) {
  const cx   = size / 2;
  const r    = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(pct, 100) / 100);
  const id   = 'core-donut-glow';
  const color = pct >= 75 ? '#30D158' : pct >= 40 ? '#0A84FF' : pct >= 20 ? '#FF9F0A' : '#FF453A';

  return (
    <svg width={size} height={size}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={thickness} />
      {/* Progress arc */}
      <circle cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={thickness}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        filter={`url(#${id})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      {/* Center */}
      <text x={cx} y={cx - 4} textAnchor="middle" fill="var(--text-hi)"
        fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="-0.03em">
        {pct}%
      </text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill="var(--text-muted)"
        fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.04em">
        COMPLETE
      </text>
    </svg>
  );
}

/* ── StatusBadge ───────────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const s = getStatus(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold
                      tracking-tight rounded-md border ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

/* ── TaskCard Component ────────────────────────────────────────────────────── */
export function TaskCard({ task, onToggle, onDelete, onEdit, onFocus, onStatusChange, showStatus = false, compact = false }) {
  const isDone = task.status === 'DONE';
  const checklists = task.checklists || [];
  const chkDone = checklists.filter(c => c.completed).length;
  const hasChecklists = checklists.length > 0;
  const isBlocked = Boolean(task.blocker?.isBlocked);

  return (
    <div className={`group/t flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
                     ${isDone ? 'opacity-40 bg-black/[0.02] dark:bg-white/[0.01] border-transparent' : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] shadow-sm hover:shadow'}
                     ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}
                     animate-fade-in`}>
      
      {/* Checkbox button */}
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 border ${
          isDone
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
            : 'border-zinc-400 dark:border-zinc-400/80 bg-black/5 dark:bg-white/10 hover:border-emerald-400 hover:bg-emerald-500/10'
        }`}
        title={isDone ? 'Mark as incomplete (moves to To Do)' : 'Mark as complete'}
      >
        {isDone && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed transition-all font-medium ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'}`}>
          {task.text}
        </p>

        {/* Blocker alert note if blocked */}
        {isBlocked && (
          <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="truncate">Blocked: {task.blocker?.reason || 'Awaiting dependency'}</span>
          </div>
        )}

        {/* Focus time mini badge */}
        {(task.totalFocusMs ?? 0) > 0 && !compact && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px]">⏱</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-hi)' }}>
              {fmtMs(task.totalFocusMs)}
            </span>
            {(task.totalSessions ?? 0) > 0 && (
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                · {task.totalSessions} session{task.totalSessions !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Checklist progress bar */}
        {hasChecklists && !compact && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 max-w-[80px] h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-400 rounded-full"
                   style={{ width: `${(chkDone / checklists.length) * 100}%` }} />
            </div>
            <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {chkDone}/{checklists.length} checklist
            </span>
          </div>
        )}

        {/* Badges row */}
        {!compact && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {showStatus && <StatusBadge status={task.status} />}
            {task.priority && <PriorityBadge priority={task.priority} />}
            {task.dueDate  && <DueBadge dateStr={task.dueDate} />}
            {(task.tags ?? []).map(tid => <TagBadge key={tid} tagId={tid} />)}
          </div>
        )}
      </div>

      {/* Actions - visible on hover */}
      <div className="flex items-center opacity-0 group-hover/t:opacity-100 transition-opacity gap-1 shrink-0">
        {onFocus && !isDone && (
          <button onClick={onFocus} title="Start Pomodoro focus"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 transition-all text-xs">
            ⏱
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 transition-all text-[11px]">
            ✎
          </button>
        )}
        <button onClick={onDelete}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
}

/* ── AddTaskForm ───────────────────────────────────────────────────────────── */
export function AddTaskForm({ projectId, onSubmit, onCancel, theme }) {
  const [text,     setText]     = useState('');
  const [priority, setPriority] = useState('MED');
  const [dueDate,  setDueDate]  = useState('');
  const [tags,     setTags]     = useState([]);

  const toggleTag = (id) => setTags(ts => ts.includes(id) ? ts.filter(t => t !== id) : [...ts, id]);

  const submit = () => {
    if (!text.trim()) return;
    onSubmit({ projectId, text: text.trim(), priority, dueDate: dueDate || null, tags });
    setText(''); setPriority('MED'); setDueDate(''); setTags([]);
  };

  return (
    <div className="p-3.5 border-t border-white/10 glass-surface rounded-b-xl space-y-2.5 animate-fade-in">
      <input
        autoFocus
        type="text"
        placeholder="Task description..."
        className="input-terminal w-full px-3 py-2 text-xs rounded-lg"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <div className="flex gap-2">
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="input-terminal flex-1 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer">
          {Object.entries(PRIORITIES).map(([k,v]) => (
            <option key={k} value={k} className="bg-gray-900 text-white">{v.label}</option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="input-terminal flex-1 px-2.5 py-1.5 text-xs rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-1">
        {TASK_TAGS.map(t => (
          <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
            className={tags.includes(t.id)
              ? `px-2 py-0.5 text-[9px] font-medium rounded-md border transition-colors ${t.text} ${t.bg} ${t.border}`
              : 'px-2 py-0.5 text-[9px] font-medium rounded-md border transition-colors text-gray-400 border-white/10 hover:text-white'}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={submit}
          className="flex-1 btn-primary text-xs font-semibold py-2 rounded-lg">
          Add Task
        </button>
        <button onClick={onCancel}
          className="px-3.5 py-2 btn-ghost text-xs rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── NewProjectModal Component ─────────────────────────────────────────────── */
export function NewProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', sub: '', color: 'blue' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl glass-panel shadow-2xl animate-scale-in border border-white/10 overflow-hidden"
           style={{ background: 'var(--bg-overlay)' }}
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Create New Project</p>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white transition-colors">
            <X size={15}/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Project Name</label>
            <input className="input-terminal w-full px-3 py-2 text-xs uppercase rounded-lg"
              placeholder="e.g. ACADEMICS or ROBOTICS"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && form.title && onCreate(form)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Subtitle / Scope</label>
            <input className="input-terminal w-full px-3 py-2 text-xs rounded-lg"
              placeholder="e.g. Coursework & Assignments"
              value={form.sub}
              onChange={e => set('sub', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Theme Palette</label>
            <div className="flex gap-2 pt-1">
              {THEME_COLORS.map(c => (
                <button key={c.name} onClick={() => set('color', c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full transition-transform duration-150
                              ${form.color === c.name
                                ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black'
                                : 'opacity-40 hover:opacity-80'}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => form.title.trim() && onCreate(form)}
            className="w-full btn-primary font-semibold py-2.5 text-xs rounded-xl mt-2"
          >
            Create Project Module
          </button>
        </div>
      </div>
    </div>
  );
}
