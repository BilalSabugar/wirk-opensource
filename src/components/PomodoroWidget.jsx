import React, { useState, useMemo } from 'react';
import { 
  X, Settings, Play, Pause, SkipForward, Square, 
  ChevronDown, Timer, Flame, Coffee, Sparkles, Check, 
  RotateCcw, Sliders, CheckCircle2, Search, ArrowLeft 
} from 'lucide-react';
import { DEFAULT_POMO_CONFIG } from '../hooks/usePomodoro';
import { getPriority, getTheme } from '../constants';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const pad  = (n) => String(n).padStart(2, '0');
const fmt  = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fmtMs = (ms) => {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

/* ── SVG Timer Progress Ring ─────────────────────────────────────────────── */
function TimerRing({ secs, totalSecs, phase, size = 170 }) {
  const cx   = size / 2;
  const r    = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const pct  = totalSecs > 0 ? secs / totalSecs : 0;
  const off  = circ * (1 - pct);

  const color = phase === 'work' ? '#10B981'
              : phase === 'longBreak' ? '#06B6D4'
              : phase === 'break' ? '#F59E0B'
              : '#10B981';

  return (
    <div className="relative flex items-center justify-center select-none my-2">
      <svg width={size} height={size} className="shrink-0 -rotate-90 transform">
        {/* Track Background */}
        <circle 
          cx={cx} cy={cx} r={r} 
          fill="none" 
          stroke="rgba(120, 120, 128, 0.15)" 
          strokeWidth={6} 
        />

        {/* Dynamic Progress Arc */}
        <circle 
          cx={cx} cy={cx} r={r} 
          fill="none"
          stroke={color} 
          strokeWidth={6}
          strokeDasharray={circ} 
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s' }}
        />
      </svg>

      {/* Central Time Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
          {fmt(secs)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>
          {phase === 'work' ? 'FOCUS' : phase === 'break' ? 'SHORT BREAK' : phase === 'longBreak' ? 'LONG BREAK' : 'READY'}
        </span>
      </div>
    </div>
  );
}

/* ── Session Dots ────────────────────────────────────────────────────────── */
function SessionDots({ count, max = 4 }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i < (count % max || (count > 0 && count % max === 0 ? max : 0))
              ? 'bg-emerald-500 shadow-sm'
              : 'bg-black/15 dark:bg-white/15'
          }`}
          title={`Session ${i + 1} of ${max}`}
        />
      ))}
    </div>
  );
}

/* ── In-Card Settings Panel ──────────────────────────────────────────────── */
function ConfigView({ config, onSave, onBack }) {
  const [work, setWork]         = useState(config.workMin);
  const [brk, setBrk]           = useState(config.breakMin);
  const [longBrk, setLongBrk]   = useState(config.longBreakMin);
  const [longAfter, setLongAfter] = useState(config.longBreakAfter);

  const applyPreset = (w, b) => {
    setWork(w);
    setBrk(b);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-xs">
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold hover:text-emerald-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Back
        </button>
        <span className="font-bold text-xs" style={{ color: 'var(--text-hi)' }}>Timer Configuration</span>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPreset(25, 5)}
            className={`py-1.5 px-2 rounded-xl border font-semibold text-[11px] transition-all ${
              work === 25 && brk === 5 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : 'btn-ghost'
            }`}
          >
            25m / 5m Standard
          </button>
          <button
            onClick={() => applyPreset(50, 10)}
            className={`py-1.5 px-2 rounded-xl border font-semibold text-[11px] transition-all ${
              work === 50 && brk === 10 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : 'btn-ghost'
            }`}
          >
            50m / 10m Deep Work
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3 pt-1">
        {[
          ['Focus Duration', work, setWork, 1, 90, 'min'],
          ['Short Break', brk, setBrk, 1, 30, 'min'],
          ['Long Break', longBrk, setLongBrk, 1, 60, 'min'],
          ['Sessions to Long Break', longAfter, setLongAfter, 2, 8, 'sessions'],
        ].map(([label, val, setter, min, max, unit]) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-mono font-bold text-emerald-500">{val} {unit}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={val}
              onChange={e => setter(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-300 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          onSave({ workMin: work, breakMin: brk, longBreakMin: longBrk, longBreakAfter: longAfter });
          onBack();
        }}
        className="w-full py-2.5 rounded-xl btn-primary font-bold text-xs shadow-md mt-2"
      >
        Save & Apply
      </button>
    </div>
  );
}

/* ── In-Card Task Picker ─────────────────────────────────────────────────── */
function TaskPickerView({ tasks, projects, onPick, onBack }) {
  const [q, setQ] = useState('');

  const items = useMemo(() =>
    tasks.filter(t => !t.completed && (!q || t.text.toLowerCase().includes(q.toLowerCase())))
         .sort((a,b) => getPriority(a.priority).order - getPriority(b.priority).order)
         .slice(0, 25),
  [tasks, q]);

  return (
    <div className="p-4 space-y-3 animate-fade-in text-xs">
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold hover:text-emerald-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Back
        </button>
        <span className="font-bold text-xs" style={{ color: 'var(--text-hi)' }}>Attach Active Task</span>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          autoFocus
          className="input-terminal w-full pl-8 pr-3 py-1.5 text-xs rounded-xl"
          placeholder="Search pending tasks…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="max-h-56 overflow-y-auto scroll divide-y divide-zinc-500/10 rounded-xl border"
           style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        {items.length === 0 && (
          <p className="text-center py-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            No pending tasks found
          </p>
        )}
        {items.map(task => {
          const proj  = projects.find(p => p.id === task.projectId);
          const theme = getTheme(proj?.color);
          const pv    = getPriority(task.priority);
          return (
            <button
              key={task.id}
              onClick={() => onPick(task)}
              className="w-full text-left p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${pv.color.replace('text-','bg-')}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{task.text}</p>
                {proj && <p className={`text-[10px] mt-0.5 ${theme.text}`}>{proj.title}</p>}
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 ${pv.color}`}>
                {pv.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Executive Focus Timer Widget ───────────────────────────────────── */
export default function PomodoroWidget({ pomodoro, tasks = [], projects = [], activeView = '' }) {
  const [expanded, setExpanded]   = useState(false);
  const [cardMode, setCardMode]   = useState('timer'); // 'timer' | 'config' | 'picker'

  const {
    config = DEFAULT_POMO_CONFIG, phase, secs, totalSecs, activeTask, sessionCount = 0, notification,
    isRunning, isIdle,
    saveConfig, startWork, startBreak, startLongBreak,
    pause, resume, skip, stop, dismissNotification,
  } = pomodoro;

  const isDonePhase  = phase === 'work-done' || phase === 'break-done-short' || phase === 'break-done-long';
  const isBreakPhase = phase === 'break' || phase === 'longBreak';
  const proj         = projects.find(p => p.id === activeTask?.projectId);
  const theme        = getTheme(proj?.color);

  // Close handler: stops timer and cleanly collapses panel
  const handleClose = () => {
    if (isIdle) stop?.();
    setExpanded(false);
    setCardMode('timer');
  };

  /* ── 1. FLOATING NOTIFICATION TOAST ── */
  if (notification && !expanded) {
    return (
      <div className={`fixed z-50 animate-slide-up ${activeView === 'ARIA' ? 'bottom-24 right-4 sm:bottom-24 sm:right-6' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}`}>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm"
             style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-mid)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Timer size={16} />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold" style={{ color: 'var(--text-hi)' }}>Phase Completed</p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{notification.text}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { dismissNotification(); notification.type === 'break' ? startBreak() : startWork(); }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg btn-primary shadow-sm"
            >
              {notification.type === 'break' ? 'Start Break' : 'Focus'}
            </button>
            <button
              onClick={dismissNotification}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. MINIMIZED FLOATING PILL (Idle State) ── */
  if (isIdle && !expanded) {
    // In ARIA companion view, keep chat interface uncluttered while idle
    if (activeView === 'ARIA') return null;

    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={() => { setExpanded(true); setCardMode('timer'); }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:border-emerald-500/40 select-none group"
          style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-mid)' }}
          title="Open Focus Timer"
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
            <Timer size={14} />
          </div>
          <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
            Focus {config.workMin}m
          </span>
        </button>
      </div>
    );
  }

  /* ── 3. MINIMIZED FLOATING PILL (Active / Running State) ── */
  if (!expanded && (isRunning || phase === 'paused' || isDonePhase)) {
    const activeColor = isBreakPhase ? '#F59E0B' : '#10B981';
    return (
      <div className={`fixed z-40 ${activeView === 'ARIA' ? 'bottom-24 right-4 sm:bottom-24 sm:right-6' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}`}>
        <button
          onClick={() => { setExpanded(true); setCardMode('timer'); }}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-all hover:scale-105 select-none"
          style={{ background: 'var(--modal-bg)', borderColor: 'var(--border-mid)' }}
        >
          <div className="relative flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${phase === 'paused' ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-extrabold" style={{ color: activeColor }}>
                {fmt(secs)}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {phase === 'paused' ? 'PAUSED' : isBreakPhase ? 'BREAK' : 'FOCUS'}
              </span>
            </div>
            {activeTask && (
              <p className="text-[10px] max-w-[110px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {activeTask.text}
              </p>
            )}
          </div>
        </button>
      </div>
    );
  }

  /* ── 4. EXPANDED FOCUS TIMER CARD ── */
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-scale-in max-w-[calc(100vw-2rem)]">
      <div 
        className="w-80 max-w-full max-h-[88vh] overflow-y-auto scroll rounded-3xl border shadow-2xl backdrop-blur-2xl"
        style={{
          background: 'var(--modal-bg)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Timer size={13} />
            </div>
            <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
              Deep Work Focus
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCardMode(m => m === 'config' ? 'timer' : 'config')}
              className={`p-1.5 rounded-lg transition-colors ${cardMode === 'config' ? 'bg-emerald-500/15 text-emerald-500' : 'hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400'}`}
              title="Timer Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 transition-colors"
              title="Minimize"
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Close & Stop"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* View Routing */}
        {cardMode === 'config' && (
          <ConfigView
            config={config}
            onSave={(cfg) => { saveConfig(cfg); setCardMode('timer'); }}
            onBack={() => setCardMode('timer')}
          />
        )}

        {cardMode === 'picker' && (
          <TaskPickerView
            tasks={tasks}
            projects={projects}
            onPick={(task) => { pomodoro.setActiveTask(task); setCardMode('timer'); }}
            onBack={() => setCardMode('timer')}
          />
        )}

        {cardMode === 'timer' && (
          <div className="p-5 space-y-4">

            {/* Sub-header status & Session Dots */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                {isIdle ? 'Ready to Focus' : phase === 'work' ? 'Sprint In Progress' : phase === 'paused' ? 'Paused' : 'Break Time'}
              </span>
              <SessionDots count={sessionCount} max={config.longBreakAfter} />
            </div>

            {/* Circular Timer Ring */}
            <TimerRing
              secs={secs}
              totalSecs={totalSecs}
              phase={phase}
            />

            {/* Active Attached Task Card */}
            {activeTask ? (
              <div className="p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs"
                   style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate" style={{ color: 'var(--text-hi)' }}>{activeTask.text}</p>
                  {proj && <p className={`text-[10px] truncate ${theme.text}`}>{proj.title}</p>}
                </div>
                <button
                  onClick={() => setCardMode('picker')}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg btn-ghost border shrink-0"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCardMode('picker')}
                className="w-full py-2 px-3 rounded-2xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-500"
                style={{ borderColor: 'var(--border-mid)' }}
              >
                <Sparkles size={13} />
                <span>+ Attach Task to Session</span>
              </button>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {isIdle && (
                <button
                  onClick={() => startWork()}
                  className="w-full py-3 rounded-2xl btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <Play size={14} className="fill-current" />
                  <span>Start Focus Session</span>
                </button>
              )}

              {phase === 'work' && (
                <div className="flex gap-2">
                  <button
                    onClick={pause}
                    className="flex-1 py-3 rounded-2xl btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={stop}
                    className="px-4 py-3 rounded-2xl btn-ghost border text-xs font-semibold hover:text-rose-400 transition-colors"
                    style={{ borderColor: 'var(--border-mid)' }}
                    title="Stop Session"
                  >
                    <Square size={13} />
                  </button>
                </div>
              )}

              {phase === 'paused' && (
                <div className="flex gap-2">
                  <button
                    onClick={resume}
                    className="flex-1 py-3 rounded-2xl btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Play size={14} className="fill-current" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={stop}
                    className="px-4 py-3 rounded-2xl btn-ghost border text-xs font-semibold hover:text-rose-400 transition-colors"
                    style={{ borderColor: 'var(--border-mid)' }}
                    title="Stop Session"
                  >
                    <Square size={13} />
                  </button>
                </div>
              )}

              {isBreakPhase && (
                <div className="flex gap-2">
                  <button
                    onClick={pause}
                    className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Pause size={14} />
                    <span>Pause Break</span>
                  </button>
                  <button
                    onClick={skip}
                    className="px-4 py-3 rounded-2xl btn-ghost border text-xs font-semibold"
                    style={{ borderColor: 'var(--border-mid)' }}
                    title="Skip Break"
                  >
                    <SkipForward size={13} />
                  </button>
                </div>
              )}

              {isDonePhase && (
                <div className="flex gap-2">
                  {phase === 'work-done' && (
                    <button
                      onClick={startBreak}
                      className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <Coffee size={14} />
                      <span>Take Short Break</span>
                    </button>
                  )}
                  {phase === 'break-done-long' && (
                    <button
                      onClick={startLongBreak}
                      className="flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <Sparkles size={14} />
                      <span>Take Long Break</span>
                    </button>
                  )}
                  {(phase === 'break-done-short' || phase === 'break-done-long') && (
                    <button
                      onClick={() => startWork()}
                      className="flex-1 py-3 rounded-2xl btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <Play size={14} className="fill-current" />
                      <span>Start Focus</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
