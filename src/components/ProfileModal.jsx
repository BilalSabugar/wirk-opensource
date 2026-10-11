import React, { useState, useRef, useEffect } from 'react';
import { updateProfile, updateEmail, verifyBeforeUpdateEmail, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {
  X, Download, Upload, Trash2, User, Save, AlertTriangle, CheckCircle2,
  BookOpen, Mail, ShieldAlert, Database, RefreshCw, LogOut, Moon, Sun,
  Shield, Check, Search, Bell, Sliders, Volume2, Info, Key, HardDrive,
  Sparkles, ChevronRight, Laptop, Activity, FileText, Lock, ExternalLink, Cpu,
  Crown, Star
} from 'lucide-react';
import { auth } from '../firebase';
import { exportTasksCSV } from '../constants';
import ForgeLogo from './ForgeLogo';
import { getStoredGeminiKey, setStoredGeminiKey, getStoredModel, setStoredModel, testGeminiKey } from '../utils/aiClient';

const AVATAR_PALETTE = [
  { id: 'obsidian', bg: 'bg-zinc-800',   hex: '#27272A', label: 'Obsidian' },
  { id: 'blue',     bg: 'bg-blue-500',   hex: '#0A84FF', label: 'Blue'     },
  { id: 'purple',   bg: 'bg-purple-500', hex: '#AF52DE', label: 'Purple'   },
  { id: 'emerald',  bg: 'bg-emerald-500',hex: '#30D158', label: 'Emerald'  },
  { id: 'amber',    bg: 'bg-amber-500',  hex: '#FF9F0A', label: 'Amber'    },
  { id: 'rose',     bg: 'bg-rose-500',   hex: '#FF453A', label: 'Rose'     },
  { id: 'indigo',   bg: 'bg-indigo-500', hex: '#5856D6', label: 'Indigo'   },
  { id: 'teal',     bg: 'bg-teal-500',   hex: '#64D2FF', label: 'Teal'     },
];

const ACCENT_COLORS = [
  { id: 'white',   label: 'Monochrome', hex: '#FFFFFF', bgClass: 'bg-zinc-400' },
  { id: 'blue',    label: 'Electric Blue', hex: '#0A84FF', bgClass: 'bg-[#0A84FF]' },
  { id: 'purple',  label: 'Purple',     hex: '#AF52DE', bgClass: 'bg-[#AF52DE]' },
  { id: 'pink',    label: 'Rose',       hex: '#FF453A', bgClass: 'bg-[#FF453A]' },
  { id: 'orange',  label: 'Amber',      hex: '#FF9F0A', bgClass: 'bg-[#FF9F0A]' },
  { id: 'green',   label: 'Emerald',    hex: '#30D158', bgClass: 'bg-[#30D158]' },
  { id: 'indigo',  label: 'Indigo',     hex: '#5856D6', bgClass: 'bg-[#5856D6]' },
];

const SETTINGS_SECTIONS = [
  { id: 'general',       label: 'General & Profile', icon: User,     desc: 'Profile, workspace preferences & audio' },
  { id: 'byok',          label: 'AI Keys & BYOK',    icon: Key,      desc: 'Bring your own Gemini API key & model settings' },
  { id: 'billing',       label: 'Plan & Billing',    icon: Crown,    desc: 'Executive Pro, lifetime pass & licenses' },
  { id: 'appearance',    label: 'Appearance',        icon: Moon,     desc: 'Themes, accent colors & visual effects' },
  { id: 'notifications', label: 'Notifications',     icon: Bell,     desc: 'Alerts, sound chimes & reminders' },
  { id: 'data',          label: 'Data & Storage',    icon: Database, desc: 'Sync status, offline exports & imports' },
  { id: 'account',       label: 'Sign-In & Security',icon: Shield,   desc: 'Email, password & session security' },
  { id: 'about',         label: 'About & Legal',     icon: Info,     desc: 'System info, version & terms' },
];

/* ── Standard Toggle Switch Component ── */
function SwitchToggle({ checked, onChange, disabled = false, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors duration-200 relative inline-flex items-center shrink-0 focus:outline-none select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        backgroundColor: checked ? '#10B981' : 'rgba(120, 120, 128, 0.32)',
        border: '1px solid ' + (checked ? '#059669' : 'rgba(120, 120, 128, 0.2)'),
      }}
    >
      <span
        className="w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out absolute top-[1px]"
        style={{
          transform: checked ? 'translateX(21px)' : 'translateX(1px)',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.2)',
        }}
      />
    </button>
  );
}

/* ── Inset Grouped Container ── */
function SettingGroup({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {(title || description) && (
        <div className="px-1">
          {title && <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h3>}
          {description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{description}</p>}
        </div>
      )}
      <div className="rounded-2xl border divide-y overflow-hidden"
           style={{
             background: 'var(--bg-panel)',
             borderColor: 'var(--border-subtle)',
           }}>
        {children}
      </div>
    </div>
  );
}

/* ── Group Item Row (Monochrome Luxury Theme) ── */
function SettingRow({ icon: Icon, title, subtitle, rightElement, onClick, isClickable = false }) {
  const content = (
    <div className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
      isClickable ? 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer' : ''
    }`} style={{ borderBottomColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
            <Icon size={14} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-hi)' }}>{title}</p>
          {subtitle && <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {rightElement}
        {isClickable && <ChevronRight size={14} className="text-zinc-400" />}
      </div>
    </div>
  );

  return isClickable ? (
    <div onClick={onClick}>{content}</div>
  ) : (
    <div>{content}</div>
  );
}

export default function ProfileModal({
  user,
  tasks = [],
  projects = [],
  notes = [],
  diary = {},
  onClose,
  onLegal,
  diaryLinkTasks = true,
  onDiaryLinkToggle,
  onImportData,
  onOpenDevCredits,
  onUpgrade,
  currentTheme = 'dark',
  onSelectTheme,
  availableThemes = []
}) {
  const [activeTab,     setActiveTab]     = useState('general');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [displayName,   setDisplayName]   = useState(user?.displayName || '');
  const [avatarColor,   setAvatarColor]   = useState(AVATAR_PALETTE[0]);
  const [selectedAccent, setSelectedAccent] = useState('white');
  const [saveState,     setSaveState]     = useState('idle');
  // BYOK (Bring Your Own Key) States
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getStoredGeminiKey());
  const [selectedModel, setSelectedModel]   = useState(() => getStoredModel());
  const [showKeyText, setShowKeyText]       = useState(false);
  const [keySaveStatus, setKeySaveStatus]   = useState('');
  const [keyTestStatus, setKeyTestStatus]   = useState(null);
  const [testingKey, setTestingKey]         = useState(false);
  const [devSecretClicks, setDevSecretClicks] = useState(0);

  // App preferences stored in localStorage
  const [soundEnabled, setSoundEnabled]   = useState(() => localStorage.getItem('pref-sound') !== 'false');
  const [motionReduced, setMotionReduced] = useState(() => localStorage.getItem('pref-reduce-motion') === 'true');
  const [highBlur, setHighBlur]           = useState(() => localStorage.getItem('pref-high-blur') !== 'false');
  const [defaultPriority, setDefaultPriority] = useState(() => localStorage.getItem('pref-default-priority') || 'MED');
  const [notifyDue, setNotifyDue]         = useState(() => localStorage.getItem('pref-notify-due') !== 'false');
  const [notifyPomodoro, setNotifyPomodoro] = useState(() => localStorage.getItem('pref-notify-pomo') !== 'false');

  // Account security states
  const [deleteMode,    setDeleteMode]    = useState(false);
  const [deletePass,    setDeletePass]    = useState('');
  const [deleteError,   setDeleteError]   = useState('');
  const [deleting,      setDeleting]      = useState(false);

  // Email upgrade state
  const [newEmail,     setNewEmail]       = useState(user?.email || '');
  const [emailPass,    setEmailPass]      = useState('');
  const [emailStatus,  setEmailStatus]    = useState('idle');
  const [emailErr,     setEmailErr]       = useState('');

  // Data Import state
  const [importFile,    setImportFile]    = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMode,    setImportMode]    = useState('merge');
  const [importing,     setImporting]     = useState(false);
  const [importStatus,  setImportStatus]  = useState('');
  const [importErr,     setImportErr]     = useState('');
  const fileInputRef = useRef(null);

  const isLegacyEmail = user?.email?.endsWith('@enginecore.dev');
  const initial = (displayName || user?.email || 'U')[0].toUpperCase();
  const username = isLegacyEmail ? user?.email?.replace('@enginecore.dev', '') : user?.email;
  const joined   = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Active';

  // Toggle handlers with localStorage
  const handleSoundToggle = (val) => {
    setSoundEnabled(val);
    localStorage.setItem('pref-sound', String(val));
  };
  const handleMotionToggle = (val) => {
    setMotionReduced(val);
    localStorage.setItem('pref-reduce-motion', String(val));
  };
  const handleBlurToggle = (val) => {
    setHighBlur(val);
    localStorage.setItem('pref-high-blur', String(val));
  };
  const handlePriorityChange = (val) => {
    setDefaultPriority(val);
    localStorage.setItem('pref-default-priority', val);
  };
  const handleNotifyDue = (val) => {
    setNotifyDue(val);
    localStorage.setItem('pref-notify-due', String(val));
  };
  const handleNotifyPomodoro = (val) => {
    setNotifyPomodoro(val);
    localStorage.setItem('pref-notify-pomo', String(val));
  };

  /* ── Save display name ── */
  const saveName = async () => {
    if (!displayName.trim()) return;
    setSaveState('saving');
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2200);
    } catch {
      setSaveState('error');
    }
  };

  /* ── Friendly Auth Error Parser ── */
  const parseAuthError = (err) => {
    if (!err) return 'An unexpected error occurred.';
    const code = err.code || '';
    if (code.includes('requires-recent-login')) {
      return 'Security check: Enter your account password to confirm email update.';
    }
    if (code.includes('invalid-credential') || code.includes('wrong-password')) {
      return 'Incorrect password. Please verify and try again.';
    }
    if (code.includes('email-already-in-use')) {
      return 'This email address is already registered to another account.';
    }
    if (code.includes('invalid-email')) {
      return 'Please enter a valid email format (e.g. name@example.com).';
    }
    return (err.message || '').replace(/^Firebase:\s*/i, '').replace(/\(auth\/[^)]+\)\.?/i, '').trim() || 'Unable to update email.';
  };

  /* ── Forgot Legacy Password ── */
  const handleForgotLegacyPassword = async () => {
    const targetEmail = (newEmail && newEmail.includes('@') && !newEmail.endsWith('@enginecore.dev')) ? newEmail.trim() : null;
    if (!targetEmail) {
      setEmailErr('Please enter your real email address above to receive your reset link.');
      return;
    }
    setEmailStatus('updating');
    setEmailErr('');
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setEmailStatus('success');
      setEmailErr('');
    } catch (err) {
      setEmailErr(parseAuthError(err));
      setEmailStatus('error');
    }
  };

  /* ── Update Email ── */
  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    if (!newEmail.includes('@') || newEmail.endsWith('@enginecore.dev')) {
      setEmailErr('Please enter a valid real email address.');
      return;
    }
    setEmailStatus('updating');
    setEmailErr('');
    try {
      if (emailPass && auth.currentUser && user?.email) {
        const cred = EmailAuthProvider.credential(user.email, emailPass);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      if (verifyBeforeUpdateEmail && auth.currentUser) {
        await verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim());
        setEmailStatus('success');
        setEmailErr('');
        setEmailPass('');
      } else if (updateEmail && auth.currentUser) {
        await updateEmail(auth.currentUser, newEmail.trim());
        setEmailStatus('success');
        setEmailPass('');
      }
    } catch (err) {
      setEmailErr(parseAuthError(err));
      setEmailStatus('error');
    }
  };

  /* ── Export JSON ── */
  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      operator:   username,
      version:    '6.0.0',
      projects:   projects.map(p => ({ ...p })),
      tasks:      tasks.map(t => ({ ...t })),
      notes:      notes.map(n => ({ ...n })),
      diary:      diary || {}
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `forge-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── File Select & Import ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErr('');
    setImportStatus('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const obj = JSON.parse(evt.target?.result || '{}');
        if (!Array.isArray(obj.projects) && !Array.isArray(obj.tasks) && !Array.isArray(obj.notes)) {
          throw new Error('File does not contain valid WIRK backup data');
        }
        setImportPreview(obj);
        setImportFile(file);
      } catch (err) {
        setImportErr(err.message || 'Failed to parse JSON backup file');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importPreview || !onImportData) return;
    setImporting(true);
    setImportErr('');
    try {
      const res = await onImportData(importPreview, importMode === 'replace');
      setImportStatus(`✓ Imported ${res.projectsCount} projects, ${res.tasksCount} tasks, and ${res.notesCount} notes.`);
      setImportPreview(null);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setImportErr(err.message || 'Import failed');
    }
    setImporting(false);
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async () => {
    if (!deletePass) { setDeleteError('Enter your password to confirm deletion.'); return; }
    setDeleting(true); setDeleteError('');
    try {
      const email = user.email;
      const cred  = EmailAuthProvider.credential(email, deletePass);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await deleteUser(auth.currentUser);
    } catch (err) {
      setDeleteError(err.message.replace('Firebase:','').replace(/\(.*\)/,'').trim());
      setDeleting(false);
    }
  };

  // Filter sections by search query
  const filteredSections = SETTINGS_SECTIONS.filter(sec =>
    sec.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.60)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={onClose}
    >
      {/* ── System Settings Window ── */}
      <div
        className="w-full max-w-4xl h-[88vh] max-h-[740px] flex flex-col md:flex-row rounded-2xl md:rounded-3xl shadow-2xl border overflow-hidden animate-fade-in"
        style={{
          background: 'var(--modal-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)'
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── LEFT MASTER SIDEBAR (Settings Sidebar) ── */}
        <div className={`${mobileDetailOpen ? 'hidden md:flex' : 'flex'} w-full md:w-72 md:border-r flex-col shrink-0 h-full md:h-auto`}
             style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          
          {/* Window Header + Search Header */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                  <Sliders size={13} />
                </div>
                <span className="text-xs font-bold tracking-tight uppercase" style={{ color: 'var(--text-hi)' }}>
                  Settings
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Close Settings"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search settings…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-terminal w-full pl-8 pr-3 py-1.5 text-xs rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* User Profile Mini-Card in Sidebar */}
          <div
            onClick={() => { setActiveTab('general'); setMobileDetailOpen(true); }}
            className={`p-3.5 mx-2 my-2 rounded-xl transition-all cursor-pointer flex items-center gap-3 border ${
              activeTab === 'general'
                ? 'bg-black/5 dark:bg-white/[0.08] shadow-sm'
                : 'bg-transparent border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
            style={{ borderColor: activeTab === 'general' ? 'var(--border-dim)' : 'transparent' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner border border-white/15"
              style={{ backgroundColor: avatarColor.hex }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--text-hi)' }}>
                {displayName || username}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {user?.email || 'WIRK Account'}
              </p>
            </div>
            <ChevronRight size={13} className="shrink-0" style={{ color: 'var(--text-dim)' }} />
          </div>

          <div className="h-px mx-3 my-1" style={{ background: 'var(--border-subtle)' }} />

          {/* Navigation Menu List */}
          <div className="flex-1 p-2 space-y-1 overflow-y-auto scroll">
            {filteredSections.map(sec => {
              const Icon = sec.icon;
              const isSelected = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => { setActiveTab(sec.id); setMobileDetailOpen(true); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'shadow-sm'
                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                  }`}
                  style={{
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? 'var(--accent-contrast)' : 'var(--text-base)',
                  }}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'text-black dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate font-semibold">
                      {sec.label}
                    </p>
                  </div>
                  {isSelected && <ChevronRight size={13} className="shrink-0 opacity-70" />}
                </button>
              );
            })}
          </div>

          {/* Clean Minimal Sidebar Footer (No generic Online pill) */}
          <div className="p-3.5 border-t text-[11px] flex items-center justify-between"
               style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-dim)' }}>
            <span>WIRK</span>
            <span className="font-mono text-[10px]">v6.0</span>
          </div>

        </div>

        {/* ── RIGHT DETAIL PANE (Inset Grouped Settings) ── */}
        <div className={`${mobileDetailOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 overflow-hidden`} style={{ background: 'var(--bg-base)' }}>
          
          {/* Top Bar Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between shrink-0 gap-3"
               style={{ borderColor: 'var(--border-subtle)', background: 'var(--header-bg)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="md:hidden px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 shrink-0"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-hi)' }}
              >
                ← Back
              </button>
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-wide truncate" style={{ color: 'var(--text-hi)' }}>
                  {SETTINGS_SECTIONS.find(s => s.id === activeTab)?.label || 'Settings'}
                </h2>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {SETTINGS_SECTIONS.find(s => s.id === activeTab)?.desc}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-ghost"
              >
                Done
              </button>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto scroll space-y-6 pb-20 sm:pb-6">

            {/* ════════════════════════════════════════════════════════
                TAB 1: GENERAL & PROFILE
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Profile Identity Card */}
                <SettingGroup title="Identity & Profile">
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg border border-white/20 ring-4 ring-black/5 dark:ring-white/5"
                      style={{ backgroundColor: avatarColor.hex }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-hi)' }}>
                        {displayName || username}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {user?.email || 'WIRK Account'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
                          Member since {joined}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Tint Row */}
                  <SettingRow
                    icon={Sparkles}
                    title="Avatar Tint"
                    subtitle="Choose your profile badge color tone"
                    rightElement={
                      <div className="flex items-center gap-3 px-1 py-1">
                        {AVATAR_PALETTE.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setAvatarColor(c)}
                            className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${
                              avatarColor.hex === c.hex
                                ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white ring-offset-2 ring-offset-[var(--bg-panel)] shadow-sm'
                                : 'opacity-40 hover:opacity-90 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    }
                  />

                  {/* Display Name Input Row */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                       style={{ borderBottomColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-hi)' }}>Display Name</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Your name shown across projects and journals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName()}
                        placeholder="Enter full name"
                        className="input-terminal px-3 py-1.5 text-xs rounded-lg w-44"
                      />
                      <button
                        onClick={saveName}
                        disabled={saveState === 'saving'}
                        className="px-3.5 py-1.5 text-xs font-semibold btn-primary rounded-lg flex items-center gap-1 shrink-0"
                      >
                        {saveState === 'saving' ? (
                          'Saving…'
                        ) : saveState === 'saved' ? (
                          <><Check size={12} /> Saved</>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                </SettingGroup>

                {/* Workspace Preferences */}
                <SettingGroup title="Task & Workspace Behavior">
                  {/* Default Priority */}
                  <SettingRow
                    icon={Sliders}
                    title="Default Task Priority"
                    subtitle="Initial priority assigned to new tasks"
                    rightElement={
                      <div className="flex p-0.5 rounded-lg gap-0.5 border"
                           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                        {['LOW', 'MED', 'HIGH', 'CRITICAL'].map(p => (
                          <button
                            key={p}
                            onClick={() => handlePriorityChange(p)}
                            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              defaultPriority === p
                                ? 'shadow-xs'
                                : 'hover:opacity-100'
                            }`}
                            style={{
                              background: defaultPriority === p ? 'var(--accent)' : 'transparent',
                              color: defaultPriority === p ? 'var(--accent-contrast)' : 'var(--text-muted)',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    }
                  />

                  {/* Auto-link Daily Completed Tasks */}
                  <SettingRow
                    icon={FileText}
                    title="Auto-Link Daily Tasks to Journal"
                    subtitle="Automatically log tasks completed today into your daily diary entry"
                    rightElement={
                      <SwitchToggle
                        checked={diaryLinkTasks}
                        onChange={onDiaryLinkToggle}
                      />
                    }
                  />

                  {/* UI Sound Effects */}
                  <SettingRow
                    icon={Volume2}
                    title="UI Audio Feedback"
                    subtitle="Play subtle tactile audio cues on task resolution and timer milestones"
                    rightElement={
                      <SwitchToggle
                        checked={soundEnabled}
                        onChange={handleSoundToggle}
                      />
                    }
                  />
                </SettingGroup>

                {/* Workspace Statistics Bento */}
                <SettingGroup title="Workspace Snapshot">
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border text-center"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Projects</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-hi)' }}>{projects.length}</p>
                    </div>
                    <div className="p-3 rounded-xl border text-center"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Tasks</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-hi)' }}>{tasks.length}</p>
                    </div>
                    <div className="p-3 rounded-xl border text-center"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Resolved</p>
                      <p className="text-lg font-bold text-emerald-500 mt-1">
                        {tasks.filter(t => t.completed).length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border text-center"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-hi)' }}>{notes.length}</p>
                    </div>
                  </div>
                </SettingGroup>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB: PLAN & BILLING
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-fade-in">
                {/* Active Plan Overview */}
                <SettingGroup title="Current Active Subscription">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold" style={{ color: 'var(--text-hi)' }}>Executive Starter</h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          $0 / month · 1,500 daily AI commands · Local AES-GCM-256 encryption
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgrade?.()}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#000000',
                      }}
                    >
                      <Crown size={15} />
                      <span>Upgrade to Pro</span>
                    </button>
                  </div>
                </SettingGroup>

                {/* Available Upgrades */}
                <SettingGroup title="Available Executive Upgrades">
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pro Card */}
                    <div className="p-4 rounded-xl border space-y-3 relative overflow-hidden"
                         style={{ background: 'var(--bg-surface)', borderColor: 'rgba(245,158,11,0.3)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                          <Crown size={14} /> Executive Pro
                        </span>
                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-hi)' }}>$9 / mo</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Unlimited ARIA AI orchestrations, full voice dispatch, custom model switching, and priority real-time cloud backup.
                      </p>
                      <button
                        onClick={() => onUpgrade?.()}
                        className="w-full py-2 rounded-lg text-xs font-bold border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        Select Pro Tier
                      </button>
                    </div>

                    {/* Lifetime Pass Card */}
                    <div className="p-4 rounded-xl border space-y-3 relative overflow-hidden"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-mid)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
                          <Star size={14} className="text-emerald-400" /> Founder Lifetime Pass
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">$39 once</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Pay once, own WIRK forever. All future v6.x and v7 updates, offline-first guarantees, and lifetime VIP founder badge.
                      </p>
                      <button
                        onClick={() => onUpgrade?.()}
                        className="w-full py-2 rounded-lg text-xs font-bold border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                      >
                        Claim Lifetime Pass
                      </button>
                    </div>
                  </div>
                </SettingGroup>

                {/* Feature Comparison Rows */}
                <SettingGroup title="Executive Tier Privileges">
                  <SettingRow
                    icon={Sparkles}
                    title="Daily ARIA AI Quotas"
                    subtitle="Starter: 1,500 requests/day · Pro: Unlimited"
                    rightElement={<span className="text-[11px] font-mono text-emerald-400">1,500 / Unlimited</span>}
                  />
                  <SettingRow
                    icon={Lock}
                    title="Zero-Knowledge Diary Encryption"
                    subtitle="Client-side AES-GCM-256 cryptography included on all plans"
                    rightElement={<span className="text-[11px] font-mono text-zinc-400">Included</span>}
                  />
                  <SettingRow
                    icon={Database}
                    title="Multi-Device Cloud Sync"
                    subtitle="Real-time Firestore conflict-free replication"
                    rightElement={<span className="text-[11px] font-mono text-zinc-400">Included</span>}
                  />
                  <SettingRow
                    icon={Activity}
                    title="Ad-Free Guarantee"
                    subtitle="Zero third-party trackers, zero telemetry, 100% ad-free on all private workspaces"
                    rightElement={<span className="text-[11px] font-mono text-emerald-400">Guaranteed</span>}
                  />
                </SettingGroup>
              </div>
            )}

            
            {/* ════════════════════════════════════════════════════════
                TAB: AI KEYS & BYOK (OPEN-SOURCE EDITION)
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'byok' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Gemini API Key Management */}
                <SettingGroup
                  title="Google Gemini API (Bring Your Own Key)"
                  description="WIRK Open-Source runs directly in your browser. Add your free Gemini key to activate ARIA AI and smart breakdowns."
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-hi)' }}>
                        Gemini API Key
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKeyText ? 'text' : 'password'}
                            value={geminiKeyInput}
                            onChange={e => {
                              setGeminiKeyInput(e.target.value);
                              setKeyTestStatus(null);
                            }}
                            placeholder="AIzaSy..."
                            className="input-terminal w-full px-3.5 py-2.5 text-xs rounded-xl font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeyText(v => !v)}
                            className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            {showKeyText ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStoredGeminiKey(geminiKeyInput);
                            setKeySaveStatus('Saved!');
                            setTimeout(() => setKeySaveStatus(''), 2000);
                          }}
                          className="px-4 py-2.5 text-xs font-semibold rounded-xl btn-primary shrink-0 flex items-center gap-1.5"
                        >
                          <Save size={13} />
                          <span>{keySaveStatus || 'Save Key'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-2">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Keys are stored locally in your browser (never transmitted to third-party servers).
                        </span>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Get Free Key</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!geminiKeyInput || testingKey}
                          onClick={async () => {
                            setTestingKey(true);
                            setKeyTestStatus(null);
                            const res = await testGeminiKey(geminiKeyInput);
                            setTestingKey(false);
                            setKeyTestStatus(res);
                          }}
                          className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          style={{ borderColor: 'var(--border-mid)' }}
                        >
                          {testingKey ? 'Testing Connection…' : 'Test API Key'}
                        </button>

                        {keyTestStatus && (
                          <span className={`text-xs font-medium ${keyTestStatus.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {keyTestStatus.ok ? '✓ Connected successfully!' : `✗ ${keyTestStatus.message}`}
                          </span>
                        )}
                      </div>

                      {/* Active Status Badge */}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        geminiKeyInput
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {geminiKeyInput ? 'KEY CONFIGURED' : 'NO KEY SET'}
                      </span>
                    </div>
                  </div>

                  {/* Model Selector */}
                  <SettingRow
                    icon={Cpu}
                    title="Foundation Model"
                    subtitle="Select the default Gemini model for ARIA companion responses"
                    rightElement={
                      <select
                        value={selectedModel}
                        onChange={e => {
                          setSelectedModel(e.target.value);
                          setStoredModel(e.target.value);
                        }}
                        className="input-terminal px-2.5 py-1.5 text-xs rounded-lg font-mono"
                      >
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                        <option value="gemini-flash-latest">gemini-flash-latest</option>
                        <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      </select>
                    }
                  />
                </SettingGroup>

                {/* Storage & Database Architecture */}
                <SettingGroup
                  title="Storage & Database Provider"
                  description="Choose how tasks, notes, and reflections are persisted."
                >
                  <SettingRow
                    icon={Database}
                    title="Active Provider: Local-First"
                    subtitle="Stored in local browser IndexedDB & localStorage. Zero server setup required."
                    rightElement={
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        OFFLINE-FIRST
                      </span>
                    }
                  />
                  <SettingRow
                    icon={HardDrive}
                    title="Cloud Sync (Optional Firebase)"
                    subtitle="To sync across devices, configure VITE_FIREBASE_* variables in your .env file."
                    rightElement={<span className="text-[11px] font-mono text-zinc-400">Supported</span>}
                  />
                </SettingGroup>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB 2: APPEARANCE
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Theme Mode Selector with Visual Preview Cards */}
                <SettingGroup title="Interface Lighting">
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Dark Obsidian Mode */}
                    <div
                      onClick={() => onSelectTheme?.('dark')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        currentTheme === 'dark'
                          ? 'ring-2 ring-zinc-500 shadow-lg'
                          : 'hover:border-zinc-400'
                      }`}
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: currentTheme === 'dark' ? 'var(--accent)' : 'var(--border-subtle)',
                      }}
                    >
                      {/* Mini Window Preview */}
                      <div className="w-full h-24 rounded-lg bg-[#000000] border border-white/15 p-2.5 flex flex-col justify-between mb-3 shadow-inner">
                        <div className="flex items-center justify-between text-zinc-500">
                          <Moon size={11} className="text-emerald-400" />
                          <span className="text-[9px] font-mono text-zinc-600">DARK</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-3/4 h-2 rounded bg-zinc-800" />
                          <div className="w-1/2 h-1.5 rounded bg-zinc-800/60" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-1/3 h-3 rounded bg-zinc-800" />
                          <div className="w-1/4 h-3 rounded bg-white/20" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>Dark Mode (Obsidian)</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pure OLED blacks & frosted titanium</p>
                        </div>
                        {currentTheme === 'dark' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                               style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Light Studio Mode */}
                    <div
                      onClick={() => onSelectTheme?.('light')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        currentTheme === 'light'
                          ? 'ring-2 ring-zinc-500 shadow-lg'
                          : 'hover:border-zinc-400'
                      }`}
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: currentTheme === 'light' ? 'var(--accent)' : 'var(--border-subtle)',
                      }}
                    >
                      {/* Mini Window Preview */}
                      <div className="w-full h-24 rounded-lg bg-[#F5F5F7] border border-black/10 p-2.5 flex flex-col justify-between mb-3 shadow-inner">
                        <div className="flex items-center justify-between text-zinc-500">
                          <Sun size={11} className="text-amber-500" />
                          <span className="text-[9px] font-mono text-zinc-400">LIGHT</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-3/4 h-2 rounded bg-zinc-300" />
                          <div className="w-1/2 h-1.5 rounded bg-zinc-200" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-1/3 h-3 rounded bg-zinc-300" />
                          <div className="w-1/4 h-3 rounded bg-black/20" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>Light Mode (Studio)</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Crisp minimal studio lighting</p>
                        </div>
                        {currentTheme === 'light' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                               style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </SettingGroup>

                {/* Accent Color Selection */}
                <SettingGroup title="Accent Color">
                  <SettingRow
                    icon={Sparkles}
                    title="Highlight Accent"
                    subtitle="System highlight and active button color palette"
                    rightElement={
                      <div className="flex items-center gap-3.5 px-1 py-1">
                        {ACCENT_COLORS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedAccent(c.id)}
                            className={`w-5 h-5 rounded-full ${c.bgClass} transition-all flex items-center justify-center ${
                              selectedAccent === c.id
                                ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white ring-offset-2 ring-offset-[var(--bg-panel)] shadow-sm'
                                : 'opacity-40 hover:opacity-90 hover:scale-105'
                            }`}
                            title={c.label}
                          >
                            {selectedAccent === c.id && (
                              <Check size={9} className="text-white drop-shadow-xs" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                      </div>
                    }
                  />
                </SettingGroup>

                {/* Visual Effects & Motion */}
                <SettingGroup title="Glass & Motion Experience">
                  <SettingRow
                    icon={Activity}
                    title="Deep Frosted Glass Blur"
                    subtitle="Enable multi-layer GPU backdrop-filter blur effects across headers and modals"
                    rightElement={
                      <SwitchToggle
                        checked={highBlur}
                        onChange={handleBlurToggle}
                      />
                    }
                  />

                  <SettingRow
                    icon={Laptop}
                    title="Reduce Motion"
                    subtitle="Minimize sliding animations and page transitions for lower latency"
                    rightElement={
                      <SwitchToggle
                        checked={motionReduced}
                        onChange={handleMotionToggle}
                      />
                    }
                  />
                </SettingGroup>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB 3: NOTIFICATIONS & FOCUS
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <SettingGroup title="Alerts & Reminders">
                  <SettingRow
                    icon={Bell}
                    title="Due Date Alerts"
                    subtitle="Highlight tasks due today with prominent amber badges on the dashboard"
                    rightElement={
                      <SwitchToggle
                        checked={notifyDue}
                        onChange={handleNotifyDue}
                      />
                    }
                  />

                  <SettingRow
                    icon={Sliders}
                    title="Pomodoro Focus Milestone Chimes"
                    subtitle="Audio cues when focus sessions and break intervals conclude"
                    rightElement={
                      <SwitchToggle
                        checked={notifyPomodoro}
                        onChange={handleNotifyPomodoro}
                      />
                    }
                  />
                </SettingGroup>

                <SettingGroup title="Notification Permissions">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-hi)' }}>Browser Notifications</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {('Notification' in window && Notification.permission === 'granted')
                          ? '✓ System notifications enabled'
                          : 'Enable native browser banners for background timer alerts'}
                      </p>
                    </div>
                    {('Notification' in window && Notification.permission !== 'granted') && (
                      <button
                        onClick={() => Notification.requestPermission()}
                        className="px-3.5 py-1.5 btn-primary text-xs font-semibold rounded-lg shrink-0"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </SettingGroup>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB 4: DATA BACKUP & STORAGE
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'data' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Storage Health & Cloud Sync */}
                <SettingGroup title="Workspace Storage & Health">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-hi)' }}>
                        <HardDrive size={14} className="text-zinc-400" />
                        Storage Distribution
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {tasks.length + projects.length + notes.length} Total Objects
                      </span>
                    </div>

                    {/* Storage Visual Segmented Bar */}
                    <div className="w-full h-2 rounded-full overflow-hidden flex border"
                         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                      <div style={{ width: `${Math.max(10, (tasks.length / Math.max(1, tasks.length + projects.length + notes.length)) * 100)}%` }} className="h-full bg-zinc-400 dark:bg-zinc-200" title="Tasks" />
                      <div style={{ width: `${Math.max(10, (projects.length / Math.max(1, tasks.length + projects.length + notes.length)) * 100)}%` }} className="h-full bg-zinc-600 dark:bg-zinc-500" title="Projects" />
                      <div style={{ width: `${Math.max(10, (notes.length / Math.max(1, tasks.length + projects.length + notes.length)) * 100)}%` }} className="h-full bg-zinc-800 dark:bg-zinc-700" title="Notes" />
                    </div>

                    <div className="flex flex-wrap gap-4 text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-200" />
                        <span>Tasks ({tasks.length})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-500" />
                        <span>Projects ({projects.length})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-700" />
                        <span>Notes ({notes.length})</span>
                      </div>
                    </div>
                  </div>
                </SettingGroup>

                {/* Export Hub */}
                <SettingGroup title="Export Workspace Backups" description="Download an offline snapshot of your complete workspace data.">
                  <div className="p-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={exportJSON}
                      className="flex-1 btn-ghost py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Full Workspace JSON
                    </button>
                    <button
                      onClick={() => exportTasksCSV(tasks, projects)}
                      className="flex-1 btn-ghost py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Tasks Spreadsheet (CSV)
                    </button>
                  </div>
                </SettingGroup>

                {/* Restore & Import Hub */}
                <SettingGroup title="Restore & Import Data" description="Restore a previously exported WIRK JSON backup file.">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Select Backup File</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Supports .json files formatted by FORGE</p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="system-backup-file-input"
                      />
                      <label
                        htmlFor="system-backup-file-input"
                        className="px-3.5 py-1.5 btn-ghost text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload size={13} /> Choose File
                      </label>
                    </div>

                    {importStatus && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                        <span>{importStatus}</span>
                      </div>
                    )}

                    {importErr && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                        <span>{importErr}</span>
                      </div>
                    )}

                    {importPreview && (
                      <div className="p-4 border text-xs space-y-3 rounded-xl"
                           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center justify-between font-semibold" style={{ color: 'var(--text-hi)' }}>
                          <span className="flex items-center gap-1.5">
                            <FileText size={14} className="text-zinc-400" />
                            {importFile?.name}
                          </span>
                          <span className="text-emerald-500 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                            Valid JSON
                          </span>
                        </div>

                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Contents: <strong style={{ color: 'var(--text-hi)' }}>{importPreview.projects?.length || 0}</strong> projects, <strong style={{ color: 'var(--text-hi)' }}>{importPreview.tasks?.length || 0}</strong> tasks, <strong style={{ color: 'var(--text-hi)' }}>{importPreview.notes?.length || 0}</strong> notes.
                        </p>

                        <div className="flex items-center gap-5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-base)' }}>
                            <input
                              type="radio"
                              name="importMode"
                              value="merge"
                              checked={importMode === 'merge'}
                              onChange={() => setImportMode('merge')}
                              className="accent-zinc-700 dark:accent-white"
                            />
                            Merge into existing
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-amber-500 text-xs">
                            <input
                              type="radio"
                              name="importMode"
                              value="replace"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="accent-amber-500"
                            />
                            Overwrite entire workspace
                          </label>
                        </div>

                        <button
                          onClick={handleExecuteImport}
                          disabled={importing}
                          className="w-full py-2.5 btn-primary font-semibold text-xs rounded-lg flex items-center justify-center gap-2"
                        >
                          {importing ? (
                            <><RefreshCw size={13} className="animate-spin" /> Restoring…</>
                          ) : (
                            'Confirm & Execute Import'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </SettingGroup>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB 5: SIGN-IN & SECURITY
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Account Credentials */}
                <SettingGroup title="Sign-In Credentials">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Account Email</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                      </div>
                      {isLegacyEmail ? (
                        <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono rounded-md">
                          Legacy Account
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-mono rounded-md flex items-center gap-1">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      )}
                    </div>

                    {isLegacyEmail && (
                      <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-xs text-amber-600 dark:text-amber-200/90 rounded-xl space-y-1">
                        <p className="font-semibold text-amber-500 flex items-center gap-1.5">
                          <Mail size={13} /> Upgrade Account Email
                        </p>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          Update to your personal email address to enable password resets and cross-device sign-in.
                        </p>
                      </div>
                    )}

                    {emailErr && (
                      <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                        <span>{emailErr}</span>
                      </div>
                    )}

                    {emailStatus === 'success' && (
                      <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                        <span>Verification link sent to <strong>{newEmail}</strong>.</span>
                      </div>
                    )}

                    <div className="space-y-2.5 pt-2">
                      <input
                        className="input-terminal w-full px-3.5 py-2 text-xs rounded-xl"
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="Enter email address"
                      />

                      <div className="flex gap-2">
                        <input
                          className="input-terminal flex-1 px-3.5 py-2 text-xs rounded-xl"
                          type="password"
                          value={emailPass}
                          onChange={e => setEmailPass(e.target.value)}
                          placeholder="Current password"
                        />
                        <button
                          onClick={handleUpdateEmail}
                          disabled={emailStatus === 'updating' || newEmail === user?.email}
                          className="px-4 py-2 text-xs font-semibold btn-primary rounded-xl disabled:opacity-40 shrink-0"
                        >
                          {emailStatus === 'updating' ? 'Updating…' : 'Update Email'}
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span style={{ color: 'var(--text-muted)' }}>Forgot your password?</span>
                        <button
                          type="button"
                          onClick={handleForgotLegacyPassword}
                          className="underline font-medium transition-colors"
                          style={{ color: 'var(--text-hi)' }}
                        >
                          Send Password Reset Link
                        </button>
                      </div>
                    </div>
                  </div>
                </SettingGroup>

                {/* Session Sign Out */}
                <SettingGroup title="Active Session">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Sign Out of WIRK</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>End your current authenticated session on this browser</p>
                    </div>
                    <button
                      onClick={() => {
    localStorage.removeItem('wirk_mode');
    if (auth && !user?.isLocal) {
      try { auth.signOut(); } catch {}
    } else {
      window.location.reload();
    }
    onClose();
  }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl btn-ghost flex items-center gap-1.5 shrink-0"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </SettingGroup>

                {/* Danger Zone */}
                <div className="space-y-2">
                  <div className="px-1">
                    <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Danger Zone</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>Irreversible account removal</p>
                  </div>

                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-4 space-y-3">
                    {!deleteMode ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>Delete Account & Data</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Permanently remove your profile and all synced tasks</p>
                        </div>
                        <button
                          onClick={() => setDeleteMode(true)}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 border border-rose-500/30 bg-rose-500/10 space-y-3 rounded-xl">
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-200">
                          Confirm permanent account deletion:
                        </p>
                        {deleteError && (
                          <p className="text-xs text-rose-600 dark:text-rose-300 border border-rose-500/30 p-2.5 rounded-lg bg-rose-500/10">
                            {deleteError}
                          </p>
                        )}
                        <input
                          type="password"
                          autoFocus
                          placeholder="Enter your account password"
                          className="input-terminal w-full px-3.5 py-2 text-xs rounded-xl"
                          value={deletePass}
                          onChange={e => setDeletePass(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
                          >
                            {deleting ? 'Deleting Account…' : 'Permanently Delete'}
                          </button>
                          <button
                            onClick={() => { setDeleteMode(false); setDeletePass(''); setDeleteError(''); }}
                            className="px-4 py-2 btn-ghost text-xs rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB 6: ABOUT & LEGAL
            ════════════════════════════════════════════════════════ */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* App Brand Specs */}
                <SettingGroup title="WIRK Specifications">
                  <div 
                    onClick={() => {
                      const next = devSecretClicks + 1;
                      setDevSecretClicks(next);
                      if (next >= 5) {
                        setDevSecretClicks(0);
                        onOpenDevCredits?.();
                      }
                    }}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all select-none group"
                    title="Click 5 times to unlock Developer Console"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 border border-white/10 bg-black/40 p-2 shrink-0">
                      <ForgeLogo size={28} variant="default" glow={true} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>WIRK</h4>
                        {devSecretClicks > 0 && devSecretClicks < 5 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Dev Mode: {devSecretClicks}/5
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Version 6.0.0 (Turn intent into execution)
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>
                        High-performance workspace runtime & task intelligence engine.
                      </p>
                    </div>
                  </div>

                  <SettingRow
                    icon={HardDrive}
                    title="System Architecture"
                    subtitle="React 19 · Vite · Tailwind · Firebase Auth & Firestore"
                    rightElement={<span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>ARM64 / x86_64</span>}
                  />

                  <SettingRow
                    icon={ShieldAlert}
                    title="Encryption & Storage"
                    subtitle="End-to-end transport TLS 1.3 · Firebase AES-256 Storage"
                    rightElement={<span className="text-[11px] font-mono text-zinc-400">Secure</span>}
                  />

                  {/* Developer Diagnostic Console Entry */}
                  <SettingRow
                    icon={Cpu}
                    title="Developer Diagnostics & AI Credits"
                    subtitle="Monitor remaining Gemini API quotas, RPM rate limits & latency"
                    isClickable={true}
                    onClick={() => onOpenDevCredits?.()}
                    rightElement={
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        ⇧⌘D
                      </span>
                    }
                  />
                </SettingGroup>

                {/* Policies & Terms */}
                <SettingGroup title="Legal & Compliance">
                  <div className="p-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onLegal?.('privacy')}
                      className="flex-1 btn-ghost py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <BookOpen size={14} /> Privacy Policy
                    </button>
                    <button
                      onClick={() => onLegal?.('terms')}
                      className="flex-1 btn-ghost py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <FileText size={14} /> Terms of Service
                    </button>
                  </div>
                </SettingGroup>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
