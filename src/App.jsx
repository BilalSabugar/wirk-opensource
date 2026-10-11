import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useData }      from './hooks/useData';
import { useEncryption } from './hooks/useEncryption';
import { useTheme }     from './hooks/useTheme';
import { usePomodoro }  from './hooks/usePomodoro';
import WirkLogo           from './components/WirkLogo';
import ForgeLogo          from './components/ForgeLogo';
import BootScreen             from './components/BootScreen';
import LandingPage            from './components/LandingPage';
import { ToastProvider }       from './components/Toast';
import AuthScreen             from './components/AuthScreen';
import { callGeminiDirect, getStoredGeminiKey, getAriaSystemPrompt } from './utils/aiClient';
import Sidebar                from './components/Sidebar';
import CommandPalette         from './components/CommandPalette';
import EditTaskModal          from './components/EditTaskModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ProfileModal           from './components/ProfileModal';
import PomodoroWidget         from './components/PomodoroWidget';
import VoiceImportModal       from './components/VoiceImportModal';
import DevCreditsModal        from './components/DevCreditsModal';
import UpgradeModal           from './components/UpgradeModal';
import ThemeWaveOverlay       from './components/ThemeWaveOverlay';
import ProductivityGuidesModal from './components/ProductivityGuidesModal';
import { recordAiUsage }      from './utils/aiCreditsTracker';
import { NewProjectModal }    from './components/shared';
import LegalView     from './views/Legal';
import TodayView     from './views/Today';
import DashboardView from './views/Dashboard';
import ModulesView   from './views/Modules';
import AnalyticsView from './views/Analytics';
import CalendarView  from './views/Calendar';
import NotesView     from './views/Notes';
import SearchView    from './views/Search';
import CompanionView, { speakText } from './views/Companion';
import DiaryView     from './views/Diary';
import NotFoundView  from './views/NotFound';

const BOOT_LEN = 6;
const VIEW_KEYS = {
  '0': 'ARIA', '1': 'TODAY', '2': 'DASHBOARD', '3': 'MODULES',
  '4': 'ANALYTICS', '5': 'CALENDAR', '6': 'DIARY', '7': 'NOTES', '8': 'SEARCH',
};

export default function App() {
  const [phase,     setPhase]     = useState('BOOT');
  const [authStage, setAuthStage] = useState('LANDING'); // 'LANDING' | 'AUTH'
  const [authInitialMode, setAuthInitialMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP'
  const [user,      setUser]      = useState(null);
  const enterLocalMode = useCallback(() => {
    const localUser = {
      uid: 'local-operator',
      displayName: 'Local Operator',
      email: 'local@wirk.workspace',
      isAnonymous: true,
      isLocal: true,
    };
    try { localStorage.setItem('wirk_mode', 'local'); } catch {}
    setUser(localUser);
    setPhase('APP');
  }, []);

  const exitLocalMode = useCallback(() => {
    try { localStorage.removeItem('wirk_mode'); } catch {}
    setUser(null);
    setPhase('AUTH');
    setAuthStage('LANDING');
  }, []);

  const [view,      setView]      = useState('DASHBOARD');
  const [sidebarX,  setSidebarX]  = useState(false);
  const [palette,   setPalette]   = useState(false);
  const [newMod,    setNewMod]    = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [shortcuts, setShortcuts] = useState(false);
  const [profile,      setProfile]      = useState(false);
  const [voiceImport,  setVoiceImport]  = useState(false);
  const [legal,        setLegal]        = useState(null);
  const [devCredits,   setDevCredits]   = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [guidesModalOpen,  setGuidesModalOpen]  = useState(false);
  const [dismissEmailBanner, setDismissEmailBanner] = useState(false);

  const { theme, setTheme, styleTheme, setStyleTheme, toggle: toggleTheme, isDark, waveState, clearWave, availableThemes, availableStyles } = useTheme();
  const { ready: encReady, init: encInit, encrypt: encryptFn, decryptEntries } = useEncryption();
  const [diaryLinkTasks, setDiaryLinkTasks] = useState(() => localStorage.getItem('diary-link-tasks') === 'true');

  const {
    projects, tasks, notes, diary, logs, stats,
    calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    createProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask,
    moveTaskStatus, rebalanceProjectColumn,
    setTaskBlocker,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    planTaskForToday, unplanTaskForToday,
    saveNote, deleteNote,
    recordFocusSession,
    saveDiaryEntry, deleteDiaryEntry,
    importData,
    ariaMemory, saveAriaMemoryFact,
    ariaChatHistory, saveAriaMessages, clearAriaChatHistory,
  } = useData(user, encReady ? encryptFn : null, encReady ? decryptEntries : null);

  // Pomodoro — lives at App level so it persists across view changes
  const pomodoro = usePomodoro({
    onSessionComplete: useCallback(({ taskId, type, durationMs }) => {
      if (recordFocusSession) recordFocusSession({ taskId, type, durationMs });
    }, [recordFocusSession]),
  });

  // ── ARIA Companion Persistent State ──
  const [ariaMessages, setAriaMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(`forge_aria_chat_${user?.uid || 'guest'}`);
      return cached ? JSON.parse(cached) : [{
        id: 'init-1',
        role: 'model',
        text: "Hello! I am ARIA, your executive orchestrator and strategic companion in WIRK. How can I assist you with your projects, daily planning, or reflections today?",
        approvedProposals: [],
      }];
    } catch {
      return [{
        id: 'init-1',
        role: 'model',
        text: "Hello! I am ARIA, your executive orchestrator and strategic companion in WIRK. How can I assist you with your projects, daily planning, or reflections today?",
        approvedProposals: [],
      }];
    }
  });
  const [ariaOrbState, setAriaOrbState] = useState('idle');
  const [ariaIsMuted, setAriaIsMuted]   = useState(false);
  const ariaHistoryRef = useRef([]);

  // Sync ariaMessages with Firestore/local persistent state
  useEffect(() => {
    if (ariaChatHistory && ariaChatHistory.length > 0) {
      setAriaMessages(ariaChatHistory);
    }
  }, [ariaChatHistory]);

  // Sync ariaHistoryRef with ariaMessages for AI context window
  useEffect(() => {
    if (ariaMessages && ariaMessages.length > 0) {
      const formatted = [];
      for (const m of ariaMessages) {
        if (m.role === 'user') {
          formatted.push({ role: 'user', parts: [{ text: m.text ?? '(voice note)' }] });
        } else if (m.role === 'model') {
          formatted.push({ role: 'model', parts: [{ text: m.text ?? '' }] });
        }
      }
      ariaHistoryRef.current = formatted.slice(-20);
    }
  }, [ariaMessages]);

  // Cancel speech synthesis when leaving ARIA view
  useEffect(() => {
    if (view !== 'ARIA') {
      window.speechSynthesis?.cancel();
      setAriaOrbState('idle');
    }
  }, [view]);

  const handleSendAriaMessage = useCallback(async ({ text, audioBase64, audioMimeType, contextPayload, continueMsgId, partialText }) => {
    if (text && !continueMsgId) {
      setAriaMessages(m => {
        const next = [...m, { id: 'msg-' + Date.now(), role: 'user', text }];
        saveAriaMessages(next);
        return next;
      });
    }
    setAriaOrbState('thinking');
    const t0 = performance.now();
    const activeGeminiKey = getStoredGeminiKey();
    let reply = '';
    let finishReason = 'STOP';

    try {
      if (activeGeminiKey) {
        // Direct Client-Side BYOK Invocation (Open Source Mode)
        const directRes = await callGeminiDirect({
          prompt: continueMsgId ? (text || 'Please continue directly from where you stopped.') : text,
          systemPrompt: getAriaSystemPrompt(tasks, projects),
          history: ariaHistoryRef.current.slice(-10),
        });
        reply = directRes.text || '';
        finishReason = directRes.finishReason || 'STOP';
      } else {
        // Fallback to serverless /api/chat if deployed with cloud backend
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: continueMsgId ? (text || 'Please continue directly from where you stopped.') : text,
            audioBase64,
            audioMimeType,
            history: ariaHistoryRef.current.slice(-20),
            contextPayload,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        reply = data.reply || '';
        finishReason = data.finishReason || 'STOP';
      }
    } catch (apiErr) {
      if (!activeGeminiKey) {
        reply = "👋 **Welcome to WIRK Open-Source!**\n\nTo enable ARIA's autonomous workspace reasoning and project breakdowns, please paste your Google Gemini API key in **Settings (Press 'P' or click your avatar) → AI Keys & BYOK**.\n\nYour key is kept safe and local inside your browser's local storage and calls Google Gemini directly with zero backend required.";
        finishReason = 'STOP';
      } else {
        throw apiErr;
      }
    }

      recordAiUsage({
        endpoint: 'chat',
        feature: 'ARIA',
        latencyMs: duration,
        usage: data.usageMetadata,
        success: true,
        statusText: '200 OK',
        note: `Generated ${reply.length} chars (finishReason: ${finishReason})`
      });

      if (continueMsgId) {
        // Seamlessly stitch continuation onto existing message
        setAriaMessages(m => {
          const next = m.map(item => {
            if (item.id === continueMsgId) {
              const baseText = (item.text || '').trimEnd();
              const stitched = baseText ? `${baseText}\n${reply.trimStart()}` : reply;
              return {
                ...item,
                text: stitched,
                finishReason,
                isTruncated: finishReason === 'MAX_TOKENS',
              };
            }
            return item;
          });
          saveAriaMessages(next);
          return next;
        });

        if (ariaHistoryRef.current.length > 0) {
          const lastTurn = ariaHistoryRef.current[ariaHistoryRef.current.length - 1];
          if (lastTurn && lastTurn.role === 'model') {
            lastTurn.parts = [{ text: (lastTurn.parts[0]?.text || '') + '\n' + reply }];
          } else {
            ariaHistoryRef.current.push(
              { role: 'user', parts: [{ text: text || 'Please continue directly from where you stopped.' }] },
              { role: 'model', parts: [{ text: reply }] }
            );
          }
        }
      } else {
        const msgId = 'model-' + Date.now();
        setAriaMessages(m => {
          const next = [...m, {
            id: msgId,
            role: 'model',
            text: reply,
            finishReason,
            isTruncated: finishReason === 'MAX_TOKENS',
            approvedProposals: []
          }];
          saveAriaMessages(next);
          return next;
        });
        ariaHistoryRef.current.push(
          { role: 'user', parts: [{ text: text ?? '(voice note)' }] },
          { role: 'model', parts: [{ text: reply }] }
        );
      }

      if (!ariaIsMuted) {
        setAriaOrbState('speaking');
        speakText(reply, undefined, () => setAriaOrbState('idle'));
      } else {
        setAriaOrbState('idle');
      }
    } catch (err) {
      console.error('[aria chat]', err);
      setAriaMessages(m => {
        const next = [...m, { id: 'err-' + Date.now(), role: 'model', text: "I'm sorry, I couldn't process that request right now. Please try again." }];
        saveAriaMessages(next);
        return next;
      });
      setAriaOrbState('idle');
    }
  }, [ariaIsMuted, saveAriaMessages]);

  const handleContinueAriaMessage = useCallback(async (msgId, partialText) => {
    const prompt = "Please continue immediately from where you stopped. Complete all remaining tasks and emit the full ```json_proposal``` block with all CREATE_PROJECT and CREATE_TASK actions now.";
    await handleSendAriaMessage({
      text: prompt,
      continueMsgId: msgId,
      partialText,
    });
  }, [handleSendAriaMessage]);

  const executeSingleProposal = useCallback(async (proposal) => {
    if (!proposal || !proposal.type) return;

    if (proposal.type === 'CREATE_TASK' && proposal.task) {
      await addTask(proposal.task);
    } else if (proposal.type === 'UPDATE_TASK' && proposal.taskId) {
      await updateTask(proposal.taskId, proposal.updates || {});
    } else if (proposal.type === 'DELETE_TASK' && proposal.taskId) {
      await deleteTask(proposal.taskId);
    } else if (proposal.type === 'MOVE_TASK_STATUS' && proposal.taskId && proposal.status) {
      await moveTaskStatus(proposal.taskId, proposal.status);
    } else if (proposal.type === 'CREATE_PROJECT' && proposal.project) {
      await createProject(proposal.project);
    } else if (proposal.type === 'UPDATE_PROJECT' && proposal.projectId) {
      await updateProject(proposal.projectId, proposal.updates || {});
    } else if (proposal.type === 'DELETE_PROJECT' && proposal.projectId) {
      await deleteProject(proposal.projectId);
    } else if (proposal.type === 'PLAN_DAY') {
      const ids = proposal.taskIds || (proposal.taskId ? [proposal.taskId] : []);
      for (const id of ids) {
        await planTaskForToday(id);
      }
    } else if (proposal.type === 'PLAN_TASK' && proposal.taskId) {
      await planTaskForToday(proposal.taskId);
    } else if (proposal.type === 'UNPLAN_TASK' && proposal.taskId) {
      await unplanTaskForToday(proposal.taskId);
    } else if (proposal.type === 'WRITE_DIARY') {
      const dKey = proposal.date || new Date().toISOString().slice(0, 10);
      await saveDiaryEntry(dKey, { content: proposal.content, mood: proposal.mood || '🔥' });
    } else if (proposal.type === 'SAVE_NOTE') {
      await saveNote({
        projectId: proposal.projectId ?? null,
        content: proposal.content || '',
        title: proposal.title || '',
      });
    } else if (proposal.type === 'SET_BLOCKER' && proposal.taskId) {
      await setTaskBlocker(proposal.taskId, proposal.reason || 'Blocked', proposal.dependencyTaskId || null);
    } else if (proposal.type === 'CLEAR_BLOCKER' && proposal.taskId) {
      await setTaskBlocker(proposal.taskId, null, null);
    } else if (proposal.type === 'CREATE_CALENDAR_EVENT' && proposal.event) {
      await addCalendarEvent(proposal.event);
    } else if (proposal.type === 'UPDATE_CALENDAR_EVENT' && proposal.eventId) {
      await updateCalendarEvent(proposal.eventId, proposal.updates || {});
    } else if (proposal.type === 'DELETE_CALENDAR_EVENT' && proposal.eventId) {
      await deleteCalendarEvent(proposal.eventId);
    } else if (proposal.type === 'SAVE_MEMORY' && proposal.memoryText) {
      if (saveAriaMemoryFact) await saveAriaMemoryFact(proposal.memoryText);
    } else if (proposal.type === 'OPEN_DEV_CREDITS') {
      setDevCredits(true);
    }
  }, [addTask, updateTask, deleteTask, moveTaskStatus, createProject, updateProject, deleteProject, planTaskForToday, unplanTaskForToday, saveDiaryEntry, saveNote, setTaskBlocker, saveAriaMemoryFact, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent]);

  const handleApproveAriaProposal = useCallback(async (msgId, proposalIdx, proposal) => {
    try {
      await executeSingleProposal(proposal);
      setAriaMessages(mList => {
        const next = mList.map(m => {
          if (m.id === msgId) {
            const prevApproved = m.approvedProposals || [];
            return { ...m, approvedProposals: [...prevApproved, proposalIdx] };
          }
          return m;
        });
        saveAriaMessages(next);
        return next;
      });
    } catch (err) {
      console.error('[aria proposal approval error]', err);
    }
  }, [executeSingleProposal, saveAriaMessages]);

  const handleApproveAllAriaProposals = useCallback(async (msgId, proposals) => {
    try {
      for (let i = 0; i < proposals.length; i++) {
        await executeSingleProposal(proposals[i]);
      }
      setAriaMessages(mList => {
        const next = mList.map(m => {
          if (m.id === msgId) {
            return { ...m, approvedProposals: proposals.map((_, i) => i) };
          }
          return m;
        });
        saveAriaMessages(next);
        return next;
      });
    } catch (err) {
      console.error('[aria all proposals approval error]', err);
    }
  }, [executeSingleProposal, saveAriaMessages]);

  const handleClearAriaChat = useCallback(async () => {
    window.speechSynthesis?.cancel();
    setAriaOrbState('idle');
    ariaHistoryRef.current = [];
    await clearAriaChatHistory();
  }, [clearAriaChatHistory]);

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
    if (!u) setAuthStage('LANDING');
    if (u) encInit(u.uid);
  }), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      // Hidden Developer Console Shortcut: Ctrl+Shift+D or Cmd+Shift+D or Alt+Shift+D
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.altKey && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        setDevCredits(c => !c);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette(p => !p); return; }
      if (e.key === 'Escape') {
        setPalette(false); setEditTask(null); setNewMod(false); setShortcuts(false); setProfile(false); setVoiceImport(false); setLegal(null); setDevCredits(false);
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

  const handleToggleTask = useCallback((taskOrId) => {
    if (!taskOrId) return;
    const targetId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    const targetTask = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => t.id === targetId);
    if (targetId && targetTask) {
      updateTask(targetId, { completed: !targetTask.completed });
    } else if (targetId) {
      updateTask(targetId, { completed: true });
    }
  }, [tasks, updateTask]);
  const handleSaveTask   = useCallback((id, patch) => updateTask(id, patch), [updateTask]);
  const handleSaveTaskModal = useCallback(async (id, data) => {
    if (editTask?.isNew) {
      await addTask(data);
    } else {
      await updateTask(id, data);
    }
  }, [editTask, addTask, updateTask]);
  const handleEditTask   = useCallback((taskOrPatch) => {
    if (taskOrPatch?.text !== undefined) setEditTask(taskOrPatch);
    else handleSaveTask(taskOrPatch.id, taskOrPatch);
  }, [handleSaveTask]);

  // Focus a task with Pomodoro — start immediately and switch to Today or stay on current view
  const handleFocusTask = useCallback((task) => {
    pomodoro.startWork(task);
  }, [pomodoro]);

  if (phase === 'BOOT') return <BootScreen />;
  if (phase === 'AUTH') {
    if (authStage === 'LANDING') {
      return (
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode || 'LOGIN');
            setAuthStage('AUTH');
          }}
          onToggleTheme={toggleTheme}
          isDark={isDark}
          onLegalClick={(tabId) => setLegal(tabId)}
        />
      );
    }
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onBackToLanding={() => setAuthStage('LANDING')}
        onSuccess={() => setPhase('APP')}
      />
    );
  }

  return (
    <ToastProvider>
    <ThemeWaveOverlay wave={waveState} onComplete={clearWave} />
    <div className="flex h-full overflow-hidden relative" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient Mesh Lighting Background */}
      <div className="executive-ambient-mesh" />

      <Sidebar
        active={view} setActive={setView}
        user={user} stats={stats}
        expanded={sidebarX} setExpanded={setSidebarX}
        onProfile={() => setProfile(true)}
        onThemeToggle={toggleTheme}
        isDark={isDark}
        onUpgrade={() => setUpgradeModalOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b shrink-0 glass-panel"
             style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <WirkLogo size={16} glow={true} />
            <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>WIRK</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="text-sm p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
              {isDark ? '☀' : '◑'}
            </button>
            <button onClick={() => setPalette(true)}
              className="text-[10px] font-medium border border-white/10 px-2.5 py-1 rounded-lg glass-pill text-gray-300">
              ⌘K
            </button>
          </div>
        </div>

        {/* Upgrade Email Banner for legacy username accounts */}
        {user?.email?.endsWith('@enginecore.dev') && !dismissEmailBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-[11px] text-amber-300 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">💡 Account Notice:</span>
              <span>Logged in with legacy username (<span className="font-mono text-amber-200">{user.email}</span>). Set your real email address for password resets.</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setProfile(true)} className="underline text-amber-300 font-bold hover:text-amber-100 transition-colors">
                Update Email
              </button>
              <button onClick={() => setDismissEmailBanner(true)} className="text-amber-400/60 hover:text-amber-300">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Absolute Viewport Frame — Guarantees 100% Native Scrolling across all browsers */}
        <div className="flex-1 min-h-0 min-w-0 relative">
          <div className={`absolute inset-0 ${view === 'ARIA' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto scroll'}`}>
            {view === 'ARIA' && (
              <CompanionView
                user={user}
                projects={projects}
                tasks={tasks}
                diary={diary}
                notes={notes}
                calendarEvents={calendarEvents}
                ariaMemory={ariaMemory}
                messages={ariaMessages}
                onSendMessage={handleSendAriaMessage}
                onContinueMessage={handleContinueAriaMessage}
                onApproveProposal={handleApproveAriaProposal}
                onApproveAllProposals={handleApproveAllAriaProposals}
                orbState={ariaOrbState}
                setOrbState={setAriaOrbState}
                isMuted={ariaIsMuted}
                setIsMuted={setAriaIsMuted}
                onClearChat={handleClearAriaChat}
                onNavigate={setView}
                onFocusTask={handleFocusTask}
                onEditTask={setEditTask}
                onToggleTask={handleToggleTask}
                onOpenProject={(projId) => setView('MODULES')}
              />
            )}
            {view === 'TODAY' && (
              <TodayView
                tasks={tasks}
                projects={projects}
                onUpdateTask={handleSaveTask}
                onFocusTask={handleFocusTask}
                onEditTask={setEditTask}
                onToggleChecklist={toggleChecklistItem}
                onPlanTask={planTaskForToday}
                onUnplanTask={unplanTaskForToday}
              />
            )}
            {view === 'DASHBOARD' && (
              <DashboardView
                user={user}
                projects={projects}
                tasks={tasks}
                stats={stats}
                logs={logs}
                styleTheme={styleTheme}
                onNewProject={() => setNewMod(true)}
                onNavigate={setView}
                onAddTask={addTask}
                onToggleTask={handleToggleTask}
                onVoiceImport={() => setVoiceImport(true)}
                onOpenNewTaskModal={() => {
                  if (projects.length === 0) setNewMod(true);
                  else setEditTask({ isNew: true, projectId: projects[0].id, text: '', priority: 'MED' });
                }}
              />
            )}
            {view === 'MODULES' && (
              <ModulesView
                projects={projects}
                tasks={tasks}
                stats={stats}
                onAddTask={addTask}
                onDeleteTask={deleteTask}
                onEditTask={setEditTask}
                onToggleTask={handleToggleTask}
                onFocusTask={handleFocusTask}
                onMoveTaskStatus={moveTaskStatus}
                onNewProject={() => setNewMod(true)}
                onUpdateProject={updateProject}
                onDeleteProject={deleteProject}
                onVoiceImport={() => setVoiceImport(true)}
              />
            )}
            {view === 'ANALYTICS' && (
              <AnalyticsView projects={projects} tasks={tasks} stats={stats} />
            )}
            {view === 'CALENDAR' && (
              <CalendarView
                tasks={tasks}
                projects={projects}
                events={calendarEvents}
                onSaveEvent={addCalendarEvent}
                onDeleteEvent={deleteCalendarEvent}
                onAddTask={addTask}
                onToggle={handleToggleTask}
                onEdit={setEditTask}
              />
            )}
            {view === 'DIARY' && (
              <DiaryView
                diary={diary}
                tasks={tasks}
                projects={projects}
                user={user}
                onSave={saveDiaryEntry}
                onDelete={deleteDiaryEntry}
                diaryLinkTasks={diaryLinkTasks}
              />
            )}
            {view === 'NOTES' && (
              <NotesView notes={notes} projects={projects} onSave={saveNote} onDelete={deleteNote} />
            )}
            {view === 'SEARCH' && (
              <SearchView tasks={tasks} projects={projects}
                onToggle={handleToggleTask} onDelete={deleteTask} onEdit={setEditTask} />
            )}
            {!['ARIA','TODAY','DASHBOARD','MODULES','ANALYTICS','CALENDAR','DIARY','NOTES','SEARCH'].includes(view) && (
              <NotFoundView onReturnHome={() => setView('DASHBOARD')} />
            )}
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      <CommandPalette
        open={palette} onClose={() => setPalette(false)}
        setView={setView}
        tasks={tasks}
        projects={projects}
        onOpenTask={(task) => setEditTask(task)}
        onNewProject={() => { setNewMod(true); setPalette(false); }}
        onShortcuts={() => { setShortcuts(true); setPalette(false); }}
        onProfile={() => { setProfile(true); setPalette(false); }}
        onThemeToggle={() => { toggleTheme(); setPalette(false); }}
        onVoiceImport={() => { setVoiceImport(true); setPalette(false); }}
        onDevCredits={() => { setDevCredits(true); setPalette(false); }}
      />
      {newMod && (
        <NewProjectModal onClose={() => setNewMod(false)}
          onCreate={async (data) => { await createProject(data); setNewMod(false); }} />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          projects={projects}
          tasks={tasks}
          onSave={handleSaveTaskModal}
          onDelete={deleteTask}
          onClose={() => setEditTask(null)}
          onFocusTask={handleFocusTask}
        />
      )}
      {shortcuts && <KeyboardShortcutsModal onClose={() => setShortcuts(false)} />}
      {profile && user && (
        <ProfileModal user={user} tasks={tasks} projects={projects} notes={notes}
          onClose={() => setProfile(false)}
          onLegal={(tab) => { setProfile(false); setLegal(tab); }}
          onOpenDevCredits={() => { setProfile(false); setDevCredits(true); }}
          onUpgrade={() => { setProfile(false); setUpgradeModalOpen(true); }}
          diary={diary}
          diaryLinkTasks={diaryLinkTasks}
          onImportData={importData}
          currentTheme={theme}
          onSelectTheme={setTheme}
          availableThemes={availableThemes}
          currentStyle={styleTheme}
          onSelectStyle={setStyleTheme}
          availableStyles={availableStyles}
          onDiaryLinkToggle={() => {
            const next = !diaryLinkTasks;
            setDiaryLinkTasks(next);
            localStorage.setItem('diary-link-tasks', String(next));
          }} />
      )}

      {/* Developer AI Credits & Quota Console Modal */}
      {devCredits && (
        <DevCreditsModal
          open={devCredits}
          onClose={() => setDevCredits(false)}
        />
      )}

      {/* Executive Pro & SaaS Upgrade Modal */}
      {upgradeModalOpen && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      )}

      {/* Productivity & Engineering Guides Modal */}
      {guidesModalOpen && (
        <ProductivityGuidesModal
          isOpen={guidesModalOpen}
          onClose={() => setGuidesModalOpen(false)}
        />
      )}

      {/* Voice Import Modal */}
      {voiceImport && (
        <VoiceImportModal
          onClose={() => { setVoiceImport(false); setView('MODULES'); }}
          onCreate={createProject}
          onAddTask={addTask}
          projects={projects}
        />
      )}

      {/* Pomodoro timer — always mounted, persists across all view changes */}
      {user && (
        <PomodoroWidget pomodoro={pomodoro} tasks={tasks} projects={projects} activeView={view} />
      )}

      {/* Legal */}
      {legal && <LegalView initialTab={legal} onClose={() => setLegal(null)}/>}
    </div>
    </ToastProvider>
  );
}
