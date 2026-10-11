import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus, X, List, LayoutGrid, CheckCircle2, Circle, Trash2, ChevronDown, Check,
  SlidersHorizontal, Sparkles, Kanban, ArrowRight, Clock, AlertTriangle, ArrowLeft,
  MoveRight, CheckSquare, MoreHorizontal, Layers, ShieldAlert
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import VoiceImportModal from '../components/VoiceImportModal';
import { getTheme, getPriority, getStatus, PRIORITIES, TASK_STATUSES } from '../constants';
import { ArcProgress, TaskCard, AddTaskForm, StatusBadge, PriorityBadge, DueBadge } from '../components/shared';
import { calculateNewOrder, sortByOrder } from '../utils/ordering';
import BulkActionsBar from '../components/BulkActionsBar';

const KANBAN_COLUMNS = [
  { id: 'BACKLOG',     title: 'Backlog',     color: '#71717A', bg: 'rgba(113,113,122,0.06)', border: 'rgba(113,113,122,0.15)' },
  { id: 'TODO',        title: 'To Do',       color: '#0A84FF', bg: 'rgba(10,132,255,0.06)',  border: 'rgba(10,132,255,0.15)'  },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#FF9F0A', bg: 'rgba(255,159,10,0.06)', border: 'rgba(255,159,10,0.15)' },
  { id: 'IN_REVIEW',   title: 'In Review',   color: '#AF52DE', bg: 'rgba(175,82,222,0.06)', border: 'rgba(175,82,222,0.15)' },
  { id: 'DONE',        title: 'Done',        color: '#30D158', bg: 'rgba(48,209,88,0.06)',  border: 'rgba(48,209,88,0.15)'  },
];

/* ── Sort Selector Popover ───────────────────────────────────────────────── */
function SortPickerPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const OPTIONS = [
    { id: 'recent',   label: 'Recently Created' },
    { id: 'name',     label: 'Alphabetical (A-Z)' },
    { id: 'progress', label: 'Completion Rate' },
    { id: 'tasks',    label: 'Total Task Count' },
  ];

  const current = OPTIONS.find(o => o.id === value) || OPTIONS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all"
        style={{
          background: 'var(--input-bg)',
          borderColor: 'var(--input-border)',
          color: 'var(--text-hi)'
        }}
      >
        <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>Sort:</span>
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border shadow-xl z-50 p-1.5 space-y-0.5 animate-scale-in"
          style={{
            background: 'var(--modal-bg)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(32px)',
          }}
        >
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left"
              style={{
                background: value === opt.id ? 'var(--bg-hover)' : 'transparent',
                color: value === opt.id ? 'var(--text-hi)' : 'var(--text-normal)'
              }}
            >
              <span>{opt.label}</span>
              {value === opt.id && <Check size={13} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Interactive Kanban Card Component ───────────────────────────────────── */
function KanbanCard({ task, onEdit, onToggle, onFocus, onMoveStatus, onDelete, onDropOnCard }) {
  const [moveMenu, setMoveMenu] = useState(false);
  const moveRef = useRef(null);
  const isDone = task.status === 'DONE';
  const isBlocked = Boolean(task.blocker?.isBlocked);
  const checklists = task.checklists || [];
  const chkDone = checklists.filter(c => c.completed).length;

  useEffect(() => {
    const handler = (e) => {
      if (moveRef.current && !moveRef.current.contains(e.target)) setMoveMenu(false);
    };
    if (moveMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moveMenu]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, sourceStatus: task.status, order: task.order }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={e => onDropOnCard && onDropOnCard(e, task)}
      className={`group/k rounded-2xl border p-3.5 space-y-2.5 transition-all duration-200 cursor-grab active:cursor-grabbing select-none shadow-xs hover:shadow-md ${
        isDone ? 'opacity-50 bg-black/[0.02] dark:bg-white/[0.01]' : 'bg-[var(--bg-panel)]'
      } ${isBlocked ? 'ring-1 ring-rose-500/40' : ''}`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Card Header & Checkbox */}
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
              : 'border-zinc-400 dark:border-zinc-400/80 bg-black/5 dark:bg-white/10 hover:border-emerald-400 hover:bg-emerald-500/10'
          }`}
          title={isDone ? 'Mark incomplete (moves to To Do)' : 'Mark complete'}
        >
          {isDone && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
          <p className={`text-xs font-semibold leading-snug cursor-pointer transition-all ${
            isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)] hover:text-[var(--accent)]'
          }`}>
            {task.text}
          </p>
        </div>
      </div>

      {/* Blocker Alert */}
      {isBlocked && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold">
          <ShieldAlert size={12} className="shrink-0" />
          <span className="truncate">{task.blocker?.reason || 'Blocked'}</span>
        </div>
      )}

      {/* Checklists & Telemetry Badges */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] pt-0.5">
        <PriorityBadge priority={task.priority} />

        {task.dueDate && <DueBadge dateStr={task.dueDate} />}

        {checklists.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            <CheckSquare size={10} />
            <span>{chkDone}/{checklists.length}</span>
          </span>
        )}

        {(task.totalFocusMs || 0) > 0 && (
          <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
            <Clock size={10} />
            <span>{Math.round(task.totalFocusMs / 60000)}m</span>
          </span>
        )}
      </div>

      {/* Quick Move Action Bar */}
      <div className="flex items-center justify-between pt-1 border-t opacity-80 group-hover/k:opacity-100 transition-opacity"
           style={{ borderColor: 'var(--border-subtle)' }}>
        
        {/* Fast Column Shift Popover */}
        <div className="relative" ref={moveRef}>
          <button
            type="button"
            onClick={() => setMoveMenu(m => !m)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            title="Move to workflow column"
          >
            <span>Move</span>
            <MoveRight size={10} />
          </button>

          {moveMenu && (
            <div
              className="absolute left-0 bottom-full mb-1.5 w-36 rounded-xl border shadow-xl z-50 p-1 space-y-0.5 animate-scale-in"
              style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-subtle)', backdropFilter: 'blur(32px)' }}
            >
              {KANBAN_COLUMNS.map(col => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => { onMoveStatus(task.id, col.id); setMoveMenu(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold rounded-lg text-left transition-colors ${
                    task.status === col.id ? 'bg-black/10 dark:bg-white/10 font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ color: col.color }}
                >
                  <span>{col.title}</span>
                  {task.status === col.id && <Check size={11} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus & Edit Action Tools */}
        <div className="flex items-center gap-1">
          {onFocus && !isDone && (
            <button
              type="button"
              onClick={() => onFocus(task)}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors text-[11px]"
              title="Launch Pomodoro on task"
            >
              ⏱
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[11px]"
            title="Task details"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors text-[11px]"
            title="Delete card"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dedicated Single Project Kanban Board View ──────────────────────────── */
function ProjectKanbanBoard({
  project,
  projects = [],
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onEditTask,
  onFocusTask,
  onMoveTaskStatus,
  onNewProject,
  onBack,
}) {
  const [quickColForm, setQuickColForm] = useState(null); // column id
  const [quickText, setQuickText] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const theme = getTheme(project.color);

  const tasksByColumn = useMemo(() => {
    const map = {};
    KANBAN_COLUMNS.forEach(c => { map[c.id] = []; });
    tasks.forEach(t => {
      const colId = t.status || (t.completed ? 'DONE' : 'TODO');
      if (map[colId]) map[colId].push(t);
      else map.TODO.push(t);
    });
    // Sort tasks in each column strictly by order
    Object.keys(map).forEach(k => {
      map[k] = sortByOrder(map[k]);
    });
    return map;
  }, [tasks]);

  const handleDropOnColumn = (e, targetStatus) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data?.taskId) return;
      const colTasks = tasksByColumn[targetStatus] || [];
      const newOrder = calculateNewOrder(
        colTasks.length > 0 ? colTasks[colTasks.length - 1].order : null,
        null
      );
      onMoveTaskStatus(data.taskId, targetStatus, newOrder, 'USER');
    } catch (err) {
      console.error('[Kanban drop error]', err);
    }
  };

  const handleDropOnCard = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data?.taskId || data.taskId === targetTask.id) return;
      const colTasks = tasksByColumn[targetTask.status] || [];
      const targetIdx = colTasks.findIndex(t => t.id === targetTask.id);
      if (targetIdx === -1) return;

      const prevTask = targetIdx > 0 ? colTasks[targetIdx - 1] : null;
      const newOrder = calculateNewOrder(prevTask?.order ?? null, targetTask.order);
      onMoveTaskStatus(data.taskId, targetTask.status, newOrder, 'USER');
    } catch (err) {
      console.error('[Kanban drop on card error]', err);
    }
  };

  const handleQuickAdd = async (status) => {
    if (!quickText.trim()) return;
    const colTasks = tasksByColumn[status] || [];
    const newOrder = calculateNewOrder(
      colTasks.length > 0 ? colTasks[colTasks.length - 1].order : null,
      null
    );
    await onAddTask({
      projectId: project.id,
      text: quickText.trim(),
      status,
      order: newOrder,
      priority: 'MED',
      checklists: [],
    });
    setQuickText('');
    setQuickColForm(null);
  };

  const total = tasks.length;
  const doneCount = (tasksByColumn.DONE || []).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in" style={{ background: 'var(--bg-base)' }}>
      
      {/* Board Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b shrink-0 flex-wrap gap-3 z-10"
           style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
        
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
          >
            <ArrowLeft size={14} />
            <span>Projects</span>
          </button>

          <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: theme.hex }} />

          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base tracking-tight truncate" style={{ color: 'var(--text-hi)' }}>
              {project.title}
            </h2>
            {project.sub && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{project.sub}</p>}
          </div>
        </div>

        {/* Board Progress Telemetry & Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 mr-1">
            <div className="w-24 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: theme.hex }} />
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>{pct}%</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{doneCount}/{total} done</span>
          </div>

          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 shadow-xs transition-all active:scale-95"
            title="Open Smart AI Task Creator for this project"
          >
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span className="hidden md:inline">Smart AI Task Creator</span>
            <span className="md:hidden">AI Tasks</span>
          </button>

          <button
            onClick={() => setQuickColForm('TODO')}
            className="btn-primary flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Task</span>
          </button>
        </div>
      </div>

      {/* ── 5-Column Kanban Board Container ── */}
      <div className="flex-1 overflow-x-auto scroll p-3.5 sm:p-5 flex gap-4 pe-8 sm:pe-12 pb-28 sm:pb-8">
        {KANBAN_COLUMNS.map(col => {
          const colTasks = tasksByColumn[col.id] || [];
          const isAdding = quickColForm === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDropOnColumn(e, col.id)}
              className="w-72 sm:w-80 shrink-0 flex flex-col rounded-3xl border shadow-xs overflow-hidden"
              style={{
                background: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between shrink-0"
                   style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="font-bold text-xs tracking-tight" style={{ color: 'var(--text-hi)' }}>
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickColForm(col.id)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-colors"
                  title="Add card to column"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Card List Stream */}
              <div className="flex-1 overflow-y-auto scroll p-3 space-y-2.5 min-h-[150px]">
                {colTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onToggle={onToggleTask}
                    onFocus={onFocusTask}
                    onMoveStatus={(id, targetCol) => onMoveTaskStatus(id, targetCol, null, 'USER')}
                    onDelete={onDeleteTask}
                    onDropOnCard={handleDropOnCard}
                  />
                ))}

                {colTasks.length === 0 && !isAdding && (
                  <div className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4"
                       style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No tasks in {col.title}</p>
                    <button
                      onClick={() => setQuickColForm(col.id)}
                      className="mt-1.5 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      + Add Card
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Card Form / Button at bottom */}
              <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                {isAdding ? (
                  <div className="space-y-2 animate-fade-in">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Card title / task description..."
                      value={quickText}
                      onChange={e => setQuickText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleQuickAdd(col.id);
                        if (e.key === 'Escape') setQuickColForm(null);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAdd(col.id)}
                        className="flex-1 btn-primary py-1.5 text-xs font-semibold rounded-xl"
                      >
                        Add Card
                      </button>
                      <button
                        onClick={() => setQuickColForm(null)}
                        className="px-3 py-1.5 rounded-xl border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuickColForm(col.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-colors"
                  >
                    <Plus size={13} /> Add Card
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart AI Task Creator Modal scoped to this project */}
      {showAIModal && (
        <VoiceImportModal
          targetProject={project}
          projects={projects.length > 0 ? projects : [project]}
          onClose={() => setShowAIModal(false)}
          onCreate={onNewProject}
          onAddTask={onAddTask}
        />
      )}
    </div>
  );
}

/* ── Project Overview Card ────────────────────────────────────────────────── */
function ProjectCard({ project, tasks, onSelectBoard, onAddTask, onDeleteTask, onToggleTask, onEditTask, onFocusTask, onDeleteProject }) {
  const theme = getTheme(project.color);
  const done = tasks.filter(t => t.status === 'DONE').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="rounded-3xl border bg-[var(--bg-panel)] shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col overflow-hidden animate-fade-in"
         style={{ borderColor: 'var(--border-subtle)' }}>

      {/* Card Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b shrink-0 gap-3 cursor-pointer"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}
        onClick={() => onSelectBoard(project)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ArcProgress pct={pct} hex={theme.hex} size={42} />
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight truncate group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-hi)' }}>
              {project.title}
            </h3>
            {project.sub && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {project.sub}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onDeleteProject(project.id, project.title); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Delete project"
        >
          <X size={14} />
        </button>
      </div>

      {/* Workflow Stats Matrix */}
      <div className="px-5 py-3 border-b flex items-center justify-between gap-3 text-xs"
           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <span>{done}/{tasks.length} Done</span>
          {inProgress > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{inProgress} Active</span>
            </span>
          )}
        </div>
        <button
          onClick={() => onSelectBoard(project)}
          className="font-semibold text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <span>Kanban Board</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Task List Sample */}
      <div className="flex-1 p-3.5 space-y-2 min-h-[140px] max-h-[260px] overflow-y-auto scroll">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No tasks created yet</p>
            <button
              onClick={() => onSelectBoard(project)}
              className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Open Kanban Board →
            </button>
          </div>
        ) : (
          tasks.slice(0, 4).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onEdit={() => onEditTask(task)}
              onFocus={() => onFocusTask && onFocusTask(task)}
              showStatus={true}
              compact={true}
            />
          ))
        )}
      </div>

      {/* Card Action Footer */}
      <button
        onClick={() => onSelectBoard(project)}
        className="w-full py-3 text-xs font-semibold border-t flex items-center justify-center gap-1.5 hover:bg-[var(--bg-hover)] transition-colors"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
      >
        <Kanban size={13} />
        <span>Open Project Kanban</span>
      </button>
    </div>
  );
}

/* ── Main Modules & Projects Suite ────────────────────────────────────────── */
export default function ModulesView({
  projects = [], tasks = [], stats = {},
  onAddTask, onDeleteTask, onToggleTask, onEditTask, onFocusTask,
  onMoveTaskStatus, onDeleteProject, onNewProject, onVoiceImport,
}) {
  const [activeBoardProject, setActiveBoardProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === 'recent')   return b.createdAt - a.createdAt;
      if (sortBy === 'name')     return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return (stats.byProject[b.id]?.pct ?? 0) - (stats.byProject[a.id]?.pct ?? 0);
      if (sortBy === 'tasks')    return (stats.byProject[b.id]?.total ?? 0) - (stats.byProject[a.id]?.total ?? 0);
      return 0;
    });
  }, [projects, sortBy, stats]);

  // If a specific project Kanban board is selected, render dedicated board
  if (activeBoardProject) {
    const projTasks = tasks.filter(t => t.projectId === activeBoardProject.id);
    return (
      <ProjectKanbanBoard
        project={activeBoardProject}
        projects={projects}
        tasks={projTasks}
        onAddTask={onAddTask}
        onDeleteTask={onDeleteTask}
        onToggleTask={onToggleTask}
        onEditTask={onEditTask}
        onFocusTask={onFocusTask}
        onMoveTaskStatus={onMoveTaskStatus}
        onNewProject={onNewProject}
        onBack={() => setActiveBoardProject(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      
      {/* ── Executive Header Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 flex-wrap gap-4 z-10"
           style={{
             background: 'var(--header-bg)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(28px) saturate(190%)',
             WebkitBackdropFilter: 'blur(28px) saturate(190%)',
           }}>
        
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
              Projects & Workspaces
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              {projects.length} active
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Multi-column Kanban boards and project execution management
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <SortPickerPopover value={sortBy} onChange={setSortBy} />

          <InfoTooltip
            title="Project Kanban Boards"
            text="Each project features a full 5-stage Kanban board (Backlog → To Do → In Progress → In Review → Done) with drag-and-drop and checklist progress tracking."
          />

          <button
            onClick={onNewProject}
            className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ── Project Grid / Overview ── */}
      <div className="flex-1 overflow-y-auto scroll p-4 sm:p-6 pb-28 sm:pb-24">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl text-center p-6 max-w-md mx-auto"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3" style={{ color: 'var(--text-hi)' }}>
              <Layers size={22} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>No Projects Created</h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Create your first project module to unlock interactive Kanban boards, checklists, and execution velocity.
            </p>
            <button
              onClick={onNewProject}
              className="mt-4 btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
            >
              + Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedProjects.map(proj => (
              <ProjectCard
                key={proj.id}
                project={proj}
                tasks={tasks.filter(t => t.projectId === proj.id)}
                onSelectBoard={p => setActiveBoardProject(p)}
                onAddTask={onAddTask}
                onDeleteTask={onDeleteTask}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onFocusTask={onFocusTask}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
