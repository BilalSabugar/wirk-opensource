import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import {
  BarChart2, TrendingUp, PieChart as PieIcon, Activity,
  Maximize2, Sparkles, CheckCircle2, ChevronRight, Layers
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const EXECUTIVE_PALETTE = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Rose
];

/* ─── Custom Frosted Glass Tooltip ────────────────────────────────────────── */
function CustomChartTooltip({ active, payload, label, isDark = true }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="p-3 rounded-2xl border shadow-2xl space-y-1.5 animate-scale-in"
      style={{
        background: isDark ? 'rgba(15, 15, 22, 0.94)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
      }}
    >
      {label && (
        <p className="font-bold text-xs pb-1.5 border-b tracking-tight"
           style={{ color: 'var(--text-hi)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shadow-xs shrink-0"
                style={{ background: entry.color || entry.fill || entry.stroke || '#10B981' }}
              />
              <span className="font-medium capitalize" style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            </div>
            <span className="font-bold font-mono" style={{ color: 'var(--text-hi)' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Flagship Interactive ARIA Chart Card ────────────────────────────────── */
export default function AriaChartCard({
  chart,
  onApprove,
  approved = false,
}) {
  const initialType = (chart.chartType || 'bar').toLowerCase();
  const [activeType, setActiveType] = useState(
    ['bar', 'area', 'line', 'pie', 'radar'].includes(initialType) ? initialType : 'bar'
  );

  const rawData = Array.isArray(chart.data) ? chart.data : [];
  const xAxisKey = chart.xAxisKey || 'name';

  // Normalize data keys and series
  const series = useMemo(() => {
    if (Array.isArray(chart.series) && chart.series.length > 0) {
      return chart.series.map((s, i) => ({
        dataKey: s.dataKey || s.key || `val${i}`,
        name: s.name || s.label || s.dataKey || `Metric ${i + 1}`,
        color: s.color || EXECUTIVE_PALETTE[i % EXECUTIVE_PALETTE.length],
      }));
    }

    // Auto-detect numeric keys if no series specified
    if (rawData.length > 0) {
      const firstItem = rawData[0];
      const numericKeys = Object.keys(firstItem).filter(
        k => k !== xAxisKey && typeof firstItem[k] === 'number'
      );
      if (numericKeys.length > 0) {
        return numericKeys.map((k, i) => ({
          dataKey: k,
          name: k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          color: EXECUTIVE_PALETTE[i % EXECUTIVE_PALETTE.length],
        }));
      }
    }

    return [{ dataKey: 'value', name: 'Value', color: '#10B981' }];
  }, [chart.series, rawData, xAxisKey]);

  // Total metric calculation
  const totalSummary = useMemo(() => {
    if (!rawData.length || !series.length) return null;
    let sum = 0;
    const primaryKey = series[0]?.dataKey;
    rawData.forEach(d => {
      const v = Number(d[primaryKey]) || 0;
      sum += v;
    });
    return { sum, label: series[0]?.name || 'Total' };
  }, [rawData, series]);

  // Pie chart formatted data
  const pieData = useMemo(() => {
    if (activeType !== 'pie') return [];
    const primaryKey = series[0]?.dataKey;
    return rawData.map((d, i) => ({
      name: d[xAxisKey] || `Item ${i + 1}`,
      value: Number(d[primaryKey]) || 0,
      color: EXECUTIVE_PALETTE[i % EXECUTIVE_PALETTE.length],
    })).filter(d => d.value > 0);
  }, [activeType, rawData, xAxisKey, series]);

  const primaryColor = series[0]?.color || '#10B981';

  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const axisLineStroke = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      className="my-3.5 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-2xl"
      style={{
        background: isDark ? 'rgba(18, 18, 24, 0.85)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: isDark ? '0 16px 40px -4px rgba(0, 0, 0, 0.5)' : '0 4px 24px -2px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md shrink-0"
            style={{
              background: `${primaryColor}22`,
              color: primaryColor,
              border: `1px solid ${primaryColor}40`,
            }}
          >
            {activeType === 'pie' ? <PieIcon size={14} /> :
             activeType === 'line' ? <TrendingUp size={14} /> :
             activeType === 'area' ? <Activity size={14} /> :
             <BarChart2 size={14} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight truncate text-zinc-900 dark:text-zinc-100">
                {chart.title || 'Workspace Visual Analytics'}
              </h4>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Data
              </span>
            </div>
            {chart.description && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {chart.description}
              </p>
            )}
          </div>
        </div>

        {/* Chart View Switcher Pills */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-black/10 dark:border-white/10 shrink-0">
          {[
            { id: 'bar', label: 'Bar', icon: BarChart2 },
            { id: 'area', label: 'Area', icon: Activity },
            { id: 'line', label: 'Line', icon: TrendingUp },
            { id: 'pie', label: 'Donut', icon: PieIcon },
          ].map(t => {
            const Icon = t.icon;
            const isSel = activeType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveType(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs border border-black/10 dark:border-white/20'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
                title={`Switch to ${t.label} visualization`}
              >
                <Icon size={11} />
                <span className="hidden xs:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-3 sm:p-5 pt-4">
        {rawData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
            <Activity size={20} className="opacity-40 animate-pulse" />
            <span>No data points available for this visualization.</span>
          </div>
        ) : (
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              {/* 1. Bar Chart */}
              {activeType === 'bar' && (
                <BarChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {series.map((s, i) => (
                      <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0.4} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey={xAxisKey}
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <Tooltip
                    content={<CustomChartTooltip isDark={isDark} />}
                    cursor={false}
                  />
                  {series.length > 1 && (
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: isDark ? '#9CA3AF' : '#6B7280' }}
                    />
                  )}
                  {series.map((s, i) => (
                    <Bar
                      key={s.dataKey}
                      dataKey={s.dataKey}
                      name={s.name}
                      fill={`url(#barGrad-${i})`}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  ))}
                </BarChart>
              )}

              {/* 2. Area Chart */}
              {activeType === 'area' && (
                <AreaChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {series.map((s, i) => (
                      <linearGradient key={i} id={`areaGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey={xAxisKey}
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <Tooltip
                    content={<CustomChartTooltip isDark={isDark} />}
                    cursor={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  {series.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: isDark ? '#9CA3AF' : '#6B7280' }} />
                  )}
                  {series.map((s, i) => (
                    <Area
                      key={s.dataKey}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2.5}
                      fill={`url(#areaGrad-${i})`}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  ))}
                </AreaChart>
              )}

              {/* 3. Line Chart */}
              {activeType === 'line' && (
                <LineChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey={xAxisKey}
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: axisLineStroke }}
                  />
                  <Tooltip
                    content={<CustomChartTooltip isDark={isDark} />}
                    cursor={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  {series.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: isDark ? '#9CA3AF' : '#6B7280' }} />
                  )}
                  {series.map(s => (
                    <Line
                      key={s.dataKey}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: s.color, stroke: isDark ? '#121218' : '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  ))}
                </LineChart>
              )}

              {/* 4. Donut / Pie Chart */}
              {activeType === 'pie' && (
                <PieChart>
                  <Tooltip content={<CustomChartTooltip isDark={isDark} />} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={isDark ? "rgba(18, 18, 24, 0.8)" : "#FFFFFF"}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                </PieChart>
              )}

              {/* 5. Radar Chart */}
              {activeType === 'radar' && (
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={rawData}>
                  <PolarGrid stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"} />
                  <PolarAngleAxis dataKey={xAxisKey} stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={10} />
                  <PolarRadiusAxis stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} fontSize={8} />
                  <Tooltip content={<CustomChartTooltip isDark={isDark} />} />
                  {series.map(s => (
                    <Radar
                      key={s.dataKey}
                      name={s.name}
                      dataKey={s.dataKey}
                      stroke={s.color}
                      fill={s.color}
                      fillOpacity={0.35}
                      isAnimationActive={true}
                      animationDuration={900}
                    />
                  ))}
                  {series.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: isDark ? '#9CA3AF' : '#6B7280' }} />
                  )}
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer Metrics & Highlights Strip */}
        <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {totalSummary && (
              <span>
                <strong className="font-mono font-bold" style={{ color: 'var(--text-hi)' }}>{totalSummary.sum}</strong> total {totalSummary.label.toLowerCase()}
              </span>
            )}
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">•</span>
            <span className="hidden sm:inline">
              {rawData.length} data segments evaluated
            </span>
          </div>

          {onApprove && (
            <div>
              {approved ? (
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Saved to Workspace</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onApprove}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>Pin Analytics</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
