import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Users,
  Building2,
  ShieldCheck,
  ChevronRight,
  Award,
  ArrowUpRight,
  Landmark,
} from 'lucide-react';
import type { ManagedClient } from '../../types/trading';

export const ClientPortfolios: React.FC = () => {
  const { managedClients, setActiveTab, setActiveInstrument } = useTrading();

  const [mandateFilter, setMandateFilter] = useState<'ALL' | 'SOVEREIGN' | 'INSTITUTIONAL_PRIME' | 'ACCREDITED' | 'PRIVATE_WEALTH'>('ALL');

  // Computed AUM Metrics
  const totalAUM = managedClients.reduce((sum, c) => sum + c.allocatedCapital, 0);
  const totalCurrentEquity = managedClients.reduce((sum, c) => sum + c.currentEquity, 0);
  const totalUnrealizedPnL = totalCurrentEquity - totalAUM;
  const blendedReturnPct = totalAUM > 0 ? (totalUnrealizedPnL / totalAUM) * 100 : 0;
  const annualManagementFee = totalAUM * 0.02; // 2% per annum
  const totalIncentiveFeeAccrued = managedClients.reduce((sum, c) => {
    if (c.currentEquity > c.highWaterMark) {
      return sum + (c.currentEquity - c.highWaterMark) * (c.incentiveFeePct / 100);
    }
    return sum;
  }, 0);

  const filteredClients = managedClients.filter(c => {
    if (mandateFilter === 'ALL') return true;
    return c.mandateType === mandateFilter;
  });

  const getMandateBadge = (mandate: ManagedClient['mandateType']) => {
    switch (mandate) {
      case 'SOVEREIGN':
        return {
          label: 'Sovereign Mandate',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'INSTITUTIONAL_PRIME':
        return {
          label: 'Institutional Prime',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'ACCREDITED':
        return {
          label: 'Accredited Portfolio',
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 'PRIVATE_WEALTH':
        return {
          label: 'Private Wealth',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          label: mandate,
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="neo-box p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neo-inset-sm text-xs font-bold text-[var(--accent-brand)] mb-2">
              <Building2 className="w-4 h-4" />
              <span>Institutional Client Funds & Mandates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Managed Client Portfolios & AUM Ledger
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
              Vantage Capital manages discretionary and quantitative client capital with real money. All strategies must satisfy the Strategy Pre-Deployment Risk Guard before live capital deployment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('terminal')}
              className="neo-btn neo-btn-primary py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
            >
              <span>Test Strategies in Terminal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Key Institutional AUM Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Total Assets (AUM)
            </span>
            <div className="text-lg font-mono font-black text-[var(--text-primary)]">
              ${totalAUM.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              4 Active Mandates
            </span>
          </div>

          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Current Portfolio Equity
            </span>
            <div className="text-lg font-mono font-black text-[var(--text-primary)]">
              ${totalCurrentEquity.toLocaleString()}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Live Interbank NAV
            </span>
          </div>

          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Net Client Alpha
            </span>
            <div className={`text-lg font-mono font-black ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString()}
            </div>
            <span className={`text-[10px] font-bold ${blendedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {blendedReturnPct >= 0 ? '+' : ''}{blendedReturnPct.toFixed(2)}% Blended
            </span>
          </div>

          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Annual Management Fee
            </span>
            <div className="text-lg font-mono font-black text-sky-400">
              ${annualManagementFee.toLocaleString()}/yr
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              2.0% Fixed Run-Rate
            </span>
          </div>

          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Accrued Incentive Fee
            </span>
            <div className="text-lg font-mono font-black text-amber-400">
              ${totalIncentiveFeeAccrued.toLocaleString()}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              20% Above High-Water Mark
            </span>
          </div>

          <div className="p-3.5 rounded-2xl neo-inset space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Settlement Protocol
            </span>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] pt-1">
              Fedwire Direct
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              Same-Day Clearing
            </span>
          </div>
        </div>
      </div>

      {/* 3. Strategy Pre-Deployment Deployment Notice */}
      <div className="neo-card p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl neo-box flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Fiduciary Strategy Pre-Deployment Gate
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Before real client funds are deployed to any strategy, the strategy must pass the forward-testing simulation gate in our Strategy Lab (+10% profit hurdle, 5% max daily risk, 10% max drawdown).
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('terminal')}
          className="neo-btn py-2 px-4 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center gap-2 whitespace-nowrap"
        >
          <span>Open Risk Guard</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Client Mandate Table & Filters */}
      <div className="neo-box p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Active Client Mandates Roster</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Real-money client accounts segregated with tier-1 US banking institutions
            </p>
          </div>

          {/* Mandate Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 neo-inset-sm p-1 rounded-xl">
            {(['ALL', 'SOVEREIGN', 'INSTITUTIONAL_PRIME', 'ACCREDITED', 'PRIVATE_WEALTH'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMandateFilter(m)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  mandateFilter === m
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {m === 'ALL' ? 'All Mandates' : m === 'INSTITUTIONAL_PRIME' ? 'Prime' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map(client => {
            const badge = getMandateBadge(client.mandateType);
            const pnl = client.currentEquity - client.allocatedCapital;
            const pnlPct = (pnl / client.allocatedCapital) * 100;
            const isPending = client.status === 'PENDING_DEPLOYMENT';

            return (
              <div
                key={client.id}
                className="neo-inset p-5 rounded-2xl space-y-4 hover:border-[var(--accent-brand)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        {client.name}
                      </h3>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {client.accountId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          client.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {client.status === 'ACTIVE' ? 'DEPLOYED' : 'AWAITING FORWARD-TEST'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Equity NAV</span>
                    <span className="text-base font-mono font-black text-[var(--text-primary)]">
                      ${client.currentEquity.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]/60 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Allocated Capital</span>
                    <span className="font-mono font-bold text-[var(--text-secondary)]">
                      ${client.allocatedCapital.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Net Return</span>
                    <span className={`font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">High-Water Mark</span>
                    <span className="font-mono font-bold text-sky-400">
                      ${client.highWaterMark.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Assigned Strategy & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/60">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Award className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                    <span>Strategy: <strong className="text-[var(--text-primary)]">{client.strategyName}</strong></span>
                  </div>

                  {isPending ? (
                    <button
                      onClick={() => setActiveTab('terminal')}
                      className="neo-btn neo-btn-primary py-1 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <span>Forward-Test Setup</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveInstrument('EUR/USD');
                        setActiveTab('terminal');
                      }}
                      className="neo-btn py-1 px-2.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
                    >
                      View Live Trades
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Institutional Fee Schedule & Fiduciary Terms */}
      <div className="neo-box p-6 rounded-3xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-400" />
          <span>Fiduciary Governance & Fee Schedule</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--text-muted)]">
          <div className="p-4 rounded-2xl neo-inset space-y-1">
            <strong className="text-[var(--text-primary)] block">2.0% Annual Management Fee</strong>
            <span>Calculated daily on settled client capital, billed quarterly in arrears. No hidden commissions or spreads markup.</span>
          </div>

          <div className="p-4 rounded-2xl neo-inset space-y-1">
            <strong className="text-[var(--text-primary)] block">20% Incentive Performance Fee</strong>
            <span>Subject to strict High-Water Mark (HWM). Incentive fees are only assessed when client net asset value exceeds historical peaks.</span>
          </div>

          <div className="p-4 rounded-2xl neo-inset space-y-1">
            <strong className="text-[var(--text-primary)] block">Domestic Fedwire Settlement</strong>
            <span>Direct commercial banking clearing under Federal Reserve Fedwire Direct. Same-day settlement for all capital disbursements.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
