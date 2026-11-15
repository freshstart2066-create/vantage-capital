import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { WithdrawalModal } from '../Withdrawal/WithdrawalModal';
import {
  ShieldCheck,
  Award,
  KeyRound,
  Landmark,
  Sliders,
  Building,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
  Fingerprint,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const {
    user,
    account,
    stats,
    setActiveTab,
    signOut,
    updateUserProfile,
    setPropTier,
    withdrawalRequests,
    soundEnabled,
    toggleSound,
    slippageEnabled,
    toggleSlippage,
  } = useTrading();

  const [activeProfileTab, setActiveProfileTab] = useState<'account' | 'wire' | 'security' | 'preferences'>('account');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);

  // Edit Profile Form State
  const [name, setName] = useState<string>(user?.name || 'Alex Vance');
  const [email, setEmail] = useState<string>(user?.email || 'alex.vance@vantagecapital.demo');
  const [phone, setPhone] = useState<string>(user?.phone || '+1 (212) 849-2041');
  const [strategyFocus, setStrategyFocus] = useState<string>(user?.strategyFocus || 'Price Action & Breakouts');
  const [deskLocation, setDeskLocation] = useState<string>(user?.deskLocation || 'New York Dealing Desk (NY4)');

  // Saved Wire Transfer Payout Info State
  const [savedBankName, setSavedBankName] = useState<string>(
    user?.savedBankName || 'JPMorgan Chase Bank, N.A.'
  );
  const [savedRoutingNumber, setSavedRoutingNumber] = useState<string>(
    user?.savedRoutingNumber || '021000021'
  );
  const [savedAccountNumber, setSavedAccountNumber] = useState<string>(
    user?.savedAccountNumberMasked || '•••• 8912'
  );
  const [savedAccountType, setSavedAccountType] = useState<'CHECKING' | 'SAVINGS'>(
    user?.savedAccountType || 'CHECKING'
  );
  const [savedAddress, setSavedAddress] = useState<string>(
    user?.savedAddress || '383 Madison Ave, New York, NY 10017'
  );

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Handle Save Preferences
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phone,
      strategyFocus,
      deskLocation,
      savedBankName,
      savedRoutingNumber,
      savedAccountNumberMasked: savedAccountNumber,
      savedAccountType,
      savedAddress,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4 space-y-6">
      {/* 1. Institutional Hero Identity Card */}
      <div className="neo-box p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Monogram Avatar with Institutional Verified Pip */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-brand)] to-emerald-600 text-white font-extrabold flex items-center justify-center text-2xl sm:text-3xl shadow-xl">
                {user?.name.charAt(0) || 'V'}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-lg text-slate-950 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                  {user?.name || 'Institutional Trader'}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  KYC Level 2 Verified
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                Account ID: <strong className="text-[var(--text-primary)]">{user?.accountId || 'VC-89421'}</strong> &bull;{' '}
                {user?.email || 'trader@vantagecapital.demo'}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  {user?.deskLocation || 'New York Dealing Desk (NY4)'}
                </span>
                <span className="hidden sm:inline text-[var(--text-muted)]">&bull;</span>
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Active Since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'November 2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('terminal')}
              className="flex-1 sm:flex-initial neo-btn neo-btn-primary py-2 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="neo-btn py-2 px-3 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl flex items-center gap-1.5"
              title="USA Domestic Wire Transfer Withdrawal"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={signOut}
              className="neo-btn p-2 text-[var(--text-muted)] hover:text-rose-400 rounded-xl"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lifetime Audit Metric Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-[var(--border-subtle)]">
          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Active Capital
            </span>
            <span className="text-base font-bold font-mono text-[var(--text-primary)]">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Win Rate
            </span>
            <span className="text-base font-bold font-mono text-[var(--accent-long)]">
              {stats.winRate}%
            </span>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Profit Factor
            </span>
            <span className="text-base font-bold font-mono text-[var(--text-primary)]">
              {stats.profitFactor}
            </span>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Max Drawdown
            </span>
            <span className="text-base font-bold font-mono text-amber-400">
              {stats.maxDrawdown}%
            </span>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Total Trades
            </span>
            <span className="text-base font-bold font-mono text-[var(--text-primary)]">
              {stats.totalTrades}
            </span>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
              Expectancy / Trade
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              ${stats.expectancy}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Profile Sections Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 neo-inset rounded-2xl">
        <button
          onClick={() => setActiveProfileTab('account')}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeProfileTab === 'account'
              ? 'bg-[var(--accent-brand)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Capital & Allocation</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('wire')}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeProfileTab === 'wire'
              ? 'bg-[var(--accent-brand)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Domestic Wire Profile</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('security')}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeProfileTab === 'security'
              ? 'bg-[var(--accent-brand)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Security & Passkeys</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('preferences')}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeProfileTab === 'preferences'
              ? 'bg-[var(--accent-brand)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Trader Preferences</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CAPITAL & ACCOUNT TIER ALLOCATION */}
      {/* ======================================================== */}
      {activeProfileTab === 'account' && (
        <div className="neo-box p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Portfolio Allocation & Fiduciary Mandate
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Parameters governed by your client portfolio mandate and strategy forward-testing protocol
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] border border-[var(--accent-brand)]/20">
              {user?.tier || 'Accredited Portfolio ($50,000)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 neo-inset rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                Execution Model
              </span>
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Raw ECN Micro-Spreads
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                From 0.0 pips + $3.50 commission
              </span>
            </div>

            <div className="p-4 neo-inset rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                Maximum Leverage
              </span>
              <div className="font-bold text-sm text-[var(--text-primary)] font-mono">
                1:200 Dynamic
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                0.5% Initial Margin Requirement
              </span>
            </div>

            <div className="p-4 neo-inset rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                Max Daily Drawdown
              </span>
              <div className="font-bold text-sm text-amber-400 font-mono">
                5% ($2,500 Buffer)
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                Hard automated cutoff
              </span>
            </div>

            <div className="p-4 neo-inset rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                Base Currency
              </span>
              <div className="font-bold text-sm text-[var(--text-primary)] font-mono">
                USD ($) United States Dollar
              </div>
              <span className="text-[10px] text-emerald-400">
                Fedwire Direct Clearing
              </span>
            </div>
          </div>

          {/* Tier Upgrade Selector */}
          <div className="p-5 neo-inset rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Switch Portfolio Allocation Mandate
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Select an institutional portfolio tier to forward-test strategy scalability across different client capital weights.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { label: '$10,000', amount: 10000, name: 'Private Wealth ($10,000)' },
                { label: '$50,000', amount: 50000, name: 'Accredited Portfolio ($50,000)' },
                { label: '$100,000', amount: 100000, name: 'Institutional Prime ($100,000)' },
                { label: '$250,000', amount: 250000, name: 'Sovereign Mandate ($250,000)' },
              ].map(t => (
                <button
                  key={t.amount}
                  type="button"
                  onClick={() => {
                    setPropTier(t.amount);
                    updateUserProfile({ tier: t.name });
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    user?.tier.includes(t.label)
                      ? 'border-[var(--accent-brand)] bg-[var(--accent-brand)] text-white shadow-md font-bold'
                      : 'border-[var(--border-subtle)] neo-btn text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="text-sm font-mono font-bold">{t.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Allocation</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SAVED USA LOCAL WIRE TRANSFER PROFILE */}
      {/* ======================================================== */}
      {activeProfileTab === 'wire' && (
        <div className="neo-box p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Saved USA Domestic Wire Profile
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                  Fedwire Default
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Default wire instructions stored for one-click capital payout processing
              </p>
            </div>

            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="neo-btn neo-btn-primary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Initiate Wire Transfer</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Beneficiary Legal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Receiving Bank Name (USA)
                </label>
                <input
                  type="text"
                  value={savedBankName}
                  onChange={e => setSavedBankName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  9-Digit ABA Routing Transit Number
                </label>
                <input
                  type="text"
                  maxLength={9}
                  inputMode="numeric"
                  value={savedRoutingNumber}
                  onChange={e => setSavedRoutingNumber(e.target.value.replace(/\D/g, ''))}
                  className="neo-input text-xs py-2.5 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  maxLength={17}
                  inputMode="numeric"
                  value={savedAccountNumber}
                  onChange={e => setSavedAccountNumber(e.target.value)}
                  className="neo-input text-xs py-2.5 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Account Type
                </label>
                <select
                  value={savedAccountType}
                  onChange={e => setSavedAccountType(e.target.value as 'CHECKING' | 'SAVINGS')}
                  className="neo-input text-xs py-2.5 font-sans"
                >
                  <option value="CHECKING">Checking Account</option>
                  <option value="SAVINGS">Savings Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Beneficiary Physical Address (FinCEN Mandate)
                </label>
                <input
                  type="text"
                  value={savedAddress}
                  onChange={e => setSavedAddress(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="neo-btn neo-btn-primary py-2.5 px-6 text-xs font-bold rounded-xl"
              >
                Save Wire Instructions
              </button>
            </div>
          </form>

          {/* Recent Wire Disbursements List */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
              <span>Recent Wire Withdrawals ({withdrawalRequests.length})</span>
              <span className="font-normal lowercase">Federal Reserve National Settlement Service</span>
            </h3>

            <div className="space-y-2">
              {withdrawalRequests.map(req => (
                <div
                  key={req.id}
                  className="p-3 neo-inset rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{req.referenceId}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {req.bankName} &bull; {req.accountNumberMasked}
                    </div>
                  </div>

                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                    ${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SECURITY, 2FA & PASSKEYS */}
      {/* ======================================================== */}
      {activeProfileTab === 'security' && (
        <div className="neo-box p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
          <div className="pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Security Credentials & Authentication Hardware
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Institutional session protection, passkey enrollments, and encryption parameters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2FA Status Card */}
            <div className="p-4 neo-inset rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-[var(--text-primary)]">Two-Factor Auth (2FA)</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  Enrolled & Active
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                RFC 6238 TOTP authenticator protection active. Code required on new browser sessions.
              </p>
            </div>

            {/* Passkeys / WebAuthn Card */}
            <div className="p-4 neo-inset rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs text-[var(--text-primary)]">WebAuthn Passkey</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">
                  Windows Hello / Touch ID
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Biometric hardware authentication key registered for instant zero-password entry.
              </p>
            </div>
          </div>

          {/* Change Password Form (Modern Web Guidance Compliant) */}
          <div className="p-5 neo-inset rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
              Change Workstation Password
            </h3>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password successfully updated and encrypted.</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="current-pwd"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="current-pwd"
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="neo-input text-xs py-2 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="new-pwd"
                      className="text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      New Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-pwd"
                    name="new-password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="neo-input text-xs py-2 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="neo-btn neo-btn-primary py-2 px-4 text-xs font-bold rounded-xl"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TRADER PREFERENCES & PLATFORM DEFAULTS */}
      {/* ======================================================== */}
      {activeProfileTab === 'preferences' && (
        <div className="neo-box p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
          <div className="pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Trader Workspace Preferences
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Customize execution parameters, auditory signals, and default trading setups
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Trader Full Legal Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Direct Trading Desk Phone
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Primary Method Focus
                </label>
                <select
                  value={strategyFocus}
                  onChange={e => setStrategyFocus(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                >
                  <option value="Price Action & Breakouts">Price Action & Key Level Breakouts</option>
                  <option value="Pullback EMA & Trend Continuation">Pullback EMA 20/50 & Trend Continuation</option>
                  <option value="Order Blocks & Fair Value Gaps">Order Blocks & Institutional Liquidity Gaps</option>
                  <option value="Mean Reversion & Bollinger Bands">Mean Reversion & Bollinger Bands</option>
                  <option value="High-Volatility Scalp">High-Volatility Scalp</option>
                  <option value="Automated Algorithmic Testing">Automated Algorithmic Strategy Testing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Institutional Execution Desk Location
                </label>
                <select
                  value={deskLocation}
                  onChange={e => setDeskLocation(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                >
                  <option value="New York Dealing Desk (NY4)">New York Dealing Desk (Equinix NY4 Secaucus)</option>
                  <option value="London Dealing Desk (LD4)">London Dealing Desk (Equinix LD4 Slough)</option>
                  <option value="Tokyo Dealing Desk (TY3)">Tokyo Dealing Desk (Equinix TY3 Tokyo)</option>
                  <option value="Chicago CME Dealing Desk (Aurora)">Chicago CME Dealing Desk (CyrusOne Aurora)</option>
                </select>
              </div>
            </div>

            {/* Platform Toggles */}
            <div className="p-4 neo-inset rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Execution Physics & Audio Feedback
              </h3>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-bold text-xs text-[var(--text-primary)] block">
                    Tactile Audio Chimes
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Auditory Web Audio feedback on order fills, TP/SL, and price alerts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    soundEnabled ? 'bg-emerald-500 text-slate-950 font-bold' : 'neo-btn text-[var(--text-muted)]'
                  }`}
                >
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-[var(--border-subtle)]/50 pt-2">
                <div>
                  <span className="font-bold text-xs text-[var(--text-primary)] block">
                    Realistic Execution Slippage Simulation
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Simulates 0.1 to 0.4 pips real-world ECN market execution drift
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSlippage}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    slippageEnabled ? 'bg-emerald-500 text-slate-950 font-bold' : 'neo-btn text-[var(--text-muted)]'
                  }`}
                >
                  {slippageEnabled ? 'Active' : 'Zero Drift'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="neo-btn neo-btn-primary py-2.5 px-6 text-xs font-bold rounded-xl"
              >
                Save All Profile Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Embedded Wire Withdrawal Dialog */}
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </div>
  );
};
