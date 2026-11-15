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
  Fingerprint,
  KeyRound,
  AlertCircle,
  X,
  Building2,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface PresetPersona {
  id: string;
  name: string;
  email: string;
  role: string;
  strategy: string;
}

const PRESET_PERSONAS: PresetPersona[] = [
  {
    id: 'persona_1',
    name: 'Alex Vance',
    email: 'alex.vance@vantagecapital.demo',
    role: 'Senior Portfolio Manager',
    strategy: 'Price Action & Breakouts',
  },
  {
    id: 'persona_2',
    name: 'Elena Rostova',
    email: 'elena.rostova@vantagecapital.demo',
    role: 'Quantitative Fund Strategist',
    strategy: 'Order Blocks & Fair Value Gaps',
  },
  {
    id: 'persona_3',
    name: 'Marcus Sterling',
    email: 'marcus.sterling@vantagecapital.demo',
    role: 'Managing Director, Client Assets',
    strategy: 'Multi-Asset Macro Scalp',
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
  const [showDemoPersonas, setShowDemoPersonas] = useState<boolean>(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [accountType, setAccountType] = useState<'ECN_RAW' | 'STANDARD_STP'>('ECN_RAW');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [strategyFocus, setStrategyFocus] = useState<string>('Price Action & Breakouts');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Error & Recovery Modal
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  // Password Entropy Validation
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

  // Sign In Submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setErrorMessage('Please enter your workstation email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }
    setErrorMessage('');
    signIn(signInEmail, signInEmail.split('@')[0]);
  };

  // Sign Up Submission (Unfunded $0.00 Starting Balance)
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid corporate or personal email address.');
      return;
    }
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number) {
      setErrorMessage('Password must be at least 8 characters with at least one uppercase letter and one number.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please acknowledge institutional risk guidelines and terms of service.');
      return;
    }

    setErrorMessage('');
    signUp(signUpName, signUpEmail, 'Unfunded Mandate ($0.00)', strategyFocus, accountType, baseCurrency);
  };

  // Fast Biometric / Passkey Auth Simulation
  const handleBiometricLogin = () => {
    setIsBiometricScanning(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsBiometricScanning(false);
      signIn('alex.vance@vantagecapital.demo', 'Alex Vance');
    }, 1000);
  };

  // Fast Persona Login
  const handleSelectPersona = (persona: PresetPersona) => {
    signIn(persona.email, persona.name);
  };

  // Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center py-8 px-4 relative">
      {/* Ambient Radial Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/8 to-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Main Centered Institutional Auth Container */}
      <div className="w-full max-w-[480px] z-10 relative">
        {/* Active Session Notification (if already authenticated) */}
        {user && (
          <div className="mb-5 p-3.5 neo-box rounded-2xl flex items-center justify-between border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-md">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-xs text-[var(--text-primary)]">
                  Active Session: {user.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  {user.accountId} &bull; {user.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className="neo-btn neo-btn-primary py-1 px-3 text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <span>Cockpit</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Auth Card */}
        <div className="neo-box p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Card Top Branding Header */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <VantageLogo size={48} showText={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neo-inset-sm text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Institutional Asset Management
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Vantage Capital
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
              Real-money client portfolio execution and forward-testing strategy lab.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 neo-inset-sm rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-[var(--accent-brand)] text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[var(--accent-brand)] text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          {/* Error Message Callout */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
              {/* Workstation Email */}
              <div className="space-y-1">
                <label
                  htmlFor="signin-email"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Workstation Email</span>
                </label>
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="name@firm.com"
                  value={signInEmail}
                  onChange={e => setSignInEmail(e.target.value)}
                  className="neo-input text-xs py-2.5 w-full font-sans"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <label htmlFor="signin-password" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                    <span>Security Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] font-medium text-[var(--accent-brand)] hover:underline"
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
                    placeholder="Enter security password"
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    className="neo-input text-xs py-2.5 pr-10 w-full font-sans"
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

              {/* Remember Device */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={e => setRememberDevice(e.target.checked)}
                    className="rounded accent-[var(--accent-brand)]"
                  />
                  <span>Remember this workstation</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  TLS 1.3 Strict
                </span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Passkey / Biometrics Button */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isBiometricScanning}
                className="w-full neo-btn py-2 px-3 rounded-xl text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 border border-sky-400/20 hover:border-sky-400/50 transition-all"
              >
                <Fingerprint className={`w-4 h-4 text-sky-400 ${isBiometricScanning ? 'animate-pulse' : ''}`} />
                <span>
                  {isBiometricScanning
                    ? 'Authenticating Sensor...'
                    : 'Sign in with Passkey / Windows Hello'}
                </span>
              </button>

              {/* Discreet 1-Click Demo Testing Access */}
              <div className="pt-2 border-t border-[var(--border-subtle)]/60">
                <button
                  type="button"
                  onClick={() => setShowDemoPersonas(prev => !prev)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Demo Trader Access (Quick-Fill)
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoPersonas ? 'rotate-180' : ''}`} />
                </button>

                {showDemoPersonas && (
                  <div className="grid grid-cols-1 gap-1.5 pt-2 animate-fadeIn">
                    {PRESET_PERSONAS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPersona(p)}
                        className="p-2 neo-inset-sm rounded-lg flex items-center justify-between text-left hover:bg-[var(--bg-surface)] transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[var(--accent-brand)]/15 text-[var(--accent-brand)] font-bold text-[10px] flex items-center justify-center font-mono">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[11px] text-[var(--text-primary)] leading-none">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
                              {p.role}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--accent-brand)] group-hover:underline">
                          Select &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
              {/* Full Legal Name */}
              <div className="space-y-1">
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
                  placeholder="e.g. Elena Rostova"
                  value={signUpName}
                  onChange={e => setSignUpName(e.target.value)}
                  className="neo-input text-xs py-2.5 w-full font-sans"
                />
              </div>

              {/* Corporate or Personal Email */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-email"
                  className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Corporate or Personal Email</span>
                </label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="trader@vantagecapital.demo"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  className="neo-input text-xs py-2.5 w-full font-sans"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <label htmlFor="signup-password" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                    <span>Create Password</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${passwordStrengthLabel.color}`}>
                    {passwordStrengthLabel.label}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    className="neo-input text-xs py-2.5 pr-10 w-full font-sans"
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

                {/* Password Entropy Meter */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-1 rounded-full transition-all duration-300 ${
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
              </div>

              {/* Execution Architecture & Currency Selection */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">
                    Execution Desk
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-0.5 neo-inset-sm rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAccountType('ECN_RAW')}
                      className={`py-1 text-[11px] font-semibold rounded transition-all ${
                        accountType === 'ECN_RAW'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Raw ECN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('STANDARD_STP')}
                      className={`py-1 text-[11px] font-semibold rounded transition-all ${
                        accountType === 'STANDARD_STP'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      STP DMA
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">
                    Base Currency
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 neo-inset-sm rounded-lg">
                    {(['USD', 'EUR', 'GBP'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBaseCurrency(c)}
                        className={`py-1 text-[11px] font-mono font-bold rounded transition-all ${
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
              <div className="space-y-1">
                <label
                  htmlFor="signup-strategy"
                  className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                  <span>Primary Strategy Focus</span>
                </label>
                <select
                  id="signup-strategy"
                  value={strategyFocus}
                  onChange={e => setStrategyFocus(e.target.value)}
                  className="neo-input text-xs py-2 w-full font-sans"
                >
                  <option value="Price Action & Breakouts">Price Action & Key Level Breakouts</option>
                  <option value="Pullback EMA & Trend Continuation">Pullback EMA 20/50 & Trend Continuation</option>
                  <option value="Order Blocks & Fair Value Gaps">Order Blocks & Institutional Liquidity Gaps</option>
                  <option value="Mean Reversion & Bollinger Bands">Mean Reversion & Volatility Bands</option>
                  <option value="Multi-Asset Algorithmic Scalp">Multi-Asset Algorithmic Scalp</option>
                </select>
              </div>

              {/* Institutional Funding Policy Notice */}
              <div className="p-3 neo-inset-sm rounded-xl text-[11px] text-[var(--text-muted)] space-y-1 border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Unfunded Mandate Policy ($0.00 Initial)</span>
                </div>
                <p className="leading-relaxed">
                  All accounts initialize with <strong>$0.00 Active Capital</strong>. Real money capital allocation and domestic wire deposits are individually approved by the firm administrator.
                </p>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 pt-0.5 text-[11px] text-[var(--text-muted)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded accent-[var(--accent-brand)]"
                />
                <span className="leading-tight">
                  I acknowledge Vantage Capital terms of service, institutional risk parameters, and execution policies.
                </span>
              </label>

              {/* Submit Registration Button */}
              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit Registration Request</span>
              </button>
            </form>
          )}

          {/* Institutional Security Footprint */}
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              256-Bit Financial Encryption
            </span>
            <span>Fedwire Direct Settlement</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="neo-box w-full max-w-sm p-6 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--accent-brand)]" />
                <h3 className="font-bold text-xs text-[var(--text-primary)]">
                  Reset Password
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
              <div className="my-5 p-4 neo-inset-sm rounded-xl text-center space-y-2 animate-fadeIn">
                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  Reset Link Dispatched
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Instructions have been sent to <strong>{forgotEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3 my-4">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Enter your registered workstation email address to receive password reset instructions.
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
                    className="neo-input text-xs py-2 w-full font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="neo-btn neo-btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Send Reset Link</span>
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
