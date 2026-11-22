import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  ShieldCheck,
  AlertTriangle,
  Target,
  TrendingDown,
} from 'lucide-react';

export const PropChallengeWidget: React.FC = () => {
  const {
    propEvaluation,
    account,
  } = useTrading();

  const tier = propEvaluation.tier;
  const profitTargetAmount = (tier * propEvaluation.profitTargetPercent) / 100;
  const maxDailyLossAmount = (tier * propEvaluation.maxDailyLossPercent) / 100;
  const maxTotalDrawdownAmount = (tier * propEvaluation.maxTotalDrawdownPercent) / 100;

  const currentProfit = account.equity - tier;
  const profitProgressPercent = Math.max(
    0,
    Math.min(100, Math.round((currentProfit / profitTargetAmount) * 100))
  );

  const currentDrawdown = propEvaluation.currentDrawdown;
  const drawdownUsedPercent = Math.min(
    100,
    Math.round((currentDrawdown / maxTotalDrawdownAmount) * 100)
  );

  return (
    <div className="neo-box p-4 flex flex-col gap-3.5 transition-all">
      {/* Top Bar: Title & Mandate Limit */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-[var(--accent-long)]/30 bg-[var(--accent-long-bg)] flex items-center justify-center text-[var(--accent-long)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Risk Mandate & Drawdown Rules
              </h3>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                  propEvaluation.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : propEvaluation.status === 'IN_PROGRESS'
                    ? 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                }`}
              >
                {propEvaluation.status === 'PASSED'
                  ? 'Mandate Satisfied'
                  : propEvaluation.status === 'IN_PROGRESS'
                  ? 'Active Monitoring'
                  : 'Threshold Breached'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Institutional drawdown controls and daily loss limit parameters
            </p>
          </div>
        </div>

        {/* Read-Only Mandate Display (Allocations strictly managed by Admin) */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 text-[11px] font-mono font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] text-[var(--text-secondary)]">
            Mandate Scale:{' '}
            <span className="font-bold text-[var(--text-primary)]">
              ${(tier > 0 ? tier : account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      {/* 3 Core Risk Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Return Objective */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Return Target (10%)
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              ${Math.max(0, currentProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${profitTargetAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${profitProgressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>Progress</span>
            <span className="font-bold text-[var(--text-primary)]">{profitProgressPercent}%</span>
          </div>
        </div>

        {/* Metric 2: Daily Loss Limit */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Daily Loss Limit (5%)
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              ${propEvaluation.currentDayLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${maxDailyLossAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                propEvaluation.currentDayLoss / maxDailyLossAmount > 0.8
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, Math.round((propEvaluation.currentDayLoss / maxDailyLossAmount) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>Remaining Buffer</span>
            <span className="font-bold text-[var(--text-primary)]">
              ${Math.max(0, maxDailyLossAmount - propEvaluation.currentDayLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Metric 3: Max Drawdown Ceiling */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              Max Drawdown (10%)
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              ${currentDrawdown.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${maxTotalDrawdownAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                drawdownUsedPercent > 70 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${drawdownUsedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>Buffer to Stop</span>
            <span className="font-bold text-[var(--text-primary)]">
              ${Math.max(0, maxTotalDrawdownAmount - currentDrawdown).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
