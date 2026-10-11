import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle, Zap, CheckCircle2, Clock, Plus, Wand2,
  Calendar as CalendarIcon, CheckSquare, Sparkles, LayoutGrid,
  Info, ArrowUpRight, ArrowDownRight, Layers, ChevronDown, Check, Folder, Search
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import { PRIORITIES, getTheme, getPriority, formatDue, dueCls } from '../constants';
import { PriorityBadge, DueBadge } from '../components/shared';

/* ── Custom Project Popover Selector ── */
function ProjectPickerPopover({ projects = [], selectedId, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedProj = projects.find(p => p.id === selectedId) || projects[0];
  const theme = getTheme(selectedProj?.color);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [open]);

  if (!projects.length) return null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-3 py-2 text-xs font-semibold rounded-lg btn-ghost flex items-center gap-2 max-w-[200px] sm:max-w-[240px] truncate"
        title={selectedProj?.title}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.hex }} />
        <span className="truncate flex-1 text-left" style={{ color: 'var(--text-hi)' }}>
          {selectedProj?.title || 'Select Project'}
        </span>
        <ChevronDown size={13} className={`text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-64 max-h-64 overflow-y-auto scroll rounded-2xl border shadow-2xl p-1.5 space-y-0.5 z-40 animate-scale-in"
          style={{
            background: 'var(--modal-bg)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(36px) saturate(190%)',
            WebkitBackdropFilter: 'blur(36px) saturate(190%)',
          }}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b mb-1"
               style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            Select Project
          </div>
          {projects.map(p => {
            const pTheme = getTheme(p.color);
            const isSelected = p.id === (selectedProj?.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-black/5 dark:bg-white/[0.08] font-semibold'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pTheme.hex }} />
                  <span className="truncate" style={{ color: 'var(--text-hi)' }}>{p.title}</span>
                </div>
                {isSelected && (
                  <Check size={13} className="text-zinc-700 dark:text-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Custom Priority Popover Selector ── */
function PriorityPickerPopover({ selectedPriority, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const prio = PRIORITIES[selectedPriority] || PRIORITIES.MED;

  useEffect(() => {
    const handleDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-3 py-2 text-xs font-semibold rounded-lg btn-ghost flex items-center gap-1.5"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prio.hex }} />
        <span style={{ color: 'var(--text-hi)' }}>{prio.short}</span>
        <ChevronDown size={13} className={`text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border shadow-2xl p-1.5 space-y-0.5 z-40 animate-scale-in"
          style={{
            background: 'var(--modal-bg)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(36px) saturate(190%)',
            WebkitBackdropFilter: 'blur(36px) saturate(190%)',
          }}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b mb-1"
               style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            Priority
          </div>
          {Object.entries(PRIORITIES).map(([key, val]) => {
            const isSelected = key === selectedPriority;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-black/5 dark:bg-white/[0.08] font-semibold'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: val.hex }} />
                  <span style={{ color: 'var(--text-hi)' }}>{val.label}</span>
                </div>
                {isSelected && (
                  <Check size={13} className="text-zinc-700 dark:text-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, warn = false, icon: Icon, trend = null }) {
  return (
    <div className={`p-3.5 sm:p-5 glass-card rounded-xl relative overflow-hidden ${
      warn ? 'border-rose-500/30' : 'border-white/[0.07]'
    }`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase truncate" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div className="flex items-center gap-1">
          <InfoTooltip title={label} text={`Overview metrics for ${label}`} />
          {Icon && (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04]">
              <Icon size={13} className={warn ? 'text-rose-400' : 'text-zinc-400'} />
            </div>
          )}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
        {value}
      </p>
      <div className="flex items-center justify-between mt-2 sm:mt-2.5 gap-1">
        {sub && <p className="text-[11px] sm:text-xs truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        {trend && (
          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md border shrink-0 ${
            trend.startsWith('↗')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700/40'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Executive Velocity Chart ── */
function MaterialMeChart({ tasks = [], stats = { total: 0, done: 0, pending: 0 } }) {
  const [activeBar, setActiveBar] = useState(6);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const hasTasks = stats.total > 0;
  
  const barData = months.map((m, idx) => {
    if (!hasTasks) return { label: m, val1: 0, val2: 0 };
    const count = tasks.filter(t => t.createdAt && new Date(t.createdAt).getMonth() === idx).length;
    const doneCount = tasks.filter(t => t.completed && t.createdAt && new Date(t.createdAt).getMonth() === idx).length;
    const basePct = Math.min(100, Math.max(8, count * 15 || 25));
    const donePct = count > 0 ? Math.round((doneCount / count) * basePct) : 8;
    return {
      label: m,
      val1: basePct,
      val2: donePct,
      taskCount: count,
      doneCount: doneCount,
    };
  });

  const sel = barData[activeBar] || barData[6];

  return (
    <div className="p-6 glass-card rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-hi)' }}>System Productivity & Velocity</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly task completion across workspace</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-hi)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }}/> Completed ({stats.done})
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full inline-block bg-zinc-500"/> Active ({stats.pending})
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-dim)' }}>
            Total ({stats.total})
          </span>
        </div>
      </div>

      {hasTasks ? (
        <div className="p-3 bg-white/[0.03] rounded-lg text-xs w-max border border-white/5">
          <p className="font-medium" style={{ color: 'var(--text-hi)' }}>{sel.taskCount || 0} tasks logged in {sel.label}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sel.doneCount || 0} completed</p>
        </div>
      ) : (
        <div className="p-3 bg-white/[0.02] rounded-lg text-xs text-center border border-dashed border-white/5">
          <p style={{ color: 'var(--text-muted)' }}>0 Tasks recorded this period</p>
        </div>
      )}

      <div className="h-40 flex items-end justify-between gap-2.5 pt-3 pb-1 border-b border-white/5">
        {barData.map((b, i) => (
          <div key={i} onClick={() => setActiveBar(i)} className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group h-full justify-end">
            <div className="w-full flex flex-col justify-end overflow-hidden rounded-t transition-all group-hover:opacity-80" style={{ height: `${b.val1}%` }}>
              {b.val1 > 0 ? (
                <>
                  <div className="w-full bg-zinc-500/40" style={{ height: `${b.val1 - b.val2}%` }} />
                  <div className="w-full" style={{ height: `${b.val2}%`, background: 'var(--accent)' }} />
                </>
              ) : (
                <div className="w-full h-0.5 bg-zinc-500/20" />
              )}
            </div>
            <span className="text-[10px] font-medium" style={{ color: i === activeBar ? 'var(--text-hi)' : 'var(--text-muted)' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleHealthRow({ project, stat, onClick }) {
  const theme = getTheme(project.color);
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors text-left group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-2 h-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: theme.hex }} />
        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-hi)' }}>
          {project.title}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-24 sm:w-28 h-1.5 bg-black/5 dark:bg-white/10 rounded-full relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
               style={{ width: `${stat?.pct ?? 0}%`, background: 'var(--accent)' }} />
        </div>
        <span className="text-xs font-mono font-medium w-9 text-right" style={{ color: 'var(--text-muted)' }}>
          {stat?.pct ?? 0}%
        </span>
      </div>
    </button>
  );
}

export default function DashboardView({ user, projects = [], tasks = [], stats = {}, logs, onNewProject, onNavigate, onAddTask, onToggleTask, onVoiceImport, onOpenNewTaskModal }) {
  const [quickText, setQuickText] = useState('');
  const [quickProject, setQuickProject] = useState(projects[0]?.id || '');
  const [quickPrio, setQuickPrio] = useState('MED');

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.displayName || (user?.email?.endsWith('@enginecore.dev') ? user?.email?.replace('@enginecore.dev', '') : user?.email?.split('@')[0]) || 'Operator';

  const handleQuickAdd = (e) => {
    e?.preventDefault();
    if (!quickText.trim()) return;
    const targetProj = quickProject || projects[0]?.id;
    if (!targetProj) {
      onNewProject?.();
      return;
    }
    onAddTask?.({ projectId: targetProj, text: quickText.trim(), priority: quickPrio, dueDate: null });
    setQuickText('');
  };

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scroll" style={{ background: 'var(--bg-base)' }}>
      {/* ── Executive Window Toolbar Header ── */}
      <div className="h-14 flex items-center justify-between px-6 border-b shrink-0 sticky top-0 z-20"
           style={{
             borderColor: 'var(--border-subtle)',
             background: 'var(--header-bg)',
             backdropFilter: 'blur(28px) saturate(190%)',
             WebkitBackdropFilter: 'blur(28px) saturate(190%)'
           }}>
        
        {/* Left: Clean Executive Title & Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-sm tracking-tight truncate" style={{ color: 'var(--text-hi)' }}>
              {timeGreeting}, {name}
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)'
                  }}>
              {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'} remaining
            </span>
          </div>
        </div>

        {/* Right: Date Stamp & Global Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Smart AI Creator Button */}
          {onVoiceImport && (
            <button
              onClick={onVoiceImport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/10"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-hi)',
              }}
              title="Open AI Smart Creator"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span className="hidden sm:inline">Smart Creator</span>
            </button>
          )}

          {/* New Project Button */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/10"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-hi)',
            }}
          >
            <Folder size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="hidden sm:inline">Project</span>
          </button>

          {/* Primary Add Task Button */}
          <button
            onClick={() => onOpenNewTaskModal ? onOpenNewTaskModal() : onNavigate('MODULES')}
            className="btn-primary flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto pb-28 sm:pb-24">

        {/* Quick Task Input Bar with Custom Popover Selectors */}
        <div className="p-3.5 glass-card rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
              <Zap size={13} className="text-amber-500"/> Quick Add
            </label>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Press Enter to save</span>
          </div>

          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              className="input-terminal flex-1 w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl font-medium"
              placeholder="What needs to be done?"
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Project Popover */}
              <ProjectPickerPopover
                projects={projects}
                selectedId={quickProject || projects[0]?.id}
                onChange={setQuickProject}
              />

              {/* Priority Popover */}
              <PriorityPickerPopover
                selectedPriority={quickPrio}
                onChange={setQuickPrio}
              />

              <button
                type="submit"
                disabled={!quickText.trim()}
                className="btn-primary px-4 py-2.5 text-xs font-semibold rounded-xl disabled:opacity-30 shrink-0"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Workspace Overview
            </h2>
            <InfoTooltip title="Overview Metrics" text="Real-time task counts and completion rate." />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard label="Total Tasks"   value={stats.total || 0}   sub={`${projects.length} active projects`} icon={CheckSquare} trend="↗ 1.5%" />
            <StatCard label="Completed"     value={stats.done || 0}    sub={`${stats.pct || 0}% resolution`} icon={CheckCircle2} trend="↗ 2.1%" />
            <StatCard label="Pending"       value={stats.pending || 0} sub="in queue" icon={Clock} />
            <StatCard label="Overdue"       value={stats.overdue || 0} sub="past due" warn={(stats.overdue || 0) > 0} icon={AlertTriangle} />
          </div>
        </div>

        {/* Velocity Chart */}
        <MaterialMeChart tasks={tasks} stats={stats} />

        {/* Global Progress Bar Card */}
        <div className="p-4 glass-card rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Overall Resolution Progress
            </p>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-hi)' }}>{stats.pct || 0}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${stats.pct || 0}%` }} />
          </div>
          <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-dim)' }}>
            <span>0%</span>
            <span>{stats.done || 0} of {stats.total || 0} tasks completed</span>
            <span>100%</span>
          </div>
        </div>

        {/* Two Column Grid: Priority Focus + Project Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

          {/* Priority Focus */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col border" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                 style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500"/>
                <p className="font-semibold text-xs" style={{ color: 'var(--text-hi)' }}>
                  Priority Focus
                </p>
                <InfoTooltip title="Priority Focus" text="Your top pending CRITICAL and HIGH priority tasks across all projects." />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-dim)' }}>Urgent</span>
            </div>
            <div className="divide-y flex-1" style={{ borderColor: 'var(--border-subtle)' }}>
              {(stats.highFocus || []).length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-zinc-400"/>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>All Urgent Tasks Clear</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>No critical or high-priority pending items.</p>
                </div>
              ) : (
                (stats.highFocus || []).map(task => {
                  const proj = projects.find(p => p.id === task.projectId);
                  return (
                    <div key={task.id}
                         className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                         style={{ borderBottomColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask?.(task)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 border ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
                              : 'border-zinc-400 dark:border-zinc-400/80 bg-black/5 dark:bg-white/10 hover:border-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-snug truncate" style={{ color: 'var(--text-hi)' }}>{task.text}</p>
                          {proj && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>📁 {proj.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && <DueBadge dateStr={task.dueDate} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Project Health */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col border" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                 style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}>
              <div className="flex items-center gap-2">
                <LayoutGrid size={14} className="text-zinc-400"/>
                <p className="font-semibold text-xs" style={{ color: 'var(--text-hi)' }}>
                  Projects
                </p>
                <InfoTooltip title="Module Health" text="Progress breakdown across each project." />
              </div>
              <button onClick={() => onNavigate('MODULES')}
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                View All →
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--text-dim)' }}>
                <p className="text-xs">No projects created yet.</p>
                <button onClick={onNewProject} className="mt-2 text-xs font-medium hover:underline" style={{ color: 'var(--text-hi)' }}>
                  + Create your first project
                </button>
              </div>
            ) : (
              <div className="divide-y flex-1" style={{ borderColor: 'var(--border-subtle)' }}>
                {projects.slice(0, 7).map(p => (
                  <ModuleHealthRow key={p.id} project={p}
                    stat={(stats.byProject || {})[p.id]}
                    onClick={() => onNavigate('MODULES')} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
