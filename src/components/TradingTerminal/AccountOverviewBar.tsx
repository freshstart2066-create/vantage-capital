import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Wallet, Landmark } from 'lucide-react';
import { WithdrawalModal } from '../Withdrawal/WithdrawalModal';

export const AccountOverviewBar: React.FC = () => {
  const { account, positions } = useTrading();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);

  const totalFloatingPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const pnlPercent = account.balance > 0 ? (totalFloatingPnl / account.balance) * 100 : 0;
  const isPnlPositive = totalFloatingPnl >= 0;

  return (
    <>
      <div className="neo-box p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
        {/* Balance */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            Balance
          </span>
          <span className="text-base font-bold font-mono-numbers text-[var(--text-primary)]">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Equity */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Equity</span>
          <span className="text-base font-bold font-mono-numbers text-[var(--text-primary)]">
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Floating P&L */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Floating P&L</span>
          <div className="flex items-baseline gap-1.5 font-mono-numbers">
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
          <span className="text-sm font-semibold font-mono-numbers text-[var(--text-primary)]">
            ${account.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Free Margin */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Free Margin</span>
          <span className="text-sm font-semibold font-mono-numbers text-[var(--text-primary)]">
            ${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Margin Level & Action Buttons */}
        <div className="flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Margin Level</span>
            <span className="text-sm font-bold font-mono-numbers text-[var(--accent-brand)]">
              {account.marginLevel > 0 ? `${account.marginLevel}%` : '∞'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="neo-btn py-1.5 px-2.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center gap-1"
              title="Request Bank transfer Withdrawal"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* USA Domestic Wire Withdrawal Modal */}
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </>
  );
};
