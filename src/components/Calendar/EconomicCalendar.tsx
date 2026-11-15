import React, { useState } from 'react';
import { MOCK_ECONOMIC_EVENTS } from '../../data/mockEconomicCalendar';
import { Calendar, AlertCircle, Clock, Globe, ArrowRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const EconomicCalendar: React.FC = () => {
  const { setActiveTab, setActiveInstrument } = useTrading();
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  const currencies = ['ALL', 'USD', 'EUR', 'GBP', 'JPY'];

  const filteredEvents = MOCK_ECONOMIC_EVENTS.filter(evt => {
    const matchesImpact = impactFilter === 'ALL' || evt.impact === 'HIGH';
    const matchesCurrency = currencyFilter === 'ALL' || evt.currency === currencyFilter;
    return matchesImpact && matchesCurrency;
  });

  const handleQuickTrade = (currency: string) => {
    if (currency === 'EUR') setActiveInstrument('EUR/USD');
    else if (currency === 'GBP') setActiveInstrument('GBP/USD');
    else if (currency === 'JPY') setActiveInstrument('USD/JPY');
    else setActiveInstrument('EUR/USD');
    setActiveTab('terminal');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div className="neo-box p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-brand)] uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Macroeconomic Event Feed</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
            Global Economic & Earnings Calendar
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl">
            Track tier-1 high-impact news releases, central bank rate decisions, and mega-cap equity earnings. Essential for backtesting volatility methods and testing news breakout strategies.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Impact Toggle */}
          <div className="flex neo-inset-sm p-1 rounded-lg">
            <button
              onClick={() => setImpactFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                impactFilter === 'ALL'
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setImpactFilter('HIGH')}
              className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1 ${
                impactFilter === 'HIGH'
                  ? 'bg-[var(--accent-short)] text-white shadow-sm'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>High Impact Only</span>
            </button>
          </div>

          {/* Currency Filter */}
          <div className="flex neo-inset-sm p-1 rounded-lg">
            {currencies.map(c => (
              <button
                key={c}
                onClick={() => setCurrencyFilter(c)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded ${
                  currencyFilter === c
                    ? 'bg-[var(--accent-brand)] text-white font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List Table */}
      <div className="neo-box p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                <th className="py-2.5 px-3 font-medium">Time (UTC)</th>
                <th className="py-2.5 px-3 font-medium">Cur</th>
                <th className="py-2.5 px-3 font-medium">Impact</th>
                <th className="py-2.5 px-3 font-medium">Economic Event / Release</th>
                <th className="py-2.5 px-3 font-medium">Actual</th>
                <th className="py-2.5 px-3 font-medium">Forecast</th>
                <th className="py-2.5 px-3 font-medium">Previous</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
              {filteredEvents.map(evt => {
                const isHigh = evt.impact === 'HIGH';
                return (
                  <tr key={evt.id} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                    <td className="py-3 px-3 text-[var(--text-secondary)] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        {evt.time}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)] font-mono">
                      {evt.currency}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          isHigh
                            ? 'bg-[var(--accent-short-bg)] text-[var(--accent-short)] border border-[var(--accent-short)]/30'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {isHigh ? 'HIGH' : 'MED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--text-primary)]">
                      {evt.title}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--accent-long)]">
                      {evt.actual || '-'}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {evt.forecast}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">
                      {evt.previous}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleQuickTrade(evt.currency)}
                        className="neo-btn py-1 px-2.5 text-xs font-sans inline-flex items-center gap-1 text-[var(--accent-brand)]"
                      >
                        <span>Trade Pair</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategy Guidance Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="neo-box p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[var(--accent-brand)]" />
            Testing News Volatility Strategies
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Vantage Capital allows you to test both <strong>straddle pending breakout orders</strong> (Buy Stop above range, Sell Stop below range before high-impact CPI/NFP) and <strong>post-release pullback fades</strong> with full execution liquidity.
          </p>
        </div>

        <div className="neo-box p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-[var(--accent-short)]" />
            Spread Expansion Modeling
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            During tier-1 releases (such as FOMC rate cuts), our simulation engine replicates interbank liquidity thinning, allowing you to observe how wide spreads impact your Stop Loss placements.
          </p>
        </div>
      </div>
    </div>
  );
};
