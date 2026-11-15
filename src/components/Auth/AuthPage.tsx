import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { VantageLogo } from '../VantageLogo';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Fingerprint,
  KeyRound,
  AlertCircle,
  X,
  Check,
  Radio,
  Server,
  Landmark,
} from 'lucide-react';

interface PersonaProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  strategy: string;
  badge: string;
}

const PRESET_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona_1',
    name: 'Alex Vance',
    email: 'alex.vance@vantagecapital.demo',
    role: 'Senior Portfolio Manager',
    tier: 'Accredited Fund ($50,000)',
    strategy: 'Price Action & Breakouts',
    badge: '$50,000 Mandate',
  },
  {
    id: 'persona_2',
    name: 'Elena Rostova',
    email: 'elena.rostova@vantagecapital.demo',
    role: 'Quantitative Fund Strategist',
    tier: 'Institutional Prime ($100,000)',
    strategy: 'Order Blocks & Fair Value Gaps',
    badge: '$100,000 Mandate',
  },
  {
    id: 'persona_3',
    name: 'Marcus Sterling',
    email: 'marcus.sterling@vantagecapital.demo',
    role: 'Managing Director, Client Assets',
    tier: 'Sovereign Fund ($250,000)',
    strategy: 'High-Volatility Scalp',
    badge: '$250,000 Mandate',
  },
];

export const AuthPage: React.FC = () => {
  const { signIn, signUp, setActiveTab, user } = useTrading();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState<string>('alex.vance@vantagecapital.demo');
  const [signInPassword, setSignInPassword] = useState<string>('VantagePro2026!');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);

  // Optional 2FA Step for Sign In
  const [require2FA, setRequire2FA] = useState<boolean>(false);
  const [totpCode, setTotpCode] = useState<string[]>(['', '', '', '', '', '']);

  // Sign Up State
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('Professional ($50,000)');
  const [accountType, setAccountType] = useState<'ECN_RAW' | 'STANDARD_STP'>('ECN_RAW');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [strategyFocus, setStrategyFocus] = useState<string>('Price Action & Breakouts');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Status & Password Reset Modal
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  // Password Strength Calculation (for Sign Up)
  const passwordCriteria = useMemo(() => {
    const pwd = signUpPassword;
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [signUpPassword]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.uppercase) score++;
    if (passwordCriteria.number) score++;
    if (passwordCriteria.special) score++;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (signUpPassword.length === 0) return { label: 'Required', color: 'text-[var(--text-muted)]' };
    if (passwordScore === 1) return { label: 'Weak', color: 'text-rose-500' };
    if (passwordScore === 2) return { label: 'Fair', color: 'text-amber-500' };
    if (passwordScore === 3) return { label: 'Good', color: 'text-sky-400' };
    return { label: 'Institutional Grade', color: 'text-emerald-400' };
  }, [signUpPassword, passwordScore]);

  // Handle Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    // If 2FA is toggled on, show 2FA prompt
    if (require2FA && totpCode.join('').length < 6) {
      setErrorMessage('Please enter the 6-digit authenticator verification code.');
      return;
    }

    setErrorMessage('');
    signIn(signInEmail, signInEmail.split('@')[0]);
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid institutional or personal email address.');
      return;
    }
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number) {
      setErrorMessage('Password must be at least 8 characters with at least one uppercase letter and one number.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please acknowledge the Vantage Capital terms of service and risk guidelines.');
      return;
    }

    setErrorMessage('');
    signUp(signUpName, signUpEmail, selectedTier, strategyFocus, accountType, baseCurrency);
  };

  // Fast Biometric / Passkey Login Simulation
  const handleBiometricLogin = () => {
    setIsBiometricScanning(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsBiometricScanning(false);
      signIn('alex.vance@vantagecapital.demo', 'Alex Vance', 'Professional ($50,000)');
    }, 1100);
  };

  // Handle Preset Persona One-Click Login
  const handleSelectPersona = (persona: PersonaProfile) => {
    signIn(persona.email, persona.name, persona.tier);
  };

  // Handle TOTP Input Progression
  const handleTotpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...totpCode];
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setTotpCode(newCode);
      const nextInput = document.getElementById(`totp-${Math.min(5, digits.length)}`);
      nextInput?.focus();
      return;
    }

    const newCode = [...totpCode];
    newCode[index] = val;
    setTotpCode(newCode);

    if (val && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }, 2800);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-2 sm:px-4">
      {/* Top Banner Notice */}
      <div className="mb-4 p-3 neo-inset rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[var(--accent-long)] font-bold uppercase tracking-wider">
            Vantage ID Central Authentication Server
          </span>
          <span className="hidden sm:inline text-[var(--text-muted)]">
            &bull; LD4 Equinix (London) &bull; Latency: 1.8ms
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 GCM
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-sky-400" /> Tier-1 Liquidity
          </span>
        </div>
      </div>

      <div className="neo-box p-6 sm:p-10 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Institutional Architecture & Fast Access Personas (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:border-r border-[var(--border-subtle)] lg:pr-8">
          <div>
            <VantageLogo size={46} showText={true} />
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mt-4 tracking-tight">
              Asset Management & Strategy Portal
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Vantage Capital manages client funds and executes real money market operations. Authenticate to access your portfolio mandates and test-run strategies in the forward simulation sandbox.
            </p>
          </div>

          {/* Value Props Pills */}
          <div className="space-y-2.5">
            <div className="p-3 neo-inset rounded-xl flex items-start gap-3 text-xs">
              <Landmark className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)] block">Real-Money Client Management:</strong>
                <span className="text-[var(--text-muted)]">
                  Discretionary and quantitative fund execution with direct USA Fedwire banking settlement.
                </span>
              </div>
            </div>

            <div className="p-3 neo-inset rounded-xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)] block">Pre-Deployment Strategy Forward-Testing:</strong>
                <span className="text-[var(--text-muted)]">
                  All models are test-run with paper simulation before live client capital allocation is authorized.
                </span>
              </div>
            </div>

            <div className="p-3 neo-inset rounded-xl flex items-start gap-3 text-xs">
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)] block">Fiduciary Risk Governance:</strong>
                <span className="text-[var(--text-muted)]">
                  Automated daily risk limits (5%) and trailing drawdown ceilings (10%) protect client wealth.
                </span>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Persona Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                Instant Trader Personas (1-Click)
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Skip form</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PRESET_PERSONAS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  className="p-3 neo-btn rounded-xl flex items-center justify-between text-left group hover:border-[var(--accent-brand)]/40 transition-all"
                  title={`Sign in as ${p.name}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] font-bold font-mono flex items-center justify-center text-xs group-hover:bg-[var(--accent-brand)] group-hover:text-white transition-all">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)] leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-tight">
                        {p.role} &bull; {p.strategy}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-brand)]/10 text-[var(--accent-brand)]">
                      {p.badge}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-brand)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Form Station (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active User Alert (if already authenticated) */}
          {user && (
            <div className="p-4 neo-inset rounded-2xl flex items-center justify-between text-xs border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    Active Session: {user.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    {user.email} &bull; {user.accountId} &bull; {user.tier}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className="neo-btn neo-btn-primary py-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <span>Launch Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tactile Segmented Tab Bar: Sign In vs Open Account */}
          <div className="grid grid-cols-2 gap-2 p-1.5 neo-inset-sm rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'bg-[var(--accent-brand)] text-white shadow-lg'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-[var(--accent-brand)] text-white shadow-lg'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Open New Account</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. SIGN IN FORM (Modern Web Guidance: autofill-sign-in-form) */}
          {/* ======================================================== */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-email"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Workstation Email Address</span>
                </label>
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  enterKeyHint="next"
                  placeholder="trader@vantagecapital.demo"
                  value={signInEmail}
                  onChange={e => setSignInEmail(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              {/* Password & Forgot Password Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <label htmlFor="signin-password" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                    <span>Security Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] font-semibold text-[var(--accent-brand)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signin-password"
                    name="password"
                    autoComplete="current-password"
                    required
                    enterKeyHint={require2FA ? 'next' : 'done'}
                    placeholder="Enter your account password"
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    className="neo-input text-xs py-2.5 pr-10 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional 2FA TOTP Drawer */}
              <div className="p-3 neo-inset rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--text-secondary)] font-semibold">
                    <input
                      type="checkbox"
                      checked={require2FA}
                      onChange={e => setRequire2FA(e.target.checked)}
                      className="rounded accent-[var(--accent-brand)]"
                    />
                    <span>Require 2FA Authenticator TOTP</span>
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    RFC 6238 Standard
                  </span>
                </div>

                {require2FA && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1.5">
                      Enter 6-Digit Authenticator Code (Google Authenticator / YubiKey):
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 justify-between">
                      {totpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`totp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                          value={digit}
                          onChange={e => handleTotpChange(idx, e.target.value)}
                          className="w-10 h-11 text-center font-mono text-base font-bold neo-input"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Workstation Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={e => setRememberDevice(e.target.checked)}
                    className="rounded accent-[var(--accent-brand)]"
                  />
                  <span>Trust this trading terminal</span>
                </label>

                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  TLS 1.3 Strict
                </span>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full py-3.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Terminal</span>
              </button>

              {/* Fast Biometric / Passkey Authenticator Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isBiometricScanning}
                  className="w-full neo-btn py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 border border-sky-400/30 hover:border-sky-400/60"
                  title="Authenticate instantly with WebAuthn Passkey, Touch ID, or Windows Hello"
                >
                  <Fingerprint className={`w-4 h-4 text-sky-400 ${isBiometricScanning ? 'animate-pulse' : ''}`} />
                  <span>
                    {isBiometricScanning
                      ? 'Scanning Biometric / Passkey Sensor...'
                      : 'Sign In with Passkey / Touch ID / Windows Hello'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. SIGN UP FORM (Modern Web Guidance: autofill-sign-up-form) */}
          {/* ======================================================== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
              {/* Full Legal Name (Single Name Input) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-name"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  required
                  enterKeyHint="next"
                  placeholder="e.g. Jordan Belfort or Sarah Chen"
                  value={signUpName}
                  onChange={e => setSignUpName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Corporate or Personal Email Address</span>
                </label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  enterKeyHint="next"
                  placeholder="trader@hedgefund.com"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              {/* Password with Strength Engine */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <label htmlFor="signup-password" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                    <span>Create Workstation Password</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${passwordStrengthLabel.color}`}>
                    {passwordStrengthLabel.label}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    enterKeyHint="done"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    className="neo-input text-xs py-2.5 pr-10 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 4-Bar Password Entropy Meter */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordScore >= step
                          ? passwordScore === 1
                            ? 'bg-rose-500'
                            : passwordScore === 2
                            ? 'bg-amber-500'
                            : passwordScore === 3
                            ? 'bg-sky-400'
                            : 'bg-emerald-400'
                          : 'bg-[var(--border-darker)]'
                      }`}
                    />
                  ))}
                </div>

                {/* Requirement Checkpoints */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
                  <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-400' : ''}`}>
                    <Check className="w-3 h-3" /> 8+ Characters
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-emerald-400' : ''}`}>
                    <Check className="w-3 h-3" /> 1 Uppercase Letter
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-emerald-400' : ''}`}>
                    <Check className="w-3 h-3" /> 1 Numeric Digit
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.special ? 'text-emerald-400' : ''}`}>
                    <Check className="w-3 h-3" /> 1 Special Symbol
                  </span>
                </div>
              </div>

              {/* Account Size Selection Cards */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Starting Capital Allocation:</span>
                  <span className="font-mono text-[var(--accent-brand)]">{selectedTier}</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '$10,000', id: 'Starter ($10,000)', desc: '1:100 Lev' },
                    { label: '$50,000', id: 'Professional ($50,000)', desc: '1:200 Lev' },
                    { label: '$100,000', id: 'Institutional ($100,000)', desc: '1:500 Lev' },
                    { label: '$250,000', id: 'Elite ($250,000)', desc: '1:500 Lev' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTier(t.id)}
                      className={`p-2.5 rounded-xl text-center transition-all ${
                        selectedTier === t.id
                          ? 'bg-[var(--accent-brand)] text-white shadow-md font-bold'
                          : 'neo-btn text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="font-mono text-xs">{t.label}</div>
                      <div className="text-[10px] opacity-80">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Execution Architecture & Base Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">
                    Execution Architecture
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 neo-inset rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAccountType('ECN_RAW')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                        accountType === 'ECN_RAW'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                      title="Raw Spreads from 0.0 pips + Commission"
                    >
                      Raw ECN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('STANDARD_STP')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                        accountType === 'STANDARD_STP'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                      title="Standard 0.8 pip spread, $0 commission"
                    >
                      Standard STP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">
                    Base Currency
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 neo-inset rounded-lg">
                    {(['USD', 'EUR', 'GBP'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBaseCurrency(c)}
                        className={`py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                          baseCurrency === c
                            ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Strategy Focus */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-strategy"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Primary Method / Strategy Focus</span>
                </label>
                <select
                  id="signup-strategy"
                  value={strategyFocus}
                  onChange={e => setStrategyFocus(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                >
                  <option value="Price Action & Breakouts">Price Action & Key Level Breakouts</option>
                  <option value="Pullback EMA & Trend Continuation">Pullback EMA 20/50 & Trend Continuation</option>
                  <option value="Order Blocks & Fair Value Gaps">Order Blocks & Institutional Liquidity Gaps</option>
                  <option value="Mean Reversion & Bollinger Bands">Mean Reversion & Bollinger Bands</option>
                  <option value="Automated Algorithmic Testing">Automated Algorithmic Strategy Testing</option>
                </select>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 text-[11px] text-[var(--text-muted)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded accent-[var(--accent-brand)]"
                />
                <span className="leading-relaxed">
                  I acknowledge the Vantage Capital terms of service, simulated execution guidelines, and institutional risk parameters.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full py-3.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Trading Account</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Self-Service Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="neo-box w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--accent-brand)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Account Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="neo-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="my-6 p-4 neo-inset rounded-xl text-center space-y-2 animate-fadeIn">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  Recovery Token Dispatched
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  A cryptographic reset link has been dispatched to <strong>{forgotEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4 my-4">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Enter your registered workstation email address to receive an instant recovery link.
                </p>

                <div className="space-y-1">
                  <label htmlFor="forgot-email" className="text-xs font-bold text-[var(--text-secondary)]">
                    Workstation Email
                  </label>
                  <input
                    type="email"
                    id="forgot-email"
                    required
                    placeholder="trader@vantagecapital.demo"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="neo-input text-xs py-2.5 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="neo-btn neo-btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Send Recovery Instructions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
