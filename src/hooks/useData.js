import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, where, getDocs, writeBatch,
} from 'firebase/firestore';
import { db, APP_ID, isFirebaseConfigured } from '../firebase.js';
import { getPriority, computeStreak } from '../constants.js';
import { calculateNewOrder, rebalanceColumn, sortByOrder, needsRebalance, ORDER_STEP } from '../utils/ordering.js';
import { validateTaskDependency, validateParentChild } from '../utils/taskValidation.js';

const pRef  = (uid, ...segs) => db ? collection(db, 'artifacts', APP_ID, 'users', uid, ...segs) : null;
const dRef  = (uid, col, id) => db ? doc(db, 'artifacts', APP_ID, 'users', uid, col, id) : null;

// Stable note doc ID from projectId (or 'global')
const noteDocId = (projectId) => `note__${projectId ?? 'global'}`;

export { getLocalDateKey, normalizeTask } from '../utils/taskNormalizer.js';
import { getLocalDateKey, normalizeTask } from '../utils/taskNormalizer.js';

// Default starter data for Open Source local-first mode
const DEFAULT_LOCAL_PROJECTS = [
  {
    id: 'proj_wirk_onboarding',
    title: 'WIRK_SYSTEM',
    color: '#06B6D4',
    icon: '⚡',
    description: 'Workspace for Intent, Reflection & Kinetic action — Open Source Edition.',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'proj_sprint_core',
    title: 'CORE_EXECUTION',
    color: '#8B5CF6',
    icon: '🚀',
    description: 'Active sprint tasks, priorities, and daily kinetic execution.',
    createdAt: Date.now() - 3600000,
  }
];

const DEFAULT_LOCAL_TASKS = [
  {
    id: 'task_byok_gemini',
    projectId: 'proj_wirk_onboarding',
    text: 'Configure your Google Gemini API key in Settings (BYOK)',
    status: 'TODO',
    priority: 'HIGH',
    order: 1000,
    plannedDate: getLocalDateKey(),
    dueDate: getLocalDateKey(),
    checklists: [
      { id: 'chk_1', text: 'Open Settings (Press P or click Avatar)', completed: false },
      { id: 'chk_2', text: 'Select AI Keys & BYOK tab', completed: false },
      { id: 'chk_3', text: 'Paste Gemini API key and test connection', completed: false },
    ],
    notes: 'In WIRK Open-Source, ARIA can invoke Google Gemini directly from your browser with zero server setup.',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'task_kanban_flow',
    projectId: 'proj_wirk_onboarding',
    text: 'Test Kanban flow across BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE',
    status: 'IN_PROGRESS',
    priority: 'MED',
    order: 2000,
    plannedDate: getLocalDateKey(),
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'task_pomodoro_focus',
    projectId: 'proj_sprint_core',
    text: 'Start a Pomodoro focus sprint and log reflections in Diary',
    status: 'BACKLOG',
    priority: 'MED',
    order: 3000,
    createdAt: Date.now() - 5400000,
    updatedAt: Date.now() - 5400000,
  },
];

export function useData(user, encryptFn, decryptEntriesFn) {
  const isLocal = !user || user.isLocal || !db;

  const [projects, setProjects] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_projects');
        return cached ? JSON.parse(cached) : DEFAULT_LOCAL_PROJECTS;
      } catch {
        return DEFAULT_LOCAL_PROJECTS;
      }
    }
    return [];
  });

  const [tasks, setTasks] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_tasks');
        return cached ? JSON.parse(cached) : DEFAULT_LOCAL_TASKS;
      } catch {
        return DEFAULT_LOCAL_TASKS;
      }
    }
    return [];
  });

  const [notes, setNotes] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_notes');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [sessions, setSessions] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_sessions');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [diary, setDiary] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_diary');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [ariaMemory, setAriaMemory] = useState(() => {
    if (isLocal) {
      try {
        const cached = localStorage.getItem('wirk_local_aria_memory');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [ariaChatHistory, setAriaChatHistory] = useState(() => {
    try {
      const cached = localStorage.getItem(`wirk_aria_chat_${user?.uid || 'guest'}`) || localStorage.getItem(`forge_aria_chat_${user?.uid || 'guest'}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('wirk_calendar_events') || localStorage.getItem('engine_calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState(['[SYSTEM] WIRK Local-First initialized.', '[READY] Standing by...']);

  const addLog = useCallback((msg) =>
    setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 9)]), []);

  // Sync to local storage whenever local state changes
  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_projects', JSON.stringify(projects)); } catch {}
    }
  }, [isLocal, projects]);

  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_tasks', JSON.stringify(tasks)); } catch {}
    }
  }, [isLocal, tasks]);

  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_notes', JSON.stringify(notes)); } catch {}
    }
  }, [isLocal, notes]);

  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_sessions', JSON.stringify(sessions)); } catch {}
    }
  }, [isLocal, sessions]);

  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_diary', JSON.stringify(diary)); } catch {}
    }
  }, [isLocal, diary]);

  useEffect(() => {
    if (isLocal) {
      try { localStorage.setItem('wirk_local_aria_memory', JSON.stringify(ariaMemory)); } catch {}
    }
  }, [isLocal, ariaMemory]);

  // Firestore Sync when cloud user is authenticated
  useEffect(() => {
    if (isLocal || !user || !db) return;
    const now = Date.now();
    const qP = query(pRef(user.uid, 'projects'), orderBy('createdAt', 'desc'));
    const qT = query(pRef(user.uid, 'tasks'),    orderBy('createdAt', 'desc'));
    const qN = query(pRef(user.uid, 'notes'),    orderBy('updatedAt', 'desc'));
    const qS = query(pRef(user.uid, 'sessions'), orderBy('completedAt', 'desc'));
    const qD = query(pRef(user.uid, 'diary'),    orderBy('date', 'desc'));

    const u1 = onSnapshot(qP, s => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      e => addLog(`[ERR] projects: ${e.code}`));
    
    const u2 = onSnapshot(qT, s => {
      const normalized = s.docs.map(d => normalizeTask({ id: d.id, ...d.data() }, now));
      setTasks(normalized);
    }, e => addLog(`[ERR] tasks: ${e.code}`));

    const u3 = onSnapshot(qN, s => setNotes(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      e => addLog(`[ERR] notes: ${e.code}`));

    const u4 = onSnapshot(qS, s => setSessions(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      e => addLog(`[ERR] sessions: ${e.code}`));

    const u5 = onSnapshot(qD, async s => {
      const rawEntries = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (decryptEntriesFn) {
        try {
          const decrypted = await decryptEntriesFn(rawEntries);
          setDiary(decrypted);
        } catch (err) {
          console.error('[useData] Diary decryption failed:', err);
          setDiary(rawEntries);
        }
      } else {
        setDiary(rawEntries);
      }
    }, e => addLog(`[ERR] diary: ${e.code}`));

    const u6 = onSnapshot(pRef(user.uid, 'ariaMemory'), s => {
      setAriaMemory(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => addLog(`[ERR] ariaMemory: ${e.code}`));

    const u7 = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'ariaChat', 'history'), s => {
      if (s.exists()) {
        const data = s.data();
        if (Array.isArray(data.messages)) {
          setAriaChatHistory(data.messages);
        }
      }
    }, e => console.warn('[ariaChatHistory snapshot err]', e));

    const u8 = onSnapshot(pRef(user.uid, 'calendarEvents'), s => {
      const evts = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setCalendarEvents(evts);
      try { localStorage.setItem('wirk_calendar_events', JSON.stringify(evts)); } catch {}
    }, e => console.warn('[calendarEvents snapshot err]', e));

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); };
  }, [user, isLocal, decryptEntriesFn, addLog]);

  // ─── Project Mutations ──────────────────────────────────────────────────
  const createProject = useCallback(async (data) => {
    const titleUpper = (data.title || 'NEW_PROJECT').toUpperCase();
    const newProj = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: titleUpper,
      color: data.color || '#6366F1',
      icon: data.icon || '📁',
      description: data.description || '',
      createdAt: Date.now(),
    };

    if (isLocal) {
      setProjects(prev => [newProj, ...prev]);
      addLog(`Project created (local): ${titleUpper}`);
      return newProj.id;
    }

    const ref = pRef(user.uid, 'projects');
    const docSnap = await addDoc(ref, {
      title: titleUpper,
      color: data.color || '#6366F1',
      icon: data.icon || '📁',
      description: data.description || '',
      createdAt: Date.now(),
    });
    addLog(`Project created: ${titleUpper}`);
    return docSnap.id;
  }, [user, isLocal, addLog]);

  const updateProject = useCallback(async (id, patch) => {
    if (!id) return;
    if (isLocal) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p));
      addLog(`Project updated (local): ${patch.title || id}`);
      return;
    }
    await updateDoc(dRef(user.uid, 'projects', id), {
      ...patch,
      updatedAt: Date.now(),
    });
    addLog(`Project updated: ${patch.title || id}`);
  }, [user, isLocal, addLog]);

  const deleteProject = useCallback(async (id, name) => {
    if (!id) return;
    if (isLocal) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setNotes(prev => prev.filter(n => n.projectId !== id));
      addLog(`Project and linked tasks deleted (local): ${name || id}`);
      return;
    }

    const batch = writeBatch(db);
    batch.delete(dRef(user.uid, 'projects', id));

    const tasksQuery = query(pRef(user.uid, 'tasks'), where('projectId', '==', id));
    const tasksSnap = await getDocs(tasksQuery);
    tasksSnap.forEach(d => batch.delete(d.ref));

    const noteRef = dRef(user.uid, 'notes', noteDocId(id));
    batch.delete(noteRef);

    await batch.commit();
    addLog(`Project and ${tasksSnap.size} linked tasks deleted: ${name || id}`);
  }, [user, isLocal, addLog]);

  // ─── Task Mutations ─────────────────────────────────────────────────────
  const addTask = useCallback(async (data) => {
    const now = Date.now();
    const colTasks = tasks.filter(t => t.projectId === data.projectId && t.status === (data.status || 'BACKLOG'));
    const initialOrder = calculateNewOrder(colTasks, -1);

    const newTask = normalizeTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...data,
      order: initialOrder,
      totalFocusMs: 0,
      totalSessions: 0,
      history: [{ type: 'CREATED', timestamp: now }],
      createdAt: now,
      updatedAt: now,
    }, now);

    if (isLocal) {
      setTasks(prev => [newTask, ...prev]);
      addLog(`Task added (local): ${(data.text || '').slice(0, 20)}`);
      return newTask.id;
    }

    const ref = pRef(user.uid, 'tasks');
    const docSnap = await addDoc(ref, {
      ...newTask,
      createdAt: now,
      updatedAt: now,
    });
    addLog(`Task added: ${(data.text || '').slice(0, 20)}`);
    return docSnap.id;
  }, [user, isLocal, tasks, addLog]);

  const updateTask = useCallback(async (id, patch) => {
    if (!id) return;
    const now = Date.now();
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return;

    const cleanPatch = { ...patch, updatedAt: now };
    if (patch.status && patch.status !== existingTask.status) {
      cleanPatch.history = [
        ...(existingTask.history || []),
        { type: 'STATUS_CHANGE', from: existingTask.status, to: patch.status, timestamp: now }
      ];
      if (patch.status === 'DONE' && !existingTask.completedAt) {
        cleanPatch.completedAt = now;
      } else if (patch.status !== 'DONE' && existingTask.completedAt) {
        cleanPatch.completedAt = null;
      }
    }

    if (isLocal) {
      setTasks(prev => prev.map(t => t.id === id ? normalizeTask({ ...t, ...cleanPatch }, now) : t));
      return;
    }

    await updateDoc(dRef(user.uid, 'tasks', id), cleanPatch);
  }, [user, isLocal, tasks]);

  const deleteTask = useCallback(async (id) => {
    if (!id) return;
    if (isLocal) {
      setTasks(prev => prev.filter(t => t.id !== id && t.parentTaskId !== id));
      addLog('Task deleted (local)');
      return;
    }

    const batch = writeBatch(db);
    batch.delete(dRef(user.uid, 'tasks', id));

    const subtasks = tasks.filter(t => t.parentTaskId === id);
    subtasks.forEach(st => {
      batch.update(dRef(user.uid, 'tasks', st.id), { parentTaskId: null, updatedAt: Date.now() });
    });

    await batch.commit();
    addLog('Task deleted');
  }, [user, isLocal, tasks, addLog]);

  const moveTaskStatus = useCallback(async (id, newStatus, targetOrder, source = 'USER') => {
    if (!id) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = { status: newStatus };
    if (targetOrder !== undefined) updates.order = targetOrder;
    await updateTask(id, updates);
  }, [tasks, updateTask]);

  const rebalanceProjectColumn = useCallback(async (projectId, status) => {
    const colTasks = tasks
      .filter(t => t.projectId === projectId && t.status === status)
      .sort(sortByOrder);

    const rebalanced = rebalanceColumn(colTasks);
    if (isLocal) {
      setTasks(prev => prev.map(t => {
        const found = rebalanced.find(r => r.id === t.id);
        return found ? { ...t, order: found.order } : t;
      }));
      return;
    }

    const batch = writeBatch(db);
    rebalanced.forEach(t => {
      batch.update(dRef(user.uid, 'tasks', t.id), { order: t.order, updatedAt: Date.now() });
    });
    await batch.commit();
  }, [user, isLocal, tasks]);

  const setTaskBlocker = useCallback(async (id, blockerData) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!blockerData || !blockerData.isBlocked) {
      await updateTask(id, { blocker: { isBlocked: false, reason: '', blockedAt: null, blockedByTaskId: null } });
      return;
    }

    const depValidation = validateTaskDependency(task, blockerData.blockedByTaskId, tasks);
    if (!depValidation.valid) {
      throw new Error(depValidation.error);
    }

    await updateTask(id, {
      blocker: {
        isBlocked: true,
        reason: blockerData.reason || 'Blocked',
        blockedAt: Date.now(),
        blockedByTaskId: blockerData.blockedByTaskId || null,
      }
    });
  }, [tasks, updateTask]);

  const addChecklistItem = useCallback(async (taskId, text) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newItem = { id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, text, completed: false };
    const checklists = [...(task.checklists || []), newItem];
    await updateTask(taskId, { checklists });
  }, [tasks, updateTask]);

  const toggleChecklistItem = useCallback(async (taskId, checklistId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const checklists = (task.checklists || []).map(c =>
      c.id === checklistId ? { ...c, completed: !c.completed } : c
    );
    await updateTask(taskId, { checklists });
  }, [tasks, updateTask]);

  const deleteChecklistItem = useCallback(async (taskId, checklistId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const checklists = (task.checklists || []).filter(c => c.id !== checklistId);
    await updateTask(taskId, { checklists });
  }, [tasks, updateTask]);

  const planTaskForToday = useCallback(async (id, dateStr = getLocalDateKey()) => {
    await updateTask(id, { plannedDate: dateStr, isGoal: true });
  }, [updateTask]);

  const unplanTaskForToday = useCallback(async (id) => {
    await updateTask(id, { plannedDate: null, isGoal: false });
  }, [updateTask]);

  const recordFocusSession = useCallback(async ({ taskId, type, durationMs, sessionId }) => {
    const now = Date.now();
    const sessionObj = {
      id: sessionId || `sess_${now}_${Math.random().toString(36).substr(2, 5)}`,
      taskId: taskId || null,
      type: type || 'POMODORO',
      durationMs: durationMs || 0,
      completedAt: now,
    };

    if (isLocal) {
      setSessions(prev => [sessionObj, ...prev]);
    } else {
      await addDoc(pRef(user.uid, 'sessions'), sessionObj);
    }

    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask(taskId, {
          totalFocusMs: (task.totalFocusMs || 0) + durationMs,
          totalSessions: (task.totalSessions || 0) + 1,
        });
      }
    }
  }, [user, isLocal, tasks, updateTask]);

  const saveNote = useCallback(async ({ projectId, content, title }) => {
    const noteId = noteDocId(projectId);
    const docData = {
      id: noteId,
      projectId: projectId ?? null,
      title: title || 'Project Note',
      content: content || '',
      updatedAt: Date.now(),
    };

    if (isLocal) {
      setNotes(prev => {
        const filtered = prev.filter(n => n.id !== noteId);
        return [docData, ...filtered];
      });
      return;
    }

    await setDoc(dRef(user.uid, 'notes', noteId), docData, { merge: true });
  }, [user, isLocal]);

  const deleteNote = useCallback(async (projectId) => {
    const noteId = noteDocId(projectId);
    if (isLocal) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      return;
    }
    await deleteDoc(dRef(user.uid, 'notes', noteId));
  }, [user, isLocal]);

  const saveDiaryEntry = useCallback(async (dateStr, fields) => {
    let payload = { ...fields, date: dateStr, updatedAt: Date.now() };
    if (encryptFn && payload.content) {
      payload.content = await encryptFn(payload.content);
    }

    if (isLocal) {
      setDiary(prev => {
        const filtered = prev.filter(d => (d.date || d.id) !== dateStr);
        return [{ id: dateStr, ...payload }, ...filtered];
      });
      return;
    }

    await setDoc(dRef(user.uid, 'diary', dateStr), payload, { merge: true });
  }, [user, isLocal, encryptFn]);

  const deleteDiaryEntry = useCallback(async (dateStr) => {
    if (isLocal) {
      setDiary(prev => prev.filter(d => (d.date || d.id) !== dateStr));
      return;
    }
    await deleteDoc(dRef(user.uid, 'diary', dateStr));
  }, [user, isLocal]);

  const saveAriaMemoryFact = useCallback(async (memoryText) => {
    if (!memoryText) return;
    const fact = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fact: memoryText,
      createdAt: Date.now(),
    };
    if (isLocal) {
      setAriaMemory(prev => [fact, ...prev]);
      return;
    }
    await addDoc(pRef(user.uid, 'ariaMemory'), fact);
  }, [user, isLocal]);

  const importData = useCallback(async (backup, replace = false) => {
    if (!backup) throw new Error('Invalid import data.');

    if (isLocal) {
      if (replace) {
        setProjects(backup.projects || []);
        setTasks(backup.tasks || []);
        setNotes(backup.notes || []);
      } else {
        setProjects(p => [...(backup.projects || []), ...p]);
        setTasks(t => [...(backup.tasks || []), ...t]);
        setNotes(n => [...(backup.notes || []), ...n]);
      }
      addLog('Import completed into local storage.');
      return { projectsCount: (backup.projects || []).length, tasksCount: (backup.tasks || []).length };
    }

    const batchOps = writeBatch(db);
    if (replace) {
      const [ep, et, en] = await Promise.all([
        getDocs(pRef(user.uid, 'projects')),
        getDocs(pRef(user.uid, 'tasks')),
        getDocs(pRef(user.uid, 'notes')),
      ]);
      ep.forEach(d => batchOps.delete(d.ref));
      et.forEach(d => batchOps.delete(d.ref));
      en.forEach(d => batchOps.delete(d.ref));
      await batchOps.commit();
    }

    (backup.projects || []).forEach(p => {
      const ref = doc(pRef(user.uid, 'projects'), p.id);
      batchOps.set(ref, p);
    });
    (backup.tasks || []).forEach(t => {
      const ref = doc(pRef(user.uid, 'tasks'), t.id);
      batchOps.set(ref, t);
    });
    (backup.notes || []).forEach(n => {
      const ref = doc(pRef(user.uid, 'notes'), n.id);
      batchOps.set(ref, n);
    });

    await batchOps.commit();
    addLog('Import completed into cloud database.');
    return { projectsCount: (backup.projects || []).length, tasksCount: (backup.tasks || []).length };
  }, [user, isLocal, addLog]);

  // ─── Stats Computation ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const active = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const inReview = tasks.filter(t => t.status === 'IN_REVIEW').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const backlog = tasks.filter(t => t.status === 'BACKLOG').length;
    const pending = todo + active + inReview;
    const blocked = tasks.filter(t => t.blocker?.isBlocked).length;

    const rootTasks = tasks.filter(t => !t.parentTaskId).length;
    const subtasks = tasks.filter(t => Boolean(t.parentTaskId)).length;
    const subtasksDone = tasks.filter(t => Boolean(t.parentTaskId) && t.status === 'DONE').length;

    let checklistsTotal = 0;
    let checklistsDone = 0;
    tasks.forEach(t => {
      (t.checklists || []).forEach(c => {
        checklistsTotal++;
        if (c.completed) checklistsDone++;
      });
    });
    const checklistsPct = checklistsTotal ? Math.round((checklistsDone / checklistsTotal) * 100) : 0;

    const now = new Date(); now.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateKey();

    const overdue = tasks.filter(t =>
      t.status !== 'DONE' && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now
    ).length;

    const dueToday = tasks.filter(t =>
      t.status !== 'DONE' && t.dueDate === todayStr
    ).length;

    const todayPlannedTasks = tasks.filter(t => t.plannedDate === todayStr || t.isGoal);
    const plannedToday = todayPlannedTasks.length;
    const plannedTodayDone = todayPlannedTasks.filter(t => t.status === 'DONE').length;
    const plannedTodayPct = plannedToday ? Math.round((plannedTodayDone / plannedToday) * 100) : 0;

    const pct = total ? Math.round((done / total) * 100) : 0;
    const actionableTotal = pending + done;
    const actionablePct = actionableTotal ? Math.round((done / actionableTotal) * 100) : 0;

    const byStatus = {
      BACKLOG: backlog,
      TODO: todo,
      IN_PROGRESS: active,
      IN_REVIEW: inReview,
      DONE: done,
    };

    const byPriority = Object.fromEntries(
      ['CRITICAL', 'HIGH', 'MED', 'LOW'].map(k => [
        k, tasks.filter(t => t.status !== 'DONE' && t.priority === k).length
      ])
    );

    const byProject = {};
    projects.forEach(p => {
      const pt = tasks.filter(t => t.projectId === p.id);
      const pd = pt.filter(t => t.status === 'DONE').length;
      const pActive = pt.filter(t => t.status === 'IN_PROGRESS').length;
      const pReview = pt.filter(t => t.status === 'IN_REVIEW').length;
      const pTodo = pt.filter(t => t.status === 'TODO').length;
      const pBacklog = pt.filter(t => t.status === 'BACKLOG').length;
      const pBlocked = pt.filter(t => t.blocker?.isBlocked).length;
      const pOver = pt.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now).length;
      const focusMs = pt.reduce((s, t) => s + (t.totalFocusMs || 0), 0);
      const focusSess = pt.reduce((s, t) => s + (t.totalSessions || 0), 0);
      
      let pChkTotal = 0;
      let pChkDone = 0;
      pt.forEach(t => {
        (t.checklists || []).forEach(c => {
          pChkTotal++;
          if (c.completed) pChkDone++;
        });
      });

      byProject[p.id] = {
        total: pt.length,
        done: pd,
        active: pActive,
        inReview: pReview,
        todo: pTodo,
        backlog: pBacklog,
        blocked: pBlocked,
        pct: pt.length ? Math.round((pd / pt.length) * 100) : 0,
        overdue: pOver,
        focusMs,
        focusSess,
        checklistsTotal: pChkTotal,
        checklistsDone: pChkDone,
      };
    });

    const highFocus = tasks
      .filter(t => t.status !== 'DONE' && (t.priority === 'CRITICAL' || t.priority === 'HIGH'))
      .sort((a, b) => getPriority(a.priority).order - getPriority(b.priority).order)
      .slice(0, 6);

    const streak = computeStreak(tasks);

    return {
      total, done, active, inReview, todo, backlog, pending, blocked,
      rootTasks, subtasks, subtasksDone,
      checklistsTotal, checklistsDone, checklistsPct,
      pct, actionablePct, overdue, dueToday,
      plannedToday, plannedTodayDone, plannedTodayPct,
      byStatus, byPriority, byProject, highFocus, streak,
    };
  }, [tasks, projects]);

  // ─── ARIA Chat & Calendar ───────────────────────────────────────────────
  const saveAriaMessages = useCallback(async (msgs) => {
    setAriaChatHistory(msgs);
    try {
      localStorage.setItem(`wirk_aria_chat_${user?.uid || 'guest'}`, JSON.stringify(msgs));
      if (!isLocal && user && db) {
        await setDoc(dRef(user.uid, 'ariaChat', 'history'), {
          messages: msgs.slice(-50),
          updatedAt: Date.now()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('[saveAriaMessages err]', e);
    }
  }, [user, isLocal]);

  const clearAriaChatHistory = useCallback(async () => {
    const initial = [{
      id: 'init-1',
      role: 'model',
      text: "Hello! I am ARIA, your executive orchestrator and strategic companion in WIRK. How can I assist you with your projects, daily planning, or reflections today?",
      approvedProposals: [],
    }];
    setAriaChatHistory(initial);
    try {
      localStorage.removeItem(`wirk_aria_chat_${user?.uid || 'guest'}`);
      if (!isLocal && user && db) {
        await setDoc(dRef(user.uid, 'ariaChat', 'history'), {
          messages: initial,
          updatedAt: Date.now()
        });
      }
    } catch (e) {
      console.warn('[clearAriaChatHistory err]', e);
    }
  }, [user, isLocal]);

  const addCalendarEvent = useCallback(async (eventData) => {
    const newId = eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const cleanEvt = {
      id: newId,
      title: eventData.title || 'Untitled Event',
      category: eventData.category || 'event',
      date: eventData.date || new Date().toISOString().slice(0, 10),
      time: eventData.time || '',
      hasTime: Boolean(eventData.time),
      location: eventData.location || '',
      notes: eventData.notes || '',
      projectId: eventData.projectId || null,
      createdAt: Date.now(),
    };
    setCalendarEvents(prev => {
      const next = [...prev, cleanEvt];
      try { localStorage.setItem('wirk_calendar_events', JSON.stringify(next)); } catch {}
      return next;
    });
    if (!isLocal && user && db) {
      try {
        await setDoc(dRef(user.uid, 'calendarEvents', newId), cleanEvt);
      } catch (err) {
        console.warn('[addCalendarEvent err]', err);
      }
    }
    return cleanEvt;
  }, [user, isLocal]);

  const updateCalendarEvent = useCallback(async (eventId, patch) => {
    setCalendarEvents(prev => {
      const next = prev.map(e => e.id === eventId ? { ...e, ...patch, updatedAt: Date.now() } : e);
      try { localStorage.setItem('wirk_calendar_events', JSON.stringify(next)); } catch {}
      return next;
    });
    if (!isLocal && user && db) {
      try {
        await updateDoc(dRef(user.uid, 'calendarEvents', eventId), { ...patch, updatedAt: Date.now() });
      } catch (err) {
        console.warn('[updateCalendarEvent err]', err);
      }
    }
  }, [user, isLocal]);

  const deleteCalendarEvent = useCallback(async (eventId) => {
    setCalendarEvents(prev => {
      const next = prev.filter(e => e.id !== eventId);
      try { localStorage.setItem('wirk_calendar_events', JSON.stringify(next)); } catch {}
      return next;
    });
    if (!isLocal && user && db) {
      try {
        await deleteDoc(dRef(user.uid, 'calendarEvents', eventId));
      } catch (err) {
        console.warn('[deleteCalendarEvent err]', err);
      }
    }
  }, [user, isLocal]);

  return {
    projects, tasks, notes, sessions, diary, logs, stats, ariaMemory, ariaChatHistory,
    calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    createProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask,
    moveTaskStatus, rebalanceProjectColumn,
    setTaskBlocker,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    planTaskForToday, unplanTaskForToday,
    saveNote, deleteNote,
    saveDiaryEntry, deleteDiaryEntry,
    saveAriaMemoryFact,
    importData,
    recordFocusSession,
    saveAriaMessages, clearAriaChatHistory,
    isLocal,
  };
}
