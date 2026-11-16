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
  } = useTrading();

  // Server UTC time clock
  const [utcTime, setUtcTime] = useState<string>('');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Authenticated trader nav items vs public unauthenticated nav items (No public client list!)
  const authenticatedNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'terminal', label: 'Terminal', icon: <Activity className="w-4 h-4" /> },
    { id: 'strategy_lab', label: 'Strategy Lab', icon: <Award className="w-4 h-4" /> },
    { id: 'calendar', label: 'Economic Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'profile', label: 'Trader Profile', icon: <User className="w-4 h-4" /> },
    { id: 'home', label: 'Company Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'markets', label: 'Markets', icon: <Globe className="w-4 h-4" /> },
    { id: 'company', label: 'About Firm', icon: <Building2 className="w-4 h-4" /> },
    { id: 'compliance', label: 'Risk & Legal', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const publicNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Company Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'company', label: 'About Firm', icon: <Building2 className="w-4 h-4" /> },
    { id: 'markets', label: 'Markets', icon: <Globe className="w-4 h-4" /> },
    { id: 'calendar', label: 'Economic Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'compliance', label: 'Risk & Legal', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const navItems = user ? authenticatedNavItems : publicNavItems;

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
      <div className="max-w-[1720px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo & Company Title */}
        <div
          onClick={() => setActiveTab(user ? 'terminal' : 'home')}
          className="cursor-pointer group select-none hover:opacity-90 transition-opacity"
        >
          <VantageLogo size={36} showText={true} />
        </div>

        {/* Nav Tabs (Neomorphic Segmented Pills) */}
        <nav className="hidden lg:flex items-center gap-1 neo-inset-sm p-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
        </nav>

        {/* Right Corner Controls: Balance badge + Theme + Admin Allocation + User Auth */}
        <div className="flex items-center gap-2">
          {/* User Session Pill or Sign In Button */}
          {user ? (
            <>
              <div className="flex items-center gap-2 neo-inset-sm p-1 rounded-xl">
                <div
                  onClick={() => setActiveTab('profile')}
                  className="w-7 h-7 rounded-lg bg-[var(--accent-brand)] text-white font-bold flex items-center justify-center text-xs cursor-pointer select-none hover:opacity-90 transition-opacity"
                  title="Trader Profile & Verification"
                >
                  {user.name.charAt(0)}
                </div>
                <div
                  onClick={() => setActiveTab('profile')}
                  className="hidden sm:flex flex-col text-left pr-1 cursor-pointer select-none hover:opacity-80 transition-opacity"
                  title="View Trader Profile"
                >
                  <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{user.name}</span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)] leading-tight">{user.accountId}</span>
                </div>
                <button
                  onClick={signOut}
                  className="neo-btn p-1 text-[var(--text-muted)] hover:text-[var(--accent-short)]"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Account Balance Indicator (only shown for authenticated users) */}
              <div className="neo-inset-sm px-3 py-1 flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--accent-long)]">
                  Active Capital
                </span>
                <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Quick Deposit Wire Button */}
              <button
                onClick={() => setIsDepositOpen(true)}
                className="neo-btn py-1.5 px-2.5 text-xs font-bold text-sky-400 border border-sky-500/30 hover:border-sky-500/60 flex items-center gap-1.5"
                title="USA Domestic Wire Transfer Deposit"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Deposit</span>
              </button>

              {/* Quick Withdraw Wire Button */}
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="neo-btn py-1.5 px-2.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center gap-1.5"
                title="USA Domestic Wire Transfer Withdrawal"
              >
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Withdraw</span>
              </button>

              {/* Firm Owner / Admin Capital Allocation Controller Button */}
              <button
                onClick={() => setActiveTab('admin')}
                className="neo-btn py-1.5 px-2.5 text-xs font-bold text-amber-400 border border-amber-500/30 hover:border-amber-500/60 flex items-center gap-1.5"
                title="Firm Owner Capital Allocation Controller"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Allocate Capital</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('auth')}
                className="neo-btn neo-btn-primary py-1.5 px-3.5 text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="neo-btn py-1.5 px-2.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:border-amber-500/60 flex items-center gap-1.5"
                title="Firm Owner Capital Allocation Controller"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Allocation</span>
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

      {/* Mobile Nav Scroller */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-[var(--border-subtle)]/60">
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
      </div>

      {/* USA Domestic Wire Inbound & Outbound Modals + Admin Capital Allocator */}
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </header>
  );
};
