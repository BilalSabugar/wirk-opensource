import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useData }      from './hooks/useData';
import { useTheme }     from './hooks/useTheme';
import { usePomodoro }  from './hooks/usePomodoro';
import BootScreen             from './components/BootScreen';
import AuthScreen             from './components/AuthScreen';
import Sidebar                from './components/Sidebar';
import CommandPalette         from './components/CommandPalette';
import EditTaskModal          from './components/EditTaskModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ProfileModal           from './components/ProfileModal';
import PomodoroWidget         from './components/PomodoroWidget';
import VoiceImportModal       from './components/VoiceImportModal';
import { NewProjectModal }    from './components/shared';
import TodayView     from './views/Today';
import DashboardView from './views/Dashboard';
import ModulesView   from './views/Modules';
import AnalyticsView from './views/Analytics';
import CalendarView  from './views/Calendar';
import NotesView     from './views/Notes';
import SearchView    from './views/Search';

const BOOT_LEN = 6;
const VIEW_KEYS = {
  '1': 'TODAY', '2': 'DASHBOARD', '3': 'MODULES',
  '4': 'ANALYTICS', '5': 'CALENDAR', '6': 'NOTES', '7': 'SEARCH',
};

export default function App() {
  const [phase,     setPhase]     = useState('BOOT');
  const [user,      setUser]      = useState(null);
  const [view,      setView]      = useState('TODAY');
  const [sidebarX,  setSidebarX]  = useState(false);
  const [palette,   setPalette]   = useState(false);
  const [newMod,    setNewMod]    = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [shortcuts, setShortcuts] = useState(false);
  const [profile,      setProfile]      = useState(false);
  const [voiceImport,  setVoiceImport]  = useState(false);

  const { toggle: toggleTheme, isDark } = useTheme();

  const {
    projects, tasks, notes, logs, stats,
    createProject, deleteProject,
    addTask, updateTask, deleteTask,
    saveNote, deleteNote,
    pinToday, unpinToday,
    recordFocusSession,
  } = useData(user);

  // Pomodoro — lives at App level so it persists across view changes
  const pomodoro = usePomodoro({
    onSessionComplete: useCallback(({ taskId, type, durationMs }) => {
      if (recordFocusSession) recordFocusSession({ taskId, type, durationMs });
    }, [recordFocusSession]),
  });

  // Boot timer
  useEffect(() => {
    const t = setTimeout(() => {
      if (!auth.currentUser) setPhase(p => p === 'BOOT' ? 'AUTH' : p);
    }, BOOT_LEN * 280 + 500);
    return () => clearTimeout(t);
  }, []);

  // Auth
  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    setPhase(u ? 'APP' : 'AUTH');
  }), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette(p => !p); return; }
      if (e.key === 'Escape') {
        setPalette(false); setEditTask(null); setNewMod(false); setShortcuts(false); setProfile(false); setVoiceImport(false);
        return;
      }
      if (!inInput) {
        if (e.key === '?') { setShortcuts(s => !s); return; }
        if (e.key === 'p' || e.key === 'P') { setProfile(s => !s); return; }
        if (e.key === 't' || e.key === 'T') { toggleTheme(); return; }
        if (VIEW_KEYS[e.key]) { setView(VIEW_KEYS[e.key]); return; }
        if ((e.key === 'n' || e.key === 'N') && view === 'MODULES') { setNewMod(true); return; }
        if (e.key === 'v' || e.key === 'V') { setVoiceImport(true); return; }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [view, toggleTheme]);

  const handleToggleTask = useCallback((task) => updateTask(task.id, { completed: !task.completed }), [updateTask]);
  const handleSaveTask   = useCallback((id, patch) => updateTask(id, patch), [updateTask]);
  const handleEditTask   = useCallback((taskOrPatch) => {
    if (taskOrPatch?.text !== undefined) setEditTask(taskOrPatch);
    else handleSaveTask(taskOrPatch.id, taskOrPatch);
  }, [handleSaveTask]);

  // Focus a task with Pomodoro — start immediately and switch to Today or stay on current view
  const handleFocusTask = useCallback((task) => {
    pomodoro.startWork(task);
  }, [pomodoro]);

  if (phase === 'BOOT') return <BootScreen />;
  if (phase === 'AUTH') return <AuthScreen />;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        active={view} setActive={setView}
        user={user} stats={stats}
        expanded={sidebarX} setExpanded={setSidebarX}
        onProfile={() => setProfile(true)}
        onThemeToggle={toggleTheme}
        isDark={isDark}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b shrink-0"
             style={{ background: 'var(--bg-base)', borderColor: 'var(--border-dim)' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }}>⚙</span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>ENGINE_CORE_V6</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="text-lg" style={{ color: 'var(--text-muted)' }}>
              {isDark ? '☀' : '◑'}
            </button>
            <button onClick={() => setPalette(true)}
              className="text-[10px] border px-2 py-1 transition-colors"
              style={{ borderColor: 'var(--border-mid)', color: 'var(--text-muted)' }}>
              ⌘K
            </button>
          </div>
        </div>

        {/* View */}
        <div className="flex-1 overflow-hidden">
          {view === 'TODAY' && (
            <TodayView tasks={tasks} projects={projects}
              onUpdateTask={handleSaveTask}
              onFocusTask={handleFocusTask} />
          )}
          {view === 'DASHBOARD' && (
            <DashboardView projects={projects} tasks={tasks} stats={stats} logs={logs}
              onNewProject={() => setNewMod(true)} onNavigate={setView} />
          )}
          {view === 'MODULES' && (
            <ModulesView projects={projects} tasks={tasks} stats={stats}
              onAddTask={addTask} onDeleteTask={deleteTask}
              onToggleTask={handleToggleTask} onEditTask={handleEditTask}
              onFocusTask={handleFocusTask}
              onVoiceImport={() => setVoiceImport(true)}
              onDeleteProject={deleteProject} onNewProject={() => setNewMod(true)} />
          )}
          {view === 'ANALYTICS' && (
            <AnalyticsView projects={projects} tasks={tasks} stats={stats} />
          )}
          {view === 'CALENDAR' && (
            <CalendarView tasks={tasks} projects={projects}
              onAddTask={addTask} onToggle={handleToggleTask} onEdit={setEditTask} />
          )}
          {view === 'NOTES' && (
            <NotesView notes={notes} projects={projects} onSave={saveNote} onDelete={deleteNote} />
          )}
          {view === 'SEARCH' && (
            <SearchView tasks={tasks} projects={projects}
              onToggle={handleToggleTask} onDelete={deleteTask} onEdit={setEditTask} />
          )}
        </div>

        {/* Desktop log bar */}
        <div className="hidden md:flex items-center justify-between px-4 py-1.5 border-t shrink-0"
             style={{ background: 'var(--bg-base)', borderColor: 'var(--border-dim)' }}>
          <div className="flex items-center gap-3 text-[9px] overflow-hidden" style={{ color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--accent)', opacity: 0.4 }}>›</span>
            {logs.slice(0, 3).map((l, i) => (
              <span key={i} className="whitespace-nowrap"
                    style={{ color: i === 0 ? 'var(--text-muted)' : 'var(--text-dim)' }}>{l}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setShortcuts(true)}
              className="text-[9px] transition-colors" style={{ color: 'var(--text-muted)' }}>
              ? shortcuts
            </button>
            <button onClick={() => setPalette(true)}
              className="flex items-center gap-2 text-[9px] border px-2 py-1 transition-all"
              style={{ borderColor: 'var(--border-dim)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.color='var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-dim)'; e.currentTarget.style.color='var(--text-muted)'; }}>
              <span>⌘K</span>
              <span className="hidden lg:inline">Command palette</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      <CommandPalette
        open={palette} onClose={() => setPalette(false)}
        setView={setView}
        onNewProject={() => { setNewMod(true); setPalette(false); }}
        onShortcuts={() => { setShortcuts(true); setPalette(false); }}
        onProfile={() => { setProfile(true); setPalette(false); }}
        onThemeToggle={() => { toggleTheme(); setPalette(false); }}
        onVoiceImport={() => { setVoiceImport(true); setPalette(false); }}
      />
      {newMod && (
        <NewProjectModal onClose={() => setNewMod(false)}
          onCreate={async (data) => { await createProject(data); setNewMod(false); }} />
      )}
      {editTask && (
        <EditTaskModal task={editTask} projects={projects}
          onSave={handleSaveTask} onDelete={deleteTask} onClose={() => setEditTask(null)} />
      )}
      {shortcuts && <KeyboardShortcutsModal onClose={() => setShortcuts(false)} />}
      {profile && user && (
        <ProfileModal user={user} tasks={tasks} projects={projects} notes={notes}
          onClose={() => setProfile(false)} />
      )}

      {/* Voice Import Modal */}
      {voiceImport && (
        <VoiceImportModal
          onClose={() => { setVoiceImport(false); setView('MODULES'); }}
          onCreate={createProject}
          onAddTask={addTask}
        />
      )}

      {/* Pomodoro timer — always mounted, persists across all view changes */}
      {user && (
        <PomodoroWidget pomodoro={pomodoro} tasks={tasks} projects={projects} />
      )}
    </div>
  );
}
