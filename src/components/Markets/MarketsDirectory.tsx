import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { AssetCategory } from '../../types/trading';
import { Globe, ArrowUpRight, ShieldCheck, Vote, Flame } from 'lucide-react';

export const MarketsDirectory: React.FC = () => {
  const { instruments, setActiveInstrument, setActiveTab } = useTrading();
  const [filter, setFilter] = useState<'all' | AssetCategory>('all');

  const filtered = instruments.filter(
    inst => filter === 'all' || inst.category === filter
  );

  const predictionMarkets = instruments.filter(inst => inst.category === 'prediction');

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
            Tradable Instruments & Prediction Markets
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl">
            Access global FX majors, blue-chip equities, benchmark commodities, and live decentralized Polymarket prediction contracts covering US politics, Federal Reserve policy, and macroeconomic milestones.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 neo-inset-sm p-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'prediction', label: 'Polymarket' },
            { id: 'forex', label: 'Forex' },
            { id: 'stock', label: 'Equities' },
            { id: 'commodity', label: 'Commodities' },
            { id: 'crypto', label: 'Crypto' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as 'all' | AssetCategory)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all whitespace-nowrap ${
                filter === cat.id
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Polymarket Trending Prediction Bets Showcase */}
      {(filter === 'all' || filter === 'prediction') && predictionMarkets.length > 0 && (
        <div className="neo-box p-5 border-l-4 border-l-purple-500">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Vote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  Trending Polymarket Political & Macro Contracts
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Live Odds
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Decentralized event contracts trade between $0.01 and $0.99 (reflecting 1% to 99% implied consensus). Settle at $1.00 upon outcome.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-purple-300/80">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>High Volume Orderflow</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {predictionMarkets.map(item => {
              const yesPct = Math.round(item.currentPrice * 100);
              const noPct = 100 - yesPct;
              const isPositive = item.change24h >= 0;

              return (
                <div
                  key={item.symbol}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/60 p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] mb-1.5">
                      <span className="font-bold text-purple-400">{item.symbol}</span>
                      <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{item.change24h}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 min-h-[32px] leading-snug">
                      {item.name.replace(' (Polymarket)', '')}
                    </h4>

                    {/* Probability Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-400">Yes {yesPct}%</span>
                        <span className="text-rose-400">No {noPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${yesPct}%` }}
                        />
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${noPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/70 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Share Price</div>
                      <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        ${item.currentPrice.toFixed(2)} USD
                      </div>
                    </div>

                    <button
                      onClick={() => handleTrade(item.symbol)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-sm shadow-purple-600/20"
                    >
                      <span>Trade</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                        <span className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                          {inst.symbol}
                          {inst.category === 'prediction' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                              POLY
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">{inst.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        inst.category === 'prediction'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-[var(--bg-sunken)] text-[var(--text-muted)] border-[var(--border-darker)]'
                      }`}>
                        {inst.category === 'prediction' ? 'Prediction' : inst.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {inst.lotSize.toLocaleString()} {inst.category === 'forex' ? 'units' : inst.category === 'stock' ? 'shares' : 'contracts'}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {inst.spread} {inst.category === 'prediction' ? 'cents' : 'pips'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--accent-brand)]">
                      {inst.category === 'forex' ? 'Up to 1:500' : inst.category === 'stock' ? 'Up to 1:5' : inst.category === 'prediction' ? '1:1 Cash' : 'Up to 1:100'}
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
                        className={`neo-btn py-1 px-3 text-xs font-sans font-bold inline-flex items-center gap-1 ${
                          inst.category === 'prediction' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'neo-btn-primary'
                        }`}
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
          <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-purple-400 mb-2">
            <Vote className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Polymarket Event Liquidity</h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Real-time political outcome odds, Federal Reserve monetary policy, and macro milestones priced with continuous consensus odds.
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
            Cross-margin equities, prediction event contracts, commodities, and FX simultaneously from a single unified capital ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
