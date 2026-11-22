import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { Wallet } from 'lucide-react';

export const AccountOverviewBar: React.FC = () => {
  const { account, positions } = useTrading();

  const totalFloatingPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const pnlPercent = account.balance > 0 ? (totalFloatingPnl / account.balance) * 100 : 0;
  const isPnlPositive = totalFloatingPnl >= 0;

  return (
    <div className="neo-box p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-center">
      {/* Balance */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
          Balance
        </span>
        <span className="text-base font-bold font-mono-numbers text-[var(--text-primary)] mt-0.5">
          ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Equity */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Equity</span>
        <span className="text-base font-bold font-mono-numbers text-[var(--text-primary)] mt-0.5">
          ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Floating P&L */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Floating P&L</span>
        <div className="flex items-baseline gap-1.5 font-mono-numbers mt-0.5">
          <span
            className={`text-base font-extrabold ${
              isPnlPositive ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
            }`}
          >
            {isPnlPositive ? '+' : ''}${totalFloatingPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              isPnlPositive ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
            }`}
          >
            ({isPnlPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Used Margin */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Margin Used</span>
        <span className="text-sm font-semibold font-mono-numbers text-[var(--text-secondary)] mt-0.5">
          ${account.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Free Margin */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Free Margin</span>
        <span className="text-sm font-semibold font-mono-numbers text-[var(--text-primary)] mt-0.5">
          ${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Margin Level */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Margin Level</span>
        <span className="text-sm font-bold font-mono-numbers text-[var(--accent-brand)] mt-0.5">
          {account.marginLevel > 0 ? `${account.marginLevel}%` : '∞'}
        </span>
      </div>
    </div>
  );
};
