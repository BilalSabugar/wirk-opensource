/**
 * Ordering and ranking utilities for Kanban columns and task lists.
 * Standardizes on `order: number` with fractional interpolation and automatic column rebalancing.
 */

export const ORDER_STEP = 1000;
export const EPSILON = 0.001;

/**
 * Calculates a new fractional order when dropping a task between two adjacent tasks.
 * @param {number|null} prevOrder - Order of the task above (or null if inserting at top)
 * @param {number|null} nextOrder - Order of the task below (or null if inserting at bottom)
 * @returns {number}
 */
export function calculateNewOrder(prevOrder, nextOrder) {
  if (prevOrder == null && nextOrder == null) {
    return ORDER_STEP;
  }
  if (prevOrder == null) {
    return (nextOrder || ORDER_STEP) / 2;
  }
  if (nextOrder == null) {
    return (prevOrder || 0) + ORDER_STEP;
  }
  return (prevOrder + nextOrder) / 2;
}

/**
 * Checks if a column's orders are too close and need rebalancing.
 * @param {Array<{ order: number }>} sortedTasks
 * @returns {boolean}
 */
export function needsRebalance(sortedTasks) {
  if (!sortedTasks || sortedTasks.length < 2) return false;
  for (let i = 0; i < sortedTasks.length - 1; i++) {
    const diff = Math.abs(sortedTasks[i + 1].order - sortedTasks[i].order);
    if (diff < EPSILON) return true;
  }
  return false;
}

/**
 * Rebalances task orders in a column to clean integers (1000, 2000, 3000...).
 * @param {Array<{ id: string, order: number }>} sortedTasks
 * @returns {Array<{ id: string, order: number }>} Array of updates to apply
 */
export function rebalanceColumn(sortedTasks) {
  if (!sortedTasks) return [];
  return sortedTasks.map((t, index) => ({
    id: t.id,
    order: (index + 1) * ORDER_STEP,
  }));
}

/**
 * Helper to sort tasks strictly by order.
 * @param {Array<{ order?: number, createdAt?: number }>} tasks
 * @returns {Array}
 */
export function sortByOrder(tasks) {
  if (!tasks) return [];
  return [...tasks].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : (a.createdAt || 0);
    const orderB = typeof b.order === 'number' ? b.order : (b.createdAt || 0);
    return orderA - orderB;
  });
}
