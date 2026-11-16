import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Target,
  TrendingDown,
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

  const tiers = [10000, 25000, 50000, 100000, 250000];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
      {/* Top Bar: Title & Mandate Limit */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Risk Mandate & Drawdown Rules
              </h3>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  propEvaluation.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : propEvaluation.status === 'IN_PROGRESS'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {propEvaluation.status === 'PASSED'
                  ? 'Mandate Satisfied'
                  : propEvaluation.status === 'IN_PROGRESS'
                  ? 'Active Monitoring'
                  : 'Threshold Breached'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Institutional drawdown controls and daily loss limit parameters
            </p>
          </div>
        </div>

        {/* Portfolio Tier Selector & Reset */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-slate-800 bg-slate-950 p-0.5 rounded">
            {tiers.map(t => (
              <button
                key={t}
                onClick={() => setPropTier(t)}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded transition-colors ${
                  tier === t
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Portfolio scale: $${t.toLocaleString()}`}
              >
                ${t >= 1000 ? `${t / 1000}k` : t}
              </button>
            ))}
          </div>

          <button
            onClick={resetPropEvaluation}
            className="rounded border border-slate-800 hover:bg-slate-800 p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Mandate Tracking"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Core Risk Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Return Objective */}
        <div className="p-3 rounded border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Return Target (10%)
            </span>
            <span className="font-mono font-semibold text-slate-200">
              ${Math.max(0, currentProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${profitTargetAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${profitProgressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Progress</span>
            <span className="font-bold text-slate-200">{profitProgressPercent}%</span>
          </div>
        </div>

        {/* Metric 2: Daily Loss Limit */}
        <div className="p-3 rounded border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Daily Loss Limit (5%)
            </span>
            <span className="font-mono font-semibold text-slate-200">
              ${propEvaluation.currentDayLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${maxDailyLossAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                propEvaluation.currentDayLoss / maxDailyLossAmount > 0.8
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, Math.round((propEvaluation.currentDayLoss / maxDailyLossAmount) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Remaining Buffer</span>
            <span className="font-bold text-slate-200">
              ${Math.max(0, maxDailyLossAmount - propEvaluation.currentDayLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Metric 3: Max Drawdown Ceiling */}
        <div className="p-3 rounded border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Max Drawdown (10%)
            </span>
            <span className="font-mono font-semibold text-slate-200">
              ${currentDrawdown.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${maxTotalDrawdownAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                drawdownUsedPercent > 70 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${drawdownUsedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Buffer to Stop</span>
            <span className="font-bold text-slate-200">
              ${Math.max(0, maxTotalDrawdownAmount - currentDrawdown).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
