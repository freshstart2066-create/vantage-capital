import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Settings, Moon, Sun, Monitor, Volume2, VolumeX, Shuffle, RotateCcw, Plus, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    soundEnabled,
    toggleSound,
    slippageEnabled,
    toggleSlippage,
    account,
    resetAccount,
    strategyTags,
    addStrategyTag,
    liveFeedConnected,
  } = useTrading();

  const [newTag, setNewTag] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const handleAddTag = () => {
    if (newTag.trim()) {
      addStrategyTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleResetCapital = (amt: number) => {
    resetAccount(amt);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Title */}
      <div className="neo-box p-6">
        <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--accent-brand)]" />
          Platform & Strategy Sandbox Settings
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Customize simulation physics, visual neomorphism themes, auditory cues, and starting capital parameters.
        </p>
      </div>

      {/* 1. Theme Configuration (Modern Web Guidance Tri-State) */}
      <div className="neo-box p-6 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Interface Theme (Neomorphism Style)</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Switch between soft tactile light neomorphism, obsidian dark neomorphism, or synchronize with your operating system.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
              theme === 'light' ? 'neo-inset border-2 border-[var(--accent-brand)]' : 'neo-box hover:scale-[1.02]'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Neomorphic Light</span>
            <span className="text-[10px] text-[var(--text-muted)]">Soft cool shadows</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
              theme === 'dark' ? 'neo-inset border-2 border-[var(--accent-brand)]' : 'neo-box hover:scale-[1.02]'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Neomorphic Dark</span>
            <span className="text-[10px] text-[var(--text-muted)]">Obsidian slate glow</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
              theme === 'system' ? 'neo-inset border-2 border-[var(--accent-brand)]' : 'neo-box hover:scale-[1.02]'
            }`}
          >
            <Monitor className="w-5 h-5 text-[var(--accent-brand)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">System Default</span>
            <span className="text-[10px] text-[var(--text-muted)]">Follows OS theme</span>
          </button>
        </div>
      </div>

      {/* 2. Simulation Physics: Slippage & Sound */}
      <div className="neo-box p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Simulation Physics & Feedback</h2>

        {/* Slippage */}
        <div className="flex items-center justify-between p-3 rounded-xl neo-inset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg neo-box text-[var(--accent-brand)]">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Simulated Order Slippage</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Introduces 0.0 to 0.4 pips of realistic execution latency and market spread drift.
              </div>
            </div>
          </div>

          <button
            onClick={toggleSlippage}
            className={`neo-btn py-1.5 px-3 text-xs font-bold ${
              slippageEnabled ? 'text-[var(--accent-long)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {slippageEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Sound Feedback */}
        <div className="flex items-center justify-between p-3 rounded-xl neo-inset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg neo-box text-[var(--accent-brand)]">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--accent-long)]" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Tactile Audio Feedback</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Web Audio synthesizer beeps for order execution, take profit hits, and stops.
              </div>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className={`neo-btn py-1.5 px-3 text-xs font-bold ${
              soundEnabled ? 'text-[var(--accent-long)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {soundEnabled ? 'Active' : 'Muted'}
          </button>
        </div>
      </div>

      {/* 3. Capital Deposit Management */}
      <div className="neo-box p-6 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Adjust Account Deposit Capital</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Reset or scale your initial deposit allocation. Current balance: <strong className="font-mono text-[var(--text-primary)]">${account.balance.toLocaleString()}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[10000, 50000, 100000, 250000].map(amt => (
            <button
              key={amt}
              onClick={() => handleResetCapital(amt)}
              className="neo-btn py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-[var(--text-muted)]" />
              <span>${(amt / 1000).toFixed(0)}k</span>
            </button>
          ))}
        </div>

        {resetSuccess && (
          <div className="p-2 text-xs text-[var(--accent-long)] font-semibold flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Account successfully reset to selected capital!</span>
          </div>
        )}
      </div>

      {/* 4. Strategy Method Tags Management */}
      <div className="neo-box p-6 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Method Setup Tags</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Add rule setup labels so you can tag your test entries in the Order Panel and view their win rate in the Strategy Lab.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. London Open Breakout, 15M Bollinger Reversal"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            className="neo-input text-xs"
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
          />
          <button
            onClick={handleAddTag}
            className="neo-btn neo-btn-primary px-4 text-xs font-bold flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {strategyTags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full neo-inset-sm text-xs text-[var(--text-primary)] font-medium flex items-center gap-1.5"
            >
              <span>{tag}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 5. Live Feed & Engine Diagnostics */}
      <div className="neo-box p-4 flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${liveFeedConnected ? 'bg-[var(--accent-long)]' : 'bg-amber-400'}`}></span>
          <span>Feed: {liveFeedConnected ? 'Public Interbank API (Active)' : 'Synthetic Tick Engine (Active)'}</span>
        </div>
        <span>Engine Latency: ~12ms</span>
      </div>
    </div>
  );
};
