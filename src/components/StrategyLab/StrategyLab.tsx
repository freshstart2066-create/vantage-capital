import React, { useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Scale,
  Zap,
  Target,
  FileSpreadsheet,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

export const StrategyLab: React.FC = () => {
  const { stats, closedTrades, account, exportTradesToCSV, resolvedTheme } = useTrading();
  const equityCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Equity Curve Canvas
  useEffect(() => {
    const canvas = equityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const isDark = resolvedTheme === 'dark';

    // Background Clear
    ctx.fillStyle = isDark ? '#141a24' : '#e6ebf4';
    ctx.fillRect(0, 0, width, height);

    if (closedTrades.length === 0) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Execute and close trades to generate your Method Equity Curve.', width / 2, height / 2);
      return;
    }

    // Build equity progression
    const points: number[] = [account.startingBalance];
    const chronological = [...closedTrades].reverse();
    let currentBal = account.startingBalance;
    chronological.forEach(t => {
      currentBal += t.pnl;
      points.push(currentBal);
    });

    const minBal = Math.min(...points) * 0.98;
    const maxBal = Math.max(...points) * 1.02;
    const range = maxBal - minBal || 1;

    const getX = (idx: number) => (idx / (points.length - 1)) * (width - 60) + 10;
    const getY = (val: number) => height - 30 - ((val - minBal) / range) * (height - 50);

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = 20 + ((height - 50) / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const labelVal = maxBal - (i / 3) * range;
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${Math.round(labelVal).toLocaleString()}`, width - 8, y + 3);
    }

    // Gradient fill under equity line
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (currentBal >= account.startingBalance) {
      grad.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(5, 150, 105, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
      grad.addColorStop(0, isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(225, 29, 72, 0.25)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    }

    // Path
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = getX(i);
      const y = getY(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(points.length - 1), height - 30);
    ctx.lineTo(getX(0), height - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = getX(i);
      const y = getY(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = currentBal >= account.startingBalance ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Baseline (starting capital) dashed line
    const baseLineY = getY(account.startingBalance);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, baseLineY);
    ctx.lineTo(width - 60, baseLineY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [closedTrades, account.startingBalance, resolvedTheme]);

  return (
    <div className="space-y-6">
      {/* Title & Intro */}
      <div className="neo-box p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--accent-brand)]" />
            Strategy Validation & Analytics Lab
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Empirical statistical evaluation for trading strategy validation. Verify mathematical edge, expectancy, and drawdown progression.
          </p>
        </div>

        <button
          onClick={exportTradesToCSV}
          className="neo-btn neo-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Full Journal (.CSV)</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="neo-box p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-semibold">Win Rate</span>
            <Target className="w-4 h-4 text-[var(--accent-brand)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-numbers text-[var(--text-primary)]">
            {stats.winRate}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {stats.winningTrades} Wins / {stats.losingTrades} Losses ({stats.totalTrades} Total)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="neo-box p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-semibold">Profit Factor</span>
            <Scale className="w-4 h-4 text-[var(--accent-brand)]" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono-numbers ${
              stats.profitFactor >= 1.5
                ? 'text-[var(--accent-long)]'
                : stats.profitFactor >= 1.0
                ? 'text-[var(--accent-brand)]'
                : 'text-[var(--accent-short)]'
            }`}
          >
            {stats.profitFactor > 0 ? stats.profitFactor : '0.00'}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {stats.profitFactor >= 1.75 ? 'Institutional Edge' : stats.profitFactor >= 1.0 ? 'Breakeven / Positive' : 'Negative Edge'}
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="neo-box p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-semibold">Max Drawdown</span>
            <AlertTriangle className="w-4 h-4 text-[var(--accent-short)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-numbers text-[var(--accent-short)]">
            {stats.maxDrawdown}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            Max equity dip: -${stats.maxDrawdownAmount.toLocaleString()}
          </div>
        </div>

        {/* Expectancy */}
        <div className="neo-box p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-semibold">Mathematical Expectancy</span>
            <Zap className="w-4 h-4 text-[var(--accent-brand)]" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono-numbers ${
              stats.expectancy >= 0 ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
            }`}
          >
            {stats.expectancy >= 0 ? '+' : ''}${stats.expectancy.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            Expected return per trade executed
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="neo-box p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent-brand)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Method Equity Growth Curve</h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Net Realized: {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-[280px]">
          <canvas ref={equityCanvasRef} className="w-full h-full block rounded-lg" />
        </div>
      </div>

      {/* Secondary Metrics & Method Tag Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Tag Rules Evaluation */}
        <div className="neo-box p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--accent-long)]" />
            Performance by Strategy Rule / Setup Tag
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Identify which specific entry rules or trade setups yield high win rates versus those dragging performance down.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                  <th className="py-2 px-2 font-medium">Setup Rule / Tag</th>
                  <th className="py-2 px-2 font-medium">Trades</th>
                  <th className="py-2 px-2 font-medium">Win Rate</th>
                  <th className="py-2 px-2 font-medium">Profit Factor</th>
                  <th className="py-2 px-2 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
                {stats.tagsSummary.map(row => (
                  <tr key={row.tag} className="hover:bg-[var(--bg-sunken)]/50">
                    <td className="py-2.5 px-2 font-sans font-bold text-[var(--text-primary)]">
                      {row.tag}
                    </td>
                    <td className="py-2.5 px-2">{row.trades}</td>
                    <td className="py-2.5 px-2">{row.winRate}%</td>
                    <td className="py-2.5 px-2">{row.profitFactor}</td>
                    <td
                      className={`py-2.5 px-2 text-right font-bold ${
                        row.pnl >= 0 ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
                      }`}
                    >
                      {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {stats.tagsSummary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--text-muted)] font-sans">
                      No tagged closed trades yet. Use the Method Rule tag in the Order Panel to track setups!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategy Journal / Testing Checklist */}
        <div className="neo-box p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent-brand)]" />
              Method Execution Checklist
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Standard operating procedures for validating your new trading method:
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2 neo-inset-sm p-2 rounded-lg">
                <span className="text-[var(--accent-brand)] font-bold">1.</span>
                <span>Minimum sample size of 30-50 trades before altering rules.</span>
              </li>
              <li className="flex items-start gap-2 neo-inset-sm p-2 rounded-lg">
                <span className="text-[var(--accent-brand)] font-bold">2.</span>
                <span>Enforce fixed risk (e.g. 1% to 2% max per trade) with Stop Loss.</span>
              </li>
              <li className="flex items-start gap-2 neo-inset-sm p-2 rounded-lg">
                <span className="text-[var(--accent-brand)] font-bold">3.</span>
                <span>Test across both Trending and Range-bound market regimes.</span>
              </li>
              <li className="flex items-start gap-2 neo-inset-sm p-2 rounded-lg">
                <span className="text-[var(--accent-brand)] font-bold">4.</span>
                <span>Tag every setup accurately to pinpoint where profits concentrate.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] mt-4 text-[11px] text-[var(--text-muted)]">
            <span>Average Win: <strong className="text-[var(--accent-long)] font-mono">${stats.avgWin}</strong></span> |{' '}
            <span>Average Loss: <strong className="text-[var(--accent-short)] font-mono">${stats.avgLoss}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
