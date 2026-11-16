import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { VantageLogo } from '../VantageLogo';
import {
  Award,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Activity,
  Layers,
  Database,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

export const CompanyHome: React.FC = () => {
  const { setActiveTab, setActiveInstrument } = useTrading();

  const tiers = [
    {
      name: 'Private Wealth Mandate',
      capital: '$10,000',
      target: '+10% ($1,000)',
      dailyLoss: '5% ($500)',
      maxDd: '10% ($1,000)',
      lev: '1:100 ECN',
      description: 'Discretionary equity and currency portfolio for private clients with automated risk stops.',
      recommended: false,
    },
    {
      name: 'Accredited Growth Portfolio',
      capital: '$50,000',
      target: '+10% ($5,000)',
      dailyLoss: '5% ($2,500)',
      maxDd: '10% ($5,000)',
      lev: '1:100 ECN',
      description: 'Active alpha strategy combining trend-following with intraday liquidity sweep execution.',
      recommended: true,
    },
    {
      name: 'Institutional Prime Allocation',
      capital: '$100,000',
      target: '+10% ($10,000)',
      dailyLoss: '5% ($5,000)',
      maxDd: '10% ($10,000)',
      lev: '1:200 ECN',
      description: 'Multi-asset quantitative fund allocation with co-located low-latency execution.',
      recommended: false,
    },
    {
      name: 'Managed Strategy Account',
      capital: '$250,000',
      target: '+10% ($25,000)',
      dailyLoss: '5% ($12,500)',
      maxDd: '10% ($25,000)',
      lev: '1:200 ECN',
      description: 'High-capacity institutional liquidity mandate engineered for sustained mathematical expectancy.',
      recommended: false,
    },
  ];

  const faqs = [
    {
      q: 'Is Vantage Capital a prop trading firm?',
      a: 'No. Vantage Capital is an institutional asset management and investment firm. We do not sell prop challenges, evaluations, or test subscriptions. We manage client funds and enable direct execution with real money. Our integrated simulation engine serves as our internal forward-testing sandbox where strategies are rigorously test-run before receiving live capital allocation.',
    },
    {
      q: 'Why do you include a simulation terminal on this site?',
      a: 'To uphold fiduciary risk management, our portfolio managers and quantitative researchers never deploy unverified models directly on client funds. Every strategy is first forward-tested with paper money in our live-market simulation engine to verify Win Rate %, Profit Factor, and drawdown resistance under real tick conditions.',
    },
    {
      q: 'How does the firm manage and safeguard client funds?',
      a: 'Client capital is managed under strict institutional fiduciary mandates. Every live strategy operates with hard daily loss stops and maximum drawdown boundaries.',
    },
    {
      q: 'How do deposits and withdrawals work for clients?',
      a: 'To deposit, open Deposit, copy your personal account details, and send a bank transfer. The status moves from Pending to Processing to Completed, and your balance updates when it completes. Withdrawals follow the same steps.',
    },
    {
      q: 'Where do your market prices and execution liquidity originate?',
      a: 'Our terminal streams live interbank exchange rates for FX majors and real-time feeds for US equities, Gold, and Crypto, backed by micro-tick order book depth modeling anchored at Equinix NY4, LD4, and TY3 data centers.',
    },
    {
      q: 'Can portfolio managers export trading audit logs?',
      a: 'Yes. With one click on the "Export CSV" button, complete trade logs—including timestamps, entry/exit ticks, SL, TP, net P&L, pips, and setup tags—are exported for institutional compliance and quantitative backtesting in Python or R.',
    },
  ];

  return (
    <div className="space-y-16 max-w-6xl mx-auto py-6">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full neo-inset-sm text-xs font-bold text-[var(--accent-brand)] shadow-sm">
          <VantageLogo size={20} />
          <span>Institutional Asset Management & Strategy Lab</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)] max-w-4xl mx-auto leading-tight">
          Client Fund Management with <span className="text-[var(--accent-brand)]">Real Capital</span>. Verified by Strategy Forward-Testing.
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-3xl mx-auto leading-relaxed">
          Vantage Capital manages client funds and executes institutional market mandates with real money. Before deploying live client capital, all quantitative and discretionary strategies must pass rigorous paper-trading forward tests in our high-precision strategy lab.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveTab('terminal')}
            className="neo-btn neo-btn-primary py-3 px-8 text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 group"
          >
            <span>Launch Strategy Testing Terminal</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setActiveTab('strategy_lab')}
            className="neo-btn py-3 px-6 text-sm font-bold rounded-xl flex items-center gap-2 text-[var(--text-primary)]"
          >
            <Award className="w-4 h-4 text-[var(--accent-brand)]" />
            <span>Review Strategy Lab Edge</span>
          </button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-semibold text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[var(--accent-long)]" />
            Real Money Client Management
          </span>
          <span className="flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-emerald-400" />
            Fast account funding
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Pre-Deployment Forward Testing
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[var(--accent-long)]" />
            Fiduciary Risk Governance
          </span>
        </div>
      </section>

      {/* 2. Interactive Terminal Live Showcase Card */}
      <section className="neo-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between pb-6 border-b border-[var(--border-subtle)] gap-4">
          <div>
            <div className="text-xs font-bold text-[var(--accent-brand)] uppercase tracking-wider mb-1">
              Internal Strategy Incubation & Testing Sandbox
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)]">
              Institutional Trading Cockpit & Risk Guard
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveInstrument('EUR/USD');
                setActiveTab('terminal');
              }}
              className="neo-btn py-1.5 px-3 text-xs font-mono font-bold"
            >
              Test EUR/USD
            </button>
            <button
              onClick={() => {
                setActiveInstrument('NVDA');
                setActiveTab('terminal');
              }}
              className="neo-btn py-1.5 px-3 text-xs font-mono font-bold"
            >
              Test NVDA
            </button>
            <button
              onClick={() => {
                setActiveInstrument('XAU/USD');
                setActiveTab('terminal');
              }}
              className="neo-btn py-1.5 px-3 text-xs font-mono font-bold"
            >
              Test Gold
            </button>
          </div>
        </div>

        {/* 3 Column Feature Teaser */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="neo-inset p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl neo-box flex items-center justify-center text-[var(--accent-brand)]">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Real Interbank Liquidity Feeds</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Multi-timeframe charting with live interbank exchange rates, real-world spreads, dynamic slippage modeling, and visual order lines.
            </p>
          </div>

          <div className="neo-inset p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl neo-box flex items-center justify-center text-[var(--accent-long)]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Fiduciary Risk Controls</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Pre-deployment risk guard monitors strategy max daily loss (5%) and portfolio drawdown ceilings (10%) to protect client capital.
            </p>
          </div>

          <div className="neo-inset p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl neo-box flex items-center justify-center text-[var(--accent-brand)]">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Strategy Alpha Validation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Tag every trade setup rule to isolate positive mathematical expectancy, Win Rate %, and Profit Factor before live client deployment.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Managed Client Fund & Strategy Allocation Tiers */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[var(--accent-brand)] uppercase tracking-wider">
            Portfolio Allocation Mandates
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Client Capital Management & Strategy Tiers
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
            Our firm manages client funds across four primary portfolio tiers. Each mandate is governed by strict drawdown parameters and forward-tested strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`neo-box p-6 rounded-2xl flex flex-col justify-between relative ${
                tier.recommended ? 'border-2 border-[var(--accent-brand)] shadow-xl' : ''
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--accent-brand)] text-white text-[10px] font-bold uppercase tracking-wider">
                  Core Allocation
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {tier.name}
                </h3>
                <div className="text-3xl font-black font-mono text-[var(--text-primary)]">
                  {tier.capital}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed min-h-[44px]">
                  {tier.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Target Hurdle:</span>
                    <span className="font-bold text-[var(--accent-long)]">{tier.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Max Daily Risk:</span>
                    <span className="font-bold text-[var(--accent-short)]">{tier.dailyLoss}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Max Drawdown:</span>
                    <span className="font-bold text-[var(--text-primary)]">{tier.maxDd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Execution:</span>
                    <span className="font-bold text-[var(--accent-brand)]">{tier.lev}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('terminal')}
                className={`mt-6 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  tier.recommended
                    ? 'neo-btn neo-btn-primary w-full'
                    : 'neo-btn w-full hover:bg-[var(--bg-sunken)]'
                }`}
              >
                Forward-Test This Tier
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) */}
      <section className="neo-box p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--accent-brand)]" />
            Institutional Architecture & Governance FAQ
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Clear insights into our client asset management model, real-money execution, and strategy forward-testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {faqs.map(faq => (
            <div key={faq.q} className="neo-inset p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-start gap-2">
                <span className="text-[var(--accent-brand)] font-extrabold">&bull;</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-3.5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Final CTA Banner */}
      <section className="neo-card p-10 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
          Forward-Test Strategies Before Live Allocation
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg mx-auto">
          Experience our institutional simulation cockpit. Verify your strategy rules under real market spread physics before deploying client funds.
        </p>
        <div>
          <button
            onClick={() => setActiveTab('terminal')}
            className="neo-btn neo-btn-primary py-3 px-8 text-sm font-bold rounded-xl shadow-xl inline-flex items-center gap-2"
          >
            <span>Launch Strategy Testing Terminal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
