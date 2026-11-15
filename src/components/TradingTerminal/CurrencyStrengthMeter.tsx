import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Gauge,
  Flame,
  Zap,
} from 'lucide-react';

export const CurrencyStrengthMeter: React.FC = () => {
  const {
    currencyStrengths,
    instruments,
    activeInstrument,
    setActiveInstrument,
  } = useTrading();

  // Find strongest and weakest for divergence setup suggestion
  const strongest = currencyStrengths[0];
  const weakest = currencyStrengths[currencyStrengths.length - 1];

  // Look for a tradable pair matching strongest vs weakest
  const recommendedPair = `${strongest?.currency}/${weakest?.currency}`;
  const reversePair = `${weakest?.currency}/${strongest?.currency}`;
  const matchInst = instruments.find(
    i => i.symbol === recommendedPair || i.symbol === reversePair
  );

  // Quick Heatmap candidates
  const heatmapSymbols = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'AUD/USD',
    'XAU/USD',
    'NVDA',
    'AAPL',
    'BTC/USD',
  ];

  const heatmapInstruments = heatmapSymbols
    .map(s => instruments.find(i => i.symbol === s))
    .filter(Boolean);

  return (
    <div className="neo-box p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg neo-inset flex items-center justify-center text-[var(--accent-brand)]">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Currency Strength Matrix
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Cross-pair relative momentum (0-100)
            </p>
          </div>
        </div>
      </div>

      {/* 6-Currency Strength Bars */}
      <div className="space-y-2">
        {currencyStrengths.map(item => {
          const isStrong = item.score >= 58;
          const isWeak = item.score <= 42;

          const barColor = isStrong
            ? 'bg-[var(--accent-long)]'
            : isWeak
            ? 'bg-[var(--accent-short)]'
            : 'bg-amber-500';

          return (
            <div key={item.currency} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <span>{item.currency}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded uppercase ${
                      isStrong
                        ? 'text-[var(--accent-long)] bg-emerald-500/10'
                        : isWeak
                        ? 'text-[var(--accent-short)] bg-rose-500/10'
                        : 'text-amber-500 bg-amber-500/10'
                    }`}
                  >
                    {item.trend}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {item.change24h >= 0 ? '+' : ''}
                    {item.change24h}%
                  </span>
                  <span className="font-bold text-[var(--text-primary)] w-7 text-right">
                    {item.score}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2 w-full neo-inset-sm rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Strategy Setup Divergence Pill */}
      {strongest && weakest && (
        <div className="p-2.5 neo-inset rounded-lg flex items-center justify-between gap-2 bg-[var(--accent-brand)]/5 border border-[var(--accent-brand)]/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-[var(--text-primary)] block">
                Momentum Divergence
              </span>
              <span className="text-[var(--text-muted)]">
                Strong {strongest.currency} vs Weak {weakest.currency} (Δ{strongest.score - weakest.score}%)
              </span>
            </div>
          </div>

          {matchInst && (
            <button
              onClick={() => setActiveInstrument(matchInst.symbol)}
              className="neo-btn py-1 px-2 text-[10px] font-mono font-bold text-[var(--accent-brand)] hover:opacity-90 shrink-0"
              title={`Switch chart to ${matchInst.symbol}`}
            >
              Trade {matchInst.symbol}
            </button>
          )}
        </div>
      )}

      {/* Multi-Asset Heatmap Mini-Grid */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> Multi-Asset Heatmap
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">Click to chart</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {heatmapInstruments.map(inst => {
            if (!inst) return null;
            const isPos = inst.change24h >= 0;
            const isSelected = inst.symbol === activeInstrument.symbol;

            return (
              <button
                key={inst.symbol}
                onClick={() => setActiveInstrument(inst.symbol)}
                className={`p-1.5 rounded-md text-left transition-all border ${
                  isSelected
                    ? 'border-[var(--accent-brand)] shadow-sm'
                    : 'border-transparent'
                } ${
                  isPos
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                }`}
                title={`${inst.name} (${inst.symbol})`}
              >
                <div className="text-[11px] font-bold truncate text-[var(--text-primary)]">
                  {inst.symbol}
                </div>
                <div className="text-[10px] font-mono font-semibold flex items-center justify-between">
                  <span>{inst.currentPrice}</span>
                  <span>{isPos ? '+' : ''}{inst.change24h}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
