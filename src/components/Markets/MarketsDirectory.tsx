import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { AssetCategory } from '../../types/trading';
import { Globe, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

export const MarketsDirectory: React.FC = () => {
  const { instruments, setActiveInstrument, setActiveTab } = useTrading();
  const [filter, setFilter] = useState<'all' | AssetCategory>('all');

  const filtered = instruments.filter(
    inst => filter === 'all' || inst.category === filter
  );

  const handleTrade = (symbol: string) => {
    setActiveInstrument(symbol);
    setActiveTab('terminal');
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="neo-box p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-brand)] flex items-center gap-1.5 mb-1">
            <Globe className="w-4 h-4" />
            Institutional Product Directory
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
            Tradable Instruments & Contract Specifications
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl">
            Access global FX majors, blue-chip equities, benchmark commodities, and digital assets. Transparent contract terms, institutional tier spreads, and zero real capital exposure.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 neo-inset-sm p-1">
          {(['all', 'forex', 'stock', 'commodity', 'crypto'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                filter === cat
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Specs Table */}
      <div className="neo-box p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-brand)]" />
          Contract Specifications & Margin Tiers
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                <th className="py-2.5 px-3 font-medium">Instrument</th>
                <th className="py-2.5 px-3 font-medium">Asset Class</th>
                <th className="py-2.5 px-3 font-medium">Contract Size</th>
                <th className="py-2.5 px-3 font-medium">Min Spread</th>
                <th className="py-2.5 px-3 font-medium">Default Leverage</th>
                <th className="py-2.5 px-3 font-medium">Current Bid</th>
                <th className="py-2.5 px-3 font-medium">Current Ask</th>
                <th className="py-2.5 px-3 font-medium">24h Change</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
              {filtered.map(inst => {
                const isUp = inst.change24h >= 0;
                return (
                  <tr key={inst.symbol} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex flex-col font-sans">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{inst.symbol}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{inst.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--bg-sunken)] text-[var(--text-muted)] border border-[var(--border-darker)]">
                        {inst.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {inst.lotSize.toLocaleString()} {inst.category === 'forex' ? 'units' : inst.category === 'stock' ? 'shares' : 'contracts'}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {inst.spread} pips
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--accent-brand)]">
                      {inst.category === 'forex' ? 'Up to 1:500' : inst.category === 'stock' ? 'Up to 1:5' : 'Up to 1:100'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                      {inst.bid.toFixed(inst.digits)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                      {inst.ask.toFixed(inst.digits)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          isUp ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
                        }`}
                      >
                        {isUp ? '+' : ''}{inst.change24h}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleTrade(inst.symbol)}
                        className="neo-btn neo-btn-primary py-1 px-3 text-xs font-sans font-bold inline-flex items-center gap-1"
                      >
                        <span>Trade</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Execution Infrastructure cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-box p-4">
          <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[var(--accent-brand)] mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Ultra-Low Latency Ticks</h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Deterministic sub-15ms pricing loop matching interbank conditions with zero requotes on market orders.
          </p>
        </div>

        <div className="neo-box p-4">
          <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[var(--accent-long)] mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Tier-1 Spread Aggregation</h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Simulated dark-pool liquidity feeds replicating tight institutional ECN spreads across market sessions.
          </p>
        </div>

        <div className="neo-box p-4">
          <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[var(--accent-brand)] mb-2">
            <Globe className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Multi-Asset Synergy</h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Cross-margin equities, commodities, and currency pairs simultaneously from a single unified capital deposit.
          </p>
        </div>
      </div>
    </div>
  );
};
