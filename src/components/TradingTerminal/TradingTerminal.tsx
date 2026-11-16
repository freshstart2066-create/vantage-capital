import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { AccountOverviewBar } from './AccountOverviewBar';
import { ChartContainer } from './ChartContainer';
import { MarketWatch } from './MarketWatch';
import { OrderPanel } from './OrderPanel';
import { PositionsAndOrders } from './PositionsAndOrders';
import { PropChallengeWidget } from './PropChallengeWidget';
import { CurrencyStrengthMeter } from './CurrencyStrengthMeter';
import { HotkeysModal } from './HotkeysModal';
import {
  Keyboard,
  List,
  Gauge,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const TradingTerminal: React.FC = () => {
  const {
    executeMarketOrder,
    closeAllPositions,
    replayState,
    togglePlayReplay,
    stepReplay,
  } = useTrading();

  const [leftTab, setLeftTab] = useState<'watch' | 'strength'>('watch');
  const [showPropWidget, setShowPropWidget] = useState<boolean>(true);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      // Shift + B: Quick Buy
      if (e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        executeMarketOrder('BUY', 0.1, 100, undefined, undefined, 'Hotkey Execution');
      }
      // Shift + S: Quick Sell
      else if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        executeMarketOrder('SELL', 0.1, 100, undefined, undefined, 'Hotkey Execution');
      }
      // Shift + C: Panic Liquidation (Close All)
      else if (e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        closeAllPositions();
      }
      // Space: Replay Play/Pause
      else if (e.code === 'Space' && replayState.isActive) {
        e.preventDefault();
        togglePlayReplay();
      }
      // Arrow Right: Replay Step 1 Bar
      else if (e.code === 'ArrowRight' && replayState.isActive) {
        e.preventDefault();
        stepReplay();
      }
      // ?: Open Hotkeys Modal
      else if (e.key === '?') {
        e.preventDefault();
        setIsHotkeysOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeMarketOrder, closeAllPositions, replayState.isActive, togglePlayReplay, stepReplay]);

  return (
    <div className="space-y-4">
      {/* 1. Account Equity & Floating Risk Overview Bar */}
      <AccountOverviewBar />

      {/* 2. Strategy Pre-Deployment Risk Guard Drawer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setShowPropWidget(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Account Risk Mandate & Drawdown Rules</span>
            {showPropWidget ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Hotkeys Pill */}
          <button
            onClick={() => setIsHotkeysOpen(true)}
            className="neo-btn py-1 px-2.5 text-xs font-mono font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
            title="Keyboard shortcuts: Shift+B (Buy), Shift+S (Sell), Shift+C (Close All)"
          >
            <Keyboard className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
            <span>Hotkeys</span>
            <kbd className="px-1 py-0.2 text-[10px] bg-[var(--bg-sunken)] rounded border border-[var(--border-darker)]">
              ?
            </kbd>
          </button>
        </div>

        {showPropWidget && <PropChallengeWidget />}
      </div>

      {/* 3. Core Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Watchlist & Currency Strength Meter (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          {/* Sub-tab switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 neo-inset rounded-lg">
            <button
              onClick={() => setLeftTab('watch')}
              className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'watch'
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Watchlist</span>
            </button>
            <button
              onClick={() => setLeftTab('strength')}
              className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'strength'
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Strength / Heatmap</span>
            </button>
          </div>

          {leftTab === 'watch' ? <MarketWatch /> : <CurrencyStrengthMeter />}
        </div>

        {/* Center Column: Interactive Canvas Candlestick & Volume Chart (6 cols) */}
        <div className="lg:col-span-6">
          <ChartContainer />
        </div>

        {/* Right Column: Order Entry Station (3 cols) */}
        <div className="lg:col-span-3">
          <OrderPanel />
        </div>
      </div>

      {/* 4. Bottom Table: Open Positions, Pending Orders, Closed Trades History */}
      <PositionsAndOrders />

      {/* Hotkeys Dialog */}
      <HotkeysModal isOpen={isHotkeysOpen} onClose={() => setIsHotkeysOpen(false)} />
    </div>
  );
};
