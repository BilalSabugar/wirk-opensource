import React, { useState, useMemo } from 'react';
import { 
  Search as SearchIcon, X, CheckSquare, Square, Trash2, 
  SlidersHorizontal, Filter, Check, AlertOctagon, Edit3, ArrowRight
} from 'lucide-react';
import { getTheme, getPriority, PRIORITIES, formatDue, dueCls, TASK_STATUSES } from '../constants';
import { PriorityBadge, DueBadge, TagBadge, StatusBadge } from '../components/shared';

function ResultCard({ task, project, onToggle, onDelete, onEdit }) {
  const theme = getTheme(project?.color);
  const isDone = task.status === 'DONE';
  const isBlocked = Boolean(task.blocker?.isBlocked);

  const chkDone = (task.checklists || []).filter(c => c.completed).length;
  const chkTotal = (task.checklists || []).length;

  return (
    <div
      className={`glass-card rounded-2xl border p-4 transition-all duration-150 flex items-start gap-3.5 group animate-fade-in ${
        isDone ? 'opacity-50' : 'hover:shadow-md'
      }`}
      style={{
        borderColor: isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 border ${
          isDone
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
            : 'border-zinc-500/40 dark:border-zinc-500/50 hover:border-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 bg-transparent'
        }`}
        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isDone && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit && onEdit(task)}>
        <p
          className={`text-xs sm:text-[13px] font-semibold leading-snug transition-colors ${
            isDone ? 'line-through opacity-70' : ''
          }`}
          style={{ color: 'var(--text-hi)' }}
        >
          {task.text}
        </p>

        {task.description && (
          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {project && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-base)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.hex }} />
              {project.title}
            </span>
          )}
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.dueDate && <DueBadge dateStr={task.dueDate} />}
          {isBlocked && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <AlertOctagon size={10} />
              <span>Blocked</span>
            </span>
          )}
          {chkTotal > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-[var(--text-muted)]"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              ☑ {chkDone}/{chkTotal}
            </span>
          )}
          {(task.tags ?? []).map(tid => <TagBadge key={tid} tagId={tid} />)}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit && onEdit(task)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          title="Inspect task"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function SearchView({ tasks = [], projects = [], onToggle, onDelete, onEdit }) {
  const [q, setQ] = useState('');
  const [pFilter, setPFilter] = useState('ALL');
  const [sFilter, setSFilter] = useState('ALL'); // ALL or specific TaskStatus
  const [modFilter, setModFilter] = useState('ALL');
  const [onlyBlocked, setOnlyBlocked] = useState(false);

  const results = useMemo(() => {
    return tasks.filter(t => {
      const matchQ = !q || (t.text || '').toLowerCase().includes(q.toLowerCase()) || (t.description || '').toLowerCase().includes(q.toLowerCase());
      const matchP = pFilter === 'ALL' || t.priority === pFilter;
      const matchS = sFilter === 'ALL' || t.status === sFilter;
      const matchM = modFilter === 'ALL' || t.projectId === modFilter;
      const matchB = !onlyBlocked || Boolean(t.blocker?.isBlocked);
      return matchQ && matchP && matchS && matchM && matchB;
    }).sort((a, b) => {
      if ((a.status === 'DONE') !== (b.status === 'DONE')) return a.status === 'DONE' ? 1 : -1;
      return getPriority(a.priority).order - getPriority(b.priority).order;
    });
  }, [tasks, q, pFilter, sFilter, modFilter, onlyBlocked]);

  // Group by project
  const grouped = useMemo(() => {
    const g = {};
    results.forEach(t => {
      if (!g[t.projectId]) g[t.projectId] = [];
      g[t.projectId].push(t);
    });
    return Object.entries(g);
  }, [results]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scroll" style={{ background: 'var(--bg-base)' }}>
      
      {/* Frosted Sticky Header */}
      <div
        className="px-6 md:px-8 py-5 border-b shrink-0 space-y-4 sticky top-0 z-10"
        style={{
          background: 'var(--header-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        }}
      >
        <div>
          <h1 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-hi)' }}>
            Search & Filter
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Find tasks across all workspace projects, workflow stages, priorities, and blockers
          </p>
        </div>

        {/* Search Command Input */}
        <div className="relative max-w-3xl">
          <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            type="text"
            className="input-terminal w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl font-medium"
            placeholder="Search tasks, descriptions, or tags…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 text-xs"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Capsule Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Status Segmented Buttons */}
          <div className="flex p-0.5 rounded-lg border gap-0.5"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setSFilter('ALL')}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                sFilter === 'ALL'
                  ? 'shadow-xs'
                  : 'hover:opacity-100'
              }`}
              style={{
                background: sFilter === 'ALL' ? 'var(--accent)' : 'transparent',
                color: sFilter === 'ALL' ? 'var(--accent-contrast)' : 'var(--text-muted)',
              }}
            >
              All Stages
            </button>
            {Object.entries(TASK_STATUSES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setSFilter(key)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  sFilter === key
                    ? 'shadow-xs font-bold'
                    : 'hover:opacity-100'
                }`}
                style={{
                  background: sFilter === key ? 'var(--accent)' : 'transparent',
                  color: sFilter === key ? 'var(--accent-contrast)' : 'var(--text-muted)',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-500/20" />

          {/* Blocked Filter Toggle */}
          <button
            type="button"
            onClick={() => setOnlyBlocked(b => !b)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
              onlyBlocked
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-hi)]'
            }`}
          >
            <AlertOctagon size={11} />
            <span>Only Blocked</span>
          </button>

          <div className="h-4 w-px bg-zinc-500/20" />

          {/* Priority Segmented Buttons */}
          <div className="flex p-0.5 rounded-lg border gap-0.5"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MED', 'LOW'].map(p => (
              <button
                key={p}
                onClick={() => setPFilter(p)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  pFilter === p
                    ? 'shadow-xs font-bold'
                    : 'hover:opacity-100'
                }`}
                style={{
                  background: pFilter === p ? 'var(--accent)' : 'transparent',
                  color: pFilter === p ? 'var(--accent-contrast)' : 'var(--text-muted)',
                }}
              >
                {p === 'ALL' ? 'All Priority' : PRIORITIES[p]?.short || p}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-500/20" />

          {/* Project Dropdown */}
          <select
            value={modFilter}
            onChange={e => setModFilter(e.target.value)}
            className="input-terminal text-xs px-3 py-1.5 rounded-lg cursor-pointer outline-none font-medium"
          >
            <option value="ALL">📁 All Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>📁 {p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Results Stream */}
      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
        
        {/* Results Metadata Summary */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>
            Showing <strong style={{ color: 'var(--text-hi)' }}>{results.length}</strong> task{results.length !== 1 ? 's' : ''}
            {q && <> matching "<strong style={{ color: 'var(--text-hi)' }}>{q}</strong>"</>}
          </p>
        </div>

        {/* Empty State */}
        {results.length === 0 && (
          <div className="p-12 text-center glass-card rounded-2xl space-y-2 border"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <SearchIcon size={24} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>No matching tasks found</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or filters</p>
          </div>
        )}

        {/* Grouped Results by Project */}
        {grouped.map(([projectId, projTasks]) => {
          const project = projects.find(p => p.id === projectId);
          const theme   = getTheme(project?.color);
          return (
            <div key={projectId} className="space-y-2.5">
              {/* Project Group Header */}
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.hex }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
                  {project?.title ?? 'Unassigned Tasks'}
                </h3>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  ({projTasks.length})
                </span>
              </div>

              {/* Task Cards List */}
              <div className="space-y-2">
                {projTasks.map(task => (
                  <ResultCard
                    key={task.id}
                    task={task}
                    project={project}
                    onToggle={() => onToggle(task.id)}
                    onDelete={() => onDelete(task.id)}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}
