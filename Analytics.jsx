import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, BarChart2, Layers, Download } from 'lucide-react';
import { PRIORITIES, THEME_COLORS, getTheme, getPriority, formatDue, dueCls, exportTasksCSV, fmtMs } from '../constants';
import { DonutChart, PriorityBadge, DueBadge } from '../components/shared';

/* ── Priority bar row ─────────────────────────────────────────────────────── */
function PriorityBarRow({ label, count, total, hex, color, border, bg }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[9px] font-bold uppercase tracking-widest w-12 shrink-0 ${color}`}>{label}</span>
      <div className="flex-1 h-2 bg-[var(--bg-raised)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bar-shine transition-all duration-1000"
             style={{ width: `${pct}%`, backgroundColor: hex }} />
      </div>
      <span className={`text-[10px] font-bold w-5 text-right ${color}`}>{count}</span>
    </div>
  );
}

/* ── Module performance table row ─────────────────────────────────────────── */
function ModuleRow({ project, stat }) {
  const theme   = getTheme(project.color);
  const status  = stat.total === 0  ? 'EMPTY'
                : stat.pct === 100  ? 'COMPLETE'
                : stat.overdue > 0  ? 'OVERDUE'
                : stat.pct < 25     ? 'CRITICAL'
                : 'ACTIVE';
  const statusCls = {
    COMPLETE: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/25',
    ACTIVE:   'text-cyan-400 bg-cyan-500/8 border-cyan-500/25',
    CRITICAL: 'text-red-400 bg-red-500/8 border-red-500/25',
    OVERDUE:  'text-amber-400 bg-amber-500/8 border-amber-500/25',
    EMPTY:    'text-slate-600 bg-slate-800/20 border-slate-700/30',
  }[status];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(34,211,238,0.04)]
                    hover:bg-[var(--bg-hover)] transition-colors">
      <div className={`w-1 h-8 ${theme.bg} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${theme.text}`}>{project.title}</p>
        {project.sub && <p className="text-[8px] text-slate-600 truncate">{project.sub}</p>}
      </div>

      {/* Mini bar */}
      <div className="hidden sm:flex items-center gap-2 w-28 shrink-0">
        <div className="flex-1 h-1 bg-[var(--bg-raised)] relative overflow-hidden">
          <div className={`absolute inset-y-0 left-0 ${theme.bg} transition-all duration-700`}
               style={{ width: `${stat.pct}%` }} />
        </div>
        <span className={`text-[9px] font-bold w-6 text-right ${theme.text}`}>{stat.pct}%</span>
      </div>

      <span className="text-[9px] text-slate-600 w-12 text-right shrink-0">
        {stat.done}/{stat.total}
      </span>

      <span className={`text-[8px] font-bold px-1.5 py-0.5 border shrink-0 ${statusCls}`}>
        {status}
      </span>
    </div>
  );
}

/* ── Overdue task row ─────────────────────────────────────────────────────── */
function OverdueRow({ task, project }) {
  const due   = formatDue(task.dueDate);
  const theme = getTheme(project?.color);
  const p     = getPriority(task.priority);
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-[rgba(34,211,238,0.04)]
                    hover:bg-[rgba(239,68,68,0.02)] transition-colors">
      <PriorityBadge priority={task.priority} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-300 leading-snug truncate">{task.text}</p>
        {project && <p className={`text-[9px] mt-0.5 ${theme.text}`}>{project.title}</p>}
      </div>
      {due && <span className={`text-[9px] border px-1.5 py-0.5 shrink-0 ${dueCls(due.tag)}`}>{due.label}</span>}
    </div>
  );
}

/* ── Radar/spider chart for module balance ──────────────────────────────────── */
function RadarChart({ projects, stats, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const displayed = projects.slice(0, 6);
  const n = displayed.length;
  if (n < 2) return null;

  const points = displayed.map((p, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const pct   = (stats.byProject[p.id]?.pct ?? 0) / 100;
    const dist  = r * (0.15 + pct * 0.85);
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      lx: cx + (r + 18) * Math.cos(angle),
      ly: cy + (r + 18) * Math.sin(angle),
      label: p.title.slice(0, 8),
      theme: getTheme(p.color),
      pct: stats.byProject[p.id]?.pct ?? 0,
    };
  });

  const outerPoints = displayed.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const dataPolygon = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const ringPts = displayed.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${cx + r * f * Math.cos(angle)},${cy + r * f * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={f} points={ringPts} fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth="1"/>;
      })}

      {/* Spokes */}
      {displayed.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(34,211,238,0.07)" strokeWidth="1" />
        );
      })}

      {/* Data area */}
      <polygon points={dataPolygon}
        fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3"
          fill={p.theme.hex} stroke="#00050f" strokeWidth="1.5" />
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly + 4}
          textAnchor="middle" fill={p.theme.hex}
          fontSize="7" fontFamily="JetBrains Mono, monospace"
          fontWeight="bold">
          {p.label}
        </text>
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2" fill="rgba(34,211,238,0.3)" />
    </svg>
  );
}

/* ── Weekly Trend Chart ───────────────────────────────────────────────────── */
function WeeklyTrendChart({ weeklyTrend }) {
  const maxCount = Math.max(...weeklyTrend.map(d => d.count), 1);
  const W = 560, H = 120, padL = 28, padB = 28, padT = 10, padR = 8;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const barW   = Math.floor(chartW / weeklyTrend.length) - 3;
  const totalDone = weeklyTrend.reduce((a, d) => a + d.count, 0);

  // Gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxCount));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="label-xs flex items-center gap-2"><TrendingUp size={10}/> 14-Day Completion Trend</p>
        <span className="text-[9px] text-slate-600">{totalDone} tasks completed</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 130 }}>
        {/* Grid lines + Y labels */}
        {gridLines.map(v => {
          const y = padT + chartH - (v / maxCount) * chartH;
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="rgba(34,211,238,0.06)" strokeWidth="1" strokeDasharray="4,4" />
              <text x={padL - 4} y={y + 3} textAnchor="end"
                fill="#1e3a5f" fontSize="7" fontFamily="JetBrains Mono, monospace">{v}</text>
            </g>
          );
        })}

        {/* Bars */}
        {weeklyTrend.map((d, i) => {
          const barH  = d.count ? Math.max(3, (d.count / maxCount) * chartH) : 0;
          const x     = padL + i * (chartW / weeklyTrend.length) + 1.5;
          const y     = padT + chartH - barH;
          const color = d.isToday ? '#22d3ee' : d.count > 0 ? '#0e4f60' : '#0a1530';
          return (
            <g key={i}>
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx="1"/>
              {/* Glow on today */}
              {d.isToday && d.count > 0 && (
                <rect x={x} y={y} width={barW} height={barH}
                  fill="rgba(34,211,238,0.15)" rx="1"
                  filter="url(#bar-blur)" />
              )}
              {/* Count label on top */}
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle"
                  fill={d.isToday ? '#22d3ee' : '#1e3a5f'}
                  fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {d.count}
                </text>
              )}
              {/* X label */}
              {(i % 2 === 0 || d.isToday) && (
                <text x={x + barW / 2} y={H - 4} textAnchor="middle"
                  fill={d.isToday ? '#22d3ee' : '#1e3a5f'}
                  fontSize="7" fontFamily="JetBrains Mono, monospace">
                  {d.short}
                </text>
              )}
            </g>
          );
        })}

        {/* Today indicator line */}
        {(() => {
          const todayIdx = weeklyTrend.findIndex(d => d.isToday);
          if (todayIdx < 0) return null;
          const x = padL + todayIdx * (chartW / weeklyTrend.length) + barW / 2 + 1.5;
          return <line x1={x} y1={padT} x2={x} y2={padT + chartH}
            stroke="rgba(34,211,238,0.2)" strokeWidth="1" strokeDasharray="2,3"/>;
        })()}

        <defs>
          <filter id="bar-blur"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-cyan-500/30" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-[#0e4f60]" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}


/* ── Focus Section ─────────────────────────────────────────────────────────── */
function FocusSection({ projects, tasks, stats }) {
  const maxMs = Math.max(...projects.map(p => stats.byProject[p.id]?.totalFocusMs ?? 0), 1);
  const sorted = [...projects]
    .filter(p => (stats.byProject[p.id]?.totalFocusMs ?? 0) > 0)
    .sort((a,b) => (stats.byProject[b.id]?.totalFocusMs ?? 0) - (stats.byProject[a.id]?.totalFocusMs ?? 0));

  if (stats.totalFocusMs === 0) return (
    <div className="border border-[rgba(34,211,238,0.06)] bg-[#03091a] p-8 text-center">
      <p className="text-4xl mb-3">🍅</p>
      <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        No focus sessions yet
      </p>
      <p className="text-[9px] mt-1" style={{ color: 'var(--text-dim)' }}>
        Use the Pomodoro timer on any task to start tracking
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Focus', value: fmtMs(stats.totalFocusMs), icon: '⏱' },
          { label: 'Sessions',    value: stats.totalSessions,        icon: '🍅' },
          { label: 'Breaks',      value: stats.totalBreaks,          icon: '☕' },
        ].map(s => (
          <div key={s.label} className="border border-[rgba(34,211,238,0.06)] bg-[#03091a] p-4">
            <p className="label-xs mb-2 flex items-center gap-1.5"><span>{s.icon}</span>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-hi)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-project focus bars */}
      <div className="border border-[rgba(34,211,238,0.06)] bg-[#03091a] p-5">
        <p className="label-xs mb-4">Focus Time by Module</p>
        <div className="space-y-3">
          {sorted.map(proj => {
            const theme = getTheme(proj.color);
            const s     = stats.byProject[proj.id];
            const pct   = maxMs > 0 ? (s.totalFocusMs / maxMs) * 100 : 0;
            return (
              <div key={proj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className={`font-bold uppercase tracking-wider ${theme.text}`}>{proj.title}</span>
                  <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span>{s.totalSessions ?? 0} 🍅</span>
                    <span>{s.totalBreaks ?? 0} ☕</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{fmtMs(s.totalFocusMs)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[#0a1530] relative overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 ${theme.bg} bar-shine transition-all duration-1000`}
                       style={{ width: `${pct}%` }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top focused tasks */}
      {stats.topFocused?.length > 0 && (
        <div className="border border-[rgba(34,211,238,0.06)] bg-[#03091a]">
          <div className="px-4 py-2.5 border-b border-[rgba(34,211,238,0.06)]">
            <p className="label-xs">Most Focused Tasks</p>
          </div>
          <div className="divide-y divide-[rgba(34,211,238,0.03)]">
            {stats.topFocused.map((task, i) => {
              const proj  = projects.find(p => p.id === task.projectId);
              const theme = getTheme(proj?.color);
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(34,211,238,0.02)] transition-colors">
                  <span className="text-[10px] font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>
                    #{i+1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] truncate ${task.completed ? 'line-through opacity-50' : ''}`}
                       style={{ color: 'var(--text-hi)' }}>{task.text}</p>
                    {proj && <p className={`text-[8px] ${theme.text}`}>{proj.title}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                      {fmtMs(task.totalFocusMs)}
                    </p>
                    <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                      {task.totalSessions ?? 0} 🍅 · {task.totalBreaks ?? 0} ☕
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Analytics View ───────────────────────────────────────────────────────── */
export default function AnalyticsView({ projects, tasks, stats }) {
  const now = new Date(); now.setHours(0,0,0,0);
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate &&
    new Date(t.dueDate + 'T00:00:00') < now);

  const pendingByPriority = Object.entries(PRIORITIES).map(([k, v]) => ({
    key: k, ...v,
    count: tasks.filter(t => !t.completed && t.priority === k).length,
  }));
  const totalPending = stats.pending;

  const completionByProject = [...projects]
    .sort((a,b) => (stats.byProject[b.id]?.pct ?? 0) - (stats.byProject[a.id]?.pct ?? 0));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-dim)] shrink-0">
        <div>
          <p className="label-xs text-slate-600">engine_core_v6</p>
          <h2 className="text-white font-bold text-sm tracking-tight">INTEL DASHBOARD</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] text-slate-600 hidden sm:flex">
            <BarChart2 size={12} className="text-cyan-500/50"/>
            <span>{tasks.length} tasks · {projects.length} modules</span>
          </div>
          <button onClick={() => exportTasksCSV(tasks, projects)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(34,211,238,0.15)]
                       text-[10px] text-cyan-500/70 hover:text-cyan-400 hover:border-cyan-500/30
                       uppercase tracking-wider font-bold transition-colors">
            <Download size={11}/> Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll p-4 md:p-6 space-y-5">

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Modules',    value: projects.length,   sub: 'active'         },
            { label: 'Total Tasks',value: stats.total,       sub: 'tracked'        },
            { label: 'Done',       value: stats.done,        sub: 'complete'       },
            { label: 'Overdue',    value: stats.overdue,     sub: 'past deadline', warn: stats.overdue > 0 },
          ].map(s => (
            <div key={s.label}
              className={`border p-4 ${s.warn ? 'border-red-500/25 bg-[#0f0505]' : 'border-[var(--border-dim)] bg-[var(--bg-panel)]'}`}>
              <p className="label-xs mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.warn ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
              <p className="text-[9px] text-slate-600 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Weekly Trend */}
        <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)] p-5">
          <WeeklyTrendChart weeklyTrend={stats.weeklyTrend} />
        </div>

        {/* Center section: donut + priority + radar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Donut */}
          <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)] p-5 flex flex-col items-center justify-center">
            <p className="label-xs mb-4 self-start">Completion Rate</p>
            <DonutChart pct={stats.pct} size={160} />
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[9px] w-full">
              <div className="flex justify-between">
                <span className="text-slate-600">Done</span>
                <span className="text-emerald-400 font-bold">{stats.done}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pending</span>
                <span className="text-slate-400 font-bold">{stats.pending}</span>
              </div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)] p-5">
            <p className="label-xs mb-4">Priority Matrix (pending)</p>
            <div className="space-y-3">
              {pendingByPriority.map(p => (
                <PriorityBarRow key={p.key} label={p.short} count={p.count}
                  total={totalPending} hex={p.hex} color={p.color}
                  border={p.border} bg={p.bg} />
              ))}
            </div>
            <div className="divider mt-4 mb-3" />
            <div className="space-y-1 text-[9px] text-slate-600">
              <div className="flex justify-between">
                <span>Critical load</span>
                <span className={stats.byPriority.CRITICAL > 5 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                  {stats.byPriority.CRITICAL > 5 ? '⚠ High' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pending ratio</span>
                <span className="text-slate-500">{totalPending}/{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)] p-5 flex flex-col">
            <p className="label-xs mb-2">Module Balance</p>
            <p className="text-[9px] text-slate-700 mb-4">Completion distribution</p>
            {projects.length >= 2
              ? <RadarChart projects={projects} stats={stats} size={190} />
              : <div className="flex-1 flex items-center justify-center text-slate-700 text-[10px]">
                  Need 2+ modules
                </div>
            }
          </div>
        </div>

        {/* Module Performance Table */}
        <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-dim)]">
            <p className="label-xs flex items-center gap-2"><Layers size={10}/> Module Performance</p>
            <span className="text-[9px] text-slate-600">sorted by completion</span>
          </div>
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[rgba(34,211,238,0.04)]
                          text-[9px] text-slate-700 uppercase tracking-widest">
            <div className="w-1 shrink-0" />
            <span className="flex-1">Module</span>
            <span className="hidden sm:block w-28 text-center">Progress</span>
            <span className="w-12 text-right">Done</span>
            <span className="w-16 text-right">Status</span>
          </div>
          <div className="divide-y divide-[rgba(34,211,238,0.03)]">
            {completionByProject.map(p => (
              <ModuleRow key={p.id} project={p} stat={stats.byProject[p.id] ?? { total:0, done:0, pct:0, overdue:0 }} />
            ))}
          </div>
        </div>

        {/* Overdue Alert Table */}
        {overdueTasks.length > 0 && (
          <div className="border border-red-500/20 bg-[#0a0303]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-500/15">
              <AlertTriangle size={12} className="text-red-400"/>
              <p className="label-xs text-red-400">Overdue Alerts ({overdueTasks.length})</p>
            </div>
            <div className="divide-y divide-red-500/5">
              {overdueTasks
                .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map(task => (
                  <OverdueRow key={task.id} task={task}
                    project={projects.find(p => p.id === task.projectId)} />
                ))}
            </div>
          </div>
        )}

        {/* Priority heatmap - tasks by project × priority */}
        <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)]">
          <div className="px-4 py-2.5 border-b border-[var(--border-dim)]">
            <p className="label-xs flex items-center gap-2"><TrendingUp size={10}/> Task Matrix (pending)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] font-mono">
              <thead>
                <tr className="border-b border-[rgba(34,211,238,0.04)]">
                  <th className="text-left px-4 py-2 text-slate-700 font-bold uppercase tracking-widest w-40">Module</th>
                  {Object.entries(PRIORITIES).map(([k,v]) => (
                    <th key={k} className={`text-center py-2 px-3 font-bold uppercase tracking-widest ${v.color}`}>{v.short}</th>
                  ))}
                  <th className="text-right px-4 py-2 text-slate-700 font-bold uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const t = getTheme(p.color);
                  const pending = tasks.filter(x => x.projectId === p.id && !x.completed);
                  return (
                    <tr key={p.id} className="border-b border-[rgba(34,211,238,0.03)] hover:bg-[rgba(34,211,238,0.015)] transition-colors">
                      <td className={`px-4 py-2.5 font-bold truncate max-w-[160px] ${t.text}`}>{p.title}</td>
                      {Object.keys(PRIORITIES).map(k => {
                        const count = pending.filter(x => x.priority === k).length;
                        const pv = PRIORITIES[k];
                        return (
                          <td key={k} className="text-center py-2.5 px-3">
                            {count > 0
                              ? <span className={`inline-block w-7 h-5 leading-5 font-bold ${pv.color} ${pv.bg} border ${pv.border}`}>
                                  {count}
                                </span>
                              : <span className="text-slate-800">—</span>
                            }
                          </td>
                        );
                      })}
                      <td className="text-right px-4 py-2.5 text-slate-500 font-bold">{pending.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Focus & Pomodoro */}
        <div className="border border-[rgba(34,211,238,0.06)] bg-[#03091a]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(34,211,238,0.06)]">
            <p className="label-xs flex items-center gap-2"><span>🍅</span> Focus & Pomodoro</p>
          </div>
          <div className="p-4">
            <FocusSection projects={projects} tasks={tasks} stats={stats} />
          </div>
        </div>

      </div>
    </div>
  );
}
