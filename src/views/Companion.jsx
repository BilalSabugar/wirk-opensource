import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Settings, X, Lock,
  CheckSquare, BookOpen, Shield, AlertTriangle,
  Send, Loader2, Trash2, RefreshCw, Sparkles, CheckCircle2, Zap, Brain, ArrowRight,
  Heart, Compass, Feather, Coffee, CornerDownLeft, Calendar, FolderPlus, FileText,
  ShieldAlert, ListPlus, Sliders, Check, Cpu, ChevronDown, Play, Target,
  BarChart2, ArrowDown, PieChart, Copy, GraduationCap, CalendarDays,
  Maximize2, Minimize2, Eye, Code2
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import AriaChartCard from '../components/AriaChartCard';
import AriaLogo from '../components/AriaLogo';
import { useTheme } from '../hooks/useTheme';

/* ─── ARIA Executive Intelligence Modes ─────────────────────────────────── */
const ARIA_MODES = [
  {
    id: 'executive',
    label: 'Executive Orchestrator',
    short: 'Executive',
    icon: Zap,
    color: '#F59E0B',
    lightColor: '#B45309',
    systemHint: 'You are operating in Executive Orchestrator mode. Prioritize high-velocity task execution, workload balancing, daily mission scheduling, and aggressive blocker clearing.',
    desc: 'Balances workload, schedules Today Focus & resolves blockers',
  },
  {
    id: 'strategist',
    label: 'Sprint Strategist',
    short: 'Strategist',
    icon: Compass,
    color: '#0A84FF',
    lightColor: '#0284C7',
    systemHint: 'You are operating in Sprint Strategist mode. Prioritize module health, critical milestone paths, dependency graph analysis, and circular blocker diagnostics.',
    desc: 'Audits milestones, circular blockers, due dates & velocity',
  },
  {
    id: 'mindful',
    label: 'Mindful Companion',
    short: 'Mindful',
    icon: Heart,
    color: '#AF52DE',
    lightColor: '#9333EA',
    systemHint: 'You are operating in Mindful Companion mode. Prioritize reflective journaling, emotional awareness, celebrating daily wins, mental clarity, and burnout prevention.',
    desc: 'Reflective evening journaling, calm momentum & wellness',
  },
  {
    id: 'architect',
    label: 'Technical Architect',
    short: 'Architect',
    icon: Cpu,
    color: '#30D158',
    lightColor: '#059669',
    systemHint: 'You are operating in Technical Architect mode. Prioritize breaking complex objectives into structured technical checklists, architecture notes, and sub-milestones.',
    desc: 'Breaks down technical specs, checklists & complex milestones',
  },
];

/* ─── Instant Power Action Triggers ─────────────────────────────────────── */
const QUICK_POWER_ACTIONS = [
  {
    id: 'briefing',
    label: 'Morning Briefing',
    icon: Zap,
    color: '#F59E0B',
    query: 'Analyze all upcoming deadlines, active projects, and critical tasks. Prepare an executive morning briefing with Today Focus recommendations.',
  },
  {
    id: 'plan_today',
    label: 'Plan Today Focus',
    icon: Compass,
    color: '#0A84FF',
    query: 'Review my active projects. Identify the highest-impact pending tasks and propose scheduling them into Today\'s Focus with priority balance.',
  },
  {
    id: 'audit_blockers',
    label: 'Audit Blockers',
    icon: ShieldAlert,
    color: '#FF453A',
    query: 'Inspect all projects for circular dependencies, stalled blockers, and overdue items. Propose solutions to unblock my workflow.',
  },
  {
    id: 'diary',
    label: 'Evening Reflection',
    icon: BookOpen,
    color: '#AF52DE',
    query: 'Review the tasks completed today and our progress. Write a mindful, structured evening diary reflection for today celebrating wins and setting intentions.',
  },
  {
    id: 'breakdown',
    label: 'Deconstruct Goal',
    icon: Feather,
    color: '#30D158',
    query: 'I have a new major objective. Help me create a new project module and break it down into 5 actionable tasks with priority levels and due dates.',
  },
  {
    id: 'workspace_chart',
    label: 'Generate Workspace Chart',
    icon: BarChart2,
    color: '#06B6D4',
    query: 'Analyze my active projects, tasks by priority, and workflow statuses. Generate an interactive visual chart comparing project workload and priority distribution.',
  },
];

/* ─── TTS Voice helper ─────────────────────────────────────────────────── */
function getBestVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const preferred = [
    'Google UK English Female', 'Google UK English Male', 'Google US English',
    'Microsoft Aria Online', 'Microsoft Jenny Online', 'Microsoft Guy Online',
    'Samantha', 'Alex', 'Daniel', 'Karen',
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return voices.find(v => v.lang === 'en-US') ||
         voices.find(v => v.lang === 'en-GB') ||
         voices.find(v => v.lang?.startsWith('en')) ||
         null;
}

export function speakText(text, onStart, onEnd) {
  const synth = window.speechSynthesis;
  if (!synth) { onEnd?.(); return; }
  synth.cancel();

  // Strip JSON proposal block from speech
  const cleanSpeech = text.replace(/```json_proposal[\s\S]*?```/gi, '').trim();
  if (!cleanSpeech) { onEnd?.(); return; }

  const doSpeak = () => {
    const utt   = new SpeechSynthesisUtterance(cleanSpeech);
    utt.voice   = getBestVoice();
    utt.rate    = 0.92;
    utt.pitch   = 1.0;
    utt.volume  = 1.0;
    utt.onstart = () => onStart?.();
    utt.onend   = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    synth.speak(utt);
  };

  if (synth.getVoices().length > 0) doSpeak();
  else { synth.addEventListener('voiceschanged', doSpeak, { once: true }); }
}

/* ─── Audio recording helper ────────────────────────────────────────────── */
async function recordAudio(onStart, onStop) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const mime   = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
    ? 'audio/ogg;codecs=opus'
    : 'audio/webm';

  const recorder = new MediaRecorder(stream, { mimeType: mime });
  recorder.ondataavailable = e => chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: mime });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve({ base64, mime });
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    onStart?.();
    onStop(recorder);
  });
}

/* ─── Privacy & Context Scope Modal ──────────────────────────────────────── */
function PrivacyPanel({ settings, onChange, onClose, taskCount, projectCount, diaryCount, noteCount }) {
  const toggle = (key) => onChange({ ...settings, [key]: !settings[key] });

  const ITEMS = [
    {
      key:   'shareTasks',
      icon:  <CheckSquare size={16} className="text-blue-400"/>,
      title: 'Tasks & Projects Context',
      desc:  `${taskCount} tasks across ${projectCount} projects. ARIA uses this to organize priorities, plan Today Focus, and detect blockers.`,
    },
    {
      key:   'shareDiary',
      icon:  <BookOpen size={16} className="text-purple-400"/>,
      title: 'Diary & Emotional Reflections',
      desc:  `${diaryCount} journal entries. ARIA accesses reflections for mindful momentum, sentiment analysis, and auto-journaling.`,
    },
    {
      key:   'shareNotes',
      icon:  <FileText size={16} className="text-emerald-400"/>,
      title: 'Notebooks & Technical Specs',
      desc:  `${noteCount} scratchpads & specs. ARIA references documentation to clarify requirements and milestones.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-scale-in"
           style={{
             background: 'var(--bg-overlay)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(40px)',
           }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/[0.08] flex items-center justify-center" style={{ color: 'var(--text-hi)' }}>
              <Lock size={14} />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-hi)' }}>ARIA Context & Telemetry</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
            <X size={15}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl border flex items-start gap-3"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-hi)' }}>Zero-knowledge architecture.</strong>
              {' '}ARIA operates within your approved context boundaries. Actions and updates always require your confirmation before touching the database.
            </p>
          </div>

          <div className="space-y-3">
            {ITEMS.map(item => (
              <div key={item.key} className="flex items-start gap-3.5 p-4 rounded-2xl border transition-all"
                   style={{
                     background: 'var(--bg-panel)',
                     borderColor: settings[item.key] ? 'var(--border-dim)' : 'var(--border-subtle)'
                   }}>
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>{item.title}</p>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 mt-1 cursor-pointer ${
                    settings[item.key] ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full transition-all duration-200 absolute top-0.5 shadow-md ${
                      settings[item.key] ? 'left-5.5 bg-white' : 'left-0.5 bg-white dark:bg-zinc-200'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl mt-2 cursor-pointer">
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Clear Chat Confirmation Modal ──────────────────────────────────────── */
function ClearChatModal({ onConfirm, onCancel, messageCount }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-in relative overflow-hidden"
        style={{
          background: 'var(--modal-bg)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Top Warning Ribbon */}
        <div
          className="absolute top-0 inset-x-0 h-1"
          style={{ background: 'linear-gradient(90deg, #EF4444, #F59E0B)' }}
        />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-md">
            <Trash2 size={22} />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
              Clear Conversation History?
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              This will permanently delete all <strong className="text-zinc-200 font-semibold">{messageCount}</strong> messages, generated visual charts, and action directives from this session.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border flex items-start gap-2.5 text-xs text-amber-300/90"
             style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
          <span>This action cannot be undone. Workspace tasks and projects will remain intact.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-hi)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Executive Proposal Action Directive Card ───────────────────────────── */
function ProposalCard({ proposal, tasks = [], projects = [], onApprove, approved }) {
  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  if (proposal.type === 'GENERATE_CHART' || proposal.type === 'CHART') {
    return (
      <AriaChartCard
        chart={proposal}
        onApprove={onApprove}
        approved={approved}
      />
    );
  }

  const isTaskCreate    = proposal.type === 'CREATE_TASK';
  const isTaskUpdate    = proposal.type === 'UPDATE_TASK';
  const isPlanDay       = proposal.type === 'PLAN_DAY';
  const isDiary         = proposal.type === 'WRITE_DIARY';
  const isProject       = proposal.type === 'CREATE_PROJECT';
  const isNote          = proposal.type === 'SAVE_NOTE';
  const isBlocker       = proposal.type === 'SET_BLOCKER';
  const isDev           = proposal.type === 'OPEN_DEV_CREDITS';
  const isCalendarEvent = proposal.type === 'CREATE_CALENDAR_EVENT';

  // For PLAN_DAY, find the actual tasks from IDs
  const plannedTasks = useMemo(() => {
    if (!isPlanDay || !Array.isArray(proposal.taskIds)) return [];
    return proposal.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
  }, [isPlanDay, proposal.taskIds, tasks]);

  const targetProj = isTaskCreate && proposal.task?.projectId ? projects.find(p => p.id === proposal.task.projectId) : null;

  const typeConfig = {
    PLAN_DAY:       { color: '#0A84FF', label: 'Daily Focus Plan',      icon: Compass,     bg: 'rgba(10, 132, 255, 0.08)' },
    WRITE_DIARY:    { color: '#AF52DE', label: 'Diary Reflection',      icon: BookOpen,    bg: 'rgba(175, 82, 222, 0.08)' },
    CREATE_PROJECT: { color: '#FF9F0A', label: 'Project Creation',      icon: Zap,         bg: 'rgba(255, 159, 10, 0.08)' },
    CREATE_TASK:    { color: '#30D158', label: 'Create Task',           icon: CheckSquare, bg: 'rgba(48, 209, 88, 0.08)' },
    UPDATE_TASK:    { color: '#FF9F0A', label: 'Update Task',           icon: Sparkles,    bg: 'rgba(255, 159, 10, 0.08)' },
    SET_BLOCKER:    { color: '#FF453A', label: 'Task Blocker',          icon: ShieldAlert, bg: 'rgba(255, 69, 58, 0.08)' },
    SAVE_NOTE:      { color: '#64D2FF', label: 'Documentation',         icon: FileText,    bg: 'rgba(100, 210, 255, 0.08)' },
    CREATE_CALENDAR_EVENT: {
      color: proposal.event?.category === 'exam' ? '#FF453A' : '#AF52DE',
      label: proposal.event?.category === 'exam' ? 'Exam Milestone' : 'Calendar Schedule',
      icon: proposal.event?.category === 'exam' ? GraduationCap : CalendarDays,
      bg: proposal.event?.category === 'exam' ? 'rgba(255, 69, 58, 0.08)' : 'rgba(175, 82, 222, 0.08)'
    },
    DELETE_CALENDAR_EVENT: { color: '#FF453A', label: 'Remove Event',             icon: Trash2, bg: 'rgba(255, 69, 58, 0.08)' },
    OPEN_DEV_CREDITS: { color: '#30D158', label: 'Developer Diagnostics', icon: Cpu,       bg: 'rgba(48, 209, 88, 0.08)' },
  }[proposal.type] || { color: '#FF9F0A', label: 'System Action', icon: Sparkles, bg: 'rgba(255, 159, 10, 0.08)' };

  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={`mt-3.5 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
        approved
          ? 'bg-emerald-500/[0.04] border-emerald-500/25'
          : isDark
          ? 'bg-[#121319]/80 border-white/[0.07] hover:border-white/[0.12] shadow-xl'
          : 'bg-white border-black/[0.08] hover:border-black/[0.14] shadow-md'
      }`}
      style={{
        boxShadow: approved ? 'none' : isDark ? '0 10px 32px -4px rgba(0, 0, 0, 0.45)' : '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: typeConfig.bg, color: typeConfig.color }}
          >
            <TypeIcon size={13} />
          </div>
          <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
            {typeConfig.label}
          </span>
        </div>

        <span
          className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
        >
          {proposal.type}
        </span>
      </div>

      {/* Main Directive Label */}
      <p className="text-xs sm:text-sm font-semibold leading-relaxed mt-2" style={{ color: 'var(--text-hi)' }}>
        {proposal.label}
      </p>

      {/* PLAN_DAY: Rich preview chips of scheduled tasks */}
      {isPlanDay && plannedTasks.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-xl border space-y-1.5"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tasks Scheduled for Today's Focus ({plannedTasks.length})
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto scroll pr-1">
            {plannedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-black/5 dark:border-white/5 last:border-0">
                <span className="truncate font-medium" style={{ color: 'var(--text-hi)' }}>• {t.text}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  t.priority === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' :
                  t.priority === 'HIGH' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE_TASK / UPDATE_TASK: Specific attributes preview */}
      {(isTaskCreate || isTaskUpdate) && proposal.task && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)] mt-2">
          {targetProj && (
            <span className="px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}>
              📁 {targetProj.title}
            </span>
          )}
          {proposal.task.priority && (
            <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
              proposal.task.priority === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' :
              proposal.task.priority === 'HIGH' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
            }`}>
              {proposal.task.priority}
            </span>
          )}
          {proposal.task.dueDate && (
            <span className="px-2 py-0.5 rounded-md font-mono border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300">
              📅 Due {proposal.task.dueDate}
            </span>
          )}
        </div>
      )}

      {/* WRITE_DIARY: Parchment Journal Excerpt Preview */}
      {isDiary && proposal.content && (
        <div className="mt-2.5 p-3 rounded-xl border text-xs italic leading-relaxed max-h-24 overflow-y-auto scroll"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5 mb-1 not-italic font-bold text-[10px] text-amber-500 dark:text-amber-400">
            <span>{proposal.mood || '🔥'}</span>
            <span>Journal Draft for {proposal.date || 'Today'}</span>
          </div>
          "{proposal.content.slice(0, 200)}..."
        </div>
      )}

      {/* CREATE_CALENDAR_EVENT: Academic Exam & Milestone Preview */}
      {isCalendarEvent && proposal.event && (
        <div className="mt-2.5 p-3 rounded-xl border space-y-1.5"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                proposal.event.category === 'exam'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : proposal.event.category === 'assignment'
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
              }`}>
                {proposal.event.category === 'exam' ? <><GraduationCap size={11}/> EXAM</> : proposal.event.category?.toUpperCase() || 'EVENT'}
              </span>
              <span className="font-semibold text-xs" style={{ color: 'var(--text-hi)' }}>
                {proposal.event.title}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
              <Calendar size={12} />
              {proposal.event.date} {proposal.event.time ? `@ ${proposal.event.time}` : ''}
            </span>
          </div>

          {(proposal.event.location || proposal.event.notes) && (
            <div className="text-[11px] text-[var(--text-muted)] pt-1.5 border-t border-black/5 dark:border-white/5 space-y-0.5">
              {proposal.event.location && (
                <p className="flex items-center gap-1">
                  <span>📍</span> <span className="font-medium text-[var(--text-hi)]">{proposal.event.location}</span>
                </p>
              )}
              {proposal.event.notes && (
                <p className="italic text-[10px] opacity-90">"{proposal.event.notes}"</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Execution confirmation or Action trigger button */}
      <div className="flex items-center justify-end pt-3 mt-1">
        {approved ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl">
            <CheckCircle2 size={13} />
            <span>Applied to System</span>
          </div>
        ) : (
          <button
            onClick={() => onApprove(proposal)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            <Sparkles size={13} />
            <span>Approve & Execute</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Interactive Canvas Project Card ────────────────────────────────────── */
function CanvasProjectCard({ project, taskCount, onOpenProject }) {
  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  return (
    <div
      onClick={() => onOpenProject?.(project.id)}
      className="my-2 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3 shadow-xs hover:shadow-md"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
          style={{ background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: 'var(--text-hi)' }}
        >
          📁
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold truncate group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-hi)' }}>
            {project.title}
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {project.sub || `${taskCount} tasks active`}
          </p>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-hi)] flex items-center gap-1 shrink-0">
        <span>Open Board</span>
        <ArrowRight size={12} />
      </span>
    </div>
  );
}

/* ─── Inline Markdown Formatter ───────────────────────────────────────── */
function parseFormattedInline(text) {
  if (!text) return null;
  const regex = /(\\\*\\\*|\\\*|\\#|\\-|\\`|\\~|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={`txt-${key++}`}>{text.slice(lastIdx, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith('\\')) {
      // Per-instance cancellation: remove backslash and render raw token
      parts.push(<span key={`esc-${key++}`}>{token.slice(1)}</span>);
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={`b-${key++}`} className="font-bold text-[var(--text-hi)]">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      parts.push(<del key={`del-${key++}`} className="line-through text-[var(--text-muted)]">{token.slice(2, -2)}</del>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={`em-${key++}`} className="italic text-[var(--text-hi)]">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`code-${key++}`} className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] text-[var(--text-hi)] font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkText = match[2];
      const linkUrl = match[3];
      parts.push(
        <a
          key={`a-${key++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors font-medium"
        >
          {linkText}
        </a>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(<span key={`end-${key++}`}>{text.slice(lastIdx)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

/* ─── Flagship Interactive Canvas Task Card ──────────────────────────────── */
function CanvasTaskCard({ task, project, onFocusTask, onEditTask, onToggleTask, onOpenProject }) {
  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  const isDone = task.status === 'DONE';
  const isBlocked = Boolean(task.blocker?.isBlocked);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  const priorityColor =
    task.priority === 'CRITICAL' ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30' :
    task.priority === 'HIGH' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
    task.priority === 'MED' ? 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30' :
    'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border-zinc-500/30';

  const chkDone = (task.checklists || []).filter(c => c.completed).length;
  const chkTotal = (task.checklists || []).length;

  return (
    <div
      className={`my-2 p-3.5 rounded-2xl border transition-all duration-200 group flex flex-col gap-2 relative overflow-hidden ${
        isDone
          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70'
          : isDark
          ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20 shadow-xs hover:shadow-md backdrop-blur-xl'
          : 'bg-white hover:bg-zinc-50/80 border-black/[0.08] hover:border-black/[0.14] shadow-xs hover:shadow-md backdrop-blur-xl'
      }`}
      style={{
        boxShadow: isDark ? '0 4px 20px -2px rgba(0, 0, 0, 0.35)' : '0 2px 12px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Custom Checkbox + Details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleTask?.(task.id, task.status)}
            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
                : 'border-zinc-400 dark:border-zinc-500 hover:border-emerald-400 hover:bg-emerald-500/10'
            }`}
            title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isDone && <Check size={12} strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditTask?.(task)}>
            <p className={`text-xs sm:text-sm font-semibold leading-relaxed break-words transition-all ${
              isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'
            }`}>
              {task.text}
            </p>

            {/* Badges strip */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {project && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onOpenProject?.(project.id); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer hover:border-black/30 dark:hover:border-white/30 transition-colors"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-hi)',
                  }}
                  title="Open Project Canvas"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color ? `var(--${project.color})` : '#3B82F6' }} />
                  <span>{project.title}</span>
                </button>
              )}

              {task.priority && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${priorityColor}`}>
                  {task.priority}
                </span>
              )}

              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                  isOverdue
                    ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30 font-bold'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                }`}>
                  <Calendar size={10} />
                  <span>{isOverdue ? 'Overdue: ' : 'Due: '}{task.dueDate}</span>
                </span>
              )}

              {isBlocked && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30">
                  <AlertTriangle size={10} />
                  <span>Blocked</span>
                </span>
              )}

              {chkTotal > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
                  ✓ {chkDone}/{chkTotal}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action cluster */}
        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onFocusTask && !isDone && (
            <button
              type="button"
              onClick={() => onFocusTask(task)}
              className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-400 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
              title="Focus in Pomodoro timer"
            >
              <Zap size={13} />
            </button>
          )}

          {onEditTask && (
            <button
              type="button"
              onClick={() => onEditTask(task)}
              className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Edit Task Details"
            >
              <FileText size={13} />
            </button>
          )}

          {onOpenProject && task.projectId && (
            <button
              type="button"
              onClick={() => onOpenProject(task.projectId)}
              className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="View in Kanban Board"
            >
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Rich Code Block with One-Click Copy ────────────────────────────────── */
function RichCodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-black/10 dark:border-white/10 bg-[#18181B] dark:bg-[#0C0C10] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/20 dark:bg-white/[0.04] border-b border-white/5 text-[10px] font-mono text-zinc-400">
        <span className="uppercase tracking-wider text-amber-400 font-bold">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed selection:bg-amber-500/20">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Rich Frosted Glass Markdown Table ───────────────────────────────────── */
function RichMarkdownTable({ lines }) {
  if (!lines || lines.length < 2) return null;

  const parseRow = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

  const headers = parseRow(lines[0]);
  const alignLine = lines[1] ? parseRow(lines[1]) : [];

  const alignments = alignLine.map(col => {
    if (col.startsWith(':') && col.endsWith(':')) return 'center';
    if (col.endsWith(':')) return 'right';
    return 'left';
  });

  const bodyRows = lines.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]">
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-400"
                style={{ textAlign: alignments[idx] || 'left' }}
              >
                {parseFormattedInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200"
                  style={{ textAlign: alignments[cIdx] || 'left' }}
                >
                  {parseFormattedInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Rich Callout / Alert Box ───────────────────────────────────────────── */
function RichCallout({ lines }) {
  const rawText = lines.map(l => l.replace(/^>\s?/, '')).join('\n');
  const alertMatch = rawText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

  let type = 'quote';
  let content = rawText;

  if (alertMatch) {
    type = alertMatch[1].toUpperCase();
    content = rawText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
  }

  const alertStyles = {
    NOTE:      { border: 'border-blue-500/40',    bg: 'rgba(59, 130, 246, 0.08)',  color: 'text-blue-500 dark:text-blue-400',   title: 'Note' },
    TIP:       { border: 'border-emerald-500/40', bg: 'rgba(16, 185, 129, 0.08)', color: 'text-emerald-500 dark:text-emerald-400',title: 'Tip' },
    IMPORTANT: { border: 'border-purple-500/40',  bg: 'rgba(168, 85, 247, 0.08)', color: 'text-purple-500 dark:text-purple-400', title: 'Important' },
    WARNING:   { border: 'border-amber-500/40',   bg: 'rgba(245, 158, 11, 0.08)',  color: 'text-amber-600 dark:text-amber-400',  title: 'Warning' },
    CAUTION:   { border: 'border-rose-500/40',    bg: 'rgba(244, 63, 94, 0.08)',   color: 'text-rose-500 dark:text-rose-400',   title: 'Caution' },
    quote:     { border: 'border-zinc-300 dark:border-white/20', bg: 'var(--bg-surface)', color: 'text-zinc-500 dark:text-zinc-400', title: null },
  };

  const style = alertStyles[type] || alertStyles.quote;

  return (
    <div
      className={`my-3 p-3.5 rounded-2xl border-l-2 ${style.border} text-xs leading-relaxed transition-all`}
      style={{ background: style.bg }}
    >
      {style.title && (
        <div className={`font-bold text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${style.color}`}>
          <AlertTriangle size={12} />
          <span>{style.title}</span>
        </div>
      )}
      <div className="text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">
        {parseFormattedInline(content)}
      </div>
    </div>
  );
}

/* ─── Rich AI Content Parser ─────────────────────────────────────────────── */
function RichAiContent({ text, tasks = [], projects = [], onFocusTask, onEditTask, onToggleTask, onOpenProject, isUserMessage = false }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentProject = null;
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // A. Empty line
    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // B. Multi-line Code Block: ```lang ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      elements.push(
        <RichCodeBlock
          key={`code-${i}`}
          code={codeLines.join('\n')}
          language={lang}
        />
      );
      continue;
    }

    // C. Markdown Table: consecutive lines starting and ending with |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].includes('-')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(<RichMarkdownTable key={`tbl-${i}`} lines={tableLines} />);
      continue;
    }

    // D. Callout / Blockquote: lines starting with >
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim());
        i++;
      }
      elements.push(<RichCallout key={`quote-${i}`} lines={quoteLines} />);
      continue;
    }

    // E1. Escaped Horizontal Rule: \--- or \*** (Cancellation)
    if (/^\\(\-{3,}|\*{3,}|_{3,}|(\-\s){2,}\-)$/.test(trimmed)) {
      elements.push(
        <p key={`raw-hr-${i}`} className="text-xs sm:text-sm font-mono text-zinc-500 dark:text-zinc-300 my-1">
          {trimmed.slice(1)}
        </p>
      );
      i++;
      continue;
    }

    // E2. Horizontal Rule / Section Divider: ---, ***, ___, - - -
    if (/^(\-{3,}|\*{3,}|_{3,}|(\-\s){2,}\-)$/.test(trimmed)) {
      elements.push(
        <div key={`hr-${i}`} className="my-4 flex items-center gap-3 select-none">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/15 dark:via-white/[0.12] to-transparent" />
          <div className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20 shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/15 dark:via-white/[0.12] to-transparent" />
        </div>
      );
      i++;
      continue;
    }

    // F. Project Header (ARIA responses only, not hijacked in user prompts)
    const projectHeaderMatch = !isUserMessage && (
      trimmed.match(/^\*\*For\s+([^:*]+):?\*\*/i) ||
      trimmed.match(/^\*\*Project:\s*([^:*]+):?\*\*/i) ||
      trimmed.match(/^#{1,3}\s+([^#\n]+)/)
    );

    let matchedProj = null;
    if (projectHeaderMatch) {
      const pName = projectHeaderMatch[1].trim().toUpperCase();
      matchedProj = projects.find(p => p.title?.toUpperCase() === pName || pName.includes(p.title?.toUpperCase()) || p.title?.toUpperCase().includes(pName));
    } else if (!isUserMessage && trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
      const stripped = trimmed.slice(2, -2).trim().toUpperCase();
      matchedProj = projects.find(p => p.title?.toUpperCase() === stripped);
    }

    if (matchedProj) {
      currentProject = matchedProj;
      const projTasks = tasks.filter(t => t.projectId === matchedProj.id);
      elements.push(
        <CanvasProjectCard
          key={`proj-${matchedProj.id}-${i}`}
          project={matchedProj}
          taskCount={projTasks.length}
          onOpenProject={onOpenProject}
        />
      );
      i++;
      continue;
    }

    // G. Checklist Item: - [ ] or - [x]
    const checklistMatch = trimmed.match(/^[\*\-•]\s+\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      const checkContent = checklistMatch[2];
      elements.push(
        <div key={`chk-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
          <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
            isChecked ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500 dark:text-emerald-400' : 'bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 text-zinc-400'
          }`}>
            {isChecked ? <Check size={11} strokeWidth={3} /> : null}
          </span>
          <div className={`text-xs sm:text-sm ${isChecked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-hi)]'}`}>
            {parseFormattedInline(checkContent)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // H. Task Bullet
    const bulletMatch = trimmed.match(/^[\*\-•\+]\s+(.*)$/);
    if (bulletMatch) {
      const bulletContent = bulletMatch[1].trim();
      const cleanTaskQuery = bulletContent
        .replace(/^\[[ xX]\]\s*/, '')
        .replace(/^[*"'`]+|[*"'`]+$/g, '')
        .trim();

      const matchedTask = tasks.find(t => {
        const tText = t.text?.toLowerCase().trim();
        const qText = cleanTaskQuery.toLowerCase();
        return tText === qText || (qText.length > 8 && tText.includes(qText)) || (tText.length > 8 && qText.includes(tText));
      });

      if (matchedTask) {
        const pObj = projects.find(p => p.id === matchedTask.projectId) || currentProject;
        elements.push(
          <CanvasTaskCard
            key={`task-${matchedTask.id}-${i}`}
            task={matchedTask}
            project={pObj}
            onFocusTask={onFocusTask}
            onEditTask={onEditTask}
            onToggleTask={onToggleTask}
            onOpenProject={onOpenProject}
          />
        );
      } else {
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/60 shrink-0 mt-2" />
            <div className="text-xs sm:text-sm text-[var(--text-hi)]">
              {parseFormattedInline(bulletContent)}
            </div>
          </div>
        );
      }
      i++;
      continue;
    }

    // I. Numbered List: 1. 2. etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const numContent = numMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
          <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.07] text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <div className="text-xs sm:text-sm text-[var(--text-hi)]">
            {parseFormattedInline(numContent)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // J1. Escaped Header: \# or \## (Cancellation)
    if (/^\\#+/.test(trimmed)) {
      elements.push(
        <p key={`raw-h-${i}`} className="text-xs sm:text-sm text-[var(--text-hi)] my-1">
          {parseFormattedInline(trimmed.slice(1))}
        </p>
      );
      i++;
      continue;
    }

    // J2. Headers (#, ##, ###, ####)
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const hText = trimmed.replace(/^#+\s*/, '');
      const hClass = 
        level === 1 ? 'text-base font-bold text-[var(--text-hi)] mt-4 mb-2 tracking-tight' :
        level === 2 ? 'text-sm font-bold text-[var(--text-hi)] mt-3.5 mb-1.5 tracking-tight' :
        level === 3 ? 'text-xs sm:text-sm font-semibold text-[var(--text-hi)] mt-3 mb-1' :
        'text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2.5 mb-1';

      elements.push(
        <div key={`head-${i}`} className={`${hClass} flex items-center gap-2`}>
          {level <= 2 && <span className="w-1 h-3.5 rounded-full bg-indigo-500/80 shrink-0" />}
          <span>{parseFormattedInline(hText)}</span>
        </div>
      );
      i++;
      continue;
    }

    // K. Standard text paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed text-[var(--text-hi)] my-1">
        {parseFormattedInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

/* ─── Conversational Message Item ────────────────────────────────────────── */
function parseProposalBlockSafely(text) {
  if (!text) return { cleanText: '', proposals: [] };
  let cleanText = text;
  let proposals = [];

  if (cleanText.includes('```json_proposal')) {
    const parts = cleanText.split('```json_proposal');
    cleanText = parts[0].trim();
    const rest = parts[1] || '';
    let jsonStr = rest.includes('```') ? rest.split('```')[0].trim() : rest.trim();

    // 1. Direct parse attempt
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed?.proposals)) {
        proposals = parsed.proposals;
      } else if (Array.isArray(parsed)) {
        proposals = parsed;
      }
    } catch (e1) {
      // 2. Auto-repair truncated JSON proposals
      try {
        let sanitized = jsonStr
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F]+/g, ' ');
        const lastBrace = sanitized.lastIndexOf('}');
        if (lastBrace !== -1) {
          sanitized = sanitized.slice(0, lastBrace + 1);
        }
        let openBraces = (sanitized.match(/\{/g) || []).length - (sanitized.match(/\}/g) || []).length;
        let openBrackets = (sanitized.match(/\[/g) || []).length - (sanitized.match(/\]/g) || []).length;
        while (openBrackets > 0) { sanitized += ']'; openBrackets--; }
        while (openBraces > 0) { sanitized += '}'; openBraces--; }

        const repaired = JSON.parse(sanitized);
        if (Array.isArray(repaired?.proposals)) {
          proposals = repaired.proposals;
        } else if (Array.isArray(repaired)) {
          proposals = repaired;
        }
      } catch (e2) {
        // failed repair
      }
    }
  }

  return { cleanText, proposals };
}

function isResponseTruncated(msg, cleanText, proposals) {
  if (msg.role !== 'model') return false;
  if (msg.finishReason === 'MAX_TOKENS' || msg.isTruncated) return true;

  const raw = (msg.text || '').trim();
  if (!raw) return false;

  // 1. Unclosed json_proposal block
  if (raw.includes('```json_proposal') && !raw.slice(raw.indexOf('```json_proposal') + 16).includes('```')) {
    return true;
  }

  // 2. Abrupt ending with open quote or dangling bullet (e.g. • "Generate)
  if (/[•\-\*]\s*"[^"\n]{1,60}$/.test(raw)) {
    return true;
  }

  // 3. Stated proposals or tasks to create, but ended mid-thought without terminal punctuation
  if (/(?:Here are the proposals|Create Tasks|Create New Project)[^.!?]*:\s*(?:\n\s*[•\-\*]\s*["\w\s]*|\s*)$/i.test(raw)) {
    return true;
  }

  return false;
}

function MessageRow({
  msg, onApproveProposal, onApproveAllProposals, onContinueMessage,
  tasks = [], projects = [], onFocusTask, onEditTask, onToggleTask, onOpenProject,
  activeModeObj
}) {
  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[11px] font-medium px-3.5 py-1 rounded-full border shadow-xs"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
          {msg.text}
        </span>
      </div>
    );
  }

  // Parse text and proposals if present
  let cleanText = msg.text || '';
  let proposals = msg.proposals || [];

  if (cleanText.includes('```json_proposal')) {
    const parsedBlock = parseProposalBlockSafely(cleanText);
    cleanText = parsedBlock.cleanText;
    if (parsedBlock.proposals.length > 0) {
      proposals = parsedBlock.proposals;
    }
  }

  const isTruncated = isResponseTruncated(msg, cleanText, proposals);

  // Parse inline chart blocks (json_chart, json:chart, chart, or json containing chartType/data)
  let inlineCharts = [];

  // 1. Check for dedicated chart code blocks: ```json_chart, ```json:chart, ```chart
  const dedicatedChartRegex = /```(?:json_chart|json:chart|chart)\s*([\s\S]*?)```/gi;
  let dMatch;
  while ((dMatch = dedicatedChartRegex.exec(cleanText)) !== null) {
    try {
      const parsed = JSON.parse(dMatch[1].trim());
      if (parsed && (parsed.data || parsed.chartType)) {
        inlineCharts.push(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse dedicated chart json', e);
    }
  }
  cleanText = cleanText.replace(/```(?:json_chart|json:chart|chart)\s*([\s\S]*?)```/gi, '').trim();

  // 2. Check for general ```json blocks that describe a chart
  const generalJsonRegex = /```json\s*([\s\S]*?)```/gi;
  let gMatch;
  while ((gMatch = generalJsonRegex.exec(cleanText)) !== null) {
    try {
      const parsed = JSON.parse(gMatch[1].trim());
      if (parsed && (parsed.chartType || (parsed.xAxisKey && parsed.data))) {
        inlineCharts.push(parsed);
        cleanText = cleanText.replace(gMatch[0], '').trim();
      }
    } catch (e) {
      // not a chart JSON, ignore
    }
  }

  // 3. Move any GENERATE_CHART proposals directly into inlineCharts for immediate visualization
  const chartProposals = proposals.filter(p => p.type === 'GENERATE_CHART' || p.type === 'CHART');
  if (chartProposals.length > 0) {
    chartProposals.forEach(cp => inlineCharts.push(cp));
    proposals = proposals.filter(p => p.type !== 'GENERATE_CHART' && p.type !== 'CHART');
  }

  // 4. Intelligent Fallback Synthesizer:
  // If the AI mentioned generating or visualizing a chart/graph but omitted the JSON block,
  // extract data points from the message text or synthesize from active workspace tasks & projects.
  if (inlineCharts.length === 0 && !isUser) {
    const textLower = cleanText.toLowerCase();
    const indicatesChart =
      /(generated?|visualiz|breakdown|showing|created?|here is|here's)\s+.*?(bar\s+|line\s+|area\s+|pie\s+|radar\s+)?(chart|graph)/i.test(cleanText) ||
      textLower.includes('generated a bar chart') ||
      textLower.includes('generated a chart') ||
      textLower.includes('generated a graph') ||
      textLower.includes('breakdown of completed versus pending') ||
      textLower.includes('breakdown of completed vs pending');

    if (indicatesChart) {
      // Step A: Parse bullet list items with numeric counts if present
      const lines = cleanText.split('\n');
      const parsedPoints = [];
      const bulletRegex = /^\s*[\*\-•]\s*([A-Za-z0-9_\s\/\-\&]+?):\s*(\d+)\s*(?:tasks?\s*completed|completed|tasks?)?/i;

      for (const line of lines) {
        const match = line.match(bulletRegex);
        if (match) {
          const rawName = match[1].trim();
          const count = parseInt(match[2], 10);
          if (rawName && !isNaN(count)) {
            const proj = projects.find(p => p.title?.toLowerCase() === rawName.toLowerCase() || p.id === rawName);
            const projTasks = proj ? tasks.filter(t => t.projectId === proj.id) : [];
            const pendingCount = projTasks.filter(t => t.status !== 'DONE' && !t.completed).length;
            parsedPoints.push({
              name: rawName,
              completed: count,
              ...(pendingCount > 0 ? { pending: pendingCount } : { pending: 0 }),
            });
          }
        }
      }

      if (parsedPoints.length >= 2) {
        const hasPending = parsedPoints.some(p => p.pending > 0);
        inlineCharts.push({
          chartType: 'bar',
          title: 'Project Completion Breakdown',
          description: 'Completed vs pending tasks across active projects',
          xAxisKey: 'name',
          data: parsedPoints,
          series: hasPending
            ? [
                { dataKey: 'completed', name: 'Completed', color: '#10B981' },
                { dataKey: 'pending', name: 'Pending', color: '#F59E0B' }
              ]
            : [
                { dataKey: 'completed', name: 'Completed Tasks', color: '#10B981' }
              ]
        });
      } else if (projects.length > 0 || tasks.length > 0) {
        // Step B: Synthesize from active workspace projects & tasks
        const projectData = projects.map(p => {
          const pTasks = tasks.filter(t => t.projectId === p.id);
          const comp = pTasks.filter(t => t.status === 'DONE' || t.completed).length;
          const pend = pTasks.length - comp;
          return {
            name: p.title || p.id,
            completed: comp,
            pending: pend,
            total: pTasks.length
          };
        }).filter(p => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

        if (projectData.length > 0) {
          inlineCharts.push({
            chartType: 'bar',
            title: 'Project Task Breakdown',
            description: 'Breakdown of completed versus pending tasks across active projects',
            xAxisKey: 'name',
            data: projectData,
            series: [
              { dataKey: 'completed', name: 'Completed', color: '#10B981' },
              { dataKey: 'pending', name: 'Pending', color: '#F59E0B' }
            ]
          });
        }
      }
    }
  }

  const allApproved = proposals.length > 0 && proposals.every((_, i) => msg.approvedProposals?.includes(i));
  const unapprovedCount = proposals.filter((_, i) => !msg.approvedProposals?.includes(i)).length;

  if (isUser) {
    return (
      <div className="flex flex-col items-end animate-fade-in group w-full">
        <div className="flex items-center gap-2 mb-1.5 mr-1">
          {/* Per-message format cancellation toggle */}
          <button
            type="button"
            onClick={() => setShowRaw(r => !r)}
            className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03]"
            title={showRaw ? "Show formatted view" : "Cancel formatting & view raw text"}
          >
            {showRaw ? (
              <>
                <Eye size={10} />
                <span>Formatted</span>
              </>
            ) : (
              <>
                <Code2 size={10} />
                <span>Raw</span>
              </>
            )}
          </button>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
            You
          </span>
        </div>
        <div
          className="px-4 sm:px-5 py-3.5 rounded-2xl max-w-[92%] sm:max-w-[85%] text-[13px] sm:text-[14px] leading-relaxed font-normal transition-all"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(26, 27, 34, 0.90) 0%, rgba(18, 19, 24, 0.95) 100%)'
              : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDark ? '0 4px 20px -2px rgba(0, 0, 0, 0.45)' : '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            color: 'var(--text-hi)',
          }}
        >
          {showRaw ? (
            <div className="whitespace-pre-wrap font-mono text-xs select-text text-zinc-700 dark:text-zinc-300">{cleanText}</div>
          ) : (
            <div className="user-message-rich space-y-1 select-text">
              <RichAiContent
                text={cleanText}
                tasks={tasks}
                projects={projects}
                onFocusTask={onFocusTask}
                onEditTask={onEditTask}
                onToggleTask={onToggleTask}
                onOpenProject={onOpenProject}
                isUserMessage={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const modeColor = activeModeObj ? (isDark ? activeModeObj.color : (activeModeObj.lightColor || activeModeObj.color)) : '#D97706';

  return (
    <div className="flex flex-col items-start animate-fade-in group w-full">
      {/* Sender Tag with ARIA emblem & mode badge */}
      <div className="flex items-center gap-2 mb-2 pl-1">
        <AriaLogo size={18} glow={false} />
        <span className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
          ARIA
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs"
          style={{
            background: `${modeColor}12`,
            color: modeColor,
            borderColor: `${modeColor}28`
          }}
        >
          {activeModeObj?.short || 'Executive'} Mode
        </span>
      </div>

      <div
        className="p-4 sm:p-6 rounded-2xl max-w-[98%] sm:max-w-[95%] border w-full shadow-xl relative overflow-hidden backdrop-blur-2xl transition-all"
        style={{
          background: isDark ? 'rgba(15, 16, 22, 0.72)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDark ? '0 16px 40px -8px rgba(0, 0, 0, 0.55)' : '0 8px 30px -4px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Copy button on hover */}
        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06]"
            title="Copy response to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>

        <RichAiContent
          text={cleanText}
          tasks={tasks}
          projects={projects}
          onFocusTask={onFocusTask}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          onOpenProject={onOpenProject}
        />

        {/* Inline Charts parsed directly from ARIA response text */}
        {inlineCharts.map((chartItem, cIdx) => (
          <AriaChartCard
            key={`inline-chart-${cIdx}`}
            chart={chartItem}
          />
        ))}

        {/* Bulk Action Trigger if multiple proposals */}
        {proposals.length > 1 && !allApproved && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap size={13} />
              <span>{unapprovedCount} Directives Ready</span>
            </span>
            <button
              onClick={() => onApproveAllProposals?.(msg.id, proposals)}
              className="btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>Apply All ({proposals.length})</span>
            </button>
          </div>
        )}

        {/* Action Proposals */}
        {proposals.map((prop, idx) => (
          <ProposalCard
            key={idx}
            proposal={prop}
            tasks={tasks}
            projects={projects}
            approved={msg.approvedProposals?.includes(idx)}
            onApprove={() => onApproveProposal?.(msg.id, idx, prop)}
          />
        ))}

        {/* Truncation / Cut-off Recovery Banner */}
        {isTruncated && (
          <div
            className="mt-3.5 p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fade-in"
            style={{
              background: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(254, 243, 199, 0.85)',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.40)',
              color: isDark ? '#FDE68A' : '#92400E',
            }}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span>ARIA stopped mid-way while writing tasks. Continue generating to complete the plan and generate action cards.</span>
            </div>
            <button
              type="button"
              onClick={() => onContinueMessage?.(msg.id, msg.text)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              <Play size={12} className="fill-current" />
              <span>Continue Generating</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Companion Suite ───────────────────────────────────────────────── */
export default function CompanionView({
  user, projects = [], tasks = [], diary = [], notes = [], calendarEvents = [], ariaMemory = [],
  messages = [], onSendMessage, onContinueMessage, onApproveProposal, onApproveAllProposals,
  orbState = 'idle', setOrbState, isMuted, setIsMuted, onClearChat,
  onNavigate, onFocusTask, onEditTask, onToggleTask, onOpenProject,
}) {
  const [textInput, setTextInput] = useState('');
  const [isStudioExpanded, setIsStudioExpanded] = useState(false);
  const [studioAnimation, setStudioAnimation] = useState('idle'); // 'idle' | 'opening' | 'open' | 'closing'
  const [studioTab, setStudioTab] = useState('edit'); // 'edit' | 'preview'
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeMode, setActiveMode] = useState(() => localStorage.getItem('aria-mode') || 'executive');

  const textareaRef = useRef(null);
  const studioTextareaRef = useRef(null);
  const stopRecordRef = useRef(null);
  const scrollRef = useRef(null);
  const modeMenuRef = useRef(null);

  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  const activeModeObj = ARIA_MODES.find(m => m.id === activeMode) || ARIA_MODES[0];
  const modeDisplayColor = isDark ? activeModeObj.color : (activeModeObj.lightColor || activeModeObj.color);
  const ActiveModeIcon = activeModeObj.icon;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.displayName || (user?.email?.endsWith('@enginecore.dev') ? user?.email?.replace('@enginecore.dev', '') : user?.email?.split('@')[0]) || 'Operator';

  const [privacy, setPrivacy] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aria-privacy') ?? '{"shareTasks":true,"shareDiary":true,"shareNotes":true}'); }
    catch { return { shareTasks: true, shareDiary: true, shareNotes: true }; }
  });

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Close mode menu on doc click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false);
      }
    };
    if (showModeMenu) document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showModeMenu]);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const hasUserMessages = useMemo(() => messages.some(m => m.role === 'user'), [messages]);
  const displayMessages = useMemo(() => {
    if (!hasUserMessages) return [];
    return messages.filter(m => m.id !== 'init-1');
  }, [messages, hasUserMessages]);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'DONE' && !t.completed), [tasks]);
  const criticalTasks = useMemo(() => pendingTasks.filter(t => t.priority === 'CRITICAL'), [pendingTasks]);

  // Monitor scroll position to update top reading progress indicator and scroll-to-bottom arrow
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollableDistance = scrollHeight - clientHeight;
    const progress = scrollableDistance > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollableDistance) * 100)) : 0;
    setScrollProgress(progress);

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
    if (isAtBottom) {
      setHasNewBelow(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setShowScrollBottom(false);
    setHasNewBelow(false);
    setScrollProgress(100);
  }, []);

  // Scroll to bottom on new message if already near bottom, else flag unread content
  useEffect(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollableDistance = scrollHeight - clientHeight;
    const progress = scrollableDistance > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollableDistance) * 100)) : 0;
    setScrollProgress(progress);

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 220;
    if (isNearBottom) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setShowScrollBottom(false);
      setHasNewBelow(false);
    } else {
      setShowScrollBottom(true);
      setHasNewBelow(true);
    }
  }, [messages, orbState]);

  // Save privacy & mode prefs
  useEffect(() => {
    localStorage.setItem('aria-privacy', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('aria-mode', activeMode);
  }, [activeMode]);

  /* ── Context Payload ── */
  const contextPayload = useMemo(() => {
    const shareTasks  = privacy.shareTasks ?? true;
    const shareDiary  = privacy.shareDiary ?? true;
    const shareNotes  = privacy.shareNotes ?? true;
    return {
      shareProjects: shareTasks,
      shareTasks,
      shareDiary,
      projects:       shareTasks ? projects : [],
      tasks:          shareTasks ? tasks    : [],
      diaryEntries:   shareDiary ? (diary ?? []).slice(0, 25) : [],
      notes:          shareNotes ? (notes ?? []).slice(0, 16) : [],
      calendarEvents: (calendarEvents ?? []).slice(0, 50),
      ariaMemory:     ariaMemory ?? [],
      activeMode,
      modeHint:       activeModeObj.systemHint,
    };
  }, [privacy, projects, tasks, diary, notes, calendarEvents, ariaMemory, activeMode, activeModeObj]);

  /* ── Voice: start/stop recording ── */
  const handleOrbClick = useCallback(async () => {
    if (orbState === 'thinking') return;
    if (orbState === 'speaking') {
      window.speechSynthesis?.cancel();
      setOrbState('idle');
      return;
    }

    if (orbState === 'recording') {
      stopRecordRef.current?.();
      return;
    }

    try {
      const { base64, mime } = await recordAudio(
        () => setOrbState('recording'),
        (stopFn) => { stopRecordRef.current = () => stopFn.stop(); }
      );
      setOrbState('thinking');
      await onSendMessage({ audioBase64: base64, audioMimeType: mime, contextPayload });
    } catch (err) {
      console.error('[companion voice]', err);
      setOrbState('idle');
    }
  }, [orbState, onSendMessage, contextPayload, setOrbState]);

  /* ── Text: submit message ── */
  // Soothing expand & collapse transitions for Prompt Studio
  const handleOpenStudio = useCallback(() => {
    setIsStudioExpanded(true);
    setStudioAnimation('opening');
    setTimeout(() => {
      setStudioAnimation('open');
      studioTextareaRef.current?.focus();
    }, 420);
  }, []);

  const handleCloseStudio = useCallback(() => {
    setStudioAnimation('closing');
    setTimeout(() => {
      setIsStudioExpanded(false);
      setStudioAnimation('idle');
      textareaRef.current?.focus();
    }, 280);
  }, []);

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text || orbState === 'thinking') return;
    setTextInput('');
    if (isStudioExpanded) {
      setStudioAnimation('closing');
      setTimeout(() => {
        setIsStudioExpanded(false);
        setStudioAnimation('idle');
      }, 260);
    }
    window.speechSynthesis?.cancel();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage({ text, contextPayload });
  }, [textInput, orbState, onSendMessage, contextPayload, isStudioExpanded]);

  // Auto-resize compact dock textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [textInput]);

  // Focus studio textarea on expand
  useEffect(() => {
    if (isStudioExpanded && studioAnimation !== 'closing') {
      const timer = setTimeout(() => {
        studioTextareaRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isStudioExpanded, studioAnimation]);

  // Keyboard shortcut: Escape to collapse studio
  useEffect(() => {
    if (!isStudioExpanded || studioAnimation === 'closing') return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleCloseStudio();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isStudioExpanded, studioAnimation, handleCloseStudio]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStudioKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Power Action trigger ── */
  const handleTriggerAction = useCallback((act) => {
    window.speechSynthesis?.cancel();
    onSendMessage({ text: act.query, contextPayload });
  }, [onSendMessage, contextPayload]);

  const sharedCount = (privacy.shareTasks ? tasks.length + projects.length : 0) + (privacy.shareDiary ? (diary?.length ?? 0) : 0);

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* ── Ambient Atmospheric Cosmic Glow Aura ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[500px] rounded-full blur-[130px] transition-all duration-700 ${
            isDark ? 'opacity-25' : 'opacity-10'
          }`}
          style={{
            background: isDark
              ? `radial-gradient(circle, ${activeModeObj.color} 0%, #6366F1 50%, transparent 75%)`
              : `radial-gradient(circle, ${modeDisplayColor} 0%, #818CF8 50%, transparent 75%)`,
          }}
        />
        <div
          className={`absolute bottom-12 right-1/4 w-[500px] h-[350px] rounded-full blur-[110px] ${
            isDark ? 'opacity-10' : 'opacity-5'
          }`}
          style={{
            background: 'radial-gradient(circle, #3B82F6 0%, #EC4899 50%, transparent 80%)',
          }}
        />
      </div>
      
      {/* ── Frosted Top Navigation Bar ── */}
      <div className="h-14 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 z-30 relative"
           style={{
             background: 'var(--header-bg)',
             borderColor: 'var(--border-subtle)',
             backdropFilter: 'blur(28px) saturate(190%)',
             WebkitBackdropFilter: 'blur(28px) saturate(190%)',
           }}>
        
        {/* Left: ARIA Identity & Mode Selector */}
        <div className="flex items-center gap-3 relative" ref={modeMenuRef}>
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowModeMenu(m => !m)}
            title="Click to switch intelligence mode"
          >
            {/* Living Fluid Aura */}
            <div className="relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
              <AriaLogo size={32} state={orbState} glow={true} />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-base)] ${
              orbState === 'recording' ? 'bg-rose-500 animate-ping' :
              orbState === 'thinking' ? 'bg-amber-400 animate-pulse' :
              orbState === 'speaking' ? 'bg-indigo-400' :
              'bg-emerald-500'
            }`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-hi)' }}>
                ARIA
              </h2>
              {/* Interactive Mode Badge */}
              <button
                type="button"
                onClick={() => setShowModeMenu(m => !m)}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:scale-105 cursor-pointer shrink-0"
                style={{
                  background: `${modeDisplayColor}15`,
                  color: modeDisplayColor,
                  borderColor: `${modeDisplayColor}35`,
                }}
                title="Switch Intelligence Archetype"
              >
                <ActiveModeIcon size={10} />
                <span>{activeModeObj.short}</span>
                <ChevronDown size={10} className={`transition-transform duration-200 ${showModeMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-[11px] hover:underline transition-colors flex items-center gap-1 text-left truncate cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              title="Inspect context boundaries"
            >
              <span>{sharedCount > 0 ? `${sharedCount} workspace items linked` : 'Private offline sandbox'}</span>
            </button>
          </div>

          {/* Mode Selector Popover */}
          {showModeMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl p-1.5 space-y-1 z-50 animate-scale-in"
              style={{
                background: 'var(--modal-bg)',
                borderColor: 'var(--border-subtle)',
                backdropFilter: 'blur(36px) saturate(200%)',
                WebkitBackdropFilter: 'blur(36px) saturate(200%)',
              }}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b mb-1"
                   style={{ borderColor: 'var(--border-subtle)' }}>
                Select Intelligence Mode
              </div>
              {ARIA_MODES.map(mode => {
                const Icon = mode.icon;
                const isSelected = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => { setActiveMode(mode.id); setShowModeMenu(false); }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                      isSelected ? 'bg-black/5 dark:bg-white/[0.08] shadow-xs' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${mode.color}20`, color: mode.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>{mode.label}</p>
                        {isSelected && <Check size={13} style={{ color: mode.color }} />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Controls Pill Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Output Toggle */}
          <button
            onClick={() => { setIsMuted(m => !m); window.speechSynthesis?.cancel(); setOrbState('idle'); }}
            className="btn-ghost px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            title={isMuted ? 'Unmute ARIA audio' : 'Mute ARIA audio'}
          >
            {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* Privacy Boundaries */}
          <button
            onClick={() => setShowPrivacy(true)}
            className="btn-ghost px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            title="Privacy and context settings"
          >
            <Shield size={14}/>
            <span className="hidden sm:inline">Context</span>
          </button>

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-ghost p-2 rounded-xl cursor-pointer hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={14}/>
            </button>
          )}
        </div>

        {/* Flushed Top Scroll Progress Bar (Rotated from vertical scrollbar) */}
        <div className="absolute -bottom-[1px] inset-x-0 h-[2px] pointer-events-none overflow-hidden z-40 bg-transparent">
          <div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${scrollProgress}%`,
              background: `linear-gradient(90deg, ${modeDisplayColor}70, ${modeDisplayColor})`,
              boxShadow: scrollProgress > 0 ? `0 0 10px ${modeDisplayColor}, 0 0 3px ${modeDisplayColor}` : 'none',
              opacity: scrollProgress > 0 ? 1 : 0,
            }}
          />
        </div>
      </div>

      {/* ── Full Height Scrollable Messages Stream ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar w-full relative"
      >
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-4 pb-52 sm:pb-36 space-y-6">
        {/* Flagship Command Center Hero when no conversation has started */}
        {!hasUserMessages && (
          <div className="py-6 sm:py-10 space-y-8 animate-fade-in text-center max-w-2xl mx-auto relative z-10">
            {/* Living ARIA Multi-Layer Halo Core with AriaLogo */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                  isDark ? 'opacity-30' : 'opacity-15'
                }`}
                style={{
                  background: `radial-gradient(circle, ${modeDisplayColor} 0%, rgba(99, 102, 241, 0.35) 60%, transparent 80%)`,
                }}
              />
              <div
                className="absolute -inset-2 rounded-full border border-black/[0.06] dark:border-white/[0.07] animate-spin-slow opacity-40 pointer-events-none"
                style={{ animationDuration: '28s' }}
              />
              <div className="relative z-10 transition-transform hover:scale-105 duration-300">
                <AriaLogo size={80} state={orbState} glow={true} />
              </div>
            </div>

            {/* Personalized Executive Greeting */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border shadow-xs"
                   style={{
                     background: `${modeDisplayColor}12`,
                     color: modeDisplayColor,
                     borderColor: `${modeDisplayColor}28`,
                   }}>
                <ActiveModeIcon size={12} />
                <span>Hermes Engine · {activeModeObj.label}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
                {greeting}, {name}.
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed max-w-lg mx-auto text-[var(--text-muted)]">
                Autonomous reasoning & execution companion. Ask ARIA to plan your sprint, schedule exams, audit blockers, or visualize real-time project metrics.
              </p>
            </div>

            {/* Workspace Live Telemetry Glass Strips */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-2xl border text-center backdrop-blur-xl shadow-xs"
                   style={{
                     background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                     borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                     boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                   }}>
                <p className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--text-hi)' }}>
                  {pendingTasks.length}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                  Active Tasks
                </p>
              </div>
              <div className="p-3 rounded-2xl border text-center backdrop-blur-xl shadow-xs"
                   style={{
                     background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                     borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                     boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                   }}>
                <p className="text-base sm:text-lg font-mono font-bold text-rose-500 dark:text-rose-400">
                  {criticalTasks.length}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                  Critical Due
                </p>
              </div>
              <div className="p-3 rounded-2xl border text-center backdrop-blur-xl shadow-xs"
                   style={{
                     background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                     borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                     boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                   }}>
                <p className="text-base sm:text-lg font-mono font-bold text-indigo-500 dark:text-indigo-400">
                  {projects.length}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                  Modules Linked
                </p>
              </div>
            </div>

            {/* Executive Quick Power Action Starter Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              {QUICK_POWER_ACTIONS.slice(0, 4).map(act => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleTriggerAction(act)}
                    className="p-4 rounded-2xl border text-left transition-all duration-200 group cursor-pointer hover:scale-[1.02] active:scale-98 relative overflow-hidden backdrop-blur-xl"
                    style={{
                      background: isDark ? 'rgba(20, 20, 28, 0.72)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)',
                      boxShadow: isDark
                        ? '0 8px 30px rgba(0, 0, 0, 0.35)'
                        : '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div
                      className="absolute top-0 inset-x-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(90deg, ${act.color}, transparent)` }}
                    />
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs"
                        style={{ background: `${act.color}20`, color: act.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold group-hover:text-[var(--accent)] dark:group-hover:text-white transition-colors" style={{ color: 'var(--text-hi)' }}>
                        {act.label}
                      </p>
                    </div>
                    <p className="text-[11px] line-clamp-2 leading-relaxed text-[var(--text-muted)]">
                      {act.query}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message stream list */}
        {displayMessages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            tasks={tasks}
            projects={projects}
            onApproveProposal={onApproveProposal}
            onApproveAllProposals={onApproveAllProposals}
            onContinueMessage={onContinueMessage}
            onFocusTask={onFocusTask}
            onEditTask={onEditTask}
            onToggleTask={onToggleTask}
            onOpenProject={onOpenProject}
            activeModeObj={activeModeObj}
          />
        ))}

        {/* Live Audio & Thinking Indicator */}
        {orbState === 'thinking' && (
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border w-max animate-fade-in shadow-lg"
            style={{
              background: isDark ? 'rgba(22, 22, 28, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(24px)',
              boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            <Loader2 size={14} className="animate-spin text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-hi)' }}>
              ARIA is synthesizing context & preparing executive actions…
            </span>
          </div>
        )}
        </div>
      </div>

      {/* ── Ultra-Sleek Floating Frosted Glass Command Dock ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none p-2.5 sm:p-4 pb-20 md:pb-4 flex flex-col items-center">
        {/* Atmospheric upward gradient scrim with blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(to top, var(--bg-base) 0%, rgba(0,0,0,0.80) 50%, transparent 100%)'
              : 'linear-gradient(to top, var(--bg-base) 15%, rgba(245, 245, 247, 0.85) 55%, transparent 100%)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
          }}
        />

        <div className="pointer-events-auto max-w-3xl w-full relative space-y-2">
          
          {/* ── One-Click Scroll to Bottom Floating Pill ── */}
          {showScrollBottom && (
            <div className="flex justify-end pr-1 sm:pr-2 animate-scale-in">
              <button
                type="button"
                onClick={scrollToBottom}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
                style={{
                  background: isDark ? 'rgba(20, 20, 28, 0.88)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: hasNewBelow ? 'rgba(245, 158, 11, 0.6)' : isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  boxShadow: hasNewBelow
                    ? '0 8px 30px rgba(245, 158, 11, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
                    : isDark
                    ? '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
                    : '0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                }}
                title="Scroll down with one click"
              >
                {hasNewBelow && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
                )}
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {hasNewBelow ? 'New response' : 'Scroll down'}
                </span>
                <ArrowDown size={12} className="text-zinc-500 dark:text-zinc-300 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Quick Action Sparks Micro-Pills (Guaranteed zero horizontal scrollbar across all OS) */}
          <div
            className="aria-sparks-bar flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
            }}
            onWheel={e => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <style>{`
              .aria-sparks-bar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
              .aria-sparks-bar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}</style>
            {QUICK_POWER_ACTIONS.map(act => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleTriggerAction(act)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: 'var(--text-hi)',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                  }}
                  title={act.query}
                >
                  <Icon size={11} style={{ color: act.color }} />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>

          {/* Floating Frosted Glass Command Capsule */}
          <form
            onSubmit={handleSend}
            className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl sm:rounded-full border transition-all duration-300 shadow-2xl focus-within:ring-1 focus-within:ring-black/10 dark:focus-within:ring-white/20"
            style={{
              background: isDark ? 'rgba(15, 16, 22, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.10)',
              backdropFilter: 'blur(36px) saturate(200%)',
              WebkitBackdropFilter: 'blur(36px) saturate(200%)',
              boxShadow: isDark
                ? '0 16px 48px -8px rgba(0, 0, 0, 0.65)'
                : '0 12px 36px -6px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Live Audio Microphone Button */}
            <button
              type="button"
              onClick={handleOrbClick}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer ${
                orbState === 'recording'
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg ring-4 ring-rose-500/20'
                  : orbState === 'speaking'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06]'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] text-zinc-700 hover:text-black border border-black/[0.06]'
              }`}
              style={{
                color: (orbState === 'recording' || orbState === 'speaking') ? '#FFFFFF' : 'var(--text-hi)',
              }}
              title={
                orbState === 'recording' ? 'Tap to finish speaking' :
                orbState === 'speaking'  ? 'Tap to stop audio' :
                'Speak with ARIA'
              }
            >
              {orbState === 'recording' ? (
                <MicOff size={15} />
              ) : orbState === 'speaking' ? (
                <Volume2 size={15} className="animate-bounce" />
              ) : (
                <Mic size={15} />
              )}
            </button>

            {/* Mode Indicator Pill inside Capsule */}
            <button
              type="button"
              onClick={() => setShowModeMenu(m => !m)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border shrink-0 transition-all hover:opacity-80 cursor-pointer"
              style={{
                background: `${modeDisplayColor}12`,
                color: modeDisplayColor,
                borderColor: `${modeDisplayColor}25`,
              }}
              title="Click to switch intelligence mode"
            >
              <ActiveModeIcon size={10} />
              <span>{activeModeObj.short}</span>
            </button>

            {/* Seamless Natural Chat Multiline Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                orbState === 'recording' ? 'Listening to your voice…' :
                `Message ARIA (${activeModeObj.short})… (Shift+Enter for new line)`
              }
              disabled={orbState === 'recording' || orbState === 'thinking'}
              className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-500 font-normal resize-none overflow-y-auto max-h-36 scroll leading-relaxed transition-[height] duration-200 ease-out"
              style={{ color: 'var(--text-hi)', minHeight: '26px' }}
            />

            {/* Expand to Fullscreen Studio Button */}
            <button
              type="button"
              onClick={handleOpenStudio}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 group"
              title="Expand to Full-Screen Studio"
            >
              <Maximize2 size={13} className="transition-transform duration-300 group-hover:rotate-45" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!textInput.trim() || orbState === 'thinking'}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                textInput.trim()
                  ? 'bg-amber-500 text-black hover:scale-105 active:scale-95 shadow-md font-bold'
                  : isDark
                  ? 'bg-white/[0.04] text-zinc-600 border border-white/[0.05]'
                  : 'bg-black/[0.04] text-zinc-400 border border-black/[0.06]'
              }`}
              title="Send message"
            >
              <Send size={12} />
            </button>
          </form>

        </div>
      </div>

      {/* ── Fullscreen Prompt Studio Overlay ── */}
      {isStudioExpanded && (
        <div
          className={`absolute inset-0 z-50 flex flex-col bg-[#FAFAFC] dark:bg-[#0B0C10] backdrop-blur-3xl overflow-hidden ${
            studioAnimation === 'closing' ? 'animate-studio-bloom-out' : 'animate-studio-bloom-in'
          }`}
          style={{ willChange: 'transform, opacity, filter, border-radius' }}
        >
          {/* Studio Top Navigation Bar */}
          <div
            className="h-14 flex items-center justify-between px-4 sm:px-8 border-b shrink-0 select-none animate-studio-content"
            style={{
              background: isDark ? 'rgba(15, 16, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Left: Studio Identity & Archetype */}
            <div className="flex items-center gap-3">
              <AriaLogo size={24} glow={false} />
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  Prompt Studio
                </h3>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400">
                  Full-Screen Composer
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    background: `${modeDisplayColor}15`,
                    color: modeDisplayColor,
                    borderColor: `${modeDisplayColor}30`,
                  }}
                >
                  {activeModeObj.short} Mode
                </span>
              </div>
            </div>

            {/* Center: Live Metrics + Write/Preview Switch */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.04] p-0.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setStudioTab('edit')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    studioTab === 'edit'
                      ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Code2 size={12} />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    studioTab === 'preview'
                      ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>{textInput.trim() ? textInput.trim().split(/\s+/).length : 0} words</span>
                <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                <span>{textInput.length} chars</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {textInput.trim() && (
                <button
                  type="button"
                  onClick={() => setTextInput('')}
                  className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Clear drafted text"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
                title="Collapse back to compact capsule (Esc)"
              >
                <Minimize2 size={13} />
                <span className="hidden sm:inline">Minimize</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">(Esc)</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!textInput.trim() || orbState === 'thinking'}
                className="btn-primary flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 cursor-pointer"
                style={{
                  background: textInput.trim() ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)',
                  color: textInput.trim() ? '#000000' : 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <Send size={12} />
                <span>Send to ARIA</span>
                <span className="text-[10px] opacity-75 font-mono hidden sm:inline">(Ctrl+Enter)</span>
              </button>
            </div>
          </div>

          {/* Studio Writing Canvas */}
          <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-8 animate-studio-content overflow-y-auto">
            {studioTab === 'edit' ? (
              <textarea
                ref={studioTextareaRef}
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={handleStudioKeyDown}
                placeholder="Draft your thoughts, comprehensive instructions, project briefings, internship details, or exam notes here…&#10;&#10;Use Shift+Enter or Enter freely for paragraphs and formatting.&#10;Supports **bold**, # headings, --- dividers, *italics*, `code`.&#10;Type \--- or \# to cancel formatting for a specific item.&#10;Press Ctrl+Enter (or ⌘+Enter) when ready to send to ARIA."
                className="flex-1 w-full bg-transparent text-sm sm:text-base leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none border-none resize-none font-normal selection:bg-amber-500/20"
                style={{
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto py-2 px-1 select-text space-y-3">
                {textInput.trim() ? (
                  <RichAiContent
                    text={textInput}
                    tasks={tasks}
                    projects={projects}
                    onFocusTask={onFocusTask}
                    onEditTask={onEditTask}
                    onToggleTask={onToggleTask}
                    onOpenProject={onOpenProject}
                    isUserMessage={true}
                  />
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic text-sm">Nothing drafted yet. Switch to Write to draft your prompt.</p>
                )}
              </div>
            )}
          </div>

          {/* Studio Footer Helper Bar */}
          <div
            className="h-10 flex items-center justify-between px-4 sm:px-8 border-t shrink-0 text-[11px] text-zinc-500 select-none animate-studio-content"
            style={{
              background: isDark ? 'rgba(12, 13, 17, 0.9)' : 'rgba(245, 245, 247, 0.9)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">Enter</kbd>
                <span>New line</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">Ctrl+Enter</kbd>
                <span>Send to ARIA</span>
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">\---</kbd>
                <span>Cancel formatting</span>
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">Esc</kbd>
                <span>Minimize</span>
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span>{textInput.trim() ? textInput.trim().split(/\s+/).length : 0} words</span>
              <span>·</span>
              <span>{textInput.length} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Configuration Modal */}
      {showPrivacy && (
        <PrivacyPanel
          settings={privacy}
          onChange={setPrivacy}
          onClose={() => setShowPrivacy(false)}
          taskCount={tasks.length}
          projectCount={projects.length}
          diaryCount={diary?.length ?? 0}
          noteCount={notes?.length ?? 0}
        />
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <ClearChatModal
          messageCount={messages.length}
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={() => {
            setShowClearConfirm(false);
            onClearChat();
          }}
        />
      )}
    </div>
  );
}
