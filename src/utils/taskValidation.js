/**
 * Domain validation utilities for tasks, blockers, and parent-child hierarchies.
 */

/**
 * Validates a blocker dependency to ensure it exists, is in the same project,
 * is not self-referential, and creates no circular dependencies.
 * @param {string} taskId - Target task ID
 * @param {string|null} dependencyTaskId - Task ID that is blocking this task
 * @param {Array<object>} allTasks - All tasks in memory
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTaskDependency(taskId, dependencyTaskId, allTasks = []) {
  if (!dependencyTaskId) {
    return { valid: true };
  }

  if (taskId && taskId === dependencyTaskId) {
    return { valid: false, error: 'A task cannot depend on itself.' };
  }

  const currentTask = allTasks.find(t => t.id === taskId);
  const depTask = allTasks.find(t => t.id === dependencyTaskId);

  if (!depTask) {
    return { valid: false, error: 'Referenced dependency task does not exist.' };
  }

  if (currentTask && depTask.projectId !== currentTask.projectId) {
    return { valid: false, error: 'Dependency task must belong to the same project.' };
  }

  // Circular dependency check (DFS)
  const visited = new Set([taskId]);
  let checkId = depTask.blocker?.dependencyTaskId;

  while (checkId) {
    if (visited.has(checkId)) {
      return { valid: false, error: 'Circular dependency detected in task blockers.' };
    }
    visited.add(checkId);
    const nextTask = allTasks.find(t => t.id === checkId);
    checkId = nextTask?.blocker?.dependencyTaskId;
  }

  return { valid: true };
}

/**
 * Validates 1-level parent-child hierarchy.
 * @param {string} taskId - Target subtask ID
 * @param {string|null} parentTaskId - Parent task ID
 * @param {Array<object>} allTasks - All tasks in memory
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateParentChild(taskId, parentTaskId, allTasks = []) {
  if (!parentTaskId) {
    return { valid: true };
  }

  if (taskId && taskId === parentTaskId) {
    return { valid: false, error: 'A task cannot be its own parent.' };
  }

  const currentTask = allTasks.find(t => t.id === taskId);
  const parentTask = allTasks.find(t => t.id === parentTaskId);

  if (!parentTask) {
    return { valid: false, error: 'Parent task does not exist.' };
  }

  if (currentTask && parentTask.projectId !== currentTask.projectId) {
    return { valid: false, error: 'Subtask must belong to the same project as its parent.' };
  }

  // Enforce 1-level hierarchy rule: parent cannot itself be a subtask
  if (parentTask.parentTaskId) {
    return { valid: false, error: 'Parent task is already a subtask. Maximum hierarchy depth is 1.' };
  }

  // If the current task already has subtasks, it cannot become a subtask
  const hasSubtasks = allTasks.some(t => t.parentTaskId === taskId);
  if (hasSubtasks) {
    return { valid: false, error: 'This task has child subtasks and cannot be converted into a subtask.' };
  }

  return { valid: true };
}
