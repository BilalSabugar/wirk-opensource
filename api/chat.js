// api/chat.js — AI Companion endpoint
// Handles both audio (Gemini multimodal) and text input.
// User context is injected server-side based on approved data selections.
// Uses Gemini 2.0 Flash for understanding + response generation.
// Fallback to secondary key on any failure.

const MODEL_URL = (key, model = 'gemini-2.5-flash') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// ─── Companion System Prompt ──────────────────────────────────────────────
export function buildSystemPrompt(context) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `You are ARIA — the autonomous executive AI intelligence and workspace orchestrator ("Hermes") embedded within WIRK (Turn intent into execution). Today is ${todayDay} (${todayISO}).

## YOUR IDENTITY & POWERS (HERMES ARCHITECTURE)
You are an intelligent, empathetic executive orchestrator with complete oversight and execution authority over the workspace:
1. **Executive Workload & Daily Planning**: You analyze deadlines, due dates, backlogs, and focus velocity to build optimized daily itineraries (planning tasks into Today Focus, adjusting priorities from MED to CRITICAL or HIGH when needed).
2. **Project & Task Management**: You can create, update, rebalance, break down, and delete tasks and projects across all 5 workflow columns (BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE).
3. **Diary & Reflection Journaling**: You can write and record thoughtful, emotional, and structured diary entries for the user, reflecting on their daily achievements, emotional state, and progress.
4. **Knowledge & Documentation**: You can write and update project notes and technical specifications.
5. **Unblocking & Dependency Resolution**: You identify circular or stalled blockers and suggest solutions.

## WORKSPACE ARCHITECTURE & DOMAIN RULES
- **5 Workflow Stages**: 'BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'.
- **Priorities**: 'CRITICAL' (immediate 24-48h deadlines/blockers), 'HIGH' (key deliverables this week), 'MED' (standard execution), 'LOW' (backlog ideas).
- **Due Dates**: Expressed as ISO strings 'YYYY-MM-DD'. Calculate relative dates based on today (${todayISO}):
  * "today" -> ${todayISO}
  * "tomorrow" -> calculate +1 day
  * "this Friday" / "next Monday" -> calculate exact date
- **Decoupled Blockers**: Tasks can have { reason, dependencyTaskId }.
- **Daily Focus**: Tasks can be planned for today's execution queue.

## TASK, PROJECT & HISTORICAL RETROSPECTIVE RULES:
- You have complete, direct visibility into all workspace projects, active tasks, and HISTORICAL COMPLETED TASKS with exact completion dates and timestamps under "FULL WORKSPACE CONTEXT".
- When the user asks you to review past work (e.g. "What did I do last week?", "I feel like I wasn't that productive, check what all I did", "Show my progress and generate graphs for that"):
  * NEVER say "I don't store historical completion dates" or "I can't tell you which tasks were completed specifically". YOU HAVE THE FULL HISTORICAL LOG.
  * Inspect the "Historical Productivity & Task Completion Log" section below.
  * List the specific tasks completed by project and date.
  * Give an encouraging, executive perspective on their actual throughput.
  * MANDATORY: Always output an inline \`\`\`json_chart ... \`\`\` block containing their daily velocity or project completion distribution.
- When listing tasks for the user, format each task on its own line as a clean bullet:
  * "<exact task text>" (Priority, Due date if set)
  This enables the WIRK interface to automatically render interactive cards with quick action buttons.

## FULL WORKSPACE CONTEXT
${context.hasAny ? context.summary : 'No specific workspace context was provided. Offer general executive assistance.'}

## ACTION PROPOSALS & MUTATIONS
When the user asks you to take actions (e.g. create tasks, plan their day, write their diary, adjust priorities, resolve blockers, create projects), explain your reasoning clearly and append a JSON proposal block formatted EXACTLY as:

\`\`\`json_proposal
{
  "proposals": [
    {
      "type": "CREATE_TASK",
      "label": "Create 'Implement API endpoints' task",
      "task": {
        "projectId": "exact_project_id",
        "text": "Specific actionable task",
        "status": "TODO",
        "priority": "HIGH",
        "dueDate": "YYYY-MM-DD"
      }
    },
    {
      "type": "UPDATE_TASK",
      "taskId": "exact_task_id",
      "label": "Change priority to CRITICAL & set due date",
      "updates": {
        "priority": "CRITICAL",
        "dueDate": "YYYY-MM-DD",
        "status": "IN_PROGRESS"
      }
    },
    {
      "type": "DELETE_TASK",
      "taskId": "exact_task_id",
      "label": "Delete deprecated task"
    },
    {
      "type": "PLAN_DAY",
      "label": "Schedule 4 priority tasks for Today Focus",
      "taskIds": ["task_id_1", "task_id_2"]
    },
    {
      "type": "WRITE_DIARY",
      "label": "Save Today's Reflection & Accomplishments",
      "date": "${todayISO}",
      "content": "Rich reflective diary entry celebrating wins, reviewing tasks completed, and setting intentions...",
      "mood": "🔥"
    },
    {
      "type": "CREATE_PROJECT",
      "label": "Create 'MACHINE LEARNING' project module",
      "project": {
        "title": "MACHINE LEARNING",
        "sub": "Deep learning models & neural network experiments",
        "color": "purple"
      }
    },
    {
      "type": "SAVE_NOTE",
      "label": "Save Architecture Spec to Robotics Notes",
      "projectId": "exact_project_id_or_null_for_global",
      "title": "Robotics Architecture Spec",
      "content": "# Robotics Architecture Spec\\n\\n..."
    },
    {
      "type": "SET_BLOCKER",
      "taskId": "exact_task_id",
      "label": "Mark task blocked waiting on hardware delivery",
      "reason": "Waiting on 3D printed brackets",
      "dependencyTaskId": null
    },
    {
      "type": "SAVE_MEMORY",
      "label": "Remember productivity preference",
      "memoryText": "User prefers deep focus blocks in the early morning"
    },
    {
      "type": "GENERATE_CHART",
      "label": "Render Workspace Priority Distribution",
      "chartType": "bar",
      "title": "Tasks by Priority Level",
      "description": "Real-time distribution of Critical, High, Medium, and Low tasks",
      "xAxisKey": "name",
      "data": [
        { "name": "Critical", "count": 6 },
        { "name": "High", "count": 14 },
        { "name": "Medium", "count": 18 },
        { "name": "Low", "count": 5 }
      ],
      "series": [
        { "dataKey": "count", "name": "Tasks", "color": "#F59E0B" }
      ]
    },
    {
      "type": "CREATE_CALENDAR_EVENT",
      "label": "Schedule Final Calculus Exam on Calendar",
      "event": {
        "title": "Calculus II Final Exam",
        "category": "exam",
        "date": "YYYY-MM-DD",
        "time": "14:00",
        "location": "Main Hall Room 302",
        "notes": "Covers chapters 6-12. Bring calculator."
      }
    },
    {
      "type": "DELETE_CALENDAR_EVENT",
      "eventId": "exact_event_id",
      "label": "Remove canceled calendar event"
    },
    {
      "type": "OPEN_DEV_CREDITS",
      "label": "Open Developer Diagnostics & AI Quotas Console"
    }
  ]
}
\`\`\`

## CALENDAR & EXAM SCHEDULING
- You have full access to the user's Calendar, including Exams, Assignments, Tests, and Milestones.
- Whenever the user shares exam dates, test timetables, assignment due dates, or general schedule information (e.g. "I have physics exam on 25th May", "Add my math quiz on Friday", "Here is my exam schedule"), ALWAYS create one or more \`CREATE_CALENDAR_EVENT\` proposals!
- Event \`category\` should be chosen accurately:
  * \`"exam"\`: For exams, finals, midterms, quizzes, tests, lab vivas.
  * \`"assignment"\`: For project submissions, essays, problem sets, homework.
  * \`"meeting"\`: For study groups, conferences, office hours, syncs.
  * \`"deadline"\`: For registration deadlines, application cutoffs.
  * \`"event"\`: For hackathons, workshops, university events.
  * \`"personal"\`: For medical, personal routines, workouts.
- If the user provides multiple exams at once (e.g., a syllabus or date sheet), create all of them in the single \`proposals\` array so the user can review and apply them in one click.
- When an exam is upcoming, actively reference it in your advice, suggest study/prep focus tasks, and track their preparation progress!

## CONTEXT RETENTION, DIARY & LONG-TERM MEMORY PROTOCOL
- When the user shares background information, career updates, internships, personal context, or life events and asks you to keep it for context or write a diary to refer to in the future:
  1. Propose \`WRITE_DIARY\` with an articulate, detailed reflection capturing all key aspects (dates, roles, responsibilities, objectives, and reflections).
  2. Propose \`SAVE_MEMORY\` with a concise factual summary of the core information (e.g. "User started internship at [Company] as [Role] working on [X]...").
  3. When the user approves these proposals, \`ariaMemory\` ensures you permanently recall these facts in EVERY future conversation, and \`diaryEntries\` ensures you can reference the complete journal context whenever asked!

## CHARTS & VISUAL ANALYTICS (MANDATORY \`\`\`json_chart\`\`\` CODE BLOCK)
When the user asks for a chart, graph, visual metrics, project comparison, velocity curve, priority spread, workload analysis, burndown, or workspace analytics, OR whenever you state in your response that you generated or visualised a chart/graph:
- **CRITICAL MANDATORY INSTRUCTION**: You MUST ALWAYS output an inline \`\`\`json_chart ... \`\`\` code block at the end of your response containing the exact dataset.
- NEVER merely say "I have generated a bar chart" or "Here is a graph" without printing the \`\`\`json_chart code block. The UI requires this block to render the interactive chart.
- GATHER the exact data points from the user's workspace context (pre-aggregated metrics, tasks, projects, priorities, statuses, tags, dates, or diary entries).
- DECIDE the optimal chart type based on the nature of the data:
  * "bar": Comparisons across discrete categories, projects, priorities, or tags.
  * "area": Volume trends, cumulative completion curves, or historical throughput.
  * "line": Velocity trends over time, burnup/burndown, or deadline progress.
  * "pie": Proportional distributions (e.g. Priority share, Status percentage, or Project task distribution).
  * "radar": Multi-dimensional project health or capability evaluations.
- EXACT FORMAT REQUIRED:
\`\`\`json_chart
{
  "chartType": "bar",
  "title": "Project Workload Distribution",
  "description": "Active tasks across key project modules",
  "xAxisKey": "name",
  "data": [
    { "name": "Hackathon", "active": 12, "completed": 8 },
    { "name": "Robotics", "active": 15, "completed": 5 }
  ],
  "series": [
    { "dataKey": "active", "name": "Active", "color": "#F59E0B" },
    { "dataKey": "completed", "name": "Completed", "color": "#10B981" }
  ]
}
\`\`\`

## CONTINUATION & RESILIENCE PROTOCOL
- If your previous response in the conversation was cut off, truncated mid-sentence, stopped before completing tasks, or hit token limits, or if the user says "It stopped mid way fix it", "continue", "finish the tasks", "you got cut off":
  1. Look directly at your last model message in the conversation history. Identify what project or tasks you were in the middle of creating.
  2. Continue seamlessly and complete all requested tasks and projects without repeating the already completed introduction.
  3. MANDATORY: You MUST generate and output the complete \`\`\`json_proposal ... \`\`\` block containing all the CREATE_PROJECT and CREATE_TASK proposals with proper due dates (e.g. today's date ${todayISO}) and priorities, so that interactive action proposal cards render in the WIRK interface!
  4. Ensure your JSON proposals are clean, valid, and fully closed with \`\`\` at the end.

## COMMUNICATION STYLE
- Confident, warm, executive, and direct.
- When organizing or planning, present clear bullet points before the JSON block.
- When writing a diary entry, make it personal, mindful, and insightful based on what happened today.
- Always provide valid JSON in the \`\`\`json_proposal and \`\`\`json_chart blocks.`;
}

// ─── Build context from user's approved data ──────────────────────────────
export function buildContext(payload = {}) {
  const {
    shareProjects = true,
    shareTasks = true,
    shareDiary = true,
    projects = [],
    tasks = [],
    diaryEntries = [],
    notes = [],
    calendarEvents = [],
    ariaMemory = [],
    modeHint = null,
  } = payload;

  if (!shareProjects && !shareTasks && !shareDiary && ariaMemory.length === 0 && notes.length === 0 && calendarEvents.length === 0 && !modeHint) {
    return { hasAny: false, summary: '' };
  }

  const isTaskDone = (t) => t.status === 'DONE' || (!t.status && Boolean(t.completed));
  const isTaskPending = (t) => !isTaskDone(t);

  const lines = [];

  if (modeHint) {
    lines.push(`### Active Executive Directive Mode\n${modeHint}\n`);
  }

  if (ariaMemory.length > 0) {
    lines.push(`### Routine & Executive Memory Facts`);
    ariaMemory.forEach(m => lines.push(`- ${m}`));
  }

  // 1. Group tasks by Project so ARIA has complete visibility into each project's backlog
  if (shareProjects && projects.length > 0) {
    lines.push(`\n### Active Workspace Projects & Project Tasks`);
    projects.forEach(p => {
      const projTasks = tasks.filter(t => t.projectId === p.id);
      const projPending = projTasks.filter(isTaskPending);
      const projDone = projTasks.filter(isTaskDone);

      lines.push(`\n#### Project: [ID: ${p.id}] "${p.title}" (${p.color || 'cyan'})`);
      if (p.sub) lines.push(`Description: ${p.sub}`);
      lines.push(`Task Counts: ${projDone.length}/${projTasks.length} tasks completed (${projPending.length} active/pending)`);

      if (shareTasks && projPending.length > 0) {
        lines.push(`Active Tasks for "${p.title}":`);
        // Up to 40 tasks per project ensures all tasks for the project are visible
        projPending.slice(0, 40).forEach(t => {
          const parts = [`- [ID: ${t.id}]`];
          parts.push(`[Stage: ${t.status || 'TODO'}]`);
          parts.push(`[Prio: ${t.priority || 'MED'}]`);
          parts.push(`"${t.text}"`);
          if (t.dueDate) parts.push(`[Due: ${t.dueDate}]`);
          if (t.blocker?.isBlocked) parts.push(`[Blocked: ${t.blocker.reason || 'unspecified'}]`);
          lines.push(parts.join(' '));
        });
        if (projPending.length > 40) {
          lines.push(`  ... and ${projPending.length - 40} more active tasks in this project`);
        }
      } else if (shareTasks) {
        lines.push(`  (No active tasks for this project)`);
      }
    });
  }

  // 2. Unassigned / General Tasks
  if (shareTasks && tasks.length > 0) {
    const knownProjectIds = new Set(projects.map(p => p.id));
    const unassignedTasks = tasks.filter(t => !t.projectId || !knownProjectIds.has(t.projectId));
    const unassignedPending = unassignedTasks.filter(isTaskPending);

    if (unassignedPending.length > 0) {
      lines.push(`\n#### General / Unassigned Tasks (${unassignedPending.length} active)`);
      unassignedPending.slice(0, 40).forEach(t => {
        const parts = [`- [ID: ${t.id}]`];
        parts.push(`[Stage: ${t.status || 'TODO'}]`);
        parts.push(`[Prio: ${t.priority || 'MED'}]`);
        parts.push(`"${t.text}"`);
        if (t.dueDate) parts.push(`[Due: ${t.dueDate}]`);
        if (t.blocker?.isBlocked) parts.push(`[Blocked: ${t.blocker.reason || 'unspecified'}]`);
        lines.push(parts.join(' '));
      });
      if (unassignedPending.length > 40) {
        lines.push(`  ... and ${unassignedPending.length - 40} more general tasks`);
      }
    }

    // 3. Workspace Workflow Telemetry & Urgent Focus
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const pending = tasks.filter(isTaskPending);
    const done = tasks.filter(isTaskDone);
    const inProgress = pending.filter(t => t.status === 'IN_PROGRESS');
    const inReview = pending.filter(t => t.status === 'IN_REVIEW');
    const blocked = pending.filter(t => t.blocker?.isBlocked);
    const overdue = pending.filter(t => t.dueDate && t.dueDate < todayStr);
    const critical = pending.filter(t => t.priority === 'CRITICAL');
    const high = pending.filter(t => t.priority === 'HIGH');
    const plannedToday = tasks.filter(t => t.plannedDate === todayStr || t.isGoal);

    // Reliable completion timestamp resolver
    const getTaskCompletionTime = (t) => {
      if (t.completedAt) {
        const ms = typeof t.completedAt === 'number' ? t.completedAt : new Date(t.completedAt).getTime();
        if (!isNaN(ms)) return ms;
      }
      if (Array.isArray(t.statusHistory) && t.statusHistory.length > 0) {
        for (let idx = t.statusHistory.length - 1; idx >= 0; idx--) {
          const ev = t.statusHistory[idx];
          if (ev && ev.status === 'DONE' && ev.timestamp) {
            const ms = typeof ev.timestamp === 'number' ? ev.timestamp : new Date(ev.timestamp).getTime();
            if (!isNaN(ms)) return ms;
          }
        }
      }
      if (isTaskDone(t)) {
        if (t.updatedAt) {
          const ms = typeof t.updatedAt === 'number' ? t.updatedAt : new Date(t.updatedAt).getTime();
          if (!isNaN(ms)) return ms;
        }
        if (t.createdAt) {
          const ms = typeof t.createdAt === 'number' ? t.createdAt : new Date(t.createdAt).getTime();
          if (!isNaN(ms)) return ms;
        }
      }
      return null;
    };

    // Calculate Monday-based calendar weeks
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const thisWeekMon = new Date(now);
    thisWeekMon.setDate(now.getDate() + diffToMonday);
    thisWeekMon.setHours(0, 0, 0, 0);

    const lastWeekMon = new Date(thisWeekMon);
    lastWeekMon.setDate(thisWeekMon.getDate() - 7);

    const lastWeekSun = new Date(thisWeekMon.getTime() - 1);

    const thisWeekStartISO = thisWeekMon.toISOString().slice(0, 10);
    const lastWeekStartISO = lastWeekMon.toISOString().slice(0, 10);
    const lastWeekEndISO   = lastWeekSun.toISOString().slice(0, 10);

    // Map all completed tasks with exact resolved dates and project titles
    const allCompletedTasks = [];
    tasks.forEach(t => {
      if (!isTaskDone(t)) return;
      const compMs = getTaskCompletionTime(t);
      const dateStr = compMs ? new Date(compMs).toISOString().slice(0, 10) : null;
      const proj = projects.find(p => p.id === t.projectId);
      allCompletedTasks.push({
        id: t.id,
        text: t.text,
        projectName: proj?.title || 'General',
        projectId: t.projectId,
        completedAtMs: compMs,
        dateStr,
      });
    });

    const doneToday = allCompletedTasks.filter(t => t.dateStr === todayStr);
    const lastWeekTasks = allCompletedTasks.filter(t => 
      t.completedAtMs && t.completedAtMs >= lastWeekMon.getTime() && t.completedAtMs <= lastWeekSun.getTime()
    );
    const thisWeekTasks = allCompletedTasks.filter(t =>
      t.completedAtMs && t.completedAtMs >= thisWeekMon.getTime()
    );

    // 14-day daily velocity curve
    const dailyVelocity14d = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(now.getTime() - d * 86400000);
      const dStr = dt.toISOString().slice(0, 10);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const count = allCompletedTasks.filter(t => t.dateStr === dStr).length;
      dailyVelocity14d.push({ date: dStr, day: dayName, completed: count });
    }

    lines.push(`\n### Workspace Workflow Telemetry & Urgent Focus`);
    lines.push(`- Total Tasks: ${tasks.length} across workspace (${pending.length} active/pending, ${done.length} completed)`);
    if (critical.length) lines.push(`- 🔴 CRITICAL Priority (${critical.length}): ${critical.map(t => `"${t.text}" [ID: ${t.id}]`).join(', ')}`);
    if (high.length) lines.push(`- 🟠 HIGH Priority (${high.length}): ${high.slice(0, 12).map(t => `"${t.text}" [ID: ${t.id}]`).join(', ')}${high.length > 12 ? '...' : ''}`);
    if (overdue.length) lines.push(`- ⚠ OVERDUE Tasks (${overdue.length}): ${overdue.map(t => `"${t.text}" [ID: ${t.id}, Due: ${t.dueDate}]`).join(', ')}`);
    if (inProgress.length) lines.push(`- ⚡ In Progress (${inProgress.length}): ${inProgress.map(t => `"${t.text}" [ID: ${t.id}]`).join(', ')}`);
    if (inReview.length) lines.push(`- 🔍 In Review (${inReview.length}): ${inReview.map(t => `"${t.text}" [ID: ${t.id}]`).join(', ')}`);
    if (plannedToday.length) lines.push(`- 🎯 Scheduled for Today Focus (${plannedToday.length}): ${plannedToday.map(t => `"${t.text}" [ID: ${t.id}]`).join(', ')}`);
    if (blocked.length) lines.push(`- 🚫 Blocked Tasks (${blocked.length}): ${blocked.map(t => `"${t.text}" [ID: ${t.id}] (Reason: ${t.blocker?.reason || 'unspecified'})`).join(', ')}`);
    if (doneToday.length) lines.push(`- ✅ Completed Today (${doneToday.length}): ${doneToday.map(t => `"${t.text}"`).join(', ')}`);

    // 4. HISTORICAL PRODUCTIVITY & TASK COMPLETION LOG (For retrospectives & velocity reviews)
    lines.push(`\n### Historical Productivity & Task Completion Log`);
    lines.push(`- Reference Time Windows:`);
    lines.push(`  * Today: ${todayStr}`);
    lines.push(`  * This Week (Mon-Sun): ${thisWeekStartISO} to ${todayStr} (${thisWeekTasks.length} tasks completed)`);
    lines.push(`  * Last Week (Mon-Sun): ${lastWeekStartISO} to ${lastWeekEndISO} (${lastWeekTasks.length} tasks completed)`);

    if (lastWeekTasks.length > 0) {
      lines.push(`- Tasks Completed LAST WEEK (${lastWeekStartISO} to ${lastWeekEndISO}):`);
      // Group by project
      const projMap = {};
      lastWeekTasks.forEach(t => {
        if (!projMap[t.projectName]) projMap[t.projectName] = [];
        projMap[t.projectName].push(`"${t.text}" (${t.dateStr || 'last week'})`);
      });
      Object.entries(projMap).forEach(([pName, tList]) => {
        lines.push(`  * **${pName}** (${tList.length} tasks): ${tList.slice(0, 15).join('; ')}${tList.length > 15 ? '...' : ''}`);
      });
    } else {
      lines.push(`- Tasks Completed LAST WEEK (${lastWeekStartISO} to ${lastWeekEndISO}): 0 tasks recorded specifically in this 7-day calendar window.`);
    }

    if (thisWeekTasks.length > 0) {
      lines.push(`- Tasks Completed THIS WEEK (${thisWeekStartISO} to ${todayStr}):`);
      const projMapThis = {};
      thisWeekTasks.forEach(t => {
        if (!projMapThis[t.projectName]) projMapThis[t.projectName] = [];
        projMapThis[t.projectName].push(`"${t.text}" (${t.dateStr})`);
      });
      Object.entries(projMapThis).forEach(([pName, tList]) => {
        lines.push(`  * **${pName}** (${tList.length} tasks): ${tList.slice(0, 15).join('; ')}${tList.length > 15 ? '...' : ''}`);
      });
    }

    // Most recent completions overall across workspace
    const recentCompleted = allCompletedTasks
      .filter(t => t.completedAtMs)
      .sort((a, b) => b.completedAtMs - a.completedAtMs)
      .slice(0, 25);

    if (recentCompleted.length > 0) {
      lines.push(`- Most Recent Completed Tasks Across All Projects:`);
      recentCompleted.forEach(t => {
        lines.push(`  * [${t.dateStr || 'Done'}] [Project: ${t.projectName}] "${t.text}"`);
      });
    }

    // 5. Pre-Aggregated Workspace Visual Metrics for Instant Chart Generation
    const prioCounts = { CRITICAL: 0, HIGH: 0, MED: 0, LOW: 0 };
    const stageCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasks.forEach(t => {
      const p = t.priority || 'MED';
      if (prioCounts[p] !== undefined) prioCounts[p]++;
      else prioCounts.MED++;

      const isD = isTaskDone(t);
      if (isD) stageCounts.DONE++;
      else if (t.status === 'IN_PROGRESS') stageCounts.IN_PROGRESS++;
      else if (t.status === 'IN_REVIEW') stageCounts.IN_REVIEW++;
      else stageCounts.TODO++;
    });

    const projectBreakdown = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pDone = pTasks.filter(isTaskDone).length;
      const pPending = pTasks.length - pDone;
      const pCritical = pTasks.filter(t => !isTaskDone(t) && t.priority === 'CRITICAL').length;
      return {
        name: p.title,
        total: pTasks.length,
        done: pDone,
        pending: pPending,
        critical: pCritical
      };
    });

    lines.push(`\n### Pre-Aggregated Workspace Visual Metrics for Charts`);
    lines.push(`- Priority Distribution: Critical=${prioCounts.CRITICAL}, High=${prioCounts.HIGH}, Medium=${prioCounts.MED}, Low=${prioCounts.LOW}`);
    lines.push(`- Stage Distribution: Todo=${stageCounts.TODO}, InProgress=${stageCounts.IN_PROGRESS}, InReview=${stageCounts.IN_REVIEW}, Done=${stageCounts.DONE}`);
    lines.push(`- 14-Day Daily Completion Velocity: ${JSON.stringify(dailyVelocity14d)}`);
    lines.push(`- Project Breakdown: ${JSON.stringify(projectBreakdown)}`);
  }

  if (shareDiary && diaryEntries.length > 0) {
    lines.push(`\n### Diary & Journal Reflections (${diaryEntries.length} entries available)`);
    diaryEntries.slice(0, 20).forEach(e => {
      if (!e.content) return;
      const preview = e.content.length > 600 ? e.content.slice(0, 600) + '...' : e.content;
      lines.push(`- **${e.date}** ${e.mood ? `[Mood: ${e.mood}]` : ''}: ${preview}`);
    });
  }

  if (notes && notes.length > 0) {
    lines.push(`\n### Notebooks & Scratchpads`);
    notes.slice(0, 5).forEach(n => {
      if (!n.content) return;
      const proj = projects.find(p => p.id === n.projectId);
      lines.push(`- **${proj?.title || 'Global'} Notes**: ${n.content.slice(0, 150)}...`);
    });
  }

  if (calendarEvents && calendarEvents.length > 0) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const sortedEvents = [...calendarEvents].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const examsAndAssignments = sortedEvents.filter(e => e.category === 'exam' || e.category === 'assignment');
    const generalEvents = sortedEvents.filter(e => e.category !== 'exam' && e.category !== 'assignment');

    if (examsAndAssignments.length > 0) {
      lines.push(`\n### 🎓 Academic Exams & Major Milestones (${examsAndAssignments.length} total)`);
      examsAndAssignments.forEach(e => {
        const isPast = e.date < todayISO;
        const status = isPast ? '[PASSED/COMPLETED]' : e.date === todayISO ? '[TODAY - URGENT!]' : '[UPCOMING]';
        const parts = [`- ${status} [Type: ${e.category?.toUpperCase()}] [ID: ${e.id || 'evt'}] **${e.title}** on ${e.date}`];
        if (e.time) parts.push(`at ${e.time}`);
        if (e.location) parts.push(`(Location: ${e.location})`);
        if (e.notes) parts.push(`- Note: "${e.notes}"`);
        lines.push(parts.join(' '));
      });
    }

    if (generalEvents.length > 0) {
      lines.push(`\n### 📅 Calendar Schedule & Key Dates (${generalEvents.length} events)`);
      generalEvents.slice(0, 30).forEach(e => {
        const isPast = e.date < todayISO;
        const status = isPast ? '[Past]' : e.date === todayISO ? '[TODAY]' : '[Upcoming]';
        const parts = [`- ${status} [${e.category || 'event'}] [ID: ${e.id || 'evt'}] **${e.title}** on ${e.date}`];
        if (e.time) parts.push(`at ${e.time}`);
        if (e.location) parts.push(`(${e.location})`);
        if (e.notes) parts.push(`- "${e.notes}"`);
        lines.push(parts.join(' '));
      });
      if (generalEvents.length > 30) {
        lines.push(`  ... and ${generalEvents.length - 30} more scheduled events`);
      }
    }
  }

  return { hasAny: lines.length > 0, summary: lines.join('\n') };
}

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];

async function callGemini(key, messages, system, model = 'gemini-2.5-flash') {
  return fetch(MODEL_URL(key, model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: messages,
      generationConfig: {
        temperature:     0.75,
        maxOutputTokens: 8192,
        topP:            0.9,
      },
    }),
  });
}

async function resilientGeminiCall(keys, messages, system) {
  let lastStatus = 502;
  let lastErr = 'Unknown error';

  for (const key of keys) {
    for (const model of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const upstream = await callGemini(key, messages, system, model);
          if (upstream.ok) {
            return { ok: true, upstream, model, key };
          }

          lastStatus = upstream.status;
          const errBody = await upstream.text();
          lastErr = errBody;

          // If API key is outright invalid (400), don't retry with this key
          if (upstream.status === 400 && errBody.includes('API_KEY_INVALID')) {
            break;
          }

          // If 503 high demand or 429 rate limit, wait briefly on first attempt then retry/fallback
          if ((upstream.status === 503 || upstream.status === 429) && attempt === 0) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }

          // Otherwise try next model in CANDIDATE_MODELS
          break;
        } catch (fetchErr) {
          lastErr = fetchErr.message;
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          break;
        }
      }
    }
  }

  return { ok: false, status: lastStatus, error: lastErr };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Prioritize secondary key (verified active) then primary key
  const candidateKeys = [
    process.env.GEMINI_API_KEY_SECONDARY,
    process.env.GEMINI_API_KEY,
  ].filter(Boolean);

  if (candidateKeys.length === 0) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const {
      text,          // text message (if no audio)
      audioBase64,   // base64 audio blob (if voice)
      audioMimeType, // e.g. "audio/webm;codecs=opus"
      history,       // [{role:'user'|'model', parts:[{text}]}]
      contextPayload,// {shareProjects, shareTasks, shareDiary, projects, tasks, diaryEntries}
    } = req.body;

    if (!text && !audioBase64) return res.status(400).json({ error: 'Provide text or audio' });

    const context = buildContext(contextPayload ?? {});
    const system  = buildSystemPrompt(context);

    // Build current turn parts
    const currentParts = [];
    if (audioBase64 && audioMimeType) {
      currentParts.push({ inline_data: { mime_type: audioMimeType, data: audioBase64 } });
      currentParts.push({ text: 'Please respond to what I just said.' });
    } else {
      currentParts.push({ text: text.trim() });
    }

    // Build full history + current turn
    const safeHistory = Array.isArray(history) ? history.slice(-20) : []; // last 20 turns
    const messages = [
      ...safeHistory,
      { role: 'user', parts: currentParts },
    ];

    const result = await resilientGeminiCall(candidateKeys, messages, system);

    if (!result.ok) {
      console.error('[chat] All Gemini keys/models failed:', result.status, result.error);
      return res.status(502).json({ error: `Gemini API ${result.status}` });
    }

    const data  = await result.upstream.json();
    const candidate = data?.candidates?.[0];
    const reply = candidate?.content?.parts?.[0]?.text ?? '';
    const finishReason = candidate?.finishReason || 'STOP';

    if (!reply) return res.status(502).json({ error: 'Empty response from Gemini' });

    return res.status(200).json({
      reply: reply.trim(),
      finishReason,
      usageMetadata: data?.usageMetadata || null,
    });

  } catch (err) {
    console.error('[chat] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
