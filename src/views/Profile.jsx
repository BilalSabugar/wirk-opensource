import React, { useState } from 'react';
import {
  updateProfile, updatePassword, deleteUser,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, APP_ID } from '../firebase';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { exportTasksCSV } from '../constants';
import { useTheme } from '../ThemeContext';
import { Sun, Moon, Download, Trash2, User, Lock, LogOut, Shield, BarChart3, CheckCircle2 } from 'lucide-react';

function Section({ title, icon, children }) {
  return (
    <div className="border border-[var(--border-dim)] bg-[var(--bg-panel)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border-dim)] bg-[var(--bg-surface)]">
        <span className="text-[var(--accent)]">{icon}</span>
        <p className="label-xs">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div className="space-y-1.5">
      <label className="label-xs">{label}</label>
      <input type={type} className="input-terminal w-full px-3 py-2.5 text-sm"
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  );
}

function StatusMsg({ msg, ok }) {
  if (!msg) return null;
  return (
    <p className={`text-[10px] font-bold mt-2 ${ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
      {ok ? '✓ ' : '✗ '}{msg}
    </p>
  );
}

export default function ProfileView({ user, tasks, projects }) {
  const { theme, toggle } = useTheme();

  // Name
  const [name,     setName]    = useState(user?.displayName ?? '');
  const [nameMsg,  setNameMsg] = useState({ text:'', ok:false });

  // Password
  const [curPw,    setCurPw]   = useState('');
  const [newPw,    setNewPw]   = useState('');
  const [cfmPw,    setCfmPw]   = useState('');
  const [pwMsg,    setPwMsg]   = useState({ text:'', ok:false });

  // Delete account
  const [delPw,    setDelPw]   = useState('');
  const [delPhase, setDelPhase]= useState('idle'); // idle | confirm | done
  const [delMsg,   setDelMsg]  = useState({ text:'', ok:false });

  const [busy, setBusy] = useState(false);

  /* ── Update display name ── */
  const saveName = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      setNameMsg({ text: 'Display name updated.', ok: true });
    } catch(e) { setNameMsg({ text: e.message, ok: false }); }
    setBusy(false);
  };

  /* ── Update password ── */
  const savePassword = async () => {
    if (newPw !== cfmPw) { setPwMsg({ text: 'Passwords do not match.', ok: false }); return; }
    if (newPw.length < 6) { setPwMsg({ text: 'Password must be ≥ 6 characters.', ok: false }); return; }
    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, curPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg({ text: 'Password updated successfully.', ok: true });
      setCurPw(''); setNewPw(''); setCfmPw('');
    } catch(e) {
      setPwMsg({ text: e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : e.message, ok: false });
    }
    setBusy(false);
  };

  /* ── Export data ── */
  const exportCSV = () => exportTasksCSV(tasks, projects);

  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      operator: user.displayName ?? user.email,
      projects: projects.map(p => ({
        ...p,
        tasks: tasks.filter(t => t.projectId === p.id),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `forge-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Delete account ── */
  const deleteAccount = async () => {
    if (!delPw) { setDelMsg({ text: 'Enter your password to confirm.', ok: false }); return; }
    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, delPw);
      await reauthenticateWithCredential(user, cred);

      // Delete all Firestore data first
      const colls = ['projects','tasks','notes'];
      for (const col of colls) {
        const snap = await getDocs(collection(db,'artifacts',APP_ID,'users',user.uid,col));
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      }

      await deleteUser(user);
      // Auth listener in App will redirect to AUTH
    } catch(e) {
      setDelMsg({
        text: e.code === 'auth/wrong-password' ? 'Password incorrect.' : e.message,
        ok: false,
      });
      setBusy(false);
    }
  };

  // Stats
  const done    = tasks.filter(t=>t.completed).length;
  const overdue = tasks.filter(t=>!t.completed && t.dueDate && new Date(t.dueDate+'T00:00:00') < new Date()).length;
  const pct     = tasks.length ? Math.round(done/tasks.length*100) : 0;

  const operatorId = user?.email?.replace('@enginecore.dev','') ?? '—';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-dim)] shrink-0">
        <div>
          <p className="label-xs text-[var(--text-muted)]">engine_core_v6</p>
          <h2 className="text-[var(--text-white)] font-bold text-sm tracking-tight">OPERATOR PROFILE</h2>
        </div>
        <button onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)]
                     border border-[var(--border-dim)] px-3 py-1.5 transition-colors uppercase tracking-wider">
          <LogOut size={12}/> Logout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll p-4 md:p-6 space-y-4 max-w-2xl w-full mx-auto">

        {/* Identity card */}
        <div className="border border-[var(--border-mid)] bg-[var(--bg-panel)] p-5 flex items-center gap-5">
          <div className="w-16 h-16 bg-[var(--accent-dim)] border border-[var(--border-hi)]
                          flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[var(--accent)]">
              {(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-white)] font-bold text-base truncate">
              {user?.displayName ?? 'Operator'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">ID: {operatorId}</p>
            <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate">{user?.email}</p>
          </div>
          {/* Theme toggle */}
          <button onClick={toggle} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--border-mid)]
                       text-[var(--accent)] hover:border-[var(--border-hi)] hover:bg-[var(--accent-dim)]
                       transition-all text-[10px] font-bold uppercase tracking-wider shrink-0">
            {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* Stats summary */}
        <Section title="Statistics" icon={<BarChart3 size={12}/>}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Modules',  value: projects.length },
              { label:'Tasks',    value: tasks.length     },
              { label:'Done',     value: done             },
              { label:'Overdue',  value: overdue, warn: overdue>0 },
            ].map(s=>(
              <div key={s.label} className="border border-[var(--border-dim)] bg-[var(--bg-surface)] p-3">
                <p className="label-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.warn?'text-[var(--danger)]':'text-[var(--text-white)]'}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[var(--bg-raised)] relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-[var(--accent)] bar-shine transition-all duration-1000"
                   style={{width:`${pct}%`}}/>
            </div>
            <span className="text-[10px] font-bold text-[var(--accent)] shrink-0">{pct}% complete</span>
          </div>
        </Section>

        {/* Theme */}
        <Section title="Appearance" icon={theme==='dark'?<Moon size={12}/>:<Sun size={12}/>}>
          <p className="text-[11px] text-[var(--text-base)] mb-4">
            Switch between the dark terminal aesthetic and a clean light interface.
          </p>
          <div className="flex gap-3">
            {['dark','light'].map(t=>(
              <button key={t} onClick={()=>t!==theme&&toggle()}
                className={`flex-1 flex flex-col items-center gap-2 p-4 border transition-all
                            ${theme===t
                              ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                              : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--border-mid)]'}`}>
                {t==='dark' ? <Moon size={18}/> : <Sun size={18}/>}
                <span className="text-[10px] font-bold uppercase tracking-widest">{t}</span>
                {theme===t && <CheckCircle2 size={12}/>}
              </button>
            ))}
          </div>
        </Section>

        {/* Display name */}
        <Section title="Display Name" icon={<User size={12}/>}>
          <div className="space-y-3">
            <Field label="Display name" value={name} onChange={setName} placeholder="Your name"/>
            <button onClick={saveName} disabled={busy}
              className="bg-[var(--accent)] text-black font-bold px-4 py-2 text-[10px]
                         uppercase tracking-wider hover:opacity-80 disabled:opacity-40 transition-opacity">
              Save Name
            </button>
            <StatusMsg msg={nameMsg.text} ok={nameMsg.ok}/>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password" icon={<Lock size={12}/>}>
          <div className="space-y-3">
            <Field label="Current password" type="password" value={curPw} onChange={setCurPw}/>
            <Field label="New password"     type="password" value={newPw} onChange={setNewPw}/>
            <Field label="Confirm new"      type="password" value={cfmPw} onChange={setCfmPw}/>
            <button onClick={savePassword} disabled={busy}
              className="bg-[var(--accent)] text-black font-bold px-4 py-2 text-[10px]
                         uppercase tracking-wider hover:opacity-80 disabled:opacity-40 transition-opacity">
              Update Password
            </button>
            <StatusMsg msg={pwMsg.text} ok={pwMsg.ok}/>
          </div>
        </Section>

        {/* Export */}
        <Section title="Export Data" icon={<Download size={12}/>}>
          <p className="text-[11px] text-[var(--text-base)] mb-4">
            Download a complete backup of all your tasks and projects.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border-mid)]
                         text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-dim)]
                         text-[10px] font-bold uppercase tracking-wider transition-all">
              <Download size={12}/> Export CSV
            </button>
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border-mid)]
                         text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-dim)]
                         text-[10px] font-bold uppercase tracking-wider transition-all">
              <Download size={12}/> Export JSON
            </button>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-3">
            JSON export includes all project and task metadata. CSV is spreadsheet-compatible.
          </p>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" icon={<Shield size={12}/>}>
          <p className="text-[11px] text-[var(--text-base)] mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>

          {delPhase === 'idle' && (
            <button onClick={()=>setDelPhase('confirm')}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30
                         text-red-400 hover:bg-red-500/8 hover:border-red-500/60
                         text-[10px] font-bold uppercase tracking-wider transition-all">
              <Trash2 size={12}/> Delete Account
            </button>
          )}

          {delPhase === 'confirm' && (
            <div className="space-y-3 border border-red-500/30 bg-red-500/4 p-4">
              <p className="text-[11px] text-red-400 font-bold">
                ⚠ This will permanently delete all your data. Enter your password to confirm.
              </p>
              <Field label="Your password" type="password" value={delPw} onChange={setDelPw}/>
              <div className="flex gap-3">
                <button onClick={deleteAccount} disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500
                             text-white text-[10px] font-bold uppercase tracking-wider
                             disabled:opacity-40 transition-colors">
                  <Trash2 size={12}/> Confirm Delete
                </button>
                <button onClick={()=>{setDelPhase('idle');setDelPw('');setDelMsg({text:'',ok:false});}}
                  className="px-4 py-2 border border-[var(--border-dim)] text-[var(--text-muted)]
                             hover:text-[var(--text-hi)] text-[10px] transition-colors">
                  Cancel
                </button>
              </div>
              <StatusMsg msg={delMsg.text} ok={delMsg.ok}/>
            </div>
          )}
        </Section>

        <div className="h-8"/>
      </div>
    </div>
  );
}
