import React from 'react';
import { useTrading } from '../context/TradingContext';
import { VantageLogo } from './VantageLogo';
import { ShieldCheck, Globe, FileText, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab } = useTrading();

  return (
    <footer className="mt-12 border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]/40 py-10 px-4 text-xs">
      <div className="max-w-[1720px] mx-auto space-y-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <VantageLogo size={28} showText={true} />
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Institutional-grade trading platform engineered for quantitative strategy testing, risk model verification, and high-performance capital allocation.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              <Lock className="w-3 h-3 text-[var(--accent-long)]" />
              <span>Client-Side Local Sandbox Security</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Trading Platform
            </h4>
            <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
              <li>
                <button onClick={() => setActiveTab('terminal')} className="hover:text-[var(--text-primary)]">
                  Live Trading Terminal
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('strategy_lab')} className="hover:text-[var(--text-primary)]">
                  Strategy Validation Lab
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('markets')} className="hover:text-[var(--text-primary)]">
                  Contract Specifications
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('settings')} className="hover:text-[var(--text-primary)]">
                  Simulation Physics & Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Specifications */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Institutional Tech
            </h4>
            <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
              <li className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[var(--accent-brand)]" />
                <span>LD4 & NY4 Simulated Cross-Connects</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[var(--accent-long)]" />
                <span>Deterministic Order Execution Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-[var(--text-muted)]" />
                <span>Full Trade Journal CSV Export</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Statutory Risk Warning */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--accent-brand)]">
              Capital & Risk Notice
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Trading across global financial markets involves substantial risk of loss. Strategy validation, risk parameters, and disciplined money management are required before executing live trades.
            </p>
            <button
              onClick={() => setActiveTab('compliance')}
              className="text-[11px] font-semibold text-[var(--accent-brand)] hover:underline inline-flex items-center gap-1"
            >
              <span>View Regulatory & CFTC 4.41 Disclosures</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[var(--text-muted)]">
          <div>
            &copy; {new Date().getFullYear()} Vantage Capital Financial Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('compliance')} className="hover:underline">
              Risk Disclosure
            </button>
            <span>&bull;</span>
            <button onClick={() => setActiveTab('company')} className="hover:underline">
              Architecture & About
            </button>
            <span>&bull;</span>
            <button onClick={() => setActiveTab('settings')} className="hover:underline">
              Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
