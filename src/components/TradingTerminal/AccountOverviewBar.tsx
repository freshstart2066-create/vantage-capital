import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { RotateCcw, Wallet, ShieldCheck, Landmark } from 'lucide-react';
import { WithdrawalModal } from '../Withdrawal/WithdrawalModal';

export const AccountOverviewBar: React.FC = () => {
  const { account, positions, resetAccount } = useTrading();
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [customBalance, setCustomBalance] = useState<number>(50000);

  const totalFloatingPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const pnlPercent = account.balance > 0 ? (totalFloatingPnl / account.balance) * 100 : 0;
  const isPnlPositive = totalFloatingPnl >= 0;

  const handleReset = (amount: number) => {
    resetAccount(amount);
    setShowResetModal(false);
  };

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

            <button
              onClick={() => setShowResetModal(true)}
              className="neo-btn py-1.5 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Reset Account Balance"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Account Capital Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="neo-card p-6 w-full max-w-md relative animate-scaleUp">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-brand)]" />
              Adjust Account Balance
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Select or customize your starting balance to test your trading strategy from a clean slate. All current positions will be closed.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[10000, 25000, 50000, 100000, 250000, 500000].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleReset(amt)}
                  className="neo-btn py-2 text-xs font-mono font-bold"
                >
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Custom Amount ($):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={customBalance}
                  onChange={e => setCustomBalance(parseFloat(e.target.value) || 10000)}
                  className="neo-input text-sm font-bold font-mono"
                />
                <button
                  onClick={() => handleReset(customBalance)}
                  className="neo-btn neo-btn-primary px-4 text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="neo-btn px-4 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USA Domestic Wire Withdrawal Modal */}
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </>
  );
};
