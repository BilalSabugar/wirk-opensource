import React, { useState, useMemo } from 'react';
import { 
  Shield, FileText, Mail, Lock, Cookie, CreditCard, 
  Trash2, CheckCircle2, Search, ExternalLink, AlertCircle, 
  Sparkles, Check, ChevronRight, UserCheck 
} from 'lucide-react';

const LEGAL_DATA = {
  privacy: {
    title: 'Privacy Policy',
    icon: Shield,
    badge: 'GDPR & CCPA Compliant',
    summary: 'WIRK enforces strict zero-knowledge encryption, minimal data collection, and absolute user ownership.',
    sections: [
      {
        id: 'overview',
        heading: '1. Executive Overview & Philosophy',
        body: `WIRK ("the Application", "we", "us") is an executive workspace intelligence and task execution platform developed by Bilal Sabugar. We believe that your productivity, thoughts, and reflections are deeply personal. We operate on a zero-exploitation philosophy: we do not sell your data, we do not track your browsing activity across other websites, and we enforce client-side zero-knowledge encryption on your private diary entries.`
      },
      {
        id: 'data-collected',
        heading: '2. Data Minimization — What We Collect',
        body: `We practice strict data minimization (collecting ONLY what is strictly necessary to operate your workspace):
• Account Identity: Your email address or operator username and encrypted authentication credentials managed securely via Google Firebase Authentication.
• Workspace Data: Projects, task items, checklists, focus session timers, and notes stored in your isolated Firestore cloud database record bound exclusively to your authenticated User ID (UID).
• Encrypted Reflections: Diary entries encrypted directly on your device via AES-GCM-256 before leaving your browser. We never store or transmit your raw encryption passkeys.
• Telemetry & Quotas: Local in-browser counters tracking your daily Gemini AI credit quotas and rate limits (stored locally in localStorage on your device).`
      },
      {
        id: 'data-use',
        heading: '3. Purpose & Use of Data',
        body: `Your data is utilized strictly to provide core workspace functionality:
• Real-time synchronization of your projects and tasks across your authorized devices.
• Client-side decryption and rendering of your personal diary notes.
• Optional AI-assisted task decomposition and strategic coaching when you explicitly invoke ARIA or the Smart Task Creator.`
      },
      {
        id: 'ai-privacy',
        heading: '4. ARIA AI Companion & Google Gemini Processing',
        body: `WIRK integrates an executive AI assistant (ARIA / Smart Task Creator) powered by the Google Gemini API:
• Explicit Consent & Context Control: You maintain complete granular control over what context is shared with ARIA (Projects, Tasks, and/or Diary).
• Transient In-Memory Processing: Context provided to Gemini is processed ephemerally solely to generate your requested suggestions.
• No Training on Private Data: Neither WIRK nor Google uses your private workspace data to train general public AI foundation models under standard developer API terms.
• Human-in-the-Loop: All AI-proposed task additions, priority updates, or status changes require your explicit, manual approval before being executed.`
      },
      {
        id: 'security-storage',
        heading: '5. Security Architecture & Storage',
        body: `• Encryption in Transit: All data transfers use TLS 1.3 cryptographic protocols with HTTPS.
• Encryption at Rest: Workspace records are stored on Google Cloud Firestore with AES-256 server-side encryption.
• Client-Side Zero-Knowledge: Diary reflections are encrypted using AES-GCM-256 with PBKDF2 salt derivation on your client device before database transmission.
• Database Isolation: Strict Firestore Security Rules guarantee that no authenticated operator can read, write, or query data belonging to another user ID.`
      },
      {
        id: 'data-deletion',
        heading: '6. Your Rights & Instant Data Deletion',
        body: `Under GDPR, CCPA, and global privacy standards, you retain complete sovereignty over your data:
• Right to Portability: Export your entire workspace anytime as a structured JSON backup or export your tasks as a CSV spreadsheet.
• Right to Erasure (Instant Deletion): You can permanently delete your account and all associated workspace records directly from Profile Settings → Danger Zone. Deletion is instantaneous and irrevocable.`
      },
      {
        id: 'age-restriction',
        heading: '7. Age Limitation & Children’s Privacy',
        body: `WIRK is designed for professionals and students aged 13 and older (or 16 in the EEA). We do not knowingly collect personal data from children under 13. If you believe a minor has registered an account without guardian consent, please contact bilal.07.04.07@gmail.com for immediate removal.`
      }
    ]
  },

  terms: {
    title: 'Terms of Service',
    icon: FileText,
    badge: 'Effective September 2026',
    summary: 'Clear, transparent rules of use with complete intellectual property ownership retained by you.',
    sections: [
      {
        id: 'acceptance',
        heading: '1. Acceptance of Terms',
        body: `By creating an account or using WIRK, you enter into a binding agreement with developer Bilal Sabugar. If you disagree with any part of these terms, you must not access or use the application.`
      },
      {
        id: 'service-description',
        heading: '2. Workspace Service Description',
        body: `WIRK provides high-performance project execution tools including a 5-stage Kanban board, deep work Pomodoro focus timer, client-side encrypted diary, analytics dashboard, and AI-assisted workspace orchestration.`
      },
      {
        id: 'ip-ownership',
        heading: '3. 100% User Intellectual Property Ownership',
        body: `You retain full, exclusive intellectual property ownership of all tasks, projects, notes, schedules, reflections, and ideas created or stored within WIRK. We claim zero rights or copyright over your content.`
      },
      {
        id: 'account-security',
        heading: '4. Operator Responsibilities & Account Security',
        body: `• You are responsible for safeguarding your login credentials and master passwords.
• You agree not to use the service for unlawful activities, unauthorized penetration testing, or distribution of malicious code.
• You may not reverse-engineer, redistribute, or resell the proprietary application source code.`
      },
      {
        id: 'ai-disclaimer',
        heading: '5. AI Output & Action Confirmation Disclaimer',
        body: `AI-generated suggestions provided by ARIA and the Smart Task Creator are advisory in nature. You retain sole decision-making authority over executing proposed changes, task deletions, or daily schedules. WIRK is not liable for outcomes resulting from AI advice.`
      },
      {
        id: 'uptime-warranty',
        heading: '6. Service Availability & Warranty',
        body: `WIRK is provided on an "as is" and "as available" basis. While we strive for 99.9% uptime and implement continuous backups, we do not warrant uninterrupted operation. We encourage operators to periodically download JSON backups for offline redundancy.`
      },
      {
        id: 'termination',
        heading: '7. Termination',
        body: `You may terminate your account at any time via Profile Settings. We reserve the right to suspend or terminate accounts that engage in security attacks, automated abuse, or violation of these terms.`
      }
    ]
  },

  cookies: {
    title: 'Cookie & Storage Policy',
    icon: Cookie,
    badge: 'Zero Tracking Cookies',
    summary: 'We only use essential local storage tokens for authentication and encrypted session persistence.',
    sections: [
      {
        id: 'cookie-usage',
        heading: '1. What We Store in Your Browser',
        body: `WIRK uses modern browser storage (LocalStorage & SessionStorage) and essential first-party cookies solely to deliver application features:
• Firebase Authentication Session: Keeps you securely logged in across page reloads (Token expires automatically).
• Theme & UI Preferences: Remembers your selected theme palette (Dark / Light) and sidebar collapsed state.
• AI Credits & Quota Cache: Caches your Gemini API request counters locally on your machine.
• Offline Encryption Salts: Locally cached salts for fast diary rendering.`
      },
      {
        id: 'no-third-party-tracking',
        heading: '2. Zero Third-Party Advertising Trackers',
        body: `We do NOT use invasive advertising tracking cookies, Facebook Pixels, behavioral fingerprinting scripts, or cross-site tracking beacons. Your workflow patterns stay strictly inside your workspace.`
      },
      {
        id: 'managing-cookies',
        heading: '3. Managing Your Browser Storage',
        body: `You can clear your browser storage or cookies anytime via your browser settings. Note that clearing local storage will log you out of your current session and reset local UI preferences.`
      }
    ]
  },

  pricing: {
    title: 'Pricing & Transparent Fees',
    icon: CreditCard,
    badge: 'No Hidden Fees · Free Tier Active',
    summary: 'Completely transparent pricing model with zero hidden charges or surprise billing.',
    sections: [
      {
        id: 'pricing-model',
        heading: '1. Current Tier & Pricing Structure',
        body: `WIRK is currently available with generous free executive capacity:
• Full Workspace Access: Unlimited projects, tasks, checklists, notes, focus timers, and encrypted diary entries.
• Included AI Quota: Standard Google Gemini Flash daily free allocation (up to 1,500 requests/day, 15 requests/minute).
• No Hidden Fees: No credit card is required to register, and there are no surprise recurring subscriptions.`
      },
      {
        id: 'refund-policy',
        heading: '2. Refund Policy',
        body: `Since the standard version of WIRK is provided free of charge, subscription refunds do not apply. In the event of future premium enterprise tiers, a 14-day no-questions-asked refund policy will be strictly honored for any paid upgrades.`
      },
      {
        id: 'fair-use',
        heading: '3. Fair Use & Quota Limits',
        body: `To protect service stability for all operators, AI usage is subject to standard rate-limiting. Operators needing ultra-high volume AI throughput may configure their own dedicated Gemini API key in developer settings.`
      }
    ]
  },

  contact: {
    title: 'Business & Developer Details',
    icon: Mail,
    badge: 'Verified Developer',
    summary: 'Direct communication line to developer Bilal Sabugar for support and inquiries.',
    sections: [
      {
        id: 'contact-info',
        heading: '1. Direct Contact & Support Line',
        body: `WIRK is engineered and maintained by Bilal Sabugar.
• Official Support Email: bilal.07.04.07@gmail.com
• Response Time: 24–48 hours for general inquiries, priority response for security reports
• Security Vulnerability Reports: Please subject email with "[SECURITY REPORT]"`
      },
      {
        id: 'business-details',
        heading: '2. Product & Operational Specifications',
        body: `• Application: WIRK: Turn intent into execution (v6.0 Executive Edition)
• Infrastructure: Google Firebase Cloud Architecture & Vercel Global Edge Network
• Technology Stack: React 19, Tailwind CSS, Web Cryptography API, Google Gemini AI`
      },
      {
        id: 'compliance-requests',
        heading: '3. Formal GDPR / CCPA Inquiries',
        body: `For formal compliance inquiries, manual data export assistance, or legal notices, email bilal.07.04.07@gmail.com with your registered account address.`
      }
    ]
  }
};

export default function LegalView({ initialTab = 'privacy', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState('');

  const currentData = LEGAL_DATA[tab] || LEGAL_DATA.privacy;
  const TabIcon = currentData.icon;

  const filteredSections = useMemo(() => {
    if (!search.trim()) return currentData.sections;
    const q = search.toLowerCase();
    return currentData.sections.filter(
      s => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
    );
  }, [currentData, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
         onClick={e => e.target === e.currentTarget && onClose?.()}>
      
      <div className="w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scale-in"
           style={{
             background: 'var(--bg-panel)',
             borderColor: 'var(--border-subtle)',
             boxShadow: 'var(--shadow-modal)',
           }}>

        {/* Top Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm"
                 style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-mid)' }}>
              <TabIcon size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
                  {currentData.title}
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {currentData.badge}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                WIRK Compliance & Governance • Developer: Bilal Sabugar
              </p>
            </div>
          </div>

          <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {/* Tab Strip & Search Bar */}
        <div className="px-6 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll">
            {[
              ['privacy', 'Privacy Policy', Shield],
              ['terms', 'Terms of Service', FileText],
              ['cookies', 'Cookie Policy', Cookie],
              ['pricing', 'Pricing & Refunds', CreditCard],
              ['contact', 'Business & Contact', Mail],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSearch(''); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                style={{
                  background: tab === id ? 'var(--accent)' : 'transparent',
                  color: tab === id ? 'var(--accent-contrast)' : 'var(--text-muted)',
                }}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[200px] sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search clauses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl input border"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto scroll p-6 space-y-6">
          {/* Summary Callout */}
          <div className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
               style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-mid)', color: 'var(--text-hi)' }}>
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <div className="leading-relaxed">
              <strong className="block mb-0.5 font-semibold">Executive Summary:</strong>
              {currentData.summary}
            </div>
          </div>

          {/* Section Clauses */}
          {filteredSections.length > 0 ? (
            <div className="space-y-6">
              {filteredSections.map((sec) => (
                <div key={sec.id} className="p-5 rounded-2xl border space-y-2 transition-all hover:border-zinc-500/30"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>
                    {sec.heading}
                  </h3>
                  <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-base)', lineHeight: 1.75 }}>
                    {sec.body}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs space-y-2" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={24} className="mx-auto text-amber-500" />
              <p>No matching clauses found for "{search}".</p>
              <button onClick={() => setSearch('')} className="text-xs underline text-emerald-500">
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Bottom Footer Action Bar */}
        <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}>
          <div className="text-[11px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Official Policy Document • Last Revised September 2026</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="mailto:bilal.07.04.07@gmail.com?subject=WIRK%20Legal%20%26%20Privacy%20Inquiry"
              className="text-xs font-semibold px-4 py-2 rounded-xl btn-ghost flex items-center gap-1.5"
            >
              <Mail size={13} /> Email Developer
            </a>
            <button
              onClick={onClose}
              className="text-xs font-semibold px-5 py-2 rounded-xl btn-primary shadow-sm"
            >
              Done & Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
