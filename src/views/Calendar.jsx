import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Sparkles,
  CheckCircle2, Circle, Trash2, X, Tag, Filter, Calendar as CalendarIcon,
  CalendarDays, List, Gift, Briefcase, Phone, Flag, AlertCircle, Check,
  MoreHorizontal, ChevronDown, CheckSquare, GraduationCap, BookOpen
} from 'lucide-react';
import { getTheme, getPriority, PRIORITIES, formatDue, dueCls } from '../constants';
import { PriorityBadge, DueBadge } from '../components/shared';
import InfoTooltip from '../components/InfoTooltip';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EVENT_CATEGORIES = [
  { id: 'exam',       label: 'Exam / Test', icon: GraduationCap, color: '#FF453A', bg: 'rgba(255,69,58,0.12)', border: 'rgba(255,69,58,0.25)' },
  { id: 'assignment', label: 'Assignment',  icon: BookOpen,      color: '#AF52DE', bg: 'rgba(175,82,222,0.12)', border: 'rgba(175,82,222,0.25)' },
  { id: 'meeting',    label: 'Meeting',     icon: Briefcase,     color: '#0A84FF', bg: 'rgba(10,132,255,0.12)', border: 'rgba(10,132,255,0.25)' },
  { id: 'deadline',   label: 'Deadline',    icon: Flag,          color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)', border: 'rgba(255,159,10,0.25)' },
  { id: 'birthday',   label: 'Birthday',    icon: Gift,          color: '#FF375F', bg: 'rgba(255,55,95,0.12)',  border: 'rgba(255,55,95,0.25)'  },
  { id: 'call',       label: 'Call',        icon: Phone,         color: '#30D158', bg: 'rgba(48,209,88,0.12)',  border: 'rgba(48,209,88,0.25)'  },
  { id: 'personal',   label: 'Personal',    icon: Sparkles,      color: '#BF5AF2', bg: 'rgba(191,90,242,0.12)', border: 'rgba(191,90,242,0.25)' },
  { id: 'event',      label: 'Event',       icon: CalendarIcon,  color: '#64D2FF', bg: 'rgba(100,210,255,0.12)', border: 'rgba(100,210,255,0.25)' },
];

function toLocalDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

function dateKey(d) {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
}

/* ── Add Event / Task Modal ────────────────────────────────────────────────── */
function AddEventModal({ date, onClose, onSaveEvent, onSaveTask, projects = [] }) {
  const [tab, setTab] = useState('event'); // 'event' | 'task'
  
  // Event state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('meeting');
  const [time, setTime] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Task state
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('MED');
  const [taskProjectId, setTaskProjectId] = useState(projects[0]?.id || '');

  const dateStr = dateKey(date);
  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSaveEvent({
      id: 'evt-' + Date.now(),
      title: title.trim(),
      date: dateStr,
      time: hasTime ? time : null,
      category,
      location: location.trim() || null,
      notes: notes.trim() || null,
      createdAt: Date.now(),
    });
    onClose();
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskText.trim() || !taskProjectId) return;
    onSaveTask({
      projectId: taskProjectId,
      text: taskText.trim(),
      priority: taskPriority,
      dueDate: dateStr,
      tags: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-scale-in"
           style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-subtle)' }}
           onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-hi)' }}>Schedule on Date</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
            <X size={15}/>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 border-b flex gap-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={() => setTab('event')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === 'event' ? 'bg-[var(--bg-panel)] shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={{ color: 'var(--text-hi)' }}
          >
            🎓 Event / Exam / Milestone
          </button>
          <button
            type="button"
            onClick={() => setTab('task')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === 'task' ? 'bg-[var(--bg-panel)] shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={{ color: 'var(--text-hi)' }}
          >
            ✓ Due Task
          </button>
        </div>

        {/* Forms */}
        {tab === 'event' ? (
          <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Event / Exam Title</label>
              <input
                autoFocus
                type="text"
                required
                placeholder="e.g. Calculus Midterm, History Final, Design Review"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Category</label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        background: cat.bg,
                        borderColor: cat.border,
                        color: cat.color,
                        ringColor: cat.color,
                      }}
                    >
                      <Icon size={13} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Include Specific Time</label>
                <input
                  type="checkbox"
                  id="hasTime"
                  checked={hasTime}
                  onChange={e => setHasTime(e.target.checked)}
                  className="cursor-pointer accent-zinc-800 dark:accent-white rounded w-4 h-4"
                />
              </div>

              {hasTime && (
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium animate-fade-in"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                />
              )}
            </div>

            {/* Location / Details */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Location or Link (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Google Meet, Conference Room B"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 btn-primary py-2.5 text-xs font-semibold rounded-xl disabled:opacity-40"
              >
                Save Event
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveTask} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Task Description</label>
              <input
                autoFocus
                type="text"
                required
                placeholder="What task needs to be finished on this day?"
                value={taskText}
                onChange={e => setTaskText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Project Module</label>
                <select
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>Priority</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-hi)' }}
                >
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={!taskText.trim()}
                className="flex-1 btn-primary py-2.5 text-xs font-semibold rounded-xl disabled:opacity-40"
              >
                Save Due Task
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Day Detail Drawer / Inspector ────────────────────────────────────────── */
function DayDetailDrawer({ date, tasks, events, projects, onClose, onEditTask, onToggleTask, onAddTask, onDeleteEvent, onOpenAddModal }) {
  const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = dateKey(date) === dateKey(new Date());

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 lg:static shrink-0 border-l flex flex-col overflow-hidden animate-slide-left shadow-2xl lg:shadow-none"
         style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
           style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-hi)' }}>
              {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            {isToday && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Current
              </span>
            )}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="btn-primary p-1.5 rounded-lg flex items-center justify-center shadow-xs"
            title="Add event or task"
          >
            <Plus size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto scroll p-5 space-y-6">
        
        {/* Events & Meetings Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
              <Sparkles size={13} className="text-amber-500" /> Events & Meetings ({events.length})
            </p>
          </div>

          {events.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No events scheduled for this day.</p>
              <button
                onClick={onOpenAddModal}
                className="mt-2 text-[11px] font-semibold text-[var(--accent)] hover:underline"
              >
                + Schedule Event / Birthday
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(evt => {
                const cat = EVENT_CATEGORIES.find(c => c.id === evt.category) || EVENT_CATEGORIES[0];
                const Icon = cat.icon;
                return (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border transition-all relative group flex items-start justify-between gap-3 shadow-xs"
                    style={{ background: cat.bg, borderColor: cat.border }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: 'rgba(255,255,255,0.15)', color: cat.color }}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--text-hi)' }}>
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-medium" style={{ color: cat.color }}>
                          {evt.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {formatTime(evt.time)}
                            </span>
                          )}
                          <span>{cat.label}</span>
                        </div>
                        {evt.location && (
                          <p className="text-[10px] mt-1 flex items-center gap-1 opacity-80" style={{ color: 'var(--text-hi)' }}>
                            <MapPin size={10} /> {evt.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                      title="Delete event"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Due Tasks Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
              <CheckSquare size={13} className="text-emerald-500" /> Due Tasks ({tasks.length})
            </p>
          </div>

          {tasks.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tasks due on this date.</p>
              <button
                onClick={onOpenAddModal}
                className="mt-2 text-[11px] font-semibold text-[var(--accent)] hover:underline"
              >
                + Add Due Task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const proj = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border flex items-start gap-3 transition-all group"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTask(task)}
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'border-zinc-500/40 dark:border-zinc-500/50 hover:border-[var(--text-hi)] hover:bg-black/5 dark:hover:bg-white/10 bg-transparent'
                      }`}
                      title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug transition-all ${
                        task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'
                      }`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {proj && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                                style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                            {proj.title}
                          </span>
                        )}
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>

                    <button
                      onClick={() => onEditTask(task)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-hi)] transition-all"
                    >
                      ✎
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 border-t shrink-0 flex gap-2"
           style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onOpenAddModal}
          className="flex-1 btn-primary py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus size={14} /> Schedule on this Day
        </button>
      </div>
    </div>
  );
}

/* ── Calendar View ─────────────────────────────────────────────────────────── */
export default function CalendarView({
  tasks = [],
  projects = [],
  events: propEvents,
  onSaveEvent: propSaveEvent,
  onDeleteEvent: propDeleteEvent,
  onAddTask,
  onToggle,
  onEdit
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EVENTS' | 'TASKS'
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'

  // Persistent Custom Calendar Events (Fallback to localStorage if not managed externally)
  const [localEvents, setLocalEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('engine_calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const events = propEvents !== undefined ? propEvents : localEvents;

  useEffect(() => {
    if (propEvents === undefined) {
      try {
        localStorage.setItem('engine_calendar_events', JSON.stringify(localEvents));
      } catch (e) {
        console.error('[Calendar events save error]', e);
      }
    }
  }, [localEvents, propEvents]);

  const handleSaveEvent = (newEvent) => {
    if (propSaveEvent) {
      propSaveEvent(newEvent);
    } else {
      setLocalEvents(prev => [...prev, newEvent]);
    }
  };

  const handleDeleteEvent = (eventId) => {
    if (propDeleteEvent) {
      propDeleteEvent(eventId);
    } else {
      setLocalEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today); };

  // Build calendar grid
  const { cells, tasksByDay, eventsByDay } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWd = first.getDay(); // 0 = Sun

    const cells = [];
    for (let i = 0; i < startWd; i++) {
      const d = new Date(year, month, -startWd + i + 1);
      cells.push({ date: d, currentMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), currentMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(year, month + 1, cells.length - last.getDate() - startWd + 1);
      cells.push({ date: d, currentMonth: false });
    }

    const tasksByDay = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const k = t.dueDate;
      if (!tasksByDay[k]) tasksByDay[k] = [];
      tasksByDay[k].push(t);
    });

    const eventsByDay = {};
    events.forEach(e => {
      if (!e.date) return;
      const k = e.date;
      if (!eventsByDay[k]) eventsByDay[k] = [];
      eventsByDay[k].push(e);
    });

    return { cells, tasksByDay, eventsByDay };
  }, [year, month, tasks, events]);

  const selectedKey = dateKey(selected);
  const selectedTasks = tasksByDay[selectedKey] ?? [];
  const selectedEvents = eventsByDay[selectedKey] ?? [];
  const todayKey = dateKey(today);

  // Agenda list (all days with items)
  const agendaItems = useMemo(() => {
    const map = new Map();
    Object.keys(eventsByDay).forEach(k => {
      if (!map.has(k)) map.set(k, { date: toLocalDate(k), events: eventsByDay[k], tasks: tasksByDay[k] || [] });
    });
    Object.keys(tasksByDay).forEach(k => {
      if (!map.has(k)) map.set(k, { date: toLocalDate(k), events: eventsByDay[k] || [], tasks: tasksByDay[k] });
    });
    return Array.from(map.values()).sort((a, b) => a.date - b.date);
  }, [eventsByDay, tasksByDay]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      
      {/* ── Frosted Executive Header Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 flex-wrap gap-4 z-10"
           style={{
             background: 'var(--header-bg)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(28px) saturate(190%)',
             WebkitBackdropFilter: 'blur(28px) saturate(190%)',
           }}>
        
        {/* Month Title & Nav */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-bold text-base sm:text-lg tracking-tight" style={{ color: 'var(--text-hi)' }}>
              {MONTHS[month]} <span className="font-normal opacity-60">{year}</span>
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Schedule, deadlines, and milestone calendar
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* View mode toggle & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Month / Agenda View Segmented Pill */}
          <div className="flex p-0.5 rounded-xl border"
               style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month' ? 'bg-[var(--bg-panel)] shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ color: 'var(--text-hi)' }}
            >
              <CalendarDays size={13} />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'agenda' ? 'bg-[var(--bg-panel)] shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ color: 'var(--text-hi)' }}
            >
              <List size={13} />
              <span>Schedule</span>
            </button>
          </div>

          <InfoTooltip
            title="Interactive Schedule"
            text="Add meetings, birthdays, calls, and project deadlines directly to any day. Tasks with due dates automatically synchronize here."
          />

          {/* New Event Action Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">+ Event / Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Calendar Stream */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          {viewMode === 'month' ? (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b shrink-0 text-center"
                   style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                {DAYS.map(d => (
                  <div key={d} className="py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="flex-1 overflow-y-auto scroll">
                <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: 'minmax(110px, 1fr)' }}>
                  {cells.map(({ date, currentMonth }, i) => {
                    const key = dateKey(date);
                    const dayTasks = tasksByDay[key] ?? [];
                    const dayEvents = eventsByDay[key] ?? [];
                    const isToday = key === todayKey;
                    const isSel = selected && dateKey(selected) === key;
                    const totalItems = dayEvents.length + dayTasks.length;

                    return (
                      <div
                        key={i}
                        onClick={() => setSelected(date)}
                        className={`border-r border-b p-2 cursor-pointer transition-all flex flex-col justify-between group ${
                          !currentMonth ? 'opacity-30' : ''
                        } ${
                          isSel
                            ? 'bg-black/[0.04] dark:bg-white/[0.06] ring-1 ring-inset ring-[var(--accent)]'
                            : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                        }`}
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between mb-1 shrink-0">
                          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isToday
                              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                              : isSel
                              ? 'text-[var(--text-hi)] font-extrabold'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-hi)]'
                          }`}>
                            {date.getDate()}
                          </span>

                          {totalItems > 0 && (
                            <div className="flex items-center gap-1">
                              {dayEvents.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              )}
                              {dayTasks.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                {totalItems}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Items Preview */}
                        <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                          {/* Events */}
                          {dayEvents.slice(0, 2).map(evt => {
                            const cat = EVENT_CATEGORIES.find(c => c.id === evt.category) || EVENT_CATEGORIES[0];
                            const Icon = cat.icon;
                            return (
                              <div
                                key={evt.id}
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate flex items-center gap-1 border"
                                style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                              >
                                <Icon size={10} className="shrink-0" />
                                <span className="truncate">{evt.time ? `${formatTime(evt.time)} ` : ''}{evt.title}</span>
                              </div>
                            );
                          })}

                          {/* Tasks */}
                          {dayTasks.slice(0, 2).map(task => (
                            <div
                              key={task.id}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate flex items-center gap-1 border ${
                                task.completed
                                  ? 'opacity-40 line-through'
                                  : 'bg-black/5 dark:bg-white/5 border-[var(--border-subtle)] text-[var(--text-hi)]'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{task.text}</span>
                            </div>
                          ))}

                          {totalItems > 4 && (
                            <p className="text-[9px] font-semibold pl-1" style={{ color: 'var(--text-muted)' }}>
                              +{totalItems - 4} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Agenda Schedule View */
            <div className="flex-1 overflow-y-auto scroll p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6 pb-28 sm:pb-24">
              {agendaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CalendarDays size={32} className="opacity-20 mb-2" style={{ color: 'var(--text-hi)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>No Upcoming Scheduled Items</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add meetings, birthdays, and due tasks to organize your schedule.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
                  >
                    + Schedule Event
                  </button>
                </div>
              ) : (
                agendaItems.map(({ date, events: dEvents, tasks: dTasks }) => {
                  const dFormatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                  const isCurrentDay = dateKey(date) === todayKey;

                  return (
                    <div
                      key={dateKey(date)}
                      className="rounded-2xl border p-5 space-y-3"
                      style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm" style={{ color: 'var(--text-hi)' }}>{dFormatted}</h3>
                          {isCurrentDay && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Today
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => { setSelected(date); setShowAddModal(true); }}
                          className="text-xs font-semibold text-[var(--accent)] hover:underline"
                        >
                          + Add Item
                        </button>
                      </div>

                      {/* Events */}
                      {dEvents.length > 0 && (
                        <div className="space-y-2">
                          {dEvents.map(evt => {
                            const cat = EVENT_CATEGORIES.find(c => c.id === evt.category) || EVENT_CATEGORIES[0];
                            const Icon = cat.icon;
                            return (
                              <div
                                key={evt.id}
                                className="p-3 rounded-xl border flex items-center justify-between gap-3"
                                style={{ background: cat.bg, borderColor: cat.border }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Icon size={14} style={{ color: cat.color }} />
                                  <div>
                                    <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>{evt.title}</p>
                                    {evt.time && <p className="text-[11px] font-medium" style={{ color: cat.color }}>{formatTime(evt.time)}</p>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tasks */}
                      {dTasks.length > 0 && (
                        <div className="space-y-1.5">
                          {dTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-2.5 rounded-xl border flex items-center gap-2.5"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                            >
                              <button
                                onClick={() => onToggle(task)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                  task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-subtle)]'
                                }`}
                              >
                                {task.completed && <Check size={10} strokeWidth={3} />}
                              </button>
                              <p className={`text-xs font-medium ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)'}`}>
                                {task.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Day Inspector Side Panel */}
        {selected && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden animate-fade-in"
              onClick={() => setSelected(null)}
            />
            <DayDetailDrawer
              date={selected}
              tasks={selectedTasks}
              events={selectedEvents}
              projects={projects}
              onClose={() => setSelected(null)}
              onEditTask={onEdit}
              onToggleTask={onToggle}
              onAddTask={onAddTask}
              onDeleteEvent={handleDeleteEvent}
              onOpenAddModal={() => setShowAddModal(true)}
            />
          </>
        )}
      </div>

      {/* Add Event / Task Modal */}
      {showAddModal && (
        <AddEventModal
          date={selected || today}
          onClose={() => setShowAddModal(false)}
          onSaveEvent={handleSaveEvent}
          onSaveTask={onAddTask}
          projects={projects}
        />
      )}
    </div>
  );
}
