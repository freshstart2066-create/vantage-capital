import React from 'react';
import { Building2, Server, Shield, Cpu, Users, Landmark, Lock } from 'lucide-react';

export const CompanyAbout: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Hero Section */}
      <div className="neo-box p-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neo-inset-sm text-xs font-bold text-[var(--accent-brand)] mb-3">
          <Building2 className="w-4 h-4" />
          <span>Institutional Asset Management & Fiduciary Governance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-2xl mx-auto">
          Client Fund Management with Real Capital. Governed by Rigorous Forward-Testing.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto mt-3">
          Vantage Capital is an institutional asset management firm that manages client funds and executes real-money market operations with domestic Fedwire settlement. To protect client capital, all quantitative models and discretionary strategies must first be test-run and verified in our paper-trading simulation engine before receiving live allocation.
        </p>
      </div>

      {/* 3 Core Technology & Fiduciary Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-card p-6 flex flex-col items-start">
          <div className="w-10 h-10 rounded-xl neo-box flex items-center justify-center text-[var(--accent-brand)] mb-3">
            <Landmark className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Real Money Client Management
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            We are not a prop firm. We manage real client funds under strict fiduciary mandates, executing direct market orders with tier-1 liquidity and domestic Fedwire banking settlement.
          </p>
        </div>

        <div className="neo-card p-6 flex flex-col items-start">
          <div className="w-10 h-10 rounded-xl neo-box flex items-center justify-center text-[var(--accent-long)] mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Pre-Deployment Strategy Lab
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Before a strategy is authorized for live client funds, it undergoes forward-testing in our simulation sandbox to verify statistical expectancy, Win Rate %, and drawdown boundaries under live interbank spreads.
          </p>
        </div>

        <div className="neo-card p-6 flex flex-col items-start">
          <div className="w-10 h-10 rounded-xl neo-box flex items-center justify-center text-[var(--accent-brand)] mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Hard Fiduciary Risk Governance
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Every client portfolio tier enforces automatic daily risk ceilings (5%) and maximum drawdown safeguards (10%) to preserve capital integrity across all market regimes.
          </p>
        </div>
      </div>

      {/* Global Infrastructure Overview */}
      <div className="neo-box p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <Server className="w-4 h-4 text-[var(--accent-brand)]" />
          Institutional Execution & Simulation Infrastructure
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Our order execution and testing architecture operates directly adjacent to global tier-1 interbank and equity matching engines:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="neo-inset p-3 rounded-xl">
            <div className="text-xs font-bold text-[var(--text-primary)]">London LD4 (Equinix)</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">FX Majors & European Interbank Hub</div>
            <div className="text-xs font-mono font-semibold text-[var(--accent-long)] mt-1">~0.8ms Direct Ping</div>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <div className="text-xs font-bold text-[var(--text-primary)]">New York NY4 (Secaucus)</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">US Equities (AAPL, NVDA, SPY) & Fedwire Direct</div>
            <div className="text-xs font-mono font-semibold text-[var(--accent-long)] mt-1">~1.2ms Direct Ping</div>
          </div>

          <div className="neo-inset p-3 rounded-xl">
            <div className="text-xs font-bold text-[var(--text-primary)]">Tokyo TY3 (Otemachi)</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Asian Session Liquidity Anchor</div>
            <div className="text-xs font-mono font-semibold text-[var(--accent-long)] mt-1">~2.1ms Direct Ping</div>
          </div>
        </div>
      </div>

      {/* Fiduciary Strategy Deployment Protocol */}
      <div className="neo-box p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Fiduciary Strategy Incubation & Deployment Lifecycle
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Phase 1: Forward-Test in Paper Simulation</div>
              <div className="text-xs text-[var(--text-muted)]">
                Portfolio managers test-run setups in our live-tick simulation cockpit without risking client capital, validating execution mechanics, slippage impact, and rule tagging.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Phase 2: Quantitative Edge Audit (Strategy Lab)</div>
              <div className="text-xs text-[var(--text-muted)]">
                The strategy must achieve a minimum statistical expectancy, Profit Factor &gt; 1.5, and pass maximum daily drawdown stress checks.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Phase 3: Live Client Capital Allocation</div>
              <div className="text-xs text-[var(--text-muted)]">
                Upon meeting deployment criteria, strategies receive live capital allocation across client mandates with real-money Fedwire settlement.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership & Portfolio Management */}
      <div className="neo-box p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--accent-brand)]" />
          Executive Leadership & Portfolio Management
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Guided by veteran quantitative portfolio managers, institutional risk directors, and algorithmic execution engineers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="neo-inset p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neo-box flex items-center justify-center font-bold text-xs text-[var(--accent-brand)]">
              AV
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Alexander Vance, CFA</div>
              <div className="text-[11px] text-[var(--text-muted)]">Managing Director & Head of Portfolio Risk</div>
            </div>
          </div>

          <div className="neo-inset p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neo-box flex items-center justify-center font-bold text-xs text-[var(--accent-long)]">
              ER
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Elena Rostova, Ph.D.</div>
              <div className="text-[11px] text-[var(--text-muted)]">Chief Quantitative Strategist & Execution Research</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
