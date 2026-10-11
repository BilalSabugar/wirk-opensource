import React, { useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, BarChart2, Layers, Download, 
  Clock, AlertOctagon, CheckCircle2, Zap, ArrowRight, 
  RotateCcw, Activity, ShieldAlert, Sparkles, CheckSquare,
  Check, ListChecks, Target, FolderKanban, GitFork, ArrowUpRight
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import { PRIORITIES, TASK_STATUSES, getTheme, getPriority, getStatus, formatDue, dueCls, fmtMs } from '../constants';
import { PriorityBadge, DueBadge, StatusBadge } from '../components/shared';

/* ── CSV Exporter v2.1 ────────────────────────────────────────────────────── */
function exportTasksCSV(tasks, projects) {
  const headers = [
    'ID', 'Title', 'Description', 'Module', 'Status', 'Priority', 
    'Due Date', 'Planned Date', 'Is Blocked', 'Blocker Reason', 
    'Is Subtask', 'Parent Task ID',
    'Checklists Total', 'Checklists Completed', 'Focus Time (Minutes)', 
    'Created At', 'Completed At'
  ];

  const rows = tasks.map(t => {
    const proj = projects.find(p => p.id === t.projectId);
    const chkDone = (t.checklists || []).filter(c => c.completed).length;
    const chkTotal = (t.checklists || []).length;
    return [
      t.id,
      `"${(t.text || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(proj?.title || 'Unknown').replace(/"/g, '""')}"`,
      t.status || 'TODO',
      t.priority || 'MED',
      t.dueDate || '',
      t.plannedDate || '',
      t.blocker?.isBlocked ? 'YES' : 'NO',
      `"${(t.blocker?.reason || '').replace(/"/g, '""')}"`,
      t.parentTaskId ? 'YES' : 'NO',
      t.parentTaskId || '',
      chkTotal,
      chkDone,
      Math.round((t.totalFocusMs || 0) / 60000),
      t.createdAt ? new Date(t.createdAt).toISOString() : '',
      t.completedAt ? new Date(t.completedAt).toISOString() : ''
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `forge-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ── Executive Resolution Overview Card ──────────────────────────────────── */
function ExecutiveResolutionHeader({ stats = {} }) {
  const total = stats.total || 0;
  const done = stats.done || 0;
  const pending = stats.pending || 0;
  const backlog = stats.backlog || 0;
  const active = stats.active || 0;
  const inReview = stats.inReview || 0;
  const pct = stats.pct || 0;
  const actionablePct = stats.actionablePct || 0;
  const chkDone = stats.checklistsDone || 0;
  const chkTotal = stats.checklistsTotal || 0;
  const subDone = stats.subtasksDone || 0;
  const subTotal = stats.subtasks || 0;

  return (
    <div className="p-6 rounded-3xl border shadow-sm space-y-5"
         style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
              Total Workspace Resolution
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {pct}% Resolved
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Comprehensive breakdown of top-level tasks, subtasks, and checklist micro-steps
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-hi)' }}>
              {done} <span className="text-xs font-normal text-[var(--text-muted)]">/ {total}</span>
            </span>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Tasks Resolved</p>
          </div>
        </div>
      </div>

      {/* Global Resolution Track */}
      <div className="space-y-1.5">
        <div className="h-3.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5 p-0.5 flex gap-1">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700 shadow-xs"
            style={{ width: `${pct}%` }}
            title={`Completed: ${done} (${pct}%)`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
          <span>0%</span>
          <span>{pending} in active pipeline ({active} in progress, {inReview} in review)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Secondary Aggregation Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-2xl border flex flex-col justify-between"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Target size={12} className="text-blue-500" />
            <span>Active Pipeline</span>
          </span>
          <div className="mt-2">
            <p className="text-lg font-extrabold" style={{ color: 'var(--text-hi)' }}>{pending}</p>
            <p className="text-[10px] text-[var(--text-muted)]">TODO + Active + Review</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl border flex flex-col justify-between"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <ListChecks size={12} className="text-emerald-500" />
            <span>Checklists</span>
          </span>
          <div className="mt-2">
            <p className="text-lg font-extrabold" style={{ color: 'var(--text-hi)' }}>
              {chkDone} <span className="text-xs font-normal text-[var(--text-muted)]">/ {chkTotal}</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{stats.checklistsPct || 0}% micro-steps done</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl border flex flex-col justify-between"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <GitFork size={12} className="text-purple-500" />
            <span>Subtasks</span>
          </span>
          <div className="mt-2">
            <p className="text-lg font-extrabold" style={{ color: 'var(--text-hi)' }}>
              {subDone} <span className="text-xs font-normal text-[var(--text-muted)]">/ {subTotal}</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">1-Level Hierarchy</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl border flex flex-col justify-between"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>Today's Execution</span>
          </span>
          <div className="mt-2">
            <p className="text-lg font-extrabold text-amber-500">
              {stats.plannedTodayDone || 0} <span className="text-xs font-normal text-[var(--text-muted)]">/ {stats.plannedToday || 0}</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{stats.plannedTodayPct || 0}% daily goal rate</p>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Status Flow Distribution Bar ────────────────────────────────────────── */
function StatusDistributionBar({ tasks = [] }) {
  const total = tasks.length || 1;
  const counts = {
    BACKLOG: tasks.filter(t => t.status === 'BACKLOG').length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  return (
    <div className="p-5 rounded-3xl border space-y-4 shadow-sm"
         style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
            Workflow Stage Allocation
          </h3>
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} total tasks
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/5 p-0.5 gap-0.5">
        {Object.entries(TASK_STATUSES).map(([key, item]) => {
          const count = counts[key] || 0;
          const pct = Math.round((count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`h-full rounded-full transition-all duration-500`}
              style={{ width: `${pct}%`, background: item.color }}
              title={`${item.label}: ${count} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* Grid Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {Object.entries(TASK_STATUSES).map(([key, item]) => {
          const count = counts[key] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="p-2.5 rounded-2xl border flex flex-col gap-1"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-extrabold" style={{ color: 'var(--text-hi)' }}>{count}</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 14-Day Completion Trend Chart ────────────────────────────────────────── */
function WeeklyTrendChart({ weeklyTrend = [] }) {
  const maxCount = Math.max(...weeklyTrend.map(d => d.count), 1);
  const W = 560, H = 130, padL = 28, padB = 28, padT = 12, padR = 8;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const barW = Math.max(8, Math.floor(chartW / (weeklyTrend.length || 1)) - 4);
  const totalDone = weeklyTrend.reduce((a, d) => a + d.count, 0);

  const gridLines = [0, 0.5, 1].map(f => Math.round(f * maxCount));

  return (
    <div className="p-5 rounded-3xl border space-y-3 shadow-sm"
         style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
            14-Day Execution Velocity
          </h3>
        </div>
        <span className="text-xs font-semibold text-emerald-500">
          {totalDone} resolved in 14d
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 140 }}>
        {gridLines.map(v => {
          const y = padT + chartH - (v / maxCount) * chartH;
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padL - 6} y={y + 3} textAnchor="end"
                fill="var(--text-muted)" fontSize="8" fontFamily="Inter, sans-serif">{v}</text>
            </g>
          );
        })}

        {weeklyTrend.map((d, i) => {
          const barH = d.count ? Math.max(6, (d.count / maxCount) * chartH) : 0;
          const x = padL + i * (chartW / weeklyTrend.length) + 2;
          const y = padT + chartH - barH;
          const isToday = Boolean(d.isToday);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={isToday ? '#30D158' : d.count > 0 ? '#0A84FF' : 'rgba(150,150,150,0.1)'}
                rx="3"
              />
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                  fill="var(--text-hi)" fontSize="8" fontWeight="bold">
                  {d.count}
                </text>
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle"
                fill={isToday ? '#30D158' : 'var(--text-muted)'}
                fontSize="8" fontWeight={isToday ? 'bold' : 'normal'}>
                {d.short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsView({ tasks = [], projects = [], stats = {} }) {
  // Telemetry Calculations
  const telemetry = useMemo(() => {
    let totalCycleTimeMs = 0;
    let cycleCount = 0;
    let totalLeadTimeMs = 0;
    let leadCount = 0;
    let reworkEvents = 0;

    const completedTasks = tasks.filter(t => t.status === 'DONE');

    completedTasks.forEach(t => {
      // Lead Time: createdAt -> completedAt
      if (t.completedAt && t.createdAt) {
        totalLeadTimeMs += (t.completedAt - t.createdAt);
        leadCount++;
      }

      // Cycle Time: First IN_PROGRESS -> completedAt
      if (t.statusHistory && t.completedAt) {
        const inProgressEvt = t.statusHistory.find(e => e.toStatus === 'IN_PROGRESS');
        if (inProgressEvt) {
          totalCycleTimeMs += (t.completedAt - inProgressEvt.timestamp);
          cycleCount++;
        }
      }
    });

    // Rework Events: status moving backward (e.g. IN_REVIEW -> IN_PROGRESS or DONE -> TODO)
    tasks.forEach(t => {
      if (t.statusHistory) {
        const history = t.statusHistory;
        for (let i = 1; i < history.length; i++) {
          const prev = history[i - 1].toStatus;
          const curr = history[i].toStatus;
          if (
            (prev === 'IN_REVIEW' && curr === 'IN_PROGRESS') ||
            (prev === 'DONE' && curr !== 'DONE')
          ) {
            reworkEvents++;
          }
        }
      }
    });

    const avgCycleHours = cycleCount ? Math.round((totalCycleTimeMs / cycleCount) / 3600000) : 0;
    const avgLeadHours = leadCount ? Math.round((totalLeadTimeMs / leadCount) / 3600000) : 0;
    const totalFocusHours = Math.round((tasks.reduce((s, t) => s + (t.totalFocusMs || 0), 0)) / 3600000 * 10) / 10;
    const totalSessions = tasks.reduce((s, t) => s + (t.totalSessions || 0), 0);

    return {
      avgCycleHours,
      avgLeadHours,
      reworkEvents,
      totalFocusHours,
      totalSessions,
      completedCount: completedTasks.length,
    };
  }, [tasks]);

  // Blocked Tasks
  const blockedTasks = useMemo(() => {
    return tasks.filter(t => t.blocker?.isBlocked);
  }, [tasks]);

  // Overdue Tasks
  const overdueTasks = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate + 'T00:00:00') < today);
  }, [tasks]);

  // 14-Day Velocity Trend Data
  const weeklyTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;

      const count = tasks.filter(t => {
        if (t.status !== 'DONE' || !t.completedAt) return false;
        const compDate = new Date(t.completedAt);
        const compKey = `${compDate.getFullYear()}-${String(compDate.getMonth() + 1).padStart(2, '0')}-${String(compDate.getDate()).padStart(2, '0')}`;
        return compKey === key;
      }).length;

      days.push({
        key,
        short: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        count,
        isToday: i === 0,
      });
    }
    return days;
  }, [tasks]);

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
              Execution & Flow Analytics
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              v2.1 Telemetry
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Resolution rates, cycle time, active bottlenecks, and project performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportTasksCSV(tasks, projects)}
          className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* ── Main Analytics Body ── */}
      <div className="flex-1 overflow-y-auto scroll p-6 space-y-6 max-w-6xl w-full mx-auto">
        
        {/* Executive Resolution Overview Banner */}
        <ExecutiveResolutionHeader stats={stats} />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border shadow-sm space-y-1"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Clock size={11} />
              <span>Avg Cycle Time</span>
            </span>
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
              {telemetry.avgCycleHours}<span className="text-xs font-semibold ml-1 text-[var(--text-muted)]">hrs</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">In-Progress → Done</p>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm space-y-1"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Zap size={11} />
              <span>Avg Lead Time</span>
            </span>
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-hi)' }}>
              {telemetry.avgLeadHours}<span className="text-xs font-semibold ml-1 text-[var(--text-muted)]">hrs</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Creation → Completion</p>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm space-y-1"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={11} />
              <span>Deep Focus</span>
            </span>
            <p className="text-2xl font-extrabold tracking-tight text-blue-500">
              {telemetry.totalFocusHours}<span className="text-xs font-semibold ml-1 text-[var(--text-muted)]">hrs</span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{telemetry.totalSessions} Pomodoro sessions</p>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm space-y-1"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <RotateCcw size={11} />
              <span>Rework Events</span>
            </span>
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: telemetry.reworkEvents > 0 ? '#FF9F0A' : 'var(--text-hi)' }}>
              {telemetry.reworkEvents}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Status reversals</p>
          </div>
        </div>

        {/* Workflow Stage Distribution */}
        <StatusDistributionBar tasks={tasks} />

        {/* 14-Day Execution Velocity Chart */}
        <WeeklyTrendChart weeklyTrend={weeklyTrend} />

        {/* Active Blockers & Bottlenecks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Active Blocked Tasks */}
          <div className="p-5 rounded-3xl border shadow-sm space-y-3 flex flex-col"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon size={15} className="text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
                  Active Blockers ({blockedTasks.length})
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-56 space-y-2">
              {blockedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <CheckCircle2 size={20} className="text-emerald-500 mb-1" />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Zero Flow Blockers</p>
                  <p className="text-[11px] text-[var(--text-muted)]">All tasks are unblocked and ready for execution.</p>
                </div>
              ) : (
                blockedTasks.map(t => {
                  const proj = projects.find(p => p.id === t.projectId);
                  return (
                    <div key={t.id} className="p-3 rounded-2xl border bg-rose-500/5 border-rose-500/20 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{t.text}</p>
                        <StatusBadge status={t.status} />
                      </div>
                      {t.blocker?.reason && (
                        <p className="text-[11px] text-rose-400 font-medium">
                          Reason: {t.blocker.reason}
                        </p>
                      )}
                      {proj && <span className="text-[9px] text-[var(--text-muted)] font-semibold">{proj.title}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overdue Deadlines */}
          <div className="p-5 rounded-3xl border shadow-sm space-y-3 flex flex-col"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
                  Overdue Items ({overdueTasks.length})
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-56 space-y-2">
              {overdueTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <CheckCircle2 size={20} className="text-emerald-500 mb-1" />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>No Overdue Deadlines</p>
                  <p className="text-[11px] text-[var(--text-muted)]">All commitments are on schedule.</p>
                </div>
              ) : (
                overdueTasks.map(t => {
                  const proj = projects.find(p => p.id === t.projectId);
                  return (
                    <div key={t.id} className="p-3 rounded-2xl border flex items-center justify-between gap-3"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{t.text}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{proj?.title}</p>
                      </div>
                      <DueBadge dateStr={t.dueDate} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Module Performance Table */}
        <div className="p-6 rounded-3xl border shadow-sm space-y-4"
             style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-hi)' }}>
                Project Execution & Focus Matrix
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">Detailed resolution rates, active work, and checklist completion by project</p>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {projects.map(proj => {
              const theme = getTheme(proj.color);
              const pStats = stats.byProject[proj.id] || { total: 0, done: 0, pct: 0, active: 0, focusMs: 0, checklistsDone: 0, checklistsTotal: 0 };
              const pTotal = pStats.total || 0;
              const pDone = pStats.done || 0;
              const pPct = pStats.pct || 0;
              const pFocusM = Math.round((pStats.focusMs || 0) / 60000);

              return (
                <div key={proj.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: theme.hex || 'var(--accent)' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-hi)' }}>{proj.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{proj.sub || `${pTotal} total tasks`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                    {/* Checklists mini badge */}
                    {pStats.checklistsTotal > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg border text-[var(--text-muted)]"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                        ☑ {pStats.checklistsDone}/{pStats.checklistsTotal}
                      </span>
                    )}

                    {/* Progress Bar */}
                    <div className="w-28 hidden sm:block">
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                        <span>{pDone}/{pTotal} done</span>
                        <span>{pPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pPct}%` }} />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>{pFocusM}m</span>
                      <p className="text-[9px] text-[var(--text-muted)]">focus logged</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
