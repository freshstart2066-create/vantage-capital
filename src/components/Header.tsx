import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import type { ActiveTab, Instrument } from '../types/trading';
import { VantageLogo } from './VantageLogo';
import {
  Home,
  Calendar,
  Activity,
  Award,
  Globe,
  Building2,
  AlertTriangle,
  Settings,
  Sun,
  Moon,
  Monitor,
  TrendingUp,
  TrendingDown,
  LogOut,
  LogIn,
  Landmark,
  User,
  ArrowDownToLine,
  ShieldAlert,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { WithdrawalModal } from './Withdrawal/WithdrawalModal';
import { DepositModal } from './Deposit/DepositModal';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    resolvedTheme,
    account,
    instruments,
    user,
    signOut,
    openAuth,
  } = useTrading();

  // Server UTC time clock
  const [utcTime, setUtcTime] = useState<string>('');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [menu, setMenu] = useState<'account' | 'more' | null>(null);
  const go = (tab: ActiveTab) => { setMenu(null); setActiveTab(tab); };
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  type NavItem = { id: ActiveTab; label: string; icon: React.ReactNode };
  // Primary: what a trader uses daily. Secondary ("More"): company information. Account items live in the account menu.
  const primaryNav: NavItem[] = user
    ? [
        { id: 'terminal', label: 'Terminal', icon: <Activity className="w-4 h-4" /> },
        { id: 'strategy_lab', label: 'Strategy Lab', icon: <Award className="w-4 h-4" /> },
        { id: 'markets', label: 'Markets', icon: <Globe className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
      ]
    : [
        { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
        { id: 'markets', label: 'Markets', icon: <Globe className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
      ];
  const moreNav: NavItem[] = [
    ...(user ? [{ id: 'home' as ActiveTab, label: 'Company overview', icon: <Home className="w-4 h-4" /> }] : []),
    { id: 'company', label: 'About the firm', icon: <Building2 className="w-4 h-4" /> },
    { id: 'compliance', label: 'Risk & legal', icon: <AlertTriangle className="w-4 h-4" /> },
  ];
  const navItems = [...primaryNav, ...moreNav]; // mobile scroller shows everything in one row
  const moreActive = moreNav.some(i => i.id === activeTab);

  // Top 6 marquee instruments
  const marqueeInstruments = instruments.slice(0, 6);

  // Modern-web-guidance toggle action
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
      {/* 1. Institutional Top Bar & Live Ticker Marquee */}
      <div className="hidden md:flex items-center justify-between px-4 py-1.5 text-[11px] font-mono border-b border-[var(--border-subtle)]/60 text-[var(--text-muted)]">
        {/* Ticker tape */}
        <div className="flex items-center gap-4 overflow-x-auto py-0.5 no-scrollbar">
          {marqueeInstruments.map((inst: Instrument) => {
            const isUp = inst.change24h >= 0;
            return (
              <div key={inst.symbol} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-bold text-[var(--text-secondary)]">{inst.symbol}</span>
                <span className="font-mono-numbers text-[var(--text-primary)]">{inst.bid.toFixed(inst.digits)}</span>
                <span className={`inline-flex items-center text-[10px] ${isUp ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'}`}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isUp ? '+' : ''}{inst.change24h}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Server Status & Clock */}
        <div className="flex items-center gap-4 whitespace-nowrap pl-4">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-long)] animate-pulse"></span>
            <span className="text-[var(--accent-long)] font-bold">MATCHING ENGINE OPERATIONAL</span>
            <span className="text-[var(--text-muted)]">(12ms)</span>
          </div>

          <div className="text-[var(--text-secondary)] font-semibold">
            {utcTime}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Company Title */}
        <div
          onClick={() => setActiveTab(user ? 'terminal' : 'home')}
          className="cursor-pointer group select-none hover:opacity-90 transition-opacity"
        >
          <VantageLogo size={32} showText={true} />
        </div>

        {/* Nav Tabs: four primary destinations + a "More" menu */}
        <nav className="hidden lg:flex items-center gap-1 neo-inset-sm p-1 relative" aria-label="Primary">
          {primaryNav.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                activeTab === item.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setMenu(menu === 'more' ? null : 'more')}
              aria-haspopup="menu"
              aria-expanded={menu === 'more'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                moreActive ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              More <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {menu === 'more' && (
              <div role="menu" className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-1.5 shadow-2xl z-50">
                {moreNav.map(item => (
                  <button key={item.id} role="menuitem" onClick={() => go(item.id)} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]">
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right cluster. Signed out: Sign in + Create account. Signed in: balance, Deposit, Withdraw, account menu. */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <>
              {!isAdmin && <div className="hidden md:flex neo-inset-sm px-3 py-1 flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--accent-long)]">Active capital</span>
                <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>}
              {!isAdmin && <button onClick={() => setIsDepositOpen(true)} className="hidden md:flex neo-btn neo-btn-primary py-1.5 px-3 text-xs font-bold rounded-lg items-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5" /><span>Deposit</span>
              </button>}
              {!isAdmin && <button onClick={() => setIsWithdrawOpen(true)} className="hidden md:flex neo-btn py-1.5 px-3 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /><span>Withdraw</span>
              </button>}

              <div className="relative">
                <button
                  onClick={() => setMenu(menu === 'account' ? null : 'account')}
                  aria-haspopup="menu"
                  aria-expanded={menu === 'account'}
                  className="flex items-center gap-2 neo-inset-sm p-1 pr-2 rounded-xl hover:opacity-90"
                >
                  <span className="w-7 h-7 rounded-lg bg-[var(--accent-brand)] text-white font-bold flex items-center justify-center text-xs">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="hidden sm:flex flex-col text-left">
                    <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{user.name}</span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] leading-tight">{user.accountId}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
                {menu === 'account' && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-1.5 shadow-2xl z-50">
                    <button role="menuitem" onClick={() => go('profile')} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"><User className="w-4 h-4" />Profile & verification</button>
                    <button role="menuitem" onClick={() => go('settings')} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"><Settings className="w-4 h-4" />Settings</button>
                    {isAdmin && (
                      <button role="menuitem" onClick={() => go('admin')} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-[var(--bg-surface)]"><ShieldAlert className="w-4 h-4" />Admin</button>
                    )}
                    <div className="my-1 border-t border-[var(--border-subtle)]" />
                    <button role="menuitem" onClick={() => { setMenu(null); signOut(); }} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--accent-short)] hover:bg-[var(--bg-surface)]"><LogOut className="w-4 h-4" />Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => openAuth('signin')} className="neo-btn py-2 px-3 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center gap-1.5 whitespace-nowrap">
                <LogIn className="hidden sm:block w-3.5 h-3.5" /><span>Sign in</span>
              </button>
              <button onClick={() => openAuth('signup')} className="neo-btn neo-btn-primary py-2 px-3 sm:px-3.5 text-xs font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                <UserPlus className="hidden sm:block w-3.5 h-3.5" /><span className="sm:hidden">Join</span><span className="hidden sm:inline">Create account</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="neo-btn py-2 px-2.5 text-xs font-medium text-amber-400/80 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/60 flex items-center gap-1.5"
                title="Firm Administration (/admin)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          )}

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="neo-btn p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title={`Current theme: ${theme}. Click to switch.`}
            aria-label="Toggle theme"
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4 text-[var(--accent-brand)]" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile money row: balance, Deposit, Withdraw (always labeled) */}
      {user && !isAdmin && (
        <div className="md:hidden flex items-center gap-2 px-4 pb-2">
          <div className="flex-1 neo-inset-sm px-3 py-1 flex flex-col">
            <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--accent-long)]">Active capital</span>
            <span className="text-xs font-bold font-mono text-[var(--text-primary)]">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button onClick={() => setIsDepositOpen(true)} className="neo-btn neo-btn-primary py-2 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5"><ArrowDownToLine className="w-3.5 h-3.5" />Deposit</button>
          <button onClick={() => setIsWithdrawOpen(true)} className="neo-btn py-2 px-3 text-xs font-bold border border-[var(--border-subtle)] flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" />Withdraw</button>
        </div>
      )}

      {/* Click-away layer for open menus */}
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} aria-hidden="true" />}

      {/* Mobile Nav Scroller (signed-out visitors; signed-in users get the bottom tab bar) */}
      {!user && <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-[var(--border-subtle)]/60">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === item.id
                ? 'bg-[var(--accent-brand)] text-white font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>}

    </header>

      {/* Mobile / iPad bottom tab bar (signed-in) */}
      {user && (
        <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          {([
            { id: 'terminal', label: 'Trade', icon: <Activity className="w-5 h-5" /> },
            { id: 'strategy_lab', label: 'Lab', icon: <Award className="w-5 h-5" /> },
            { id: 'markets', label: 'Markets', icon: <Globe className="w-5 h-5" /> },
            { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
            { id: isAdmin ? 'admin' : 'profile', label: isAdmin ? 'Admin' : 'Account', icon: isAdmin ? <ShieldAlert className="w-5 h-5" /> : <User className="w-5 h-5" /> },
          ] as NavItem[]).map(item => (
            <button key={item.id} onClick={() => go(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-14 text-[10px] font-semibold ${activeTab === item.id ? 'text-[var(--accent-brand)]' : 'text-[var(--text-muted)]'}`}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </>
  );
};
