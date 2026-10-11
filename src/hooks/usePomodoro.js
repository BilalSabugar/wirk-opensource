import { useState, useRef, useCallback, useEffect } from 'react';

export const DEFAULT_POMO_CONFIG = {
  workMin:        25,
  breakMin:       5,
  longBreakMin:   15,
  longBreakAfter: 4,   // sessions before long break
};

// Phases: 'idle' | 'work' | 'break' | 'longBreak' | 'paused'
// Transition states: 'work-done' | 'break-done'

const loadConfig = () => {
  try { return { ...DEFAULT_POMO_CONFIG, ...JSON.parse(localStorage.getItem('pomo-cfg') ?? '{}') }; }
  catch { return DEFAULT_POMO_CONFIG; }
};

/**
 * onSessionComplete({ taskId, type: 'work'|'break', durationMs })
 * Called whenever a full phase is completed (not skipped).
 */
export function usePomodoro({ onSessionComplete }) {
  const [config,       setConfigState] = useState(loadConfig);
  const [phase,        setPhase]       = useState('idle');
  const [secs,         setSecs]        = useState(0);
  const [totalSecs,    setTotalSecs]   = useState(0);
  const [activeTask,   setActiveTask]  = useState(null);  // task object
  const [sessionCount, setSessionCount] = useState(0);    // work sessions in current cycle
  const [notification, setNotification] = useState(null); // { text, type }

  // Refs so interval callback always sees current values
  const tickRef          = useRef(null);
  const secsRef          = useRef(0);
  const totalSecsRef     = useRef(0);
  const phaseRef         = useRef('idle');
  const prevPhaseRef     = useRef('idle');   // phase before pause
  const activeTaskRef    = useRef(null);
  const sessionCountRef  = useRef(0);
  const configRef        = useRef(config);
  const onCompleteRef    = useRef(onSessionComplete);

  useEffect(() => { configRef.current = config; },            [config]);
  useEffect(() => { onCompleteRef.current = onSessionComplete; }, [onSessionComplete]);

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  // Called at the end of a phase (either naturally or via skip)
  const finishPhase = useCallback((completed = true) => {
    clearTick();
    const ph   = phaseRef.current;
    const dur  = totalSecsRef.current * 1000;
    const task = activeTaskRef.current;

    // Fire callback only on natural completion (not skip)
    if (completed && task && (ph === 'work' || ph === 'break' || ph === 'longBreak')) {
      onCompleteRef.current({
        taskId:     task.id,
        type:       ph === 'work' ? 'work' : 'break',
        durationMs: dur,
        sessionId:  'pomo-' + Date.now(),
      });
    }

    // Advance phase
    if (ph === 'work') {
      const next = sessionCountRef.current + 1;
      sessionCountRef.current = next;
      setSessionCount(next);
      const isLong = next % configRef.current.longBreakAfter === 0;
      const nextPhase = isLong ? 'break-done-long' : 'break-done-short';
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
      setNotification({ text: isLong ? '🎉 Long break time — you earned it!' : '☕ Take a short break.', type: 'break' });
    } else {
      phaseRef.current = 'work-done';
      setPhase('work-done');
      setNotification({ text: '🍅 Break over — ready to focus?', type: 'work' });
    }
    setSecs(0);
  }, []);

  const launchPhase = useCallback((phaseName, task) => {
    clearTick();
    setNotification(null);

    const mins =
      phaseName === 'work'      ? configRef.current.workMin      :
      phaseName === 'longBreak' ? configRef.current.longBreakMin :
                                  configRef.current.breakMin;
    const s = mins * 60;

    phaseRef.current     = phaseName;
    secsRef.current      = s;
    totalSecsRef.current = s;
    if (task !== undefined) { activeTaskRef.current = task; setActiveTask(task); }

    setPhase(phaseName);
    setSecs(s);
    setTotalSecs(s);

    tickRef.current = setInterval(() => {
      secsRef.current -= 1;
      setSecs(secsRef.current);
      if (secsRef.current <= 0) finishPhase(true);
    }, 1000);
  }, [finishPhase]);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), []);

  const saveConfig = useCallback((cfg) => {
    const merged = { ...DEFAULT_POMO_CONFIG, ...cfg };
    setConfigState(merged);
    localStorage.setItem('pomo-cfg', JSON.stringify(merged));
  }, []);

  return {
    /* state */
    config, phase, secs, totalSecs, activeTask, sessionCount, notification,
    isRunning: phase === 'work' || phase === 'break' || phase === 'longBreak',
    isIdle:    phase === 'idle',

    /* actions */
    saveConfig,

    startWork(task) {
      launchPhase('work', task ?? activeTaskRef.current);
    },
    startBreak() {
      launchPhase('break', undefined);
    },
    startLongBreak() {
      launchPhase('longBreak', undefined);
    },
    pause() {
      if (phaseRef.current !== 'work' && phaseRef.current !== 'break' && phaseRef.current !== 'longBreak') return;
      clearTick();
      prevPhaseRef.current = phaseRef.current;
      phaseRef.current = 'paused';
      setPhase('paused');
    },
    resume() {
      if (phaseRef.current !== 'paused') return;
      const prev = prevPhaseRef.current;
      phaseRef.current = prev;
      setPhase(prev);

      tickRef.current = setInterval(() => {
        secsRef.current -= 1;
        setSecs(secsRef.current);
        if (secsRef.current <= 0) finishPhase(true);
      }, 1000);
    },
    skip() {
      if (phaseRef.current === 'idle') return;
      finishPhase(false); // skip = no session recorded
    },
    stop() {
      clearTick();
      phaseRef.current = 'idle';
      setPhase('idle');
      setActiveTask(null);
      activeTaskRef.current = null;
      setSecs(0);
      setTotalSecs(0);
      setNotification(null);
    },
    setActiveTask(task) {
      activeTaskRef.current = task;
      setActiveTask(task);
    },
    dismissNotification() { setNotification(null); },
  };
}
