// seed.mjs — Run once to inject all tasks for bilalsabugar
// Usage: node seed.mjs
// Must be run from inside the engine-core-v6/ folder after npm install

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// ─── Load .env manually (no dotenv needed) ───────────────────────────────────
const envFile = readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim().replace(/^["']|["']$/g, '')]; })
);

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};

const APP_ID = 'engine-core-v6';
const USERNAME = 'bilalsabugar';
const EMAIL = `${USERNAME}@enginecore.dev`;

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_DATA = [
  {
    project: { title: 'ACADEMICS', sub: 'Exams + Study', color: 'cyan' },
    tasks: [
      // MCS
      { text: '[MCS] Revise Unit concepts — logic, truth tables, equivalence', priority: 'CRITICAL' },
      { text: '[MCS] Practice 2–3 questions per topic', priority: 'CRITICAL' },
      { text: '[MCS] Go through important definitions', priority: 'HIGH' },
      { text: '[MCS] Prepare for example-based questions in exam', priority: 'HIGH' },
      // Calculus
      { text: '[CALC] Basic concept revision (whatever possible)', priority: 'CRITICAL' },
      { text: '[CALC] Practice at least core problems', priority: 'HIGH' },
      { text: '[CALC] Focus on passing-level preparation', priority: 'HIGH' },
      { text: '[CALC] Prepare for example solving in exam', priority: 'HIGH' },
      // Physics
      { text: '[PHYS] Unit 2 — Force systems, fluid mechanics', priority: 'CRITICAL' },
      { text: '[PHYS] Unit 3 — Rigid body, motion, friction', priority: 'CRITICAL' },
      { text: '[PHYS] Practice numerical problems', priority: 'HIGH' },
      { text: '[PHYS] Revise formulas', priority: 'HIGH' },
      { text: '[PHYS] Prepare for example-based questions', priority: 'HIGH' },
    ]
  },
  {
    project: { title: 'ELECTIVE_3D_PRINTING', sub: '3D Design / Rhino Assignments', color: 'emerald' },
    tasks: [
      { text: 'Complete ALL pending assignments (5 total)', priority: 'CRITICAL' },
      { text: 'Tissue Box design in Rhino', priority: 'HIGH' },
      { text: 'Other 3D models — lamp etc.', priority: 'HIGH' },
      { text: 'Export properly (files + formats)', priority: 'HIGH' },
      { text: 'Create PDF / submission format', priority: 'HIGH' },
      { text: 'Submit on Google Classroom', priority: 'CRITICAL' },
      { text: 'Send apology mail to elective faculty (delay apology)', priority: 'HIGH' },
    ]
  },
  {
    project: { title: 'HEXAPOD_ROBOT', sub: 'Conference Paper + Corrections', color: 'purple' },
    tasks: [
      { text: 'Conference paper written ✓', priority: 'LOW', completed: true },
      { text: 'Check plagiarism report', priority: 'CRITICAL' },
      { text: 'Make corrections based on plagiarism report', priority: 'CRITICAL' },
      { text: 'Final submission', priority: 'CRITICAL' },
    ]
  },
  {
    project: { title: 'IV_ROBOTIC_ARM', sub: 'Intravenous Practice Bot', color: 'amber' },
    tasks: [
      { text: 'Full design — CAD modelling', priority: 'HIGH' },
      { text: 'System planning', priority: 'HIGH' },
      { text: 'Mechanism finalization', priority: 'HIGH' },
      { text: 'Documentation', priority: 'MED' },
      { text: 'Prepare for submission (12th deadline)', priority: 'CRITICAL' },
    ]
  },
  {
    project: { title: 'ROVER_PROJECT', sub: 'NASA HERC Type', color: 'blue' },
    tasks: [
      { text: 'Abstract writing (already started earlier)', priority: 'HIGH' },
      { text: 'Design concept refinement', priority: 'MED' },
      { text: 'Mobility system thinking', priority: 'MED' },
      { text: 'Proposal / documentation', priority: 'MED' },
    ]
  },
  {
    project: { title: 'IDEX_DEFENSE', sub: 'Defense Project with Khushi', color: 'red' },
    tasks: [
      { text: 'Concept development', priority: 'HIGH' },
      { text: 'System idea clarity', priority: 'HIGH' },
      { text: 'Research', priority: 'HIGH' },
      { text: 'Basic documentation / notes', priority: 'MED' },
    ]
  },
  {
    project: { title: 'PERSONAL_SETUP', sub: 'Tech + Health', color: 'rose' },
    tasks: [
      { text: 'Check RAM working properly', priority: 'MED' },
      { text: 'Laptop optimization if needed', priority: 'LOW' },
      { text: 'Proper meals — not skipping', priority: 'HIGH' },
      { text: 'Hydration — 2–3L water daily', priority: 'HIGH' },
      { text: 'Sleep recovery', priority: 'HIGH' },
      { text: 'Reduce extreme exhaustion cycles', priority: 'HIGH' },
    ]
  },
  {
    project: { title: 'FUTURE_IDEAS', sub: 'Optional / Not Urgent', color: 'cyan' },
    tasks: [
      { text: 'Quadruped / pet robot idea', priority: 'LOW' },
      { text: 'Simulations for designs', priority: 'LOW' },
      { text: 'Learning improvements', priority: 'LOW' },
    ]
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

function log(msg, color = '\x1b[36m') {
  console.log(`${color}${msg}\x1b[0m`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n\x1b[1m\x1b[36m⚙  ENGINE_CORE_V6 — Seed Script\x1b[0m');
  console.log('\x1b[90m─────────────────────────────────\x1b[0m');
  log(`Operator  : ${USERNAME}`);
  log(`Email     : ${EMAIL}`);
  log(`Projects  : ${SEED_DATA.length}`);
  log(`Tasks     : ${SEED_DATA.reduce((a, b) => a + b.tasks.length, 0)}`);
  console.log('\x1b[90m─────────────────────────────────\x1b[0m\n');

  const password = await ask('\x1b[33mEnter your ENGINE_CORE passkey: \x1b[0m');
  if (!password) { console.error('\x1b[31mNo password entered. Aborting.\x1b[0m'); process.exit(1); }

  log('\nConnecting to Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let uid;
  try {
    const cred = await signInWithEmailAndPassword(auth, EMAIL, password);
    uid = cred.user.uid;
    log(`✓ Authenticated as ${cred.user.displayName || EMAIL}`);
  } catch (err) {
    console.error(`\x1b[31m✗ Auth failed: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  const projectsRef = (uid) => collection(db, 'artifacts', APP_ID, 'users', uid, 'projects');
  const tasksRef    = (uid) => collection(db, 'artifacts', APP_ID, 'users', uid, 'tasks');

  // Optional: clear existing data first
  const clearFirst = await ask('\x1b[33mClear existing projects/tasks first? (y/N): \x1b[0m');
  if (clearFirst.toLowerCase() === 'y') {
    log('\nClearing existing data...');
    const existingProjects = await getDocs(projectsRef(uid));
    for (const d of existingProjects.docs) await deleteDoc(d.ref);
    const existingTasks = await getDocs(tasksRef(uid));
    for (const d of existingTasks.docs) await deleteDoc(d.ref);
    log(`✓ Cleared ${existingProjects.size} projects, ${existingTasks.size} tasks`);
  }

  log('\nInjecting data...\n');

  let totalTasks = 0;
  for (const { project, tasks } of SEED_DATA) {
    // Create project
    const projDoc = await addDoc(projectsRef(uid), {
      ...project,
      createdAt: Date.now() - (SEED_DATA.indexOf({ project, tasks }) * 1000),
    });
    log(`  + MODULE: ${project.title}`, '\x1b[32m');

    // Create tasks
    for (const task of tasks) {
      const isDone = task.completed || false;
      await addDoc(tasksRef(uid), {
        projectId: projDoc.id,
        text: task.text,
        priority: task.priority || 'MED',
        dueDate: task.dueDate || null,
        subtasks: task.subtasks || [],
        completed: isDone,
        completedAt: isDone ? Date.now() : null,
        todayGoal: false,
        todayDate: null,
        totalFocusMs: 0,
        totalSessions: 0,
        totalBreaks: 0,
        createdAt: Date.now(),
      });
      process.stdout.write(`\x1b[90m    ↳ ${task.text.substring(0, 60)}...\r\x1b[0m`);
      totalTasks++;
    }
    process.stdout.write('                                                              \r');
    log(`    ↳ ${tasks.length} tasks injected`, '\x1b[90m');
  }

  console.log('\n\x1b[90m─────────────────────────────────\x1b[0m');
  log(`✓ Done! ${SEED_DATA.length} modules, ${totalTasks} tasks loaded.`, '\x1b[32m');
  log('Open your app and log in as bilalsabugar to see everything.', '\x1b[36m');
  console.log('\x1b[90m─────────────────────────────────\x1b[0m\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\x1b[31mUnexpected error:', err.message, '\x1b[0m');
  process.exit(1);
});
