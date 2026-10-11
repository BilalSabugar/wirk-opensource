import React from 'react';
import {
  LayoutDashboard, Sparkles, CheckCircle2, FolderKanban,
  BarChart2, Calendar, BookOpen, FileText, Search,
  Sun, Moon, LogOut, ChevronRight, Crown
} from 'lucide-react';
import { auth } from '../firebase';
import ForgeLogo from './ForgeLogo';
import AriaLogo from './AriaLogo';

const ICON_MAP = {
  DASHBOARD: LayoutDashboard,
  ARIA:      Sparkles,
  TODAY:     CheckCircle2,
  MODULES:   FolderKanban,
  ANALYTICS: BarChart2,
  CALENDAR:  Calendar,
  DIARY:     BookOpen,
  NOTES:     FileText,
  SEARCH:    Search,
};

const NAV_ITEMS_LIST = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'ARIA',      label: 'ARIA Companion' },
  { id: 'TODAY',     label: 'Today Focus' },
  { id: 'MODULES',   label: 'Projects' },
  { id: 'ANALYTICS', label: 'Analytics' },
  { id: 'CALENDAR',  label: 'Calendar' },
  { id: 'DIARY',     label: 'Diary' },
  { id: 'NOTES',     label: 'Notes' },
  { id: 'SEARCH',    label: 'Search' },
];

export default function Sidebar({ active, setActive, user, stats, expanded, setExpanded, onProfile, onThemeToggle, isDark, onUpgrade }) {
  const initial  = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const username = user?.displayName || (user?.email?.endsWith('@enginecore.dev') ? user?.email?.replace('@enginecore.dev','') : user?.email?.split('@')[0]) || 'Operator';

  return (
    <>
      {/* ── Desktop macOS Luxury Sidebar ── */}
      <aside
        className="hidden md:flex flex-col shrink-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: expanded ? 230 : 68,
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-subtle)',
        }}>

        {/* Brand / Workspace Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="h-16 flex items-center gap-3 px-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] shrink-0 w-full text-left"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm p-1 transition-transform group-hover:scale-105"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                 border: '1px solid var(--border-mid)',
               }}>
            <WirkLogo size={20} variant="default" glow={true} />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-xs tracking-tight truncate" style={{ color: 'var(--text-hi)' }}>
                  WIRK
                </p>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  v6.0
                </span>
              </div>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                Turn intent into execution
              </p>
            </div>
          )}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto scroll">
          {NAV_ITEMS_LIST.map(item => {
            const isActive = active === item.id;
            const Icon = ICON_MAP[item.id] || LayoutDashboard;

            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-black/5 dark:bg-white/[0.08] shadow-xs font-semibold'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] font-medium'
                }`}
                style={{
                  padding: expanded ? '9px 12px' : '9px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  color: isActive ? 'var(--text-hi)' : 'var(--text-muted)',
                }}
                title={item.label}
              >
                <div className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'text-[var(--text-hi)]' : 'group-hover:text-[var(--text-hi)]'
                }`}>
                  {item.id === 'ARIA' ? (
                    <AriaLogo size={18} glow={isActive} variant={isActive ? 'default' : 'monochrome'} />
                  ) : (
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  )}
                </div>

                {expanded && (
                  <span className="text-xs tracking-tight truncate animate-fade-in flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {isActive && expanded && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Executive Pro Upgrade Trigger */}
        {expanded ? (
          <button
            onClick={onUpgrade}
            className="mx-3 mb-2.5 p-3 rounded-2xl border flex items-center gap-3 transition-all hover:scale-[1.02] shadow-sm text-left group"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 100%)',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
            title="Upgrade to Executive Pro"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
              <Crown size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-500 dark:text-amber-400">Executive Pro</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500 font-mono">PRO</span>
              </div>
              <p className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                Plans & Lifetime Pass
              </p>
            </div>
          </button>
        ) : (
          <div className="flex justify-center mb-2.5">
            <button
              onClick={onUpgrade}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:scale-105 shadow-sm text-amber-500"
              style={{
                background: 'rgba(245,158,11,0.12)',
                borderColor: 'rgba(245,158,11,0.3)',
              }}
              title="Upgrade to Executive Pro"
            >
              <Crown size={18} />
            </button>
          </div>
        )}

        {/* Focus Velocity Mini Card */}
        {expanded && (
          <div className="mx-3 mb-3 p-3.5 rounded-2xl border animate-fade-in"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[11px] font-semibold tracking-tight" style={{ color: 'var(--text-muted)' }}>
                Focus Velocity
              </span>
              <span className="font-bold text-xs" style={{ color: 'var(--text-hi)' }}>
                {stats?.pct ?? 0}%
              </span>
            </div>

            <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stats?.pct ?? 0}%`, background: 'var(--accent)' }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span>{stats?.done ?? 0} of {stats?.total ?? 0} done</span>
              {(stats?.streak?.current ?? 0) > 0 && (
                <span className="text-amber-500 font-medium">🔥 {stats.streak.current}d streak</span>
              )}
            </div>
          </div>
        )}

        {/* Bottom Section: Theme + Profile + Logout */}
        <div className="p-2.5 space-y-1 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          
          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
              color: 'var(--text-muted)',
            }}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {isDark ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-zinc-600 dark:text-zinc-400" />
              )}
            </div>
            {expanded && (
              <span className="truncate animate-fade-in" style={{ color: 'var(--text-hi)' }}>
                {isDark ? 'Light Theme' : 'Dark Theme'}
              </span>
            )}
          </button>

          {/* User Profile / Settings */}
          <button
            onClick={onProfile}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-left"
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
            title="Profile & Settings"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              {initial}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--text-hi)' }}>
                  {username}
                </p>
                <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  Settings
                </p>
              </div>
            )}
          </button>

          {/* Sign Out Option */}
          <button
            onClick={() => {
    localStorage.removeItem('wirk_mode');
    if (auth && !user?.isLocal) {
      try { auth.signOut(); } catch {}
    } else {
      window.location.reload();
    }
  }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10"
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
            title="Sign Out"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <LogOut size={15} />
            </div>
            {expanded && (
              <span className="truncate animate-fade-in">
                Sign Out
              </span>
            )}
          </button>

        </div>
      </aside>

      {/* ── Mobile Floating Bottom Bar ── */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 flex items-center justify-around py-2 px-2 rounded-2xl shadow-2xl border"
           style={{
             borderColor: 'var(--border-subtle)',
             background: 'var(--modal-bg)',
             backdropFilter: 'blur(32px)',
             WebkitBackdropFilter: 'blur(32px)',
           }}>
        {NAV_ITEMS_LIST.slice(0, 5).map(item => {
          const isActive = active === item.id;
          const Icon = ICON_MAP[item.id] || LayoutDashboard;

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive ? 'bg-black/5 dark:bg-white/10 font-semibold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                color: isActive ? 'var(--text-hi)' : 'var(--text-muted)',
              }}
            >
              {item.id === 'ARIA' ? (
                <AriaLogo size={18} glow={isActive} variant={isActive ? 'default' : 'monochrome'} />
              ) : (
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              )}
              <span className="text-[9px] mt-1 font-medium truncate max-w-[54px]">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}

        <button
          onClick={onProfile}
          className="flex flex-col items-center justify-center p-2 transition-opacity opacity-70 hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <div
            className="w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px]"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            {initial}
          </div>
          <span className="text-[9px] mt-1 font-medium">Profile</span>
        </button>
      </nav>
    </>
  );
}
