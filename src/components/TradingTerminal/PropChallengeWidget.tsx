import React, { useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Target,
  TrendingDown,
  Lock,
} from 'lucide-react';

export const PropChallengeWidget: React.FC = () => {
  const {
    propEvaluation,
    setPropTier,
    resetPropEvaluation,
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

  // Trigger celebration when strategy meets deployment criteria
  useEffect(() => {
    if (propEvaluation.status === 'PASSED') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [propEvaluation.status]);

  const tiers = [10000, 25000, 50000, 100000, 250000];

  return (
    <div className="neo-box p-4 flex flex-col gap-3">
      {/* Top Bar: Title & Strategy Portfolio Allocation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg neo-inset flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Strategy Pre-Deployment Risk Guard
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  propEvaluation.status === 'PASSED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : propEvaluation.status === 'IN_PROGRESS'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {propEvaluation.status === 'PASSED'
                  ? 'Approved for Live Client Funds'
                  : propEvaluation.status === 'IN_PROGRESS'
                  ? 'Forward-Testing in Progress'
                  : 'Risk Threshold Breached'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Fiduciary risk & deployment criteria before allocating live client funds
            </p>
          </div>
        </div>

        {/* Portfolio Size Selector & Reset */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center neo-inset-sm p-0.5 rounded-md">
            {tiers.map(t => (
              <button
                key={t}
                onClick={() => setPropTier(t)}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-all ${
                  tier === t
                    ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={`Test strategy against $${t.toLocaleString()} client portfolio allocation`}
              >
                ${t >= 1000 ? `${t / 1000}k` : t}
              </button>
            ))}
          </div>

          <button
            onClick={resetPropEvaluation}
            className="neo-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Reset Strategy Forward-Testing Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Core Fiduciary Risk Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Profit Target Hurdle (10%) */}
        <div className="p-3 neo-inset rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" /> Performance Hurdle (+10%)
            </span>
            <span className="font-mono text-xs font-bold text-[var(--accent-long)]">
              {profitProgressPercent}%
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs font-mono">
            <span
              className={`font-bold ${
                currentProfit >= 0 ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
              }`}
            >
              {currentProfit >= 0 ? '+' : ''}${currentProfit.toFixed(2)}
            </span>
            <span className="text-[var(--text-muted)] text-[11px]">
              Required: +${profitTargetAmount.toLocaleString()}
            </span>
          </div>

          <div className="h-2 w-full neo-inset-sm rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[var(--accent-long)] rounded-full transition-all duration-300"
              style={{ width: `${profitProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Max Daily Risk Budget (5%) */}
        <div className="p-3 neo-inset rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Max Daily Risk Budget (5%)
            </span>
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
              ${propEvaluation.currentDayLoss.toLocaleString()} used
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs font-mono">
            <span className="text-amber-500 font-bold">
              {Math.min(
                100,
                Math.round(
                  (propEvaluation.currentDayLoss / maxDailyLossAmount) * 100
                )
              )}
              % of limit
            </span>
            <span className="text-[var(--text-muted)] text-[11px]">
              Limit: ${maxDailyLossAmount.toLocaleString()}
            </span>
          </div>

          <div className="h-2 w-full neo-inset-sm rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                (propEvaluation.currentDayLoss / maxDailyLossAmount) * 100 > 80
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (propEvaluation.currentDayLoss / maxDailyLossAmount) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: Overall Maximum Strategy Drawdown (10%) */}
        <div className="p-3 neo-inset rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Max Portfolio Drawdown (10%)
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                drawdownUsedPercent > 80 ? 'text-rose-400' : 'text-[var(--text-primary)]'
              }`}
            >
              {drawdownUsedPercent}% used
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs font-mono">
            <span
              className={`font-bold ${
                currentDrawdown > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ${currentDrawdown.toLocaleString()} DD
            </span>
            <span className="text-[var(--text-muted)] text-[11px]">
              Hard Stop: ${maxTotalDrawdownAmount.toLocaleString()}
            </span>
          </div>

          <div className="h-2 w-full neo-inset-sm rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                drawdownUsedPercent > 80
                  ? 'bg-rose-500'
                  : drawdownUsedPercent > 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${drawdownUsedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Institutional Fiduciary Notice */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]/40 px-1">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Fiduciary mandate: Live client capital is only allocated after a strategy maintains positive expectancy in forward simulation.</span>
        </span>
        <span className="font-mono text-[10px]">ECN RAW DMA</span>
      </div>
    </div>
  );
};
