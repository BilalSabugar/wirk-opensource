import { calculateNewOrder, rebalanceColumn, needsRebalance, sortByOrder, ORDER_STEP } from '../ordering.js';
import { validateTaskDependency, validateParentChild } from '../taskValidation.js';
import { normalizeTask, getLocalDateKey } from '../taskNormalizer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== RUNNING WIRK v6 DOMAIN TESTS ===\n');

// ── 1. Ordering Logic Tests ──
console.log('Test Suite 1: Ordering Logic');
{
  const firstOrder = calculateNewOrder(null, null);
  assert(firstOrder === ORDER_STEP, 'calculateNewOrder(null, null) returns initial step');

  const insertAfter = calculateNewOrder(1000, null);
  assert(insertAfter === 2000, 'calculateNewOrder(1000, null) appends with +ORDER_STEP');

  const insertBefore = calculateNewOrder(null, 1000);
  assert(insertBefore === 500, 'calculateNewOrder(null, 1000) prepends with /2');

  const insertBetween = calculateNewOrder(1000, 2000);
  assert(insertBetween === 1500, 'calculateNewOrder(1000, 2000) splits evenly to 1500');

  // Precision / Rebalance check
  const denseTasks = [
    { id: '1', order: 1.0001 },
    { id: '2', order: 1.0002 },
  ];
  assert(needsRebalance(denseTasks) === true, 'Dense fractional spacing (<0.001) triggers rebalance need');

  const rebalanced = rebalanceColumn(denseTasks);
  assert(rebalanced[0].order === 1000 && rebalanced[1].order === 2000, 'rebalanceColumn normalizes orders to 1000, 2000');
}

// ── 2. Blocker Dependency Validation Tests ──
console.log('\nTest Suite 2: Blocker Dependency Validation');
{
  const mockTasks = [
    { id: 't1', projectId: 'p1', text: 'Task 1', blocker: { dependencyTaskId: null } },
    { id: 't2', projectId: 'p1', text: 'Task 2', blocker: { dependencyTaskId: 't1' } },
    { id: 't3', projectId: 'p2', text: 'Task 3 (different project)', blocker: {} },
  ];

  // Self dependency
  const selfVal = validateTaskDependency('t1', 't1', mockTasks);
  assert(selfVal.valid === false && selfVal.error.includes('cannot depend on itself'), 'Disallows self-dependency');

  // Non-existent task
  const nonExist = validateTaskDependency('t1', 't999', mockTasks);
  assert(nonExist.valid === false, 'Disallows dependency on non-existent task');

  // Cross project
  const crossProj = validateTaskDependency('t1', 't3', mockTasks);
  assert(crossProj.valid === false && crossProj.error.includes('same project'), 'Disallows cross-project dependency');

  // Circular dependency check: making t1 depend on t2 when t2 depends on t1
  const cycleVal = validateTaskDependency('t1', 't2', mockTasks);
  assert(cycleVal.valid === false && cycleVal.error.includes('Circular dependency'), 'Detects and prevents circular blocker dependencies');

  // Valid dependency
  const validDep = validateTaskDependency('t4', 't1', [...mockTasks, { id: 't4', projectId: 'p1' }]);
  assert(validDep.valid === true, 'Allows valid non-circular dependency');
}

// ── 3. Parent-Child Hierarchy Validation Tests ──
console.log('\nTest Suite 3: Parent-Child 1-Level Hierarchy Validation');
{
  const mockHierarchy = [
    { id: 'root1', projectId: 'p1', parentTaskId: null },
    { id: 'child1', projectId: 'p1', parentTaskId: 'root1' },
    { id: 'root2', projectId: 'p2', parentTaskId: null },
  ];

  // Self parent
  const selfParent = validateParentChild('root1', 'root1', mockHierarchy);
  assert(selfParent.valid === false, 'Disallows self-parenting');

  // Cross project
  const crossProj = validateParentChild('root1', 'root2', mockHierarchy);
  assert(crossProj.valid === false && crossProj.error.includes('same project'), 'Disallows cross-project parent');

  // 1-Level Hierarchy: parent cannot be a subtask
  const parentIsSubtask = validateParentChild('newChild', 'child1', mockHierarchy);
  assert(parentIsSubtask.valid === false && parentIsSubtask.error.includes('Maximum hierarchy depth is 1'), 'Prevents nesting deeper than 1 level');

  // Parent that already has subtasks cannot be converted into a subtask
  const convertRoot = validateParentChild('root1', 'anotherRoot', [...mockHierarchy, { id: 'anotherRoot', projectId: 'p1', parentTaskId: null }]);
  assert(convertRoot.valid === false && convertRoot.error.includes('has child subtasks'), 'Prevents task with children from becoming a subtask');
}

// ── 4. Task Migration & Normalizer Tests ──
console.log('\nTest Suite 4: Safe Task Normalization');
{
  const todayKey = getLocalDateKey();

  // Legacy completed task without completedAt
  const legacyDone = normalizeTask({ id: 'leg1', text: 'Old Done Task', completed: true });
  assert(legacyDone.status === 'DONE', 'Legacy completed task maps to status: DONE');
  assert(legacyDone.completedAt === null, 'Never fabricates completedAt during normalization');

  // Legacy inProgress task
  const legacyProg = normalizeTask({ id: 'leg2', text: 'Active Task', inProgress: true });
  assert(legacyProg.status === 'IN_PROGRESS', 'Legacy inProgress task maps to status: IN_PROGRESS');

  // Legacy todayDate matching today
  const legacyTodayMatch = normalizeTask({ id: 'leg3', todayDate: todayKey });
  assert(legacyTodayMatch.plannedDate === todayKey, 'Preserves todayDate if equal to current local date');

  // Stale legacy todayDate
  const legacyStaleDate = normalizeTask({ id: 'leg4', todayDate: '2023-01-01' });
  assert(legacyStaleDate.plannedDate === null, 'Stale legacy todayDate is discarded to prevent flooding');

  // Legacy subtasks conversion to checklists
  const legacySubtasks = normalizeTask({
    id: 'leg5',
    subtasks: [{ id: 's1', text: 'Step 1', completed: true }, { id: 's2', text: 'Step 2', completed: false }]
  });
  assert(legacySubtasks.checklists.length === 2, 'Converts legacy subtasks to checklists');
  assert(legacySubtasks.checklists[0].completed === true, 'Preserves checklist completed state');
}

console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}
