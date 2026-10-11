/**
 * Pure task normalization and date utilities.
 */

export function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Pure, date-aware, deterministic task normalizer.
 * Maps legacy schema into the v2.1 multi-stage workflow schema.
 */
export function normalizeTask(raw, baseTimestamp = Date.now()) {
  const isDone = raw.status === 'DONE' || (raw.status === undefined && Boolean(raw.completed));
  const status = raw.status || (isDone ? 'DONE' : (raw.inProgress ? 'IN_PROGRESS' : 'TODO'));
  
  const todayStr = getLocalDateKey();
  let plannedDate = raw.plannedDate || null;
  if (!plannedDate && raw.todayDate === todayStr) {
    plannedDate = raw.todayDate;
  }

  // Convert legacy subtasks if present
  const checklists = Array.isArray(raw.checklists)
    ? raw.checklists
    : Array.isArray(raw.subtasks)
    ? raw.subtasks.map(s => ({
        id: s.id || String(Date.now() + Math.random()),
        text: s.text || '',
        completed: Boolean(s.completed),
      }))
    : [];

  return {
    id: raw.id,
    projectId: raw.projectId || '',
    text: raw.text || raw.title || 'Untitled Task',
    description: raw.description || '',
    status,
    completed: status === 'DONE', // Derived compatibility mirror for UI
    parentTaskId: raw.parentTaskId || null,
    order: typeof raw.order === 'number' ? raw.order : (raw.createdAt || baseTimestamp),
    priority: raw.priority || 'MED',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    
    // Checklists & Micro-steps
    checklists,
    
    // Blocker system
    blocker: raw.blocker || {
      isBlocked: Boolean(raw.isBlocked),
      reason: raw.blockerReason || '',
      dependencyTaskId: raw.dependencyTaskId || null,
      blockedAt: raw.blockedAt || null,
      resolvedAt: raw.resolvedAt || null,
    },
    
    // Dates & Deadlines
    dueDate: raw.dueDate || null,
    dueTime: raw.dueTime || null,
    plannedDate,
    completedAt: raw.completedAt || null, // Never fabricate completedAt
    statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory : [],
    
    // Focus Telemetry
    totalFocusMs: raw.totalFocusMs || 0,
    totalSessions: raw.totalSessions || 0,
    createdAt: raw.createdAt || baseTimestamp,
    updatedAt: raw.updatedAt || baseTimestamp,
  };
}
