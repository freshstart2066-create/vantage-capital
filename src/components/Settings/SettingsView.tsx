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
        <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--accent-brand)]" />
          Workstation & Execution Preferences
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Configure appearance theme, audio notifications, and execution latency simulation.
        </p>
      </div>

      {/* 1. Theme Configuration */}
      <div className="neo-box p-6 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Color Scheme</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Select Dark, Light, or automatic synchronization with your operating system.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-lg flex flex-col items-center gap-2 border transition-all ${
              theme === 'light' ? 'border-sky-500 bg-slate-100 text-slate-900 font-bold' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold">Light</span>
            <span className="text-[10px] text-slate-500">Clean institutional white</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-lg flex flex-col items-center gap-2 border transition-all ${
              theme === 'dark' ? 'border-sky-500 bg-slate-800/80 text-white font-bold' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold">Dark</span>
            <span className="text-[10px] text-slate-400">Obsidian slate</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-lg flex flex-col items-center gap-2 border transition-all ${
              theme === 'system' ? 'border-sky-500 bg-slate-800/80 text-white font-bold' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-semibold">System Default</span>
            <span className="text-[10px] text-slate-400">Matches OS settings</span>
          </button>
        </div>
      </div>

      {/* 2. Execution Parameters & Audio */}
      <div className="neo-box p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Execution Environment & Audio</h2>

        {/* Slippage */}
        <div className="flex items-center justify-between p-3 rounded-lg neo-inset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded neo-box text-[var(--accent-brand)]">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Realistic Spread Drift & Slippage</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Simulates real-world order execution latency (0.0 to 0.4 pips spread variation).
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
        <div className="flex items-center justify-between p-3 rounded-lg neo-inset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded neo-box text-[var(--accent-brand)]">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--accent-long)]" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Trading Audio Signals</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Auditory confirmation on order execution, price alert triggers, and risk stops.
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
