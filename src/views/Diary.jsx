import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Wand2, Sparkles, Download,
  ChevronLeft, ChevronRight, Trash2, Save, Link,
  FileText, Calendar, BarChart2, X, Check, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import { getPriority, getTheme } from '../constants';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const todayKey  = () => new Date().toISOString().slice(0, 10);
const fmtDate   = (d) => {
  const [y,m,day] = d.split('-');
  return new Date(y, m-1, day).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
};
const fmtShort  = (d) => {
  const [y,m,day] = d.split('-');
  return new Date(y, m-1, day).toLocaleDateString('en-US', { month:'short', day:'numeric' });
};
const dayOfWeek = (d) => {
  const [y,m,day] = d.split('-');
  return new Date(y, m-1, day).toLocaleDateString('en-US', { weekday:'long' });
};
const wordCount    = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const readingTime  = (t) => Math.max(1, Math.round(wordCount(t) / 200));

const MOODS = [
  { emoji: '😄', label: 'Great',     color: '#22c55e' },
  { emoji: '🙂', label: 'Good',      color: '#86efac' },
  { emoji: '😐', label: 'Neutral',   color: '#94a3b8' },
  { emoji: '😔', label: 'Low',       color: '#f59e0b' },
  { emoji: '😢', label: 'Sad',       color: '#60a5fa' },
  { emoji: '😤', label: 'Frustrated',color: '#f87171' },
  { emoji: '😰', label: 'Anxious',   color: '#a78bfa' },
  { emoji: '🔥', label: 'Motivated', color: '#fb923c' },
];

/* ─── AI call helper ─────────────────────────────────────────────────────── */
async function callAI(action, text) {
  const t0 = performance.now();
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text }),
    });
    const duration = performance.now() - t0;
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      recordAiUsage({
        endpoint: 'ai',
        feature: 'QUICK_TOOLS',
        latencyMs: duration,
        success: false,
        statusText: `HTTP ${res.status}`,
        note: `Action: ${action}`
      });
      throw new Error(e.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    recordAiUsage({
      endpoint: 'ai',
      feature: 'QUICK_TOOLS',
      latencyMs: duration,
      usage: data.usageMetadata || null,
      success: true,
      statusText: '200 OK',
      note: `Action: ${action}`
    });
    return data.result;
  } catch (err) {
    if (!err.message.includes('Server error')) {
      recordAiUsage({
        endpoint: 'ai',
        feature: 'QUICK_TOOLS',
        latencyMs: performance.now() - t0,
        success: false,
        statusText: 'Network Err',
        note: err.message
      });
    }
    throw err;
  }
}

/* ─── Export helpers ─────────────────────────────────────────────────────── */
function buildMarkdown(entries) {
  return entries.map(e => {
    const lines = [
      `# ${fmtDate(e.date)}`,
      e.mood ? `**Mood:** ${e.mood}` : '',
      '',
      e.content || '_No content written._',
      '',
      e.linkedTasksText ? `---\n**Tasks completed this day:**\n${e.linkedTasksText}` : '',
      '\n---\n',
    ].filter(l => l !== undefined);
    return lines.join('\n');
  }).join('\n');
}

function downloadFile(content, filename, type = 'text/markdown') {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Entry History Sidebar ──────────────────────────────────────────────── */
function EntrySidebar({ diary, selectedDate, onSelect, onClose }) {
  const grouped = useMemo(() => {
    const g = {};
    diary.forEach(e => {
      const [y, m] = e.date.split('-');
      const key = `${y}-${m}`;
      if (!g[key]) g[key] = [];
      g[key].push(e);
    });
    return Object.entries(g).sort((a,b) => b[0].localeCompare(a[0]));
  }, [diary]);

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-72 sm:w-60 sm:static shrink-0 flex flex-col overflow-hidden shadow-2xl sm:shadow-none animate-slide-right sm:animate-none"
         style={{ borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="section-title">Entries</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{diary.length} total</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="sm:hidden btn-icon p-1" title="Close sidebar">
            <X size={15} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scroll">
        {diary.length === 0 && (
          <div className="p-4 text-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <p className="text-2xl mb-2">✦</p>
            <p>No entries yet.</p>
            <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-dim)' }}>Start writing today.</p>
          </div>
        )}
        {grouped.map(([monthKey, entries]) => {
          const [y, m] = monthKey.split('-');
          const monthLabel = new Date(y, m-1, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });
          return (
            <div key={monthKey}>
              <div className="px-4 py-2 sticky top-0"
                   style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  {monthLabel}
                </p>
              </div>
              {entries.map(e => {
                const isSelected = e.date === selectedDate;
                const wc = wordCount(e.content || '');
                return (
                  <button key={e.date} onClick={() => onSelect(e.date)}
                    className="w-full text-left px-4 py-3 transition-all"
                    style={{
                      background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                    onMouseEnter={e2 => { if (!isSelected) e2.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e2 => { if (!isSelected) e2.currentTarget.style.background = 'transparent'; }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {e.mood && <span style={{ fontSize: 14 }}>{e.mood}</span>}
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600,
                                      color: isSelected ? 'var(--accent)' : 'var(--text-hi)' }}>
                            {fmtShort(e.date)}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dayOfWeek(e.date)}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{wc}w</p>
                    </div>
                    {e.content && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
                                  overflow: 'hidden', display: '-webkit-box',
                                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {e.content.slice(0, 80)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Export Modal ───────────────────────────────────────────────────────── */
function ExportModal({ diary, onClose }) {
  const [mode,      setMode]      = useState('all');   // all | day | range
  const [day,       setDay]       = useState(todayKey());
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [format,    setFormat]    = useState('md');    // md | txt

  const doExport = () => {
    let entries = [...diary].sort((a,b) => a.date.localeCompare(b.date));
    let filename = `diary-all.${format}`;

    if (mode === 'day') {
      entries = entries.filter(e => e.date === day);
      filename = `diary-${day}.${format}`;
    } else if (mode === 'range' && from && to) {
      entries = entries.filter(e => e.date >= from && e.date <= to);
      filename = `diary-${from}-to-${to}.${format}`;
    }

    if (entries.length === 0) { alert('No entries found for the selected range.'); return; }

    const content = buildMarkdown(entries);
    downloadFile(content, filename, format === 'md' ? 'text/markdown' : 'text/plain');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm animate-scale-in"
           style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-mid)',
                    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
             style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Download size={16} style={{ color: 'var(--accent)' }}/>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-hi)' }}>Export Diary</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={14}/></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode */}
          <div className="space-y-2">
            <p className="label-xs">What to export</p>
            <div className="flex flex-col gap-1.5">
              {[
                ['all',   '📚 All entries'],
                ['day',   '📅 Specific day'],
                ['range', '📆 Date range'],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-3 p-3 cursor-pointer transition-all"
                       style={{
                         borderRadius: 'var(--radius-sm)',
                         border: `1px solid ${mode === val ? 'var(--border-mid)' : 'var(--border-subtle)'}`,
                         background: mode === val ? 'var(--accent-dim)' : 'transparent',
                       }}>
                  <input type="radio" name="mode" value={val} checked={mode===val}
                         onChange={() => setMode(val)} className="accent-indigo-500"/>
                  <span style={{ fontSize: 13, color: mode===val ? 'var(--text-hi)' : 'var(--text-base)' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {mode === 'day' && (
            <div className="space-y-1.5">
              <p className="label-xs">Date</p>
              <input type="date" value={day} onChange={e => setDay(e.target.value)}
                     className="input w-full"/>
            </div>
          )}

          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="label-xs">From</p>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-full"/>
              </div>
              <div className="space-y-1.5">
                <p className="label-xs">To</p>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input w-full"/>
              </div>
            </div>
          )}

          {/* Format */}
          <div className="space-y-2">
            <p className="label-xs">Format</p>
            <div className="flex gap-2">
              {[['md','Markdown (.md)'],['txt','Plain text (.txt)']].map(([val, label]) => (
                <button key={val} onClick={() => setFormat(val)}
                  className="flex-1 py-2 text-xs font-medium transition-all"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${format===val ? 'var(--border-mid)' : 'var(--border-subtle)'}`,
                    background: format===val ? 'var(--accent-dim)' : 'transparent',
                    color: format===val ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={doExport} className="btn-primary w-full ripple">
            <Download size={14}/> Download
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Panel ───────────────────────────────────────────────────────────── */
function AIPanel({ content, onApply, onClose }) {
  const [busy,   setBusy]   = useState(false);
  const [result, setResult] = useState('');
  const [action, setAction] = useState('');
  const [err,    setErr]    = useState('');
  const [diff,   setDiff]   = useState(false);

  const run = async (act) => {
    if (!content.trim()) { setErr('Write something in your diary first.'); return; }
    setBusy(true); setAction(act); setErr(''); setResult('');
    try {
      const r = await callAI(act, content);
      setResult(r);
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  const ACTIONS = [
    { id: 'fix_grammar',    icon: '✏️', label: 'Fix Grammar & Spelling', desc: 'Corrects errors while keeping your voice' },
    { id: 'improve_clarity',icon: '✨', label: 'Improve Clarity',        desc: 'Smooths flow without changing meaning' },
    { id: 'diary_summary',  icon: '🔍', label: 'Insights & Reflection',  desc: 'Emotional analysis and gentle insights' },
  ];

  return (
    <div className="animate-slide-left fixed inset-y-0 right-0 z-40 w-full sm:w-80 sm:static shrink-0 flex flex-col shadow-2xl sm:shadow-none border-l"
         style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b"
           style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'var(--accent)' }}/>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)' }}>AI Assistant</p>
        </div>
        <button onClick={onClose} className="btn-icon"><X size={13}/></button>
      </div>

      <div className="p-4 space-y-2">
        {ACTIONS.map(a => (
          <button key={a.id} onClick={() => run(a.id)} disabled={busy}
            className="w-full text-left p-3 transition-all ripple"
            style={{
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${action===a.id && result ? 'var(--border-mid)' : 'var(--border-subtle)'}`,
              background: action===a.id && result ? 'var(--accent-dim)' : 'var(--bg-surface)',
              opacity: busy && action !== a.id ? 0.5 : 1,
            }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{a.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{a.desc}</p>
              </div>
              {busy && action === a.id && (
                <div className="ml-auto w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin-slow"/>
              )}
            </div>
          </button>
        ))}
      </div>

      {err && (
        <div className="mx-4 p-3 text-xs" style={{ background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)',
             border: '1px solid rgba(244,63,94,0.25)', color: 'var(--danger)' }}>
          {err}
        </div>
      )}

      {result && (
        <div className="flex-1 flex flex-col overflow-hidden mx-4 mb-4">
          <div className="flex items-center justify-between py-2">
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Result
            </p>
            {action !== 'diary_summary' && (
              <button onClick={() => setDiff(d => !d)} className="btn-ghost"
                      style={{ fontSize: 11, padding: '2px 8px' }}>
                {diff ? <><EyeOff size={11}/> Hide diff</> : <><Eye size={11}/> Compare</>}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto scroll p-3"
               style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)', fontSize: 13,
                        color: 'var(--text-base)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
          {action !== 'diary_summary' && (
            <button onClick={() => { onApply(result); onClose(); }} className="btn-primary w-full mt-2 ripple">
              <Check size={13}/> Apply to diary
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Diary View ────────────────────────────────────────────────────── */
export default function DiaryView({
  diary, tasks, projects, user,
  onSave, onDelete,
  diaryLinkTasks, // boolean from user settings
}) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [content,      setContent]      = useState('');
  const [mood,         setMood]         = useState('');
  const [saveState,    setSaveState]    = useState('idle'); // idle|saving|saved
  const [listening,    setListening]    = useState(false);
  const [speaking,     setSpeaking]     = useState(false);
  const [showAI,       setShowAI]       = useState(false);
  const [showExport,   setShowExport]   = useState(false);
  const [showMood,     setShowMood]     = useState(false);
  const [showSidebar,  setShowSidebar]  = useState(true);
  const [interimText,  setInterimText]  = useState('');

  const saveTimer  = useRef(null);
  const recogRef   = useRef(null);
  const finalRef   = useRef('');
  const initialLoad = useRef(true);

  /* ── Load entry when date changes ── */
  useEffect(() => {
    const entry = diary.find(e => e.date === selectedDate);
    const text  = entry?.content ?? '';
    const m     = entry?.mood    ?? '';
    setContent(text);
    setMood(m);
    finalRef.current = text;
    setSaveState('idle');
    initialLoad.current = true;
  }, [selectedDate, diary]);

  /* ── Auto-append completed tasks (if enabled) ── */
  useEffect(() => {
    if (!diaryLinkTasks || selectedDate !== todayKey()) return;
    const entry = diary.find(e => e.date === selectedDate);
    const existingLinked = entry?.linkedTaskIds ?? [];

    const completedToday = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const day = new Date(t.completedAt).toISOString().slice(0,10);
      return day === selectedDate;
    });

    const newOnes = completedToday.filter(t => !existingLinked.includes(t.id));
    if (newOnes.length === 0) return;

    // Save linked task info to entry
    const allLinked = [...existingLinked, ...newOnes.map(t => t.id)];
    const linkedTasksText = completedToday
      .map(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return `- [x] ${t.text}${proj ? ` (${proj.title})` : ''}`;
      }).join('\n');

    onSave(selectedDate, { linkedTaskIds: allLinked, linkedTasksText });
  }, [diaryLinkTasks, selectedDate, tasks, projects, diary]);

  /* ── Auto-save ── */
  const triggerSave = useCallback((text, moodVal) => {
    if (initialLoad.current) { initialLoad.current = false; return; }
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await onSave(selectedDate, { content: text, mood: moodVal, wordCount: wordCount(text) });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 1500);
  }, [selectedDate, onSave]);

  const handleContentChange = (val) => {
    setContent(val);
    finalRef.current = val;
    triggerSave(val, mood);
  };

  const handleMoodSelect = (emoji) => {
    setMood(emoji);
    setShowMood(false);
    triggerSave(content, emoji);
  };

  /* ── Voice input ── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      let final = finalRef.current;
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { final += (final.endsWith(' ') || !final ? '' : ' ') + t; }
        else interim = t;
      }
      finalRef.current = final;
      setContent(final);
      setInterimText(interim);
      triggerSave(final, mood);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => { setListening(false); setInterimText(''); };
    rec.start();
    recogRef.current = rec;
    setListening(true);
  };

  const stopListening = () => { recogRef.current?.stop(); setListening(false); setInterimText(''); };
  useEffect(() => () => recogRef.current?.stop(), []);

  /* ── Text-to-speech ── */
  const startSpeaking = () => {
    if (!content.trim()) return;
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(content);
    utt.rate = 0.92; utt.pitch = 1.0;
    // Prefer a natural voice
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US');
    if (preferred) utt.voice = preferred;
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    synth.speak(utt);
    setSpeaking(true);
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  /* ── Delete entry ── */
  const handleDelete = async () => {
    if (!window.confirm('Delete this diary entry? This cannot be undone.')) return;
    await onDelete(selectedDate);
    setContent(''); setMood('');
  };

  /* ── Navigate days ── */
  const goDay = (delta) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m-1, d + delta);
    setSelectedDate(date.toISOString().slice(0,10));
  };

  const currentEntry = diary.find(e => e.date === selectedDate);
  const isToday      = selectedDate === todayKey();
  const wc           = wordCount(content);
  const rt           = readingTime(content);
  const moodObj      = MOODS.find(m => m.emoji === mood) || null;
  const linkedTasks  = useMemo(() => {
    if (currentEntry?.linkedTaskIds?.length > 0) {
      return tasks.filter(t => currentEntry.linkedTaskIds.includes(t.id));
    }
    return tasks.filter(t => {
      if (t.status !== 'DONE' || !t.completedAt) return false;
      const compDate = new Date(t.completedAt).toISOString().slice(0, 10);
      return compDate === selectedDate;
    });
  }, [currentEntry, tasks, selectedDate]);

  return (
    <div className="absolute inset-0 flex overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Entry list sidebar ── */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden animate-fade-in" onClick={() => setShowSidebar(false)} />
          <EntrySidebar
            diary={diary}
            selectedDate={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setShowSidebar(false); }}
            onClose={() => setShowSidebar(false)}
          />
        </>
      )}

      {/* ── Main editor area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top toolbar ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b shrink-0 overflow-x-auto no-scrollbar"
             style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>

          {/* Sidebar toggle */}
          <button onClick={() => setShowSidebar(s => !s)} className="btn-icon" title="Toggle entry list">
            <FileText size={15}/>
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }}/>

          {/* Date navigation */}
          <button onClick={() => goDay(-1)} className="btn-icon" title="Previous day">
            <ChevronLeft size={15}/>
          </button>

          <div className="text-center px-2">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
              {isToday ? '✦ Today' : fmtShort(selectedDate)}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dayOfWeek(selectedDate)}</p>
          </div>

          <button onClick={() => goDay(1)} className="btn-icon" title="Next day"
                  disabled={selectedDate >= todayKey()}>
            <ChevronRight size={15}/>
          </button>

          <input type="date" value={selectedDate} max={todayKey()}
                 onChange={e => setSelectedDate(e.target.value)}
                 className="text-xs py-1.5 px-2 ml-1"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'inherit' }}/>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }}/>

          {/* Mood picker */}
          <div className="relative">
            <button onClick={() => setShowMood(m => !m)} className="btn-ghost" style={{ gap: 4 }}
                    title="Set your mood">
              <span style={{ fontSize: 18 }}>{mood || '😶'}</span>
              <span style={{ fontSize: 11 }}>{moodObj?.label ?? 'Mood'}</span>
            </button>
            {showMood && (
              <div className="absolute top-full left-0 mt-1 z-40 p-2 grid grid-cols-4 gap-1 animate-scale-in"
                   style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-mid)',
                            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', width: 200 }}>
                {MOODS.map(m => (
                  <button key={m.emoji} onClick={() => handleMoodSelect(m.emoji)}
                    className="flex flex-col items-center gap-0.5 p-2 transition-all"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    title={m.label}>
                    <span style={{ fontSize: 22 }}>{m.emoji}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1"/>

          {/* Right toolbar actions */}
          <div className="flex items-center gap-1">
            {/* Voice input */}
            <button onClick={listening ? stopListening : startListening}
              className="btn-ghost ripple"
              style={{ color: listening ? 'var(--danger)' : 'var(--text-muted)', gap: 4 }}
              title={listening ? 'Stop recording' : 'Voice input'}>
              {listening ? <><MicOff size={14}/> <span style={{fontSize:11}}>Stop</span></> : <><Mic size={14}/> <span style={{fontSize:11}}>Voice</span></>}
              {listening && <span className="w-2 h-2 rounded-full animate-pulse" style={{background:'var(--danger)'}}/>}
            </button>

            {/* Text to speech */}
            <button onClick={startSpeaking}
              className="btn-ghost ripple"
              style={{ color: speaking ? 'var(--accent)' : 'var(--text-muted)', gap: 4 }}
              title={speaking ? 'Stop reading' : 'Read aloud'}>
              {speaking ? <><VolumeX size={14}/> <span style={{fontSize:11}}>Stop</span></> : <><Volume2 size={14}/> <span style={{fontSize:11}}>Listen</span></>}
            </button>

            {/* AI assistant */}
            <button onClick={() => setShowAI(a => !a)}
              className="btn-ghost ripple"
              style={{ color: showAI ? 'var(--accent)' : 'var(--text-muted)', gap: 4,
                       background: showAI ? 'var(--accent-dim)' : 'transparent' }}
              title="AI assistant">
              <Sparkles size={14}/> <span style={{fontSize:11}}>AI</span>
            </button>

            {/* Export */}
            <button onClick={() => setShowExport(true)} className="btn-ghost ripple"
                    style={{ gap: 4, color: 'var(--text-muted)' }} title="Export diary">
              <Download size={14}/> <span style={{fontSize:11, display:'none'}}>Export</span>
            </button>

            {/* Delete */}
            {currentEntry && (
              <button onClick={handleDelete} className="btn-icon danger" title="Delete this entry">
                <Trash2 size={14}/>
              </button>
            )}

            <InfoTooltip title="Diary" text="Your private emotional journal. Each day has its own entry. Entries auto-save as you type. Use Voice to speak your thoughts, Listen to hear them read back, and AI to fix grammar or get emotional insights." />
          </div>
        </div>

        {/* ── Editor + AI panel ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-y-auto scroll min-w-0 pb-28 sm:pb-8">

            {/* Date banner */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em' }}>
                    {isToday ? "Today's Entry" : fmtDate(selectedDate)}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {mood && (
                      <span style={{ fontSize: 18 }} title={moodObj?.label}>{mood}</span>
                    )}
                    {wc > 0 && (
                      <>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wc} words</span>
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rt} min read</span>
                      </>
                    )}
                    {saveState === 'saving' && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Saving…</span>
                    )}
                    {saveState === 'saved' && (
                      <span style={{ fontSize: 11, color: 'var(--success)', display:'flex', alignItems:'center', gap:3 }}>
                        <Check size={11}/> Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 min-h-[300px] px-4 sm:px-6 pb-4">
              <textarea
                className="w-full h-full resize-none outline-none"
                placeholder={isToday
                  ? `What's on your mind today, ${user?.displayName?.split(' ')[0] ?? 'you'}?\n\nThis is your safe space. Write freely — no judgment, no limits. Dump your thoughts, feelings, wins, frustrations, dreams.\n\nPress the 🎤 mic button to speak instead of type.`
                  : `No entry for ${fmtDate(selectedDate)}. You can write one now.`
                }
                value={content + (interimText ? (content ? ' ' : '') + interimText : '')}
                onChange={e => !listening && handleContentChange(e.target.value)}
                readOnly={listening}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-hi)',
                  fontSize: 15,
                  lineHeight: 1.85,
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  resize: 'none',
                }}
              />
            </div>

            {/* Linked tasks (if any) */}
            {linkedTasks.length > 0 && (
              <div className="mx-4 sm:mx-6 mb-4 p-4 shrink-0"
                   style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Link size={13} style={{ color: 'var(--success)' }}/>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>
                    Tasks completed this day
                  </p>
                  <InfoTooltip title="Linked Tasks"
                    text="Tasks you completed on this day are automatically recorded here when 'Link tasks to diary' is enabled in your profile settings." />
                </div>
                <div className="space-y-1.5">
                  {linkedTasks.map(t => {
                    const proj  = projects.find(p => p.id === t.projectId);
                    const theme = getTheme(proj?.color);
                    return (
                      <div key={t.id} className="flex items-start gap-2">
                        <Check size={12} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}/>
                        <div>
                          <span style={{ fontSize: 13, color: 'var(--text-base)', textDecoration: 'line-through' }}>
                            {t.text}
                          </span>
                          {proj && <span className={`ml-2 text-xs ${theme.text}`}>{proj.title}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI side panel */}
          {showAI && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden animate-fade-in" onClick={() => setShowAI(false)} />
              <AIPanel
                content={content}
                onApply={handleContentChange}
                onClose={() => setShowAI(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* Export modal */}
      {showExport && <ExportModal diary={diary} onClose={() => setShowExport(false)}/>}
    </div>
  );
}
