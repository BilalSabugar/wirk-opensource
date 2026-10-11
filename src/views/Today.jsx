import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, X, Plus, Target, ChevronDown, 
  Sparkles, Play, AlertOctagon, CheckSquare, Calendar, Clock,
  ArrowRight, Check
} from 'lucide-react';
import { getTheme, getPriority, PRIORITIES, getStatus, TASK_STATUSES } from '../constants';
import InfoTooltip from '../components/InfoTooltip';
import { PriorityBadge, DueBadge, StatusBadge } from '../components/shared';
import { getLocalDateKey } from '../hooks/useData';

/* ── Activity Progress Ring ───────────────────────────────────────────────── */
function Ring({ pct, done, total, size = 120 }) {
  const cx = size / 2, r = (size - 14) / 2, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(pct, 100) / 100);
  const color = pct === 100 ? '#30D158' : pct >= 60 ? '#0A84FF' : pct >= 30 ? '#FF9F0A' : '#FF453A';

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={8}/>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s' }}/>
      <text x={cx} y={cx - 4} textAnchor="middle" fill="var(--text-hi)" fontSize="22" fontWeight="800" fontFamily="Inter, sans-serif">{pct}%</text>
      <text x={cx} y={cx + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.05em">{done}/{total} GOALS</text>
    </svg>
  );
}

/* ── Today Goal Card ──────────────────────────────────────────────────────── */
function GoalCard({ 
  task, 
  projects, 
  onToggle, 
  onRemove, 
  onFocus, 
  onEdit,
  onToggleChecklist 
}) {
  const proj = projects.find(p => p.id === task.projectId);
  const theme = getTheme(proj?.color);
  const isDone = task.status === 'DONE';
  const isBlocked = Boolean(task.blocker?.isBlocked);

  const chkDone = (task.checklists || []).filter(c => c.completed).length;
  const chkTotal = (task.checklists || []).length;

  return (
    <div className={`group/card flex flex-col p-4 rounded-2xl border transition-all duration-200 animate-fade-in
                     ${isDone ? 'opacity-50 bg-black/[0.02] dark:bg-white/[0.01]' : 'bg-[var(--bg-panel)] shadow-sm hover:shadow-md'}`}
         style={{ borderColor: isBlocked ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-subtle)' }}>
      
      <div className="flex items-start gap-3">
        {/* Goal Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
              : 'border-zinc-400 dark:border-zinc-400/80 bg-black/5 dark:bg-white/10 hover:border-emerald-400 hover:bg-emerald-500/10'
          }`}
          title={isDone ? 'Mark as Incomplete' : 'Complete Task'}
        >
          {isDone && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit && onEdit(task)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {proj && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                {proj.title}
              </span>
            )}
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {isBlocked && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <AlertOctagon size={10} />
                <span>Blocked</span>
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm font-semibold leading-relaxed transition-all ${
            isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'
          }`}>
            {task.text}
          </p>

          {task.description && (
            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}

          {/* Checklist preview */}
          {chkTotal > 0 && (
            <div className="mt-2.5 pt-2 border-t space-y-1" style={{ borderColor: 'var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-semibold mb-1">
                <span>Checklist ({chkDone}/{chkTotal})</span>
                <span>{Math.round((chkDone / chkTotal) * 100)}%</span>
              </div>
              <div className="space-y-1">
                {task.checklists.slice(0, 3).map(chk => (
                  <div key={chk.id} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onToggleChecklist && onToggleChecklist(task.id, chk.id)}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                        chk.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-400 dark:border-zinc-500'
                      }`}
                    >
                      {chk.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={`text-[11px] ${chk.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'}`}>
                      {chk.text}
                    </span>
                  </div>
                ))}
                {chkTotal > 3 && (
                  <span className="text-[10px] text-[var(--text-muted)] italic">+ {chkTotal - 3} more items</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!isDone && onFocus && (
            <button
              type="button"
              onClick={() => onFocus(task)}
              className="p-1.5 rounded-xl text-blue-500 hover:bg-blue-500/10 transition-colors"
              title="Focus in Pomodoro"
            >
              <Play size={13} fill="currentColor" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onRemove(task)}
            className="p-1.5 rounded-xl opacity-0 group-hover/card:opacity-100 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            title="Remove from Today"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Picker Row ───────────────────────────────────────────────────────────── */
function PickerRow({ task, projects, onAdd, alreadyAdded }) {
  const proj = projects.find(p => p.id === task.projectId);
  const theme = getTheme(proj?.color);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b transition-colors group/pick ${alreadyAdded ? 'opacity-35 pointer-events-none' : 'cursor-pointer hover:bg-[var(--bg-hover)]'}`}
         style={{ borderColor: 'var(--border-subtle)' }}
         onClick={() => !alreadyAdded && onAdd(task)}>
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.hex || 'var(--accent)' }}/>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate font-semibold" style={{ color: 'var(--text-hi)' }}>{task.text}</p>
        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{proj?.title}</p>
      </div>
      <PriorityBadge priority={task.priority}/>
      {alreadyAdded ? (
        <span className="text-[10px] font-semibold text-emerald-500 shrink-0">✓ Planned</span>
      ) : (
        <Plus size={14} className="opacity-0 group-hover/pick:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--text-hi)' }}/>
      )}
    </div>
  );
}

export default function TodayView({ 
  tasks = [], 
  projects = [], 
  onUpdateTask, 
  onFocusTask,
  onEditTask,
  onToggleChecklist,
  onPlanTask,
  onUnplanTask
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const [pickerPrio, setPickerPrio] = useState('ALL');
  const [pickerMod, setPickerMod] = useState('ALL');
  const [expandDone, setExpandDone] = useState(false);

  const todayStr = getLocalDateKey();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Today's commitments: plannedDate === todayStr OR legacy isGoal === true
  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => t.plannedDate === todayStr || t.isGoal)
      .sort((a, b) => getPriority(a.priority).order - getPriority(b.priority).order);
  }, [tasks, todayStr]);

  const pendingGoals = todayTasks.filter(t => t.status !== 'DONE');
  const completedGoals = todayTasks.filter(t => t.status === 'DONE');
  const pct = todayTasks.length ? Math.round((completedGoals.length / todayTasks.length) * 100) : 0;
  const goalIds = new Set(todayTasks.map(t => t.id));

  // Available tasks to pick for today
  const pickerTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status === 'DONE') return false;
      const matchQ = !pickerQ || t.text.toLowerCase().includes(pickerQ.toLowerCase());
      const matchP = pickerPrio === 'ALL' || t.priority === pickerPrio;
      const matchM = pickerMod === 'ALL' || t.projectId === pickerMod;
      return matchQ && matchP && matchM;
    }).sort((a, b) => getPriority(a.priority).order - getPriority(b.priority).order);
  }, [tasks, pickerQ, pickerPrio, pickerMod]);

  // Handlers
  const handleAddGoal = (task) => {
    if (onPlanTask) onPlanTask(task.id, todayStr);
    else onUpdateTask(task.id, { plannedDate: todayStr, isGoal: true });
  };

  const handleRemoveGoal = (task) => {
    if (onUnplanTask) onUnplanTask(task.id);
    else onUpdateTask(task.id, { plannedDate: null, isGoal: false });
  };

  const handleToggleTask = (task) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    onUpdateTask(task.id, { status: nextStatus, source: 'USER' });
  };

  const motivational = pct === 100 ? '🎉 All goals complete. Outstanding execution.'
    : pct >= 75 ? '🔥 Almost there — push through the finish line.'
    : pct >= 50 ? '⚡ Halfway done — stay in the zone.'
    : pct >= 25 ? '🎯 Good start — keep the momentum going.'
    : todayTasks.length === 0 ? 'No goals planned for today. Pick tasks from your modules to get started.'
    : '🚀 Day in progress — execute with precision.';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 z-10"
           style={{
             background: 'var(--header-bg)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(28px) saturate(190%)',
             WebkitBackdropFilter: 'blur(28px) saturate(190%)',
           }}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
              Today's Focus
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              {pendingGoals.length} remaining
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dateLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <InfoTooltip
            title="Daily Mission"
            text="Pick high-impact tasks from your modules to tackle today. Focus on completing these to maintain your execution streak."
          />
          <button
            onClick={() => setShowPicker(p => !p)}
            className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={14}/>
            <span>Plan Today</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Goal List */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
          
          {/* Hero Activity Ring & Status Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0 text-center sm:text-left"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <Ring pct={pct} done={completedGoals.length} total={todayTasks.length}/>
            <div className="flex-1 min-w-0 w-full">
              <p className="text-xs sm:text-sm font-semibold mb-2.5 sm:mb-3" style={{ color: 'var(--text-hi)' }}>{motivational}</p>
              {todayTasks.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {Object.entries(PRIORITIES).map(([k, v]) => {
                    const cnt = todayTasks.filter(t => t.priority === k).length;
                    if (!cnt) return null;
                    const Icon = v.Icon;
                    return (
                      <div key={k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}>
                        <Icon size={12} className={v.color}/>
                        <span>{cnt}</span>
                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{v.short}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Task Stream */}
          <div className="flex-1 overflow-y-auto scroll p-3.5 sm:p-5 space-y-3 max-w-4xl w-full mx-auto pb-28 sm:pb-24">
            {todayTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3" style={{ color: 'var(--text-hi)' }}>
                  <Target size={22} />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>No Daily Goals Selected</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Select the most important tasks from your modules to dedicate your energy to today.
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  className="mt-4 btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  + Pick Tasks from Modules
                </button>
              </div>
            )}

            {pendingGoals.map(task => (
              <GoalCard 
                key={task.id} 
                task={task} 
                projects={projects}
                onToggle={handleToggleTask} 
                onRemove={handleRemoveGoal}
                onFocus={onFocusTask}
                onEdit={onEditTask}
                onToggleChecklist={onToggleChecklist}
              />
            ))}

            {completedGoals.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setExpandDone(e => !e)}
                  className="flex items-center gap-2 text-xs font-semibold mb-3 transition-colors hover:text-[var(--text-hi)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ChevronDown size={13} className={`transition-transform duration-200 ${expandDone ? '' : '-rotate-90'}`}/>
                  <span>Completed Today ({completedGoals.length})</span>
                </button>

                {expandDone && (
                  <div className="space-y-3 animate-fade-in">
                    {completedGoals.map(task => (
                      <GoalCard 
                        key={task.id} 
                        task={task} 
                        projects={projects}
                        onToggle={handleToggleTask} 
                        onRemove={handleRemoveGoal}
                        onFocus={onFocusTask}
                        onEdit={onEditTask}
                        onToggleChecklist={onToggleChecklist}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Picker Drawer */}
        {showPicker && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden animate-fade-in" 
              onClick={() => setShowPicker(false)} 
            />
            <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 sm:static shrink-0 border-l flex flex-col overflow-hidden animate-slide-left shadow-2xl"
                 style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-subtle)', backdropFilter: 'blur(32px)' }}>
            
            <div className="p-4 border-b shrink-0 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>Pick Tasks for Today</p>
                <button onClick={() => setShowPicker(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                  <X size={14}/>
                </button>
              </div>

              <input
                className="w-full px-3 py-1.5 text-xs rounded-xl border outline-none font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                placeholder="Search across all tasks..."
                value={pickerQ}
                onChange={e => setPickerQ(e.target.value)}
              />

              <div className="flex gap-2">
                <select
                  value={pickerPrio}
                  onChange={e => setPickerPrio(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                >
                  <option value="ALL">All Priorities</option>
                  {Object.entries(PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>

                <select
                  value={pickerMod}
                  onChange={e => setPickerMod(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                >
                  <option value="ALL">All Modules</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll">
              {pickerTasks.length === 0 && (
                <p className="text-center py-10 text-xs" style={{ color: 'var(--text-muted)' }}>No matching tasks found</p>
              )}
              {pickerTasks.map(task => (
                <PickerRow key={task.id} task={task} projects={projects}
                  onAdd={handleAddGoal} alreadyAdded={goalIds.has(task.id)}/>
              ))}
            </div>

            <div className="p-3 border-t shrink-0 text-center" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {goalIds.size} goal{goalIds.size !== 1 ? 's' : ''} planned for today
              </p>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
