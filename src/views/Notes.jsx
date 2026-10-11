import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FileText, Plus, X, Save, Search, Sparkles, Copy, Download, Trash2,
  Check, CheckSquare, Square, List, Heading1, Heading2, Heading3,
  Code, Quote, Minus, BookOpen, Globe, Clock, ArrowRight, CornerDownLeft,
  Columns, Eye, Edit3, Share2, Layers, AlertCircle
} from 'lucide-react';
import { getTheme, THEME_COLORS } from '../constants';

const AUTOSAVE_MS = 1200;

/* ── Rich Markdown Renderer with Interactive Checkboxes ─────────────────── */
function MarkdownPreview({ content, onToggleCheckbox }) {
  if (!content || !content.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-[var(--text-muted)]">
        <BookOpen size={32} className="opacity-20 mb-2" />
        <p className="text-xs font-semibold text-[var(--text-hi)]">Empty Notebook</p>
        <p className="text-[11px] mt-1 max-w-xs">Start writing or switch to Edit mode to add headings, notes, bullet lists, and action items.</p>
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--text-hi)] font-sans max-w-4xl">
      {lines.map((line, idx) => {
        // Heading 1
        if (/^#\s+(.+)/.test(line)) {
          const text = line.replace(/^#\s+/, '');
          return (
            <h1 key={idx} className="text-xl font-bold tracking-tight text-[var(--text-hi)] pt-4 pb-1 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-[var(--accent)]" />
              <span>{text}</span>
            </h1>
          );
        }
        // Heading 2
        if (/^##\s+(.+)/.test(line)) {
          const text = line.replace(/^##\s+/, '');
          return (
            <h2 key={idx} className="text-base font-bold tracking-tight text-[var(--text-hi)] pt-3 pb-0.5">
              {text}
            </h2>
          );
        }
        // Heading 3
        if (/^###\s+(.+)/.test(line)) {
          const text = line.replace(/^###\s+/, '');
          return (
            <h3 key={idx} className="text-sm font-semibold text-[var(--text-hi)] opacity-90 pt-2">
              {text}
            </h3>
          );
        }
        // Checkbox Task (Done)
        if (/^\[x\]\s+(.+)/i.test(line)) {
          const text = line.replace(/^\[x\]\s+/i, '');
          return (
            <div
              key={idx}
              onClick={() => onToggleCheckbox && onToggleCheckbox(idx, false)}
              className="flex items-start gap-2.5 py-1 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <div className="mt-0.5 w-4 h-4 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="line-through text-[var(--text-muted)] group-hover:text-[var(--text-hi)] transition-colors">{text}</span>
            </div>
          );
        }
        // Checkbox Task (Pending)
        if (/^\[ \]\s+(.+)/.test(line)) {
          const text = line.replace(/^\[ \]\s+/, '');
          return (
            <div
              key={idx}
              onClick={() => onToggleCheckbox && onToggleCheckbox(idx, true)}
              className="flex items-start gap-2.5 py-1 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <div className="mt-0.5 w-4 h-4 rounded-md border border-zinc-400 dark:border-zinc-500 hover:border-[var(--accent)] flex items-center justify-center shrink-0 transition-colors">
                <span className="w-1.5 h-1.5 rounded-sm bg-transparent group-hover:bg-[var(--accent)]" />
              </div>
              <span className="text-[var(--text-hi)]">{text}</span>
            </div>
          );
        }
        // Bullet List
        if (/^[-*]\s+(.+)/.test(line)) {
          const text = line.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 py-0.5">
              <span className="text-[var(--accent)] font-bold shrink-0 mt-0.5">•</span>
              <span className="text-[var(--text-hi)]">{text}</span>
            </div>
          );
        }
        // Blockquote
        if (/^>\s+(.+)/.test(line)) {
          const text = line.replace(/^>\s+/, '');
          return (
            <div key={idx} className="border-l-2 border-[var(--accent)] pl-3.5 py-1 my-1 bg-black/5 dark:bg-white/5 rounded-r-lg italic text-[var(--text-muted)]">
              {text}
            </div>
          );
        }
        // Code snippet
        if (/^`{3}/.test(line)) {
          return (
            <div key={idx} className="text-[10px] font-mono text-[var(--text-muted)] py-0.5 opacity-60">
              {line}
            </div>
          );
        }
        if (/^---+$/.test(line)) {
          return <div key={idx} className="my-3 border-t border-[var(--border-subtle)]" />;
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-2" />;
        }
        return <p key={idx} className="py-0.5">{line}</p>;
      })}
    </div>
  );
}

/* ── Sidebar Notebook Card Item ─────────────────────────────────────────── */
function NotebookItem({ slot, project, note, isActive, onClick }) {
  const theme = project ? getTheme(project.color) : null;
  const rawContent = (note?.content || '').trim();
  const lines = rawContent.split('\n').filter(Boolean);
  const title = lines[0]?.replace(/^#+\s*/, '') || (slot.isGlobal ? 'Global Scratchpad' : slot.label);
  const preview = lines.find(l => !l.startsWith('#'))?.slice(0, 50) || '';
  const wordCount = rawContent ? rawContent.split(/\s+/).length : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 border group mb-1.5 ${
        isActive
          ? 'bg-[var(--bg-hover)] border-[var(--accent)] shadow-xs scale-[1.01]'
          : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-[var(--border-subtle)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {slot.isGlobal ? (
            <div className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Globe size={11} className="text-amber-400" />
            </div>
          ) : (
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: theme?.hex || 'var(--accent)' }}
            />
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${
            slot.isGlobal ? 'text-amber-400' : (theme?.text || 'text-[var(--text-hi)]')
          }`}>
            {slot.label}
          </span>
        </div>

        {wordCount > 0 ? (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-muted)] shrink-0 font-mono">
            {wordCount}w
          </span>
        ) : (
          <span className="text-[9px] text-[var(--text-muted)] italic shrink-0 opacity-60">
            empty
          </span>
        )}
      </div>

      <p className={`text-xs font-semibold truncate transition-colors ${
        isActive ? 'text-[var(--text-hi)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-hi)]'
      }`}>
        {rawContent ? title : 'No notes written yet'}
      </p>

      {preview && (
        <p className="text-[11px] text-[var(--text-muted)] opacity-75 truncate mt-0.5">
          {preview}
        </p>
      )}
    </button>
  );
}

/* ── Main Notes & Module Scratchpad View ────────────────────────────────── */
export default function NotesView({ notes = [], projects = [], onSave, onDelete }) {
  const [activeSlotKey, setActiveSlotKey] = useState(null); // 'global' | project.id
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'edit' | 'preview' | 'split'
  const [searchQuery, setSearchQuery] = useState('');
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // Build unified note slots: Global Scratchpad + Projects
  const noteSlots = useMemo(() => {
    return [
      { key: 'global', projectId: null, label: 'Global Workspace', isGlobal: true, sub: 'General ideas, scratchpad & cross-project notes' },
      ...projects.map(p => ({ key: p.id, projectId: p.id, label: p.title, isGlobal: false, sub: p.sub || 'Project notebook' })),
    ];
  }, [projects]);

  // Filter note slots by search query
  const filteredSlots = useMemo(() => {
    if (!searchQuery.trim()) return noteSlots;
    const q = searchQuery.toLowerCase();
    return noteSlots.filter(s => {
      const matchLabel = s.label.toLowerCase().includes(q);
      const note = notes.find(n => n.projectId === s.projectId);
      const matchContent = note?.content?.toLowerCase().includes(q);
      return matchLabel || matchContent;
    });
  }, [noteSlots, notes, searchQuery]);

  // Active slot and project details
  const activeSlot = useMemo(() => {
    return noteSlots.find(s => s.key === activeSlotKey) || null;
  }, [noteSlots, activeSlotKey]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeSlot?.projectId) || null;
  }, [projects, activeSlot]);

  // Select slot
  const handleSelectSlot = useCallback((slot) => {
    setActiveSlotKey(slot.key);
    const existing = notes.find(n => n.projectId === slot.projectId);
    setContent(existing?.content || '');
    setSaveState('idle');
  }, [notes]);

  // Autosave triggers on content change
  useEffect(() => {
    if (!activeSlot) return;
    setSaveState('saving');
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (onSave) {
        await onSave({
          projectId: activeSlot.projectId,
          content,
          title: activeSlot.isGlobal ? 'Global Notes' : activeSlot.label,
        });
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, AUTOSAVE_MS);

    return () => clearTimeout(timerRef.current);
  }, [content, activeSlot, onSave]);

  // Insertion helpers for rich formatting toolbar
  const insertText = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const selected = v.slice(s, e);
    const newVal = v.slice(0, s) + before + selected + after + v.slice(e);
    setContent(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, e + before.length);
    }, 0);
  };

  const insertLinePrefix = (prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, value: v } = ta;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    const newVal = v.slice(0, lineStart) + prefix + v.slice(lineStart);
    setContent(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length);
    }, 0);
  };

  const handleToggleCheckboxInPreview = (lineIndex, makeChecked) => {
    const lines = content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    if (makeChecked) {
      lines[lineIndex] = lines[lineIndex].replace(/^\[ \]/, '[x]');
    } else {
      lines[lineIndex] = lines[lineIndex].replace(/^\[x\]/i, '[ ]');
    }
    setContent(lines.join('\n'));
  };

  const handleCopyNote = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadNote = () => {
    if (!content) return;
    const filename = `${(activeSlot?.label || 'notes').toLowerCase().replace(/\s+/g, '_')}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleInsertTemplate = (type) => {
    let tpl = '';
    if (type === 'meeting') {
      tpl = `# Meeting Notes: ${new Date().toLocaleDateString()}\n\n## Attendees\n- [ ] Team member 1\n- [ ] Team member 2\n\n## Agenda\n1. Project status review\n2. Key blockers and milestones\n\n## Action Items\n[ ] Follow up on deliverables\n[ ] Schedule next review`;
    } else if (type === 'spec') {
      tpl = `# Technical Spec: ${activeSlot?.label || 'Module'}\n\n## Objective\nDescribe the main goals and requirements.\n\n## Architecture & Data Flow\n- Component 1: \n- State Management: \n\n## Key Tasks\n[ ] Define API contracts\n[ ] Implement UI components\n[ ] Write unit and integration tests`;
    } else {
      tpl = `# ${activeSlot?.label || 'Scratchpad'}\n\n## Key Thoughts\n- Quick note item\n\n## Checklist\n[ ] Review open items\n[ ] Update project status`;
    }
    setContent(prev => prev ? `${prev}\n\n${tpl}` : tpl);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const linesCount = content ? content.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in" style={{ background: 'var(--bg-base)' }}>
      
      {/* ── Executive Header Bar ── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0 flex-wrap gap-3 z-10"
        style={{
          background: 'var(--header-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-[var(--text-hi)] font-bold shadow-xs">
            <FileText size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
                Notes & Notebooks
              </h2>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                {noteSlots.length} notebooks
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Per-module documentation, markdown scratchpads, and live auto-saved notes
            </p>
          </div>
        </div>

        {/* Global Save Telemetry & Actions */}
        <div className="flex items-center gap-3">
          {activeSlot && (
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border transition-all ${
                  saveState === 'saved'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : saveState === 'saving'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-[var(--text-muted)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${saveState === 'saved' ? 'bg-emerald-400' : saveState === 'saving' ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                <span>{saveState === 'saved' ? 'Saved to Cloud' : saveState === 'saving' ? 'Saving…' : 'Synced'}</span>
              </span>

              <button
                onClick={handleCopyNote}
                className="p-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                title="Copy markdown to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadNote}
                className="p-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                title="Download as .md file"
              >
                <Download size={14} />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Two-Pane Container ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── Left Notebooks Sidebar ── */}
        <div
          className={`${activeSlot ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r flex-col overflow-hidden`}
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Search Box */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notebooks & notes..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-hi)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-hi)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Notebooks List Stream */}
          <div className="flex-1 overflow-y-auto scroll p-3 space-y-1 pb-28 sm:pb-3">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                All Notebooks ({filteredSlots.length})
              </span>
            </div>

            {filteredSlots.map(slot => {
              const existingNote = notes.find(n => n.projectId === slot.projectId);
              const proj = projects.find(p => p.id === slot.projectId);
              const isActive = activeSlotKey === slot.key;

              return (
                <NotebookItem
                  key={slot.key}
                  slot={slot}
                  project={proj}
                  note={existingNote}
                  isActive={isActive}
                  onClick={() => handleSelectSlot(slot)}
                />
              );
            })}

            {filteredSlots.length === 0 && (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                No matching notebooks found
              </div>
            )}
          </div>
        </div>

        {/* ── Right Notebook Editor & Preview Pane ── */}
        <div className={`${activeSlot ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden min-w-0`} style={{ background: 'var(--bg-base)' }}>
          {activeSlot === null ? (
            /* Luxury Empty State */
            <div className="flex-1 overflow-y-auto scroll p-8 flex flex-col items-center justify-center text-center">
              <div className="max-w-md space-y-4 animate-scale-in">
                <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 border flex items-center justify-center mx-auto shadow-sm"
                     style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}>
                  <BookOpen size={26} className="text-[var(--accent)]" />
                </div>

                <div>
                  <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
                    Select a Notebook to View or Edit
                  </h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Capture ideas, architecture specs, sprint reviews, and checklists scoped directly to your workspace projects.
                  </p>
                </div>

                {/* Quick launch grid */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {noteSlots.slice(0, 4).map(slot => {
                    const proj = projects.find(p => p.id === slot.projectId);
                    const theme = proj ? getTheme(proj.color) : null;
                    return (
                      <button
                        key={slot.key}
                        onClick={() => handleSelectSlot(slot)}
                        className="p-3 rounded-2xl border bg-[var(--bg-panel)] hover:border-[var(--accent)] hover:shadow-xs transition-all duration-200 group"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: theme?.hex || '#F59E0B' }}
                          />
                          <span className="text-xs font-bold truncate group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-hi)' }}>
                            {slot.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{slot.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Notebook Workspace */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Workspace Sub-Header & Toolbar */}
              <div
                className="px-3.5 sm:px-6 py-2 sm:py-2.5 border-b flex items-center justify-between shrink-0 flex-wrap gap-2"
                style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}
              >
                {/* Active Notebook Badge & Templates */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <button
                    onClick={() => setActiveSlot(null)}
                    className="md:hidden px-2 py-1 rounded-lg border text-xs font-semibold shrink-0"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                  >
                    ← Back
                  </button>

                  <span className="text-xs font-bold tracking-tight truncate" style={{ color: 'var(--text-hi)' }}>
                    {activeSlot.label}
                  </span>
                  
                  <div className="hidden sm:block h-3 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                    <button
                      onClick={() => insertLinePrefix('# ')}
                      className="p-1.5 rounded-lg border text-[11px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Heading 1"
                    >
                      <Heading1 size={13} />
                    </button>
                    <button
                      onClick={() => insertLinePrefix('## ')}
                      className="p-1.5 rounded-lg border text-[11px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Heading 2"
                    >
                      <Heading2 size={13} />
                    </button>
                    <button
                      onClick={() => insertLinePrefix('- ')}
                      className="p-1.5 rounded-lg border text-[11px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Bullet list"
                    >
                      <List size={13} />
                    </button>
                    <button
                      onClick={() => insertLinePrefix('[ ] ')}
                      className="p-1.5 rounded-lg border text-[11px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--accent)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      title="Action item checklist"
                    >
                      <CheckSquare size={13} />
                    </button>
                    <button
                      onClick={() => insertText('\n```\n', '\n```\n')}
                      className="p-1.5 rounded-lg border text-[11px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Code block"
                    >
                      <Code size={13} />
                    </button>
                    <button
                      onClick={() => insertLinePrefix('> ')}
                      className="p-1.5 rounded-lg border text-[11px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Quote"
                    >
                      <Quote size={13} />
                    </button>
                    <button
                      onClick={() => insertText('\n---\n')}
                      className="p-1.5 rounded-lg border text-[11px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
                      title="Divider line"
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                </div>

                {/* View Mode Segmented Controls */}
                <div className="flex items-center gap-2">
                  {/* Template Dropdown / Quick Button */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleInsertTemplate('meeting')}
                      className="px-2 py-1 text-[11px] rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      + Meeting
                    </button>
                    <button
                      onClick={() => handleInsertTemplate('spec')}
                      className="px-2 py-1 text-[11px] rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      + Spec
                    </button>
                  </div>

                  <div
                    className="flex items-center p-0.5 rounded-xl border bg-black/5 dark:bg-white/5"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'edit'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-hi)] shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-hi)]'
                      }`}
                      title="Raw Markdown Editor"
                    >
                      <Edit3 size={12} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'split'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-hi)] shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-hi)]'
                      }`}
                      title="Side-by-side Editor and Live Preview"
                    >
                      <Columns size={12} />
                      <span>Split</span>
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'preview'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-hi)] shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-hi)]'
                      }`}
                      title="Rendered Markdown Preview"
                    >
                      <Eye size={12} />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor & Preview Split/Single Container */}
              <div className="flex-1 flex overflow-hidden">
                {/* Editor Pane */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={`flex-1 flex flex-col h-full overflow-hidden ${viewMode === 'split' ? 'border-r' : ''}`}
                       style={{ borderColor: 'var(--border-subtle)' }}>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={`# ${activeSlot.label}\n\nStart typing notes in markdown...\n\n- Tip: Use [ ] for action items\n- Tip: Use # for headings\n- Tip: Use > for blockquotes`}
                      spellCheck={false}
                      className="w-full h-full p-6 bg-transparent text-xs font-mono leading-relaxed outline-none resize-none overflow-y-auto scroll"
                      style={{ color: 'var(--text-hi)' }}
                    />
                  </div>
                )}

                {/* Preview Pane */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="flex-1 h-full overflow-y-auto scroll p-6" style={{ background: 'var(--bg-panel)' }}>
                    <MarkdownPreview
                      content={content}
                      onToggleCheckbox={handleToggleCheckboxInPreview}
                    />
                  </div>
                )}
              </div>

              {/* Luxury Footer Bar */}
              <div
                className="px-4 sm:px-6 py-2 border-t flex items-center justify-between shrink-0 text-[11px] font-medium mb-14 md:mb-0"
                style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>{charCount} characters</span>
                  <span>·</span>
                  <span>{linesCount} lines</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={11} />
                  <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
