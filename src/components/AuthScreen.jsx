import React, { useState, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Eye, EyeOff, Zap, KeyRound, ArrowLeft, CheckCircle2, 
  AlertTriangle, HelpCircle, Shield, Lock, User, Mail, 
  Check, Sparkles 
} from 'lucide-react';
import LegalView from '../views/Legal';
import WirkLogo from './WirkLogo';
import ForgeLogo from './ForgeLogo';

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: 'None', color: 'bg-zinc-600', text: 'text-zinc-500' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-rose-500', text: 'text-rose-400' };
  if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', text: 'text-amber-400' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
}

export default function AuthScreen({ 
  initialMode = 'LOGIN', 
  onBackToLanding, 
  onSuccess 
}) {
  const [mode, setMode] = useState(initialMode); // 'LOGIN' | 'SIGNUP' | 'RECOVERY'
  const [form, setForm] = useState({ 
    emailOrUsername: '', 
    fullname: '', 
    password: '', 
    confirm: '',
    agreedToTerms: false 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState(null); // 'privacy' | 'terms' | 'cookies' | null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const strength = useMemo(() => calculatePasswordStrength(form.password), [form.password]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); 
    setMsg(''); 
    setBusy(true);

    const rawInput = (form.emailOrUsername || '').trim();
    if (!rawInput) {
      setErr('Please enter your email or operator username.');
      setBusy(false);
      return;
    }

    const isEmail = rawInput.includes('@');
    const primaryEmail = isEmail ? rawInput : `${rawInput.toLowerCase()}@enginecore.dev`;

    try {
      if (mode === 'LOGIN') {
        try {
          const userCred = await signInWithEmailAndPassword(auth, primaryEmail, form.password);
          onSuccess?.(userCred.user);
        } catch (primaryErr) {
          if (!isEmail) {
            const fallbackCred = await signInWithEmailAndPassword(auth, rawInput, form.password);
            onSuccess?.(fallbackCred.user);
          } else {
            throw primaryErr;
          }
        }
      } else if (mode === 'SIGNUP') {
        if (!form.agreedToTerms) {
          setErr('Please confirm your agreement to the Terms of Service and Privacy Policy.');
          setBusy(false);
          return;
        }
        if (form.password !== form.confirm) { 
          setErr('Passwords do not match.'); 
          setBusy(false); 
          return; 
        }
        if (form.password.length < 6) { 
          setErr('Password must be at least 6 characters long.'); 
          setBusy(false); 
          return; 
        }
        
        const defaultName = form.fullname || (isEmail ? rawInput.split('@')[0] : rawInput);
        const c = await createUserWithEmailAndPassword(auth, primaryEmail, form.password);
        await updateProfile(c.user, { displayName: defaultName });
        onSuccess?.(c.user);
      } else if (mode === 'RECOVERY') {
        if (isEmail && !rawInput.endsWith('@enginecore.dev')) {
          await sendPasswordResetEmail(auth, rawInput);
          setMsg(`A secure password reset link has been dispatched to ${rawInput}. Please check your email inbox.`);
        } else {
          const legacyUser = rawInput.replace('@enginecore.dev', '');
          setErr(`🔒 Security Restriction: Legacy username accounts ("${legacyUser}") must sign in with your master password to update a verified personal email address in Settings.`);
        }
      }
    } catch (e) {
      const code = e.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setErr('Invalid email/username or password.');
      else if (code === 'auth/email-already-in-use')
        setErr('This email/username is already registered. Please sign in instead.');
      else if (code === 'auth/invalid-email')
        setErr('Please enter a valid email address format.');
      else if (code === 'auth/weak-password')
        setErr('Password is too weak. Please use at least 6 characters.');
      else if (code === 'auth/too-many-requests')
        setErr('Too many failed attempts. Access temporarily restricted for security. Please try again shortly.');
      else
        setErr(e.message.replace('Firebase: ','').replace(/\(.*\)/,'').trim());
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden"
         style={{ background: 'var(--bg-base)', color: 'var(--text-hi)' }}>

      {/* Ambient Lighting Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        
        {/* Back to Overview Nav */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-6 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl btn-ghost transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Overview</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-xl border p-2 relative group transition-transform duration-300 hover:scale-105"
               style={{
                 background: 'linear-gradient(145deg, rgba(28, 28, 32, 0.9) 0%, rgba(10, 10, 12, 0.95) 100%)',
                 borderColor: 'var(--border-mid)',
                 boxShadow: 'var(--shadow-modal)',
               }}>
            <WirkLogo size={36} variant="default" glow={true} />
          </div>
          <h1 className="text-2xl font-black tracking-[0.18em] uppercase" style={{ color: 'var(--text-hi)' }}>
            WIRK
          </h1>
          <p className="text-[11px] font-semibold tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
            Turn intent into execution
          </p>
        </div>

        {/* Card Frame */}
        <div className="rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl"
             style={{
               background: 'var(--bg-panel)',
               borderColor: 'var(--border-subtle)',
               boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
             }}>

          {/* Mode Switcher Tabs */}
          {mode !== 'RECOVERY' ? (
            <div className="grid grid-cols-2 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              {[
                ['LOGIN', 'Sign In'],
                ['SIGNUP', 'Create Account'],
              ].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErr(''); setMsg(''); }}
                  className="py-3.5 text-xs font-bold transition-all relative"
                  style={{
                    color: mode === m ? 'var(--text-hi)' : 'var(--text-muted)',
                    background: mode === m ? 'var(--bg-panel)' : 'transparent',
                  }}
                >
                  {label}
                  {mode === m && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 py-3.5 border-b"
                 style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <button
                onClick={() => { setMode('LOGIN'); setErr(''); setMsg(''); }}
                className="flex items-center gap-1.5 text-xs font-semibold hover:text-emerald-500 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Account Recovery
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="p-6 sm:p-7 space-y-4">
            
            {/* Error Message Alert */}
            {err && (
              <div className="p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs leading-relaxed animate-shake bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-300">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">{err}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {msg && (
              <div className="p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs leading-relaxed animate-fade-in bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                <div className="flex-1">{msg}</div>
              </div>
            )}

            {mode === 'RECOVERY' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <p className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-hi)' }}>
                    <Shield size={14} className="text-emerald-500" /> Secure Recovery
                  </p>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Enter your registered email address. We will dispatch an authorized password reset link.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="e.g. operator@domain.com"
                      value={form.emailOrUsername}
                      onChange={e => set('emailOrUsername', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl input border"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 text-xs font-bold rounded-xl btn-primary shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 transition-all mt-2"
                >
                  {busy ? 'Dispatching Reset Link…' : 'Send Password Reset Link'}
                </button>
              </div>
            ) : (
              <>
                {/* Account Identifier Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                    {mode === 'SIGNUP' ? 'Email Address' : 'Email Address or Username'}
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder={mode === 'SIGNUP' ? 'e.g. name@company.com' : 'e.g. name@company.com or username'}
                      value={form.emailOrUsername}
                      onChange={e => set('emailOrUsername', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl input border"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>

                {/* Display Name Input (Sign Up Only) */}
                {mode === 'SIGNUP' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                      Full Name or Operator Moniker
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Mercer"
                        value={form.fullname}
                        onChange={e => set('fullname', e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl input border"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                      Password
                    </label>
                    {mode === 'LOGIN' && (
                      <button
                        type="button"
                        onClick={() => { setMode('RECOVERY'); setErr(''); setMsg(''); }}
                        className="text-[11px] font-medium text-emerald-500 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl input border"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password Strength Meter (Sign Up Only) */}
                  {mode === 'SIGNUP' && form.password && (
                    <div className="pt-1 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input (Sign Up Only) */}
                {mode === 'SIGNUP' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={e => set('confirm', e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl input border"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                        title={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Consent Checkbox (Sign Up Only) */}
                {mode === 'SIGNUP' && (
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none text-[11px] leading-relaxed animate-fade-in"
                         style={{ color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      required
                      checked={form.agreedToTerms}
                      onChange={e => set('agreedToTerms', e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setLegal('terms')}
                        className="underline text-emerald-500 hover:text-emerald-400"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => setLegal('privacy')}
                        className="underline text-emerald-500 hover:text-emerald-400"
                      >
                        Privacy Policy
                      </button>.
                    </span>
                  </label>
                )}

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 text-xs font-bold rounded-xl btn-primary shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 transition-all mt-2"
                >
                  {busy ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{mode === 'LOGIN' ? 'Authenticating…' : 'Initializing Workspace…'}</span>
                    </span>
                  ) : (
                    mode === 'LOGIN' ? 'Sign In to Workspace' : 'Create Free Account'
                  )}
                </button>
              </>
            )}

          </form>

          {onEnterLocalMode && (
            <div className="px-6 sm:px-7 pb-6 pt-1 text-center">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
                  <span className="px-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)' }}>or offline local mode</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onEnterLocalMode}
                className="w-full py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 hover:border-cyan-500/50 transition-all"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-mid)', color: 'var(--text-hi)' }}
              >
                <Zap size={14} className="text-cyan-400" />
                <span>Launch Offline / Local-First (No Cloud Needed)</span>
              </button>
            </div>
          )}

        </div>

        {/* Compliance Footer Links */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs" style={{ color: 'var(--text-dim)' }}>
          <button onClick={() => setLegal('privacy')} className="hover:underline">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setLegal('terms')} className="hover:underline">Terms of Service</button>
          <span>•</span>
          <button onClick={() => setLegal('cookies')} className="hover:underline">Cookies</button>
        </div>

      </div>

      {/* Legal View Modal */}
      {legal && (
        <LegalView initialTab={legal} onClose={() => setLegal(null)} />
      )}

    </div>
  );
}
