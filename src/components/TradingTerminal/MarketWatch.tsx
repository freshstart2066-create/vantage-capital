import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { AssetCategory } from '../../types/trading';
import { Search, TrendingUp, TrendingDown, Radio } from 'lucide-react';

export const MarketWatch: React.FC = () => {
  const { instruments, activeInstrument, setActiveInstrument, liveFeedConnected } = useTrading();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | AssetCategory>('all');

  const categories: { id: 'all' | AssetCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'forex', label: 'Forex' },
    { id: 'stock', label: 'Equities' },
    { id: 'commodity', label: 'Commodities' },
    { id: 'crypto', label: 'Crypto' },
  ];

  const filteredInstruments = useMemo(() => {
    return instruments.filter(inst => {
      const matchesCategory = selectedCategory === 'all' || inst.category === selectedCategory;
      const matchesSearch =
        inst.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [instruments, selectedCategory, searchTerm]);

  return (
    <div className="neo-box p-3 flex flex-col h-full min-h-[520px]">
      {/* Header & Live Stream Status */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[var(--text-primary)]">Market Watch</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full neo-inset-sm font-mono text-[var(--text-muted)]">
            {instruments.length} Pairs
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]" title="Connected to Real-time Liquidity Network">
          <Radio className={`w-3.5 h-3.5 ${liveFeedConnected ? 'text-[var(--accent-long)] animate-pulse' : 'text-[var(--text-muted)]'}`} />
          <span>{liveFeedConnected ? 'LIVE FEED' : 'STREAM'}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search symbol (e.g. EUR/USD, NVDA)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="neo-input pl-8 py-1.5 text-xs"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[var(--accent-brand)] text-white shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Instrument List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
        {filteredInstruments.map(inst => {
          const isActive = inst.symbol === activeInstrument.symbol;
          const isUp = inst.change24h >= 0;

          return (
            <div
              key={inst.symbol}
              onClick={() => setActiveInstrument(inst.symbol)}
              className={`p-2.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between ${
                isActive
                  ? 'neo-inset border-l-4 border-l-[var(--accent-brand)] bg-[var(--bg-sunken)]'
                  : 'hover:bg-[var(--bg-sunken)]/60 border border-transparent'
              }`}
            >
              {/* Left Column: Symbol & Category */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[var(--text-primary)]">{inst.symbol}</span>
                  {inst.isRealtime && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-long)]"></span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[95px]">{inst.name}</span>
              </div>

              {/* Middle Column: Bid / Ask Spread */}
              <div className="text-right font-mono-numbers">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {inst.bid.toFixed(inst.digits)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Sprd: {inst.spread}
                </div>
              </div>

              {/* Right Column: 24h Change */}
              <div className="text-right font-mono-numbers min-w-[55px]">
                <div
                  className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                    isUp
                      ? 'text-[var(--accent-long)] bg-[var(--accent-long-bg)]'
                      : 'text-[var(--accent-short)] bg-[var(--accent-short-bg)]'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{inst.change24h}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInstruments.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            No instruments match "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};
