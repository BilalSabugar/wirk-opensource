import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Wand2, Plus, Trash2, RotateCcw, Check, AlertTriangle, ChevronUp, ChevronDown, FolderPlus, Sparkles, Calendar } from 'lucide-react';
import { THEME_COLORS, PRIORITIES, getPriority, getTheme } from '../constants';
import { recordAiUsage } from '../utils/aiCreditsTracker';

/* ─── Secure API call — proxied through Vercel serverless function ───────── */
async function callAI(transcript, existingProjects = [], targetProject = null) {
  let promptText = transcript;
  if (targetProject) {
    promptText = `[Target Project: "${targetProject.title}" (ID: ${targetProject.id}) - ${targetProject.sub || 'Main workspace project'}]:\n${transcript}`;
  }

  const projectList = targetProject
    ? [{ id: targetProject.id, title: targetProject.title, sub: targetProject.sub, color: targetProject.color }, ...existingProjects.filter(p => p.id !== targetProject.id)]
    : existingProjects;

  const t0 = performance.now();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: promptText, existingProjects: projectList }),
    });
    
    const duration = performance.now() - t0;
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      recordAiUsage({
        endpoint: 'generate',
        feature: 'TASK_CREATOR',
        latencyMs: duration,
        success: false,
        statusText: `HTTP ${res.status}`,
        note: 'Invalid JSON response'
      });
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 100)}`);
    }

    if (!res.ok) {
      recordAiUsage({
        endpoint: 'generate',
        feature: 'TASK_CREATOR',
        latencyMs: duration,
        success: false,
        statusText: `HTTP ${res.status}`,
        note: json.error || 'Generation failed'
      });
      throw new Error(json.error || `Server error ${res.status}`);
    }

    recordAiUsage({
      endpoint: 'generate',
      feature: 'TASK_CREATOR',
      latencyMs: duration,
      usage: json._usageMetadata || null,
      success: true,
      statusText: '200 OK',
      note: `Parsed ${json.projects?.length || 0} projects, ${json.tasks?.length || 0} tasks`
    });

    return json;
  } catch (err) {
    if (!err.message.includes('Server error') && !err.message.includes('non-JSON')) {
      recordAiUsage({
        endpoint: 'generate',
        feature: 'TASK_CREATOR',
        latencyMs: performance.now() - t0,
        success: false,
        statusText: 'Network Err',
        note: err.message
      });
    }
    throw err;
  }
}

/* ─── Animated voice input waveform ───────────────────────────────────────── */
function Waveform({ active }) {
  const bars = 20;
  return (
    <div className="flex items-center justify-center gap-[3px] h-10 px-4 py-1 rounded-full bg-white/[0.04] border border-white/5">
      {Array.from({ length: bars }, (_, i) => (
        <div key={i}
          className="w-[3px] rounded-full transition-all duration-150"
          style={{
            background: active ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
            height: '22%',
            animation: active ? `soundWave ${0.35 + (i % 5) * 0.08}s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate` : 'none',
            animationDelay: `${i * 0.03}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes soundWave { from { height: 18%; opacity: 0.5; } to { height: 95%; opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ─── Task row in preview ────────────────────────────────────────────────── */
function TaskRow({ task, globalIndex, projTasks, projIndex, projects, onDelete, onEdit, onMove, onPriorityChange, onDueDateChange, onProjectChange }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(task.text);
  const p    = getPriority(task.priority);
  const Icon = p.Icon;

  const commit = () => { onEdit(globalIndex, val.trim() || task.text); setEditing(false); };

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 border-b group/row transition-colors hover:bg-white/[0.03]"
         style={{ borderColor: 'var(--border-subtle)' }}>

      {/* Up / Down arrows within project */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <button onClick={() => onMove(globalIndex, -1)} disabled={projIndex === 0}
          className="opacity-0 group-hover/row:opacity-100 transition-opacity disabled:opacity-0 p-0.5 hover:text-white"
          style={{ color: 'var(--text-muted)' }}>
          <ChevronUp size={11}/>
        </button>
        <span className="text-[9px] font-mono font-semibold w-4 text-center" style={{ color: 'var(--text-dim)' }}>
          {projIndex + 1}
        </span>
        <button onClick={() => onMove(globalIndex, 1)} disabled={projIndex === projTasks.length - 1}
          className="opacity-0 group-hover/row:opacity-100 transition-opacity disabled:opacity-0 p-0.5 hover:text-white"
          style={{ color: 'var(--text-muted)' }}>
          <ChevronDown size={11}/>
        </button>
      </div>

      {/* Priority badge — click to cycle */}
      <button
        onClick={() => {
          const keys = Object.keys(PRIORITIES);
          onPriorityChange(globalIndex, keys[(keys.indexOf(task.priority) + 1) % keys.length]);
        }}
        className="shrink-0 transition-transform active:scale-95 hover:opacity-80"
        title="Click to cycle priority">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold
                          uppercase tracking-wider rounded-md border ${p.color} ${p.bg} ${p.border}`}>
          <Icon size={8}/>{p.short}
        </span>
      </button>

      {/* Task text — click to edit inline */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input autoFocus className="input-terminal w-full px-2.5 py-1 text-xs"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          />
        ) : (
          <p className="text-xs cursor-text leading-relaxed hover:text-white transition-colors"
             style={{ color: 'var(--text-hi)' }}
             onClick={() => setEditing(true)}>
            {task.text}
          </p>
        )}
      </div>

      {/* Due date picker */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="date"
          value={task.dueDate || ''}
          onChange={e => onDueDateChange(globalIndex, e.target.value || null)}
          className="text-[10px] px-2 py-1 rounded-lg border bg-black/50 text-gray-300 border-white/10 hover:border-white/20 outline-none cursor-pointer"
          title="Set due date"
        />
      </div>

      {/* Project selector dropdown */}
      {projects.length > 1 && (
        <select
          value={task.projectRef}
          onChange={e => onProjectChange(globalIndex, e.target.value)}
          className="text-[10px] px-2 py-1 border rounded-lg bg-black/50 text-gray-300 border-white/10 hover:border-white/20 cursor-pointer max-w-[130px] truncate shrink-0 outline-none"
          title="Move to project">
          {projects.map(p => (
            <option key={p.refId} value={p.refId} className="bg-gray-900 text-white">
              {p.isNew ? `✨ ${p.title}` : `📁 ${p.title}`}
            </option>
          ))}
        </select>
      )}

      {/* Delete */}
      <button onClick={() => onDelete(globalIndex)}
        className="opacity-0 group-hover/row:opacity-100 p-1.5 shrink-0 transition-all text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
        <Trash2 size={12}/>
      </button>
    </div>
  );
}

const STEPS = ['RECORD', 'GENERATE', 'PREVIEW', 'DONE'];

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function VoiceImportModal({ onClose, onCreate, onAddTask, projects = [], targetProject = null }) {
  const [step,        setStep]       = useState('RECORD');
  const [listening,   setListening]  = useState(false);
  const [transcript,  setTranscript] = useState('');
  const [interimText, setInterimText]= useState('');
  const [error,       setError]      = useState('');
  const [generating,  setGenerating] = useState(false);
  const [result,      setResult]     = useState(null); // { projects: [...], tasks: [...] }
  const [creating,    setCreating]   = useState(false);
  const [newTaskText, setNewTaskText]= useState('');
  const [newTaskProj, setNewTaskProj]= useState('');

  const recognitionRef  = useRef(null);
  const manualPrefixRef = useRef('');

  /* ── Speech recognition ── */
  const startListening = useCallback(() => {
    setError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported in this browser. Use Chrome or Edge — or just type below.');
      return;
    }

    manualPrefixRef.current = transcript.trim();

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-US';

    rec.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += (final ? ' ' : '') + t.trim();
        } else {
          interim += (interim ? ' ' : '') + t.trim();
        }
      }

      const fullText = manualPrefixRef.current
        ? `${manualPrefixRef.current} ${final}`
        : final;

      setTranscript(fullText.trim());
      setInterimText(interim);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone access denied. Allow it in browser settings.');
      else if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => { setListening(false); setInterimText(''); };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, [transcript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimText('');
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && !generating && !creating && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [generating, creating, onClose]);

  /* ── Generate ── */
  const generate = async () => {
    const text = transcript.trim();
    if (!text)            { setError('Please record or type your project description first.'); return; }
    if (text.length < 10) { setError('Please describe your project in a bit more detail.'); return; }

    setGenerating(true); setStep('GENERATE'); setError('');
    try {
      const data = await callAI(text, projects, targetProject);
      if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
        throw new Error('Unexpected response format from AI');
      }
      let finalProjects = [...data.projects];
      let finalTasks = [...data.tasks];

      if (targetProject) {
        const found = finalProjects.find(p => p.refId === targetProject.id || p.title?.toUpperCase() === targetProject.title?.toUpperCase());
        if (!found && finalProjects.length > 0) {
          const oldRef = finalProjects[0].refId;
          finalProjects[0] = {
            ...finalProjects[0],
            refId: targetProject.id,
            title: targetProject.title,
            sub: targetProject.sub || finalProjects[0].sub,
            color: targetProject.color || finalProjects[0].color,
            isNew: false
          };
          finalTasks = finalTasks.map(t => t.projectRef === oldRef ? { ...t, projectRef: targetProject.id } : t);
        } else if (found) {
          const oldRef = found.refId;
          found.refId = targetProject.id;
          found.isNew = false;
          if (oldRef !== targetProject.id) {
            finalTasks = finalTasks.map(t => t.projectRef === oldRef ? { ...t, projectRef: targetProject.id } : t);
          }
        }
      }
      setResult({ projects: finalProjects, tasks: finalTasks });
      if (finalProjects.length > 0) {
        setNewTaskProj(targetProject ? targetProject.id : finalProjects[0].refId);
      }
      setStep('PREVIEW');
    } catch (e) {
      setError(`Generation failed: ${e.message}`);
      setStep('RECORD');
    }
    setGenerating(false);
  };

  /* ── Mutations ── */
  const deleteTask      = (globalIdx) => setResult(r => ({ ...r, tasks: r.tasks.filter((_, j) => j !== globalIdx) }));
  const editTask        = (globalIdx, text) => setResult(r => ({ ...r, tasks: r.tasks.map((t, j) => j === globalIdx ? { ...t, text } : t) }));
  const changePriority  = (globalIdx, prio) => setResult(r => ({ ...r, tasks: r.tasks.map((t, j) => j === globalIdx ? { ...t, priority: prio } : t) }));
  const changeDueDate   = (globalIdx, date) => setResult(r => ({ ...r, tasks: r.tasks.map((t, j) => j === globalIdx ? { ...t, dueDate: date } : t) }));
  const changeTaskProject = (globalIdx, projRef) => setResult(r => ({ ...r, tasks: r.tasks.map((t, j) => j === globalIdx ? { ...t, projectRef: projRef } : t) }));

  const moveTask = (globalIdx, dir) => setResult(r => {
    const arr = [...r.tasks];
    const targetTask = arr[globalIdx];
    const projTaskIndices = arr.map((t, idx) => t.projectRef === targetTask.projectRef ? idx : -1).filter(i => i !== -1);
    const posInProj = projTaskIndices.indexOf(globalIdx);
    const swapTargetIdx = projTaskIndices[posInProj + dir];
    if (swapTargetIdx !== undefined) {
      [arr[globalIdx], arr[swapTargetIdx]] = [arr[swapTargetIdx], arr[globalIdx]];
    }
    return { ...r, tasks: arr };
  });

  const addNewTaskToProject = (projRef) => {
    if (!newTaskText.trim()) return;
    setResult(r => ({
      ...r,
      tasks: [...r.tasks, { text: newTaskText.trim(), priority: 'MED', dueDate: null, projectRef: projRef || r.projects[0]?.refId }]
    }));
    setNewTaskText('');
  };

  const updateProject = (refId, field, val) => setResult(r => ({
    ...r,
    projects: r.projects.map(p => p.refId === refId ? { ...p, [field]: val } : p)
  }));

  const deleteProject = (refId) => setResult(r => ({
    projects: r.projects.filter(p => p.refId !== refId),
    tasks: r.tasks.filter(t => t.projectRef !== refId)
  }));

  const addManualNewProject = () => {
    const newRef = `new_${Date.now()}`;
    const newP = {
      refId: newRef,
      isNew: true,
      title: 'NEW_MODULE',
      sub: 'Custom project module',
      color: 'blue'
    };
    setResult(r => ({ ...r, projects: [...r.projects, newP] }));
  };

  /* ── Confirm → Firebase ── */
  const confirm = async () => {
    if (!result || result.projects.length === 0) return;
    setCreating(true);
    setError('');
    try {
      const createdMap = {};

      for (const proj of result.projects) {
        if (proj.isNew) {
          const created = await onCreate({ title: proj.title.toUpperCase(), sub: proj.sub, color: proj.color });
          createdMap[proj.refId] = created.id;
        } else {
          createdMap[proj.refId] = proj.refId;
        }
      }

      for (const task of result.tasks) {
        const targetProjId = createdMap[task.projectRef] || (targetProject ? targetProject.id : createdMap[result.projects[0]?.refId]);
        if (targetProjId) {
          await onAddTask({
            projectId: targetProjId,
            text: task.text,
            priority: task.priority ?? 'MED',
            status: 'TODO',
            dueDate: task.dueDate || null,
            tags: [],
            checklists: []
          });
        }
      }
      setStep('DONE');
    } catch (e) {
      setError(`Failed to save: ${e.message}`);
    }
    setCreating(false);
  };

  const totalTasks = result?.tasks?.length || 0;
  const newProjCount = result?.projects?.filter(p => p.isNew).length || 0;
  const existingProjCount = result?.projects?.filter(p => !p.isNew).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
         onClick={e => e.target === e.currentTarget && !generating && !creating && onClose()}>

      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col glass-panel rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-white/10"
           style={{ background: 'var(--bg-overlay)' }}>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black bg-white font-bold text-xs shadow-sm">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white tracking-tight">Smart AI Task Creator</p>
                {targetProject && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/10 text-white border border-white/20 truncate max-w-[180px]">
                    {targetProject.title}
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {step === 'RECORD'   && (targetProject ? `Speak or type tasks for "${targetProject.title}" — AI will extract & schedule them` : 'Speak or type your goals — AI will auto-route tasks across projects')}
                {step === 'GENERATE' && (targetProject ? `Analyzing and extracting tasks for "${targetProject.title}"…` : 'Analyzing and organizing your tasks across projects…')}
                {step === 'PREVIEW'  && 'Review project structure and task assignments before importing'}
                {step === 'DONE'     && 'Tasks and projects created successfully!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              {['Record','Generate','Preview','Done'].map((s, i) => {
                const idx = STEPS.indexOf(step);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full transition-all"
                         style={{ background: i <= idx ? '#FFFFFF' : 'rgba(255,255,255,0.15)' }}/>
                    {i < 3 && <div className="w-3 h-px bg-white/10"/>}
                  </div>
                );
              })}
            </div>
            {!generating && !creating && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                <X size={15}/>
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2.5 mx-6 mt-4 px-4 py-3 rounded-lg border border-rose-500/30 bg-rose-500/10 shrink-0">
            <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5"/>
            <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── RECORD ── */}
        {step === 'RECORD' && (
          <div className="flex-1 overflow-y-auto scroll p-6 space-y-6">

            {/* Mic Sphere */}
            <div className="flex flex-col items-center gap-3.5 py-2">
              <button onClick={listening ? stopListening : startListening}
                className="relative w-18 h-18 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background:  listening ? 'rgba(255,69,58,0.15)' : 'rgba(255,255,255,0.06)',
                  border:      `1px solid ${listening ? '#FF453A' : 'rgba(255,255,255,0.15)'}`,
                }}>
                {listening ? <MicOff size={24} className="text-rose-400"/> : <Mic size={24} className="text-white"/>}
                {listening && <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-rose-500"/>}
              </button>
              <p className="text-xs font-medium"
                 style={{ color: listening ? '#FF453A' : 'var(--text-muted)' }}>
                {listening ? 'Listening… Click to stop' : 'Click to speak'}
              </p>
              <Waveform active={listening}/>
            </div>

            {/* Transcript Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Prompt / Transcript</label>
              <div className="relative">
                <textarea rows={5}
                  className="input-terminal w-full px-4 py-3 text-sm leading-relaxed resize-none rounded-xl"
                  placeholder={`Example: "I need to prepare for my Calculus exam: solve differential equations and practice chapter 4 problems. For Robotics club: 3D print the bracket and calibrate PID speed controller."`}
                  value={transcript + (interimText ? ' ' + interimText : '')}
                  readOnly={listening}
                  onChange={e => { if (!listening) setTranscript(e.target.value); }}
                />
                {transcript && !listening && (
                  <button onClick={() => { setTranscript(''); setError(''); }}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X size={13}/>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                <span>AI will automatically map tasks into projects</span>
              </div>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Quick templates</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Tomorrow Focus: study calculus midterm chapters, redesign robotics chassis arm in Rhino, order 3D printer filament',
                  'Academics: finish physics problem set, review integration notes. Robotics: calibrate servos and test hardware gait',
                  'Design assignment: create lamp model in Rhino, export STL, clean workbench',
                ].map((ex, i) => (
                  <button key={i} onClick={() => setTranscript(ex)}
                    className="text-left text-[11px] px-3.5 py-2 rounded-xl border transition-all hover:bg-white/[0.06] truncate max-w-xs"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
                    "{ex.slice(0, 50)}…"
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button onClick={generate} disabled={!transcript.trim() || generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold tracking-wide btn-primary rounded-xl disabled:opacity-40">
              <Wand2 size={15}/> Generate & Route Tasks with AI
            </button>
          </div>
        )}

        {/* ── GENERATE ── */}
        {step === 'GENERATE' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin"/>
              <Sparkles size={28} className="text-blue-400 animate-pulse"/>
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-base font-bold text-white tracking-tight">Synthesizing Project Action Items…</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Matching tasks to existing workspace projects & structuring modules</p>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {step === 'PREVIEW' && result && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Summary Bar */}
            <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between text-xs"
                 style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-blue-400">{totalTasks} tasks synthesized</span>
                {existingProjCount > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                    📁 {existingProjCount} Existing Projects
                  </span>
                )}
                {newProjCount > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                    ✨ {newProjCount} New Projects
                  </span>
                )}
              </div>
              <button onClick={addManualNewProject}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-colors">
                <FolderPlus size={13}/> Add Project Topic
              </button>
            </div>

            {/* Scrollable list of Project Cards */}
            <div className="flex-1 overflow-y-auto scroll p-5 space-y-5">
              {result.projects.map((proj) => {
                const projTasks = result.tasks.filter(t => t.projectRef === proj.refId);

                return (
                  <div key={proj.refId}
                       className="rounded-xl overflow-hidden glass-card"
                       style={{ borderColor: proj.isNew ? 'rgba(48,209,88,0.35)' : 'var(--border-subtle)' }}>
                    
                    {/* Project Header */}
                    <div className="p-4 border-b space-y-2.5"
                         style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider border shrink-0 ${
                            proj.isNew
                              ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300'
                              : 'bg-blue-500/12 border-blue-500/30 text-blue-300'
                          }`}>
                            {proj.isNew ? '✨ NEW PROJECT' : '📁 EXISTING'}
                          </span>

                          {proj.isNew ? (
                            <input
                              className="input-terminal flex-1 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                              value={proj.title}
                              onChange={e => updateProject(proj.refId, 'title', e.target.value.toUpperCase())}
                              placeholder="PROJECT TITLE"
                            />
                          ) : (
                            <span className="text-xs font-bold uppercase tracking-wide text-white truncate">
                              {proj.title}
                            </span>
                          )}
                        </div>

                        {result.projects.length > 1 && (
                          <button onClick={() => deleteProject(proj.refId)}
                            className="p-1.5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-300 rounded-lg transition-colors"
                            title="Delete project module and tasks">
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>

                      {/* Subtitle & Palette Picker */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        {proj.isNew ? (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              className="input-terminal flex-1 px-3 py-1 text-[11px]"
                              value={proj.sub || ''}
                              onChange={e => updateProject(proj.refId, 'sub', e.target.value)}
                              placeholder="Short project description..."
                            />
                            <div className="flex items-center gap-1.5">
                              {THEME_COLORS.map(c => (
                                <button key={c.name} onClick={() => updateProject(proj.refId, 'color', c.name)}
                                  className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: c.hex,
                                    outline: proj.color === c.name ? '2px solid white' : 'none',
                                    outlineOffset: '2px',
                                  }}/>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">
                            {proj.sub || 'Tasks will be added to your existing project'}
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-gray-400 font-semibold ml-auto">
                          {projTasks.length} tasks
                        </span>
                      </div>
                    </div>

                    {/* Tasks list */}
                    <div>
                      {projTasks.length === 0 ? (
                        <div className="p-5 text-center text-xs text-gray-500 italic">
                          No tasks assigned to this project yet. Use "+ Add task" below.
                        </div>
                      ) : (
                        projTasks.map((t, idx) => {
                          const globalIdx = result.tasks.indexOf(t);
                          return (
                            <TaskRow
                              key={globalIdx}
                              task={t}
                              globalIndex={globalIdx}
                              projTasks={projTasks}
                              projIndex={idx}
                              projects={result.projects}
                              onDelete={deleteTask}
                              onEdit={editTask}
                              onMove={moveTask}
                              onPriorityChange={changePriority}
                              onDueDateChange={changeDueDate}
                              onProjectChange={changeTaskProject}
                            />
                          );
                        })
                      )}

                      {/* Add task quick entry */}
                      <div className="flex gap-2 px-4 py-2.5 bg-white/[0.02]">
                        <input className="input-terminal flex-1 px-3 py-1.5 text-xs rounded-lg"
                          placeholder={`+ Add task to ${proj.title}…`}
                          value={newTaskProj === proj.refId ? newTaskText : ''}
                          onFocus={() => setNewTaskProj(proj.refId)}
                          onChange={e => { setNewTaskProj(proj.refId); setNewTaskText(e.target.value); }}
                          onKeyDown={e => e.key === 'Enter' && addNewTaskToProject(proj.refId)}/>
                        <button onClick={() => addNewTaskToProject(proj.refId)}
                          className="px-3.5 py-1.5 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-xs"
                          style={{ background: 'var(--accent)' }}>
                          <Plus size={14}/>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Preview Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t shrink-0"
                 style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
              <button onClick={() => { setStep('RECORD'); setResult(null); setError(''); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold btn-ghost">
                <RotateCcw size={13}/> Redo
              </button>
              <button onClick={confirm} disabled={creating || totalTasks === 0 || result.projects.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold btn-primary rounded-xl disabled:opacity-40">
                {creating
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving to Workspace…</>
                  : <><Check size={15}/> Confirm & Import {totalTasks} Tasks across {result.projects.length} Projects</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'DONE' && result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center animate-fade-in">
            <div className="text-5xl animate-bounce">✨</div>
            <div>
              <p className="text-xl font-bold text-white tracking-tight">Import Complete!</p>
              <p className="text-xs mt-1.5 text-gray-300">
                {targetProject ? (
                  <>Successfully created <span className="font-semibold text-amber-400">{totalTasks} tasks</span> for <span className="font-semibold text-white">{targetProject.title}</span>.</>
                ) : (
                  <>Successfully organized <span className="font-semibold text-blue-400">{totalTasks} tasks</span> across <span className="font-semibold text-emerald-400">{result.projects.length} projects</span>.</>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="px-6 py-2.5 text-xs font-semibold btn-primary rounded-xl">
                {targetProject ? 'Back to Board' : 'View Projects'}
              </button>
              <button onClick={() => { setStep('RECORD'); setResult(null); setTranscript(''); setError(''); }}
                className="px-6 py-2.5 text-xs font-semibold btn-ghost rounded-xl">
                Create More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
