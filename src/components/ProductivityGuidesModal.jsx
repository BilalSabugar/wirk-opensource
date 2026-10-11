import React, { useState } from 'react';
import { 
  X, BookOpen, Clock, ChevronRight, Sparkles, Zap, Shield, 
  Layers, CheckCircle2, ArrowLeft, Share2, ExternalLink
} from 'lucide-react';
import AdBanner from './AdBanner';

const GUIDES = [
  {
    id: 'executive-workflow',
    title: 'The Executive Task Architecture: Turning Chaotic Backlogs into Daily Execution',
    readTime: '6 min read',
    category: 'Productivity Architecture',
    summary: 'A comprehensive methodology for organizing complex projects into a 5-stage workflow pipeline with decoupled blocker resolution.',
    content: `
# The Executive Task Architecture: Turning Chaotic Backlogs into Daily Execution

Modern knowledge workers and engineering leaders face a pervasive cognitive dilemma: task overload. When an operator maintains hundreds of unorganized action items across scattered notes, working memory degrades, resulting in context switching and decision fatigue.

WIRK implements the **Hermes Executive Framework**, a domain-tested architecture designed to decouple high-level strategic intent from minute-by-minute execution.

## The 5 Workflow Stages

Traditional todo apps rely on binary states (Todo / Done), which fail to capture the nuances of active knowledge work. WIRK enforces a five-stage linear progression:

1. **BACKLOG (Incubation)**: Raw ideas, future enhancements, and deferred ambitions. Items in the backlog carry no urgency and consume zero cognitive focus.
2. **TODO (Committed)**: Actively scoped tasks ready for execution within the current sprint cycle.
3. **IN_PROGRESS (Deep Work Active)**: Items currently under active development. Best practices dictate limiting WIP (Work in Progress) to 1–3 simultaneous tasks to preserve flow state.
4. **IN_REVIEW (Validation & Quality Assurance)**: Tasks awaiting review, pull request merging, feedback, or testing verification.
5. **DONE (Completed Velocity)**: Successfully executed milestones archived into the permanent productivity logbook.

## Decoupled Blocker Resolution

In conventional task trackers, a blocked task remains stalled indefinitely in "In Progress" or "Todo", obscuring the real reason for delay.

Under the Hermes architecture, blockers are decoupled into structured metadata containing:
- **Blocker Reason**: A clear statement of what external dependency is missing (e.g., "Waiting on 3D printed brackets", "Pending client API credentials").
- **Dependency Task ID**: Direct linkage to the prerequisite task required to unlock execution.

When a dependency task transitions to 'DONE', the system automatically clears the dependency alert, restoring the task to an actionable state.

## Strategic Daily Planning: The Today Focus Queue

The hallmark of executive velocity is intentional daily scoping. At the beginning of each day, an operator should review active projects and promote 3 to 5 critical deliverables into the **Today Focus** queue. This creates a psychological boundary that shields the operator from backlog overwhelm.
    `
  },
  {
    id: 'pomodoro-velocity',
    title: 'Focus Velocity & The Science of Pomodoro Interval Training',
    readTime: '5 min read',
    category: 'Cognitive Science',
    summary: 'How structured 25-minute deep focus sessions with interval recovery maximize neural throughput and prevent burnout.',
    content: `
# Focus Velocity & The Science of Pomodoro Interval Training

The human prefrontal cortex is optimized for intense, single-task immersion followed by structured recovery periods. Continuous multitasking without boundaries leads to attention residue—a phenomenon where thoughts about unfinished tasks fragment mental bandwidth.

## The 25/5 Neurological Principle

The Pomodoro Technique, integrated natively into the WIRK workspace, leverages circadian rhythms and attentional cycles:

- **25 Minutes Deep Immersion**: Complete detachment from incoming communications, browser tab sprawl, and social alerts. The timer creates an external commitment device.
- **5 Minutes Neural Recovery**: Complete sensory rest. Stepping away from backlit displays allows the brain's Default Mode Network (DMN) to consolidate learnings and process subconscious problem-solving.
- **Long Break (15-30 min)**: Administered every 4 focus blocks to replenish neurochemical energy stores (specifically dopamine and acetylcholine).

## Measuring Velocity Instead of Time

Time spent sitting at a desk is a poor proxy for value created. WIRK records **Focus Sessions**:
- Tracking actual focus minutes spent against specific project modules.
- Correlating focus intervals with task completion velocity.
- Identifying high-friction tasks where an operator experiences unexpected pauses.
    `
  },
  {
    id: 'ai-orchestration',
    title: 'Autonomous Workspace Intelligence: Pair Programming with ARIA',
    readTime: '7 min read',
    category: 'Artificial Intelligence',
    summary: 'How multi-modal LLM companions acting as executive co-pilots automate task decomposition, schedule exams, and audit blockers.',
    content: `
# Autonomous Workspace Intelligence: Pair Programming with ARIA

Artificial intelligence in productivity software is often relegated to simple text autocomplete or chat summaries. In WIRK, ARIA represents a fundamental paradigm shift: an **Autonomous Executive Companion** with direct read/write oversight over workspace topology.

## Natural Intent to Structured Execution

Operators often conceptualize work as loose voice notes or conversational streams:
> *"Plate redesign and print that, headlight mount redesign, front right wheel assembly, solder loose wires, and procure threaded rod and 3S charger by today."*

ARIA processes this unstructured natural language, extracts priorities, domain entities, and deadlines, and outputs interactive action proposal cards:
- Creating new project modules with tailored color codes.
- Structuring individual tasks with accurate priority ratings (CRITICAL, HIGH, MED, LOW).
- Synthesizing visual workload charts and velocity burndowns.

## The Human-in-the-Loop Protocol

Autonomous AI should empower, not overwrite. ARIA operates under strict human-in-the-loop governance:
- **Proposal Generation**: ARIA formulates executable proposals ('CREATE_TASK', 'UPDATE_TASK', 'WRITE_DIARY').
- **Visual Inspection**: The operator reviews the proposed actions via interactive cards.
- **Atomic Approval**: The operator can approve single actions or execute "Apply All" in one click.
- **Reversibility**: Every mutation is logged with undo capabilities.
    `
  },
  {
    id: 'zero-knowledge-privacy',
    title: 'Zero-Knowledge Cryptography: Securing Digital Reflections in the Cloud',
    readTime: '4 min read',
    category: 'Information Security',
    summary: 'Why client-side AES-GCM-256 encryption is essential for authentic personal journaling and vulnerability mitigation.',
    content: `
# Zero-Knowledge Cryptography: Securing Digital Reflections in the Cloud

Digital journaling and daily retrospective reflections contain an operator's most candid assessments: professional vulnerabilities, personal breakthroughs, emotional state, and strategic trade secrets.

Storing raw reflections in standard cloud databases poses an unacceptable risk of breach, internal staff inspection, or automated keyword ad-targeting.

## The WIRK Client-Side Encryption Protocol

WIRK enforces **Client-Side Zero-Knowledge Encryption** for all private diary entries using the Web Cryptography API:

1. **Key Derivation (PBKDF2)**: When an operator logs in, a unique cryptographic key material is derived using HMAC-SHA-256 with a unique salt.
2. **Local AES-GCM-256 Encryption**: Before any reflection leaves the browser window, it is encrypted locally on the device with a cryptographically secure random Initialization Vector (IV).
3. **Ciphertext Storage**: Google Cloud Firestore receives ONLY the encrypted ciphertext string. Neither Google Cloud servers nor WIRK infrastructure ever possess the decryption key.
4. **Client-Side Decryption**: Only your authenticated browser session can decrypt and display the plaintext reflections.

This architectural guarantee gives operators the psychological safety to reflect honestly, knowing their reflections are mathematically inviolable.
    `
  }
];

export default function ProductivityGuidesModal({ isOpen, onClose }) {
  const [selectedGuide, setSelectedGuide] = useState(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[88vh] max-h-[760px] flex flex-col rounded-3xl shadow-2xl border overflow-hidden animate-fade-in relative"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-mid)',
          color: 'var(--text-hi)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b flex items-center justify-between shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            {selectedGuide ? (
              <button
                onClick={() => setSelectedGuide(null)}
                className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                style={{ borderColor: 'var(--border-mid)' }}
              >
                <ArrowLeft size={14} />
                <span>All Guides</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {selectedGuide ? selectedGuide.title : 'WIRK Productivity & Architecture Guides'}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {selectedGuide ? `${selectedGuide.category} · ${selectedGuide.readTime}` : 'Editorial methodologies, cognitive research, and workspace intelligence specs.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close knowledge base"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 scroll space-y-6">
          {selectedGuide ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="prose prose-invert prose-emerald max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line"
                   style={{ color: 'var(--text-base)' }}>
                {selectedGuide.content}
              </div>

              {/* Publisher Content Ad Container (Compliant with AdSense editorial content rules) */}
              <div className="pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-[10px] uppercase font-mono text-zinc-500 mb-2">Publisher Sponsored Resource</p>
                <AdBanner />
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="text-center max-w-md mx-auto mb-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold">Official Knowledge Base</span>
                <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-hi)' }}>High-Value Execution Frameworks</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  In-depth architectural guides on sprint optimization, neural interval training, and cryptographic privacy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GUIDES.map(g => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGuide(g)}
                    className="p-5 rounded-2xl border transition-all hover:border-emerald-500/40 hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-4 group bg-black/[0.02] dark:bg-white/[0.02]"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-500">
                        <span>{g.category}</span>
                        <span className="text-zinc-500">{g.readTime}</span>
                      </div>
                      <h4 className="text-sm font-bold group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-hi)' }}>
                        {g.title}
                      </h4>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                        {g.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 group-hover:translate-x-1 transition-transform">
                      <span>Read Article</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between text-xs shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-dim)' }}>
          <span>WIRK Engineering & Cognitive Architecture</span>
          <span>© 2026 Bilal Sabugar · Open Educational Resource</span>
        </div>

      </div>
    </div>
  );
}
