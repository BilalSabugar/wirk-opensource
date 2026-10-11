import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, CheckCircle2, Circle, Trash2, AlertOctagon, 
  Clock, Play, GitFork, Link2, CheckSquare, Sparkles,
  Calendar, Flag, Folder, ArrowRight, Activity
} from 'lucide-react';
import { PRIORITIES, TASK_STATUSES, TASK_TAGS, getPriority, getStatus, getTheme } from '../constants';
import { validateTaskDependency, validateParentChild } from '../utils/taskValidation';

export default function EditTaskModal({ 
  task, 
  projects = [], 
  tasks = [], 
  onSave, 
  onDelete, 
  onClose,
  onFocusTask 
}) {
  const isNew = Boolean(task?.isNew);

  const [text, setText] = useState(task.text ?? '');
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState(task.status ?? 'TODO');
  const [priority, setPriority] = useState(task.priority ?? 'MED');
  const [projectId, setProjectId] = useState(task.projectId ?? (projects[0]?.id || ''));
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [dueTime, setDueTime] = useState(task.dueTime ?? '');
  const [plannedDate, setPlannedDate] = useState(task.plannedDate ?? '');
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId ?? '');
  const [tags, setTags] = useState(task.tags ?? []);
  
  // Blocker state
  const [isBlocked, setIsBlocked] = useState(Boolean(task.blocker?.isBlocked));
  const [blockerReason, setBlockerReason] = useState(task.blocker?.reason ?? '');
  const [dependencyTaskId, setDependencyTaskId] = useState(task.blocker?.dependencyTaskId ?? '');
  const [validationError, setValidationError] = useState('');

  // Checklist state
  const [checklists, setChecklists] = useState(task.checklists ?? []);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Project theme
  const proj = projects.find(p => p.id === projectId);
  const theme = getTheme(proj?.color);

  // Filter valid parent task candidates (same project, not self, parent itself has no parent)
  const validParents = useMemo(() => {
    return tasks.filter(t => 
      t.projectId === projectId &&
      t.id !== task.id &&
      !t.parentTaskId &&
      validateParentChild(task.id, t.id, tasks).valid
    );
  }, [tasks, projectId, task.id]);

  // Filter valid dependency task candidates
  const validDependencies = useMemo(() => {
    return tasks.filter(t => 
      t.projectId === projectId &&
      t.id !== task.id &&
      validateTaskDependency(task.id, t.id, tasks).valid
    );
  }, [tasks, projectId, task.id]);

  // Existing child subtasks if this is a parent
  const childSubtasks = useMemo(() => {
    if (!task.id) return [];
    return tasks.filter(t => t.parentTaskId === task.id);
  }, [tasks, task.id]);

  // Checklist handlers
  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    setChecklists(prev => [
      ...prev,
      { id: 'chk-' + Date.now(), text: newChecklistText.trim(), completed: false }
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id) => {
    setChecklists(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteChecklist = (id) => {
    setChecklists(prev => prev.filter(item => item.id !== id));
  };

  // Save handler
  const handleSave = () => {
    if (!text.trim()) return;
    setValidationError('');

    // Validate Blocker
    if (isBlocked && dependencyTaskId) {
      const depVal = validateTaskDependency(task.id, dependencyTaskId, tasks);
      if (!depVal.valid) {
        setValidationError(depVal.error);
        return;
      }
    }

    // Validate Parent-Child
    if (parentTaskId) {
      const parentVal = validateParentChild(task.id, parentTaskId, tasks);
      if (!parentVal.valid) {
        setValidationError(parentVal.error);
        return;
      }
    }

    const payload = {
      text: text.trim(),
      description: description.trim(),
      status,
      priority,
      projectId,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      plannedDate: plannedDate || null,
      parentTaskId: parentTaskId || null,
      tags,
      checklists,
      blocker: {
        isBlocked,
        reason: blockerReason.trim(),
        dependencyTaskId: isBlocked ? (dependencyTaskId || null) : null,
      }
    };

    onSave(task.id, payload);
    onClose();
  };

  // Esc key listener
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const chkDone = checklists.filter(c => c.completed).length;
  const chkTotal = checklists.length;
  const chkPct = chkTotal ? Math.round((chkDone / chkTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
         onClick={onClose}>
      
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
           style={{
             background: 'var(--modal-bg)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(36px) saturate(200%)',
             WebkitBackdropFilter: 'blur(36px) saturate(200%)'
           }}
           onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: theme.hex || 'var(--accent)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
              {isNew ? 'Create New Task' : 'Task Inspector'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && onFocusTask && (
              <button
                type="button"
                onClick={() => { onFocusTask(task); onClose(); }}
                className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-blue-500 hover:text-blue-400"
                title="Start Pomodoro Focus"
              >
                <Play size={12} fill="currentColor" />
                <span>Focus</span>
              </button>
            )}

            {!isNew && (
              <button
                type="button"
                onClick={() => { onDelete(task.id); onClose(); }}
                className="btn-ghost p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-ghost p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-hi)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Validation Banner ── */}
        {validationError && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs text-rose-400 font-semibold animate-fade-in shrink-0">
            <AlertOctagon size={14} />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto scroll p-6 space-y-5">
          
          {/* Status Selector Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Workflow Stage
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl border"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              {Object.entries(TASK_STATUSES).map(([key, item]) => {
                const isCurrent = status === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatus(key)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold transition-all ${
                      isCurrent
                        ? `${item.color} ${item.bg} border shadow-xs scale-100`
                        : 'text-[var(--text-muted)] hover:text-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
                    }`}
                    style={isCurrent ? { borderColor: 'var(--border-subtle)' } : {}}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Task Title
              </label>
              <input
                type="text"
                autoFocus
                placeholder="What needs to be accomplished?"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.shiftKey === false && handleSave()}
                className="w-full mt-1.5 px-3.5 py-2.5 text-sm font-semibold rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Description & Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add additional context, specifications, or links..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full mt-1.5 px-3.5 py-2.5 text-xs rounded-2xl border outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500/30"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>
          </div>

          {/* Project & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Project Module
              </label>
              <select
                value={projectId}
                onChange={e => {
                  setProjectId(e.target.value);
                  setParentTaskId('');
                  setDependencyTaskId('');
                }}
                className="w-full mt-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-2xl border outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full mt-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-2xl border outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              >
                {Object.entries(PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({v.short})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates Row: Due Date & Planned Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Calendar size={11} />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-2xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Clock size={11} />
                <span>Due Time</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-2xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Flag size={11} />
                <span>Planned For</span>
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={e => setPlannedDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-2xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>
          </div>

          {/* ── Blockers Section ── */}
          <div className="p-4 rounded-2xl border space-y-3"
               style={{ 
                 background: isBlocked ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface)', 
                 borderColor: isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)' 
               }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon size={14} className={isBlocked ? 'text-rose-500' : 'text-[var(--text-muted)]'} />
                <span className="text-xs font-bold" style={{ color: isBlocked ? '#FF453A' : 'var(--text-hi)' }}>
                  Blocker Status
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBlocked(b => !b)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  isBlocked
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-hi)]'
                }`}
              >
                {isBlocked ? 'Blocked' : 'Unblocked'}
              </button>
            </div>

            {isBlocked && (
              <div className="space-y-2.5 pt-1 animate-fade-in">
                <div>
                  <input
                    type="text"
                    placeholder="Why is this task blocked? (e.g. Waiting on API approval)"
                    value={blockerReason}
                    onChange={e => setBlockerReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                  />
                </div>
                {validDependencies.length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">
                      Blocked by Another Task
                    </label>
                    <select
                      value={dependencyTaskId}
                      onChange={e => setDependencyTaskId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                    >
                      <option value="">No specific dependency</option>
                      {validDependencies.map(dep => (
                        <option key={dep.id} value={dep.id}>{dep.text}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Checklists (Micro-steps) ── */}
          <div className="p-4 rounded-2xl border space-y-3"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} className="text-blue-500" />
                <span className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>
                  Checklist ({chkDone}/{chkTotal})
                </span>
              </div>
              {chkTotal > 0 && (
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  {chkPct}% complete
                </span>
              )}
            </div>

            {chkTotal > 0 && (
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                     style={{ width: `${chkPct}%` }} />
              </div>
            )}

            <div className="space-y-1.5">
              {checklists.map(item => (
                <div key={item.id}
                     className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl group/item hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-zinc-400 dark:border-zinc-500'
                    }`}
                  >
                    {item.completed && <CheckCircle2 size={12} />}
                  </button>
                  <span className={`flex-1 text-xs transition-all ${
                    item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)] font-medium'
                  }`}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:text-rose-500 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist micro-step..."
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ── 1-Level Hierarchy Parent Selection ── */}
          {childSubtasks.length === 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <GitFork size={11} />
                <span>Nest as Subtask of Parent</span>
              </label>
              <select
                value={parentTaskId}
                onChange={e => setParentTaskId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-2xl border outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              >
                <option value="">Top-Level Task (No Parent)</option>
                {validParents.map(parent => (
                  <option key={parent.id} value={parent.id}>{parent.text}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Tags ── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TAGS.map(t => {
                const isSelected = tags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTags(prev => isSelected ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                      isSelected
                        ? `${t.bg} ${t.text} ${t.border} shadow-xs`
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-hi)]'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Focus Telemetry & Status History ── */}
          {!isNew && (
            <div className="pt-2 border-t flex items-center justify-between text-[11px]"
                 style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{Math.round((task.totalFocusMs || 0) / 60000)}m focused</span>
                </span>
                <span>•</span>
                <span>{task.totalSessions || 0} Pomodoro sessions</span>
              </div>
              {task.statusHistory?.length > 0 && (
                <span className="text-[10px] font-mono">
                  {task.statusHistory.length} status transition{task.statusHistory.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-4 py-2 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-sm"
          >
            {isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
