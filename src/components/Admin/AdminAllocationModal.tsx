import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  ShieldAlert,
  X,
  DollarSign,
  User,
  CheckCircle2,
  FileText,
  Building,
  RotateCcw,
} from 'lucide-react';

interface AdminAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAllocationModal: React.FC<AdminAllocationModalProps> = ({ isOpen, onClose }) => {
  const { user, account, adminSetAccountBalance } = useTrading();

  const [targetAccount, setTargetAccount] = useState<string>(
    user ? `${user.name} (${user.accountId})` : 'Active Trader Session'
  );
  const [allocationAmount, setAllocationAmount] = useState<string>('50000');
  const [allocationMemo, setAllocationMemo] = useState<string>('Owner Approved Capital Allocation');
  const [successNotice, setSuccessNotice] = useState<string>('');

  if (!isOpen) return null;

  const handleApplyAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(allocationAmount);
    if (isNaN(parsed) || parsed < 0) return;

    adminSetAccountBalance(parsed, targetAccount, allocationMemo);
    setSuccessNotice(`Successfully allocated $${parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD to ${targetAccount}`);
    setTimeout(() => {
      setSuccessNotice('');
      onClose();
    }, 1800);
  };

  const handleSetZero = () => {
    adminSetAccountBalance(0, targetAccount, 'Reset to $0.00 (Unfunded)');
    setAllocationAmount('0');
    setSuccessNotice(`Account balance set to $0.00 (Unfunded) for ${targetAccount}`);
    setTimeout(() => {
      setSuccessNotice('');
      onClose();
    }, 1800);
  };

  const quickPresets = ['0', '10000', '25000', '50000', '100000', '250000'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="neo-box w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Firm Owner Capital Controller
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Directly allocate or adjust trader capital balance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="neo-btn p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl"
            aria-label="Close admin modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Current Balance Banner */}
          <div className="p-4 rounded-2xl neo-inset flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider block">
                Target Active Balance
              </span>
              <span className="font-mono text-xl font-black text-[var(--text-primary)]">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSetZero}
              className="neo-btn py-1.5 px-3 text-xs font-bold text-rose-400 border border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1.5"
              title="Reset balance to $0.00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set to $0.00 (Unfunded)</span>
            </button>
          </div>

          <form onSubmit={handleApplyAllocation} className="space-y-4">
            {/* Target Account (WHO) */}
            <div className="space-y-1">
              <label htmlFor="adm-target" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Trader Account (WHO)</span>
              </label>
              <input
                id="adm-target"
                type="text"
                required
                value={targetAccount}
                onChange={e => setTargetAccount(e.target.value)}
                className="neo-input text-xs font-mono"
                placeholder="User Name or Account ID (e.g. Alex Vance VC-89421)"
              />
            </div>

            {/* Allocation Amount (HOW MUCH) */}
            <div className="space-y-1">
              <label htmlFor="adm-amount" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Capital Balance Amount ($ USD) (HOW MUCH)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">
                  $
                </span>
                <input
                  id="adm-amount"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={allocationAmount}
                  onChange={e => setAllocationAmount(e.target.value)}
                  className="neo-input pl-8 text-sm font-mono font-bold"
                  placeholder="50,000"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {quickPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAllocationAmount(preset)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold transition-all ${
                      allocationAmount === preset
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'neo-btn text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    ${parseInt(preset) >= 1000 ? `${parseInt(preset) / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Allocation Reason / Memo */}
            <div className="space-y-1">
              <label htmlFor="adm-memo" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Administrative Allocation Reason / Memo</span>
              </label>
              <input
                id="adm-memo"
                type="text"
                value={allocationMemo}
                onChange={e => setAllocationMemo(e.target.value)}
                className="neo-input text-xs"
                placeholder="e.g. Approved Wire Deposit / Owner Discretionary Funding"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Building className="w-4 h-4" />
                <span>
                  Authorize & Update Balance (${parseFloat(allocationAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
