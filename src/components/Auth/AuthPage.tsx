import React, { useMemo, useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { VantageLogo } from '../VantageLogo';
import { api } from '../../services/api';
import { ArrowRight, Eye, EyeOff, AlertCircle, X, Check } from 'lucide-react';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'United Arab Emirates', 'Singapore', 'South Africa', 'Nigeria', 'Kenya', 'India', 'Other',
];

const inputCls =
  'w-full rounded-lg border border-slate-400/40 bg-transparent px-3.5 py-3 text-sm text-[var(--text-primary)] ' +
  'placeholder:text-[var(--text-muted)] outline-none transition-colors ' +
  'focus:border-[var(--accent-brand)] focus:ring-2 focus:ring-[var(--accent-brand)]/25';

const labelCls = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';

const BrandPanel: React.FC = () => (
  <div className="hidden lg:flex flex-col justify-between bg-[#0b1220] text-white p-10 relative overflow-hidden">
    <VantageLogo size={38} showText={true} />
    <svg className="absolute inset-x-0 bottom-0 w-full opacity-70" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="authFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.28" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 200 L50 185 L95 195 L150 150 L200 165 L255 120 L310 135 L365 90 L420 105 L480 60 L540 75 L600 35 L600 260 L0 260Z" fill="url(#authFill)" />
      <path d="M0 200 L50 185 L95 195 L150 150 L200 165 L255 120 L310 135 L365 90 L420 105 L480 60 L540 75 L600 35" fill="none" stroke="#60a5fa" strokeWidth="2" />
    </svg>
    <div className="relative z-10 max-w-sm">
      <h2 className="text-3xl font-semibold leading-tight tracking-tight">
        Institutional execution & managed portfolio strategies.
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        Direct market access, Tier-1 liquidity, and forward-testing protocol for live client capital allocation.
      </p>
    </div>
  </div>
);

export const AuthPage: React.FC = () => {
  const { signIn, signUp, updateUserProfile, setActiveTab, user } = useTrading();
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('United States');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [accountType, setAccountType] = useState<'STANDARD_STP' | 'ECN_RAW'>('STANDARD_STP');
  const [agree, setAgree] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const rules = useMemo(
    () => [
      { ok: password.length >= 8, text: 'At least 8 characters' },
      { ok: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { ok: /[0-9]/.test(password), text: 'One number' },
    ],
    [password]
  );

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError('');
    setPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return setError('Enter the email address you registered with.');
    if (!password) return setError('Enter your password.');
    setError('');
    setBusy(true);
    try {
      const u = await api.login(email.trim(), password);
      signIn(u.email, u.name);
      updateUserProfile({ role: u.role, accountId: u.accountId, name: u.name });
      if (u.role === 'admin') setActiveTab('admin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (!rules.every(r => r.ok)) return setError('Your password must meet all three requirements below.');
    if (!agree) return setError('Accept the terms and risk disclosure to continue.');
    setError('');
    setBusy(true);
    try {
      const u = await api.signup({ name: fullName.trim(), email: email.trim(), password, country, currency, accountType });
      signUp(u.name, u.email, 'Standard', undefined, accountType, currency);
      updateUserProfile({ role: u.role, accountId: u.accountId });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) return;
    setForgotSent(true);
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotSent(false);
    setForgotEmail('');
  };

  const PasswordField = (id: string, autoComplete: string, placeholder: string) => (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={password}
        onChange={e => setPassword(e.target.value)}
        className={inputCls + ' pr-11'}
      />
      <button
        type="button"
        onClick={() => setShowPassword(s => !s)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  const primaryBtn =
    'w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-brand)] px-4 py-3 text-sm font-semibold ' +
    'text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-brand)]';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6">
      <div className="w-full max-w-[1020px] grid lg:grid-cols-[1fr_1.05fr] rounded-2xl overflow-hidden border border-slate-400/30 bg-[var(--bg-surface-card)] shadow-xl">
        <BrandPanel />

        <div className="p-7 sm:p-10">
          <div className="lg:hidden mb-6">
            <VantageLogo size={30} showText={false} />
          </div>

          {user && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-400/30 px-4 py-3 text-sm">
              <span className="text-[var(--text-secondary)]">Signed in as {user.email}</span>
              <button onClick={() => setActiveTab('terminal')} className="font-semibold text-[var(--accent-brand)] hover:underline">
                Open terminal
              </button>
            </div>
          )}

          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {mode === 'signin' ? 'Sign in to Vantage' : 'Open your account'}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {mode === 'signin' ? 'Welcome back. Enter your details to continue.' : 'Takes about two minutes. No documents needed yet.'}
          </p>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-500">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="si-email" className={labelCls}>Email</label>
                <input id="si-email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="si-pass" className={labelCls}>Password</label>
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-[var(--accent-brand)] hover:underline -mt-1.5">
                    Forgot password?
                  </button>
                </div>
                {PasswordField('si-pass', 'current-password', 'Your password')}
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[var(--accent-brand)]" />
                Keep me signed in on this device
              </label>
              <button type="submit" disabled={busy} className={primaryBtn + ' disabled:opacity-60'}>
                {busy ? 'Signing in…' : 'Sign in'} <ArrowRight className="w-4 h-4" />
              </button>
              <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@vantage.local');
                    setPassword('change-me-now');
                  }}
                  className="text-[var(--accent-brand)] hover:underline"
                >
                  Fill Admin Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alex.vance@vantagecapital.demo');
                    setPassword('VantagePro2026!');
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
                >
                  Fill Demo Trader
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="su-name" className={labelCls}>Full name</label>
                <input id="su-name" type="text" autoComplete="name" placeholder="As it appears on your ID" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="su-email" className={labelCls}>Email</label>
                <input id="su-email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="su-pass" className={labelCls}>Password</label>
                {PasswordField('su-pass', 'new-password', 'Create a password')}
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {rules.map(r => (
                    <li key={r.text} className={'flex items-center gap-1 ' + (r.ok ? 'text-emerald-500' : 'text-[var(--text-muted)]')}>
                      <Check className={'w-3 h-3 ' + (r.ok ? '' : 'opacity-30')} /> {r.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="su-country" className={labelCls}>Country of residence</label>
                  <select id="su-country" value={country} onChange={e => setCountry(e.target.value)} className={inputCls}>
                    {COUNTRIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="su-ccy" className={labelCls}>Account currency</label>
                  <select id="su-ccy" value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')} className={inputCls}>
                    {['USD', 'EUR', 'GBP'].map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className={labelCls}>Account type</span>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['STANDARD_STP', 'Standard', 'Commission-free, spread from 1.0 pip'],
                    ['ECN_RAW', 'Raw', 'Spread from 0.0 pip, commission per lot'],
                  ] as const).map(([val, title, sub]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAccountType(val)}
                      aria-pressed={accountType === val}
                      className={'text-left rounded-lg border px-3.5 py-3 transition-colors ' + (accountType === val ? 'border-[var(--accent-brand)] bg-[var(--accent-brand)]/10' : 'border-slate-400/40 hover:border-slate-400/80')}
                    >
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 accent-[var(--accent-brand)]" />
                <span>I agree to the terms of service and have read the risk disclosure.</span>
              </label>
              <button type="submit" disabled={busy} className={primaryBtn + ' disabled:opacity-60'}>
                {busy ? 'Creating account…' : 'Create account'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-[var(--text-muted)]">
            {mode === 'signin' ? 'New to Vantage? ' : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-[var(--accent-brand)] hover:underline">
              {mode === 'signin' ? 'Open an account' : 'Sign in'}
            </button>
          </p>
          <p className="mt-6 text-xs text-[var(--text-muted)]/80">
            Institutional Asset Management &bull; Quantitative strategy forward-testing precedes live client fund allocation.
          </p>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface-card)] border border-slate-400/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="forgot-title" className="text-base font-semibold text-[var(--text-primary)]">Reset your password</h3>
              <button onClick={closeForgot} aria-label="Close" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            {forgotSent ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                If an account exists for {forgotEmail}, a reset link is on its way.
              </p>
            ) : (
              <form onSubmit={handleForgot} className="mt-4 space-y-4">
                <p className="text-sm text-[var(--text-muted)]">Enter your email and we will send you a link to choose a new password.</p>
                <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputCls} aria-label="Email" />
                <button type="submit" className={primaryBtn}>Send reset link</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
