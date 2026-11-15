import React, { useState, useId } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Landmark,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Hash,
  FileText,
  History,
  Send,
  Zap,
  Copy,
  Check,
  ArrowDownToLine,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_US_BANKS = [
  'JPMorgan Chase Bank, N.A.',
  'Bank of America, N.A.',
  'Wells Fargo Bank, N.A.',
  'Citibank, N.A.',
];

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { user, depositRequests, requestWireDeposit } = useTrading();

  const [activeTab, setActiveTab] = useState<'wire_info' | 'history'>('wire_info');

  // Deposit Form State
  const [amount, setAmount] = useState<string>('50000');
  const [originatorName, setOriginatorName] = useState<string>(user?.name || 'Alex Vance');
  const [originatingBankName, setOriginatingBankName] = useState<string>('JPMorgan Chase Bank, N.A.');
  const [originatingRoutingNumber, setOriginatingRoutingNumber] = useState<string>('021000021');
  const [imadOmad, setImadOmad] = useState<string>('20241115MMQFMPBJ' + Math.floor(100000 + Math.random() * 900000));
  const [wireMemo, setWireMemo] = useState<string>(`DEP-${user?.accountId || 'VC-89421'} Capital Allocation`);

  // Copy state for instructions
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Submission state
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [recentReceipt, setRecentReceipt] = useState<{
    referenceId: string;
    amount: number;
    bankName: string;
    date: string;
  } | null>(null);

  const routingHintId = useId();
  const imadHintId = useId();

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      setErrorMsg('Minimum deposit amount is $100.00 USD.');
      return;
    }

    if (!originatorName.trim()) {
      setErrorMsg('Originator full legal name is required.');
      return;
    }

    if (!originatingBankName.trim()) {
      setErrorMsg('Originating bank institution name is required.');
      return;
    }

    if (!/^\d{9}$/.test(originatingRoutingNumber.trim())) {
      setErrorMsg('Originating ABA Routing Transit Number must be exactly 9 numeric digits.');
      return;
    }

    // Submit wire notification
    requestWireDeposit({
      amount: parsedAmount,
      originatorName: originatorName.trim(),
      originatingBankName: originatingBankName.trim(),
      originatingRoutingNumber: originatingRoutingNumber.trim(),
      imadOmad: imadOmad.trim() || undefined,
      wireMemo: wireMemo.trim() || undefined,
    });

    setRecentReceipt({
      referenceId: `DEP-${user?.accountId || 'VC-89421'}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: parsedAmount,
      bankName: originatingBankName,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setActiveTab('history');
  };

  const wireInstructions = [
    { label: 'Beneficiary Name', value: 'Vantage Capital Asset Management LLC', id: 'bene' },
    { label: 'Receiving Bank', value: 'JPMorgan Chase Bank, N.A.', id: 'bank' },
    { label: 'Fedwire Routing (ABA)', value: '021000021', id: 'aba' },
    { label: 'Account Number', value: '7724-0019-3841', id: 'acct' },
    { label: 'Account Classification', value: 'Commercial Trust Checking', id: 'type' },
    { label: 'Bank Address', value: '383 Madison Ave, New York, NY 10017', id: 'addr' },
    { label: 'Mandatory Wire Reference', value: `DEP-${user?.accountId || 'VC-89421'} / ${user?.name || 'Alex Vance'}`, id: 'memo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="neo-box w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-sky-400">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  USA Domestic Fedwire Deposit
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30">
                  Fedwire Inbound
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Same-day Federal Reserve settlement directly to active trading capital
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="neo-btn p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl"
            aria-label="Close deposit dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-1 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2 neo-inset-sm p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('wire_info')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'wire_info'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-sky-400" />
              <span>Wiring Instructions & Form</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'history'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inbound History ({depositRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'wire_info' ? (
            <div className="space-y-5">
              {/* Official Vantage Capital Fedwire Wiring Instructions Card */}
              <div className="p-4 rounded-2xl neo-inset space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Official Fedwire Wiring Instructions
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    Domestic USD Only
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Provide these details to your commercial bank teller or enter them directly into your bank&apos;s online Fedwire dispatch portal:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
                  {wireInstructions.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl neo-box flex items-center justify-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-sans text-[var(--text-muted)] block">
                          {item.label}
                        </span>
                        <span className="font-bold text-[var(--text-primary)] truncate block text-[11px]">
                          {item.value}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.value, item.id)}
                        className="neo-btn p-1.5 text-[var(--text-muted)] hover:text-sky-400 shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedField === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inbound Wire Notification Form */}
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="border-b border-[var(--border-subtle)] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>Register Dispatched Wire Deposit</span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Notify our matching engine of your inbound transfer for immediate settlement verification
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1">
                  <label htmlFor="dep-amount" className="text-xs font-semibold text-[var(--text-secondary)]">
                    Wire Deposit Amount ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">
                      $
                    </span>
                    <input
                      id="dep-amount"
                      type="number"
                      min={100}
                      step={100}
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="neo-input pl-8 text-sm font-mono font-bold"
                      placeholder="50,000"
                    />
                  </div>
                  {/* Quick Preset Chips */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {['10000', '25000', '50000', '100000', '250000'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold transition-all ${
                          amount === val
                            ? 'bg-sky-500 text-white'
                            : 'neo-btn text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        ${parseInt(val) >= 1000 ? `${parseInt(val) / 1000}k` : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Originator Legal Name */}
                <div className="space-y-1">
                  <label htmlFor="dep-originator" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Originator Full Legal / Entity Name</span>
                  </label>
                  <input
                    id="dep-originator"
                    type="text"
                    required
                    autoComplete="name"
                    value={originatorName}
                    onChange={e => setOriginatorName(e.target.value)}
                    className="neo-input text-xs"
                    placeholder="Alex Vance or Vance Capital LLC"
                  />
                </div>

                {/* Originating Bank Name with Quick Chips */}
                <div className="space-y-1">
                  <label htmlFor="dep-bank" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>Originating Sending Bank</span>
                  </label>
                  <input
                    id="dep-bank"
                    type="text"
                    required
                    value={originatingBankName}
                    onChange={e => setOriginatingBankName(e.target.value)}
                    className="neo-input text-xs"
                    placeholder="e.g. JPMorgan Chase Bank, N.A."
                  />
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {COMMON_US_BANKS.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setOriginatingBankName(b)}
                        className="text-[10px] neo-btn px-2 py-0.5 text-[var(--text-muted)] hover:text-sky-400"
                      >
                        {b.replace(' Bank, N.A.', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Originating ABA Routing Transit Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dep-routing" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-sky-400" />
                      <span>Originating 9-Digit ABA Routing Transit Number</span>
                    </label>
                    <span id={routingHintId} className="text-[10px] text-[var(--text-muted)]">
                      Exactly 9 numeric digits
                    </span>
                  </div>
                  <input
                    id="dep-routing"
                    type="text"
                    inputMode="numeric"
                    required
                    pattern="\d{9}"
                    maxLength={9}
                    aria-describedby={routingHintId}
                    value={originatingRoutingNumber}
                    onChange={e => setOriginatingRoutingNumber(e.target.value.replace(/\D/g, ''))}
                    className="neo-input text-xs font-mono tracking-wider"
                    placeholder="021000021"
                  />
                </div>

                {/* IMAD / OMAD Fedwire Trace Number (Optional) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dep-imad" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Federal Reserve IMAD / OMAD Trace ID (Optional)</span>
                    </label>
                    <span id={imadHintId} className="text-[10px] text-[var(--text-muted)]">
                      Provided on wire receipt
                    </span>
                  </div>
                  <input
                    id="dep-imad"
                    type="text"
                    aria-describedby={imadHintId}
                    value={imadOmad}
                    onChange={e => setImadOmad(e.target.value)}
                    className="neo-input text-xs font-mono"
                    placeholder="20241115MMQFMPBJ000091"
                  />
                </div>

                {/* Wire Memo */}
                <div className="space-y-1">
                  <label htmlFor="dep-memo" className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Wire Memo Reference</span>
                  </label>
                  <input
                    id="dep-memo"
                    type="text"
                    value={wireMemo}
                    onChange={e => setWireMemo(e.target.value)}
                    className="neo-input text-xs font-mono"
                    placeholder="DEP-VC-89421 Capital Allocation"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="neo-btn neo-btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>
                      Register Domestic Fedwire Deposit (${parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })})
                    </span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Tab 2: Deposit History */
            <div className="space-y-4">
              {recentReceipt && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Inbound Wire Successfully Registered</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20">
                      SETTLING
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div>Ref: <strong className="text-[var(--text-primary)]">{recentReceipt.referenceId}</strong></div>
                    <div>Amount: <strong className="text-emerald-400">${recentReceipt.amount.toLocaleString()} USD</strong></div>
                    <div>Sending Bank: <strong className="text-[var(--text-primary)]">{recentReceipt.bankName}</strong></div>
                    <div>Clearing: <strong className="text-[var(--text-primary)]">Federal Reserve Fedwire Direct</strong></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Fedwire Inbound Ledger
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {depositRequests.length} recorded
                </span>
              </div>

              {depositRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] neo-inset rounded-2xl">
                  No wire deposits registered yet. Complete the wire instructions to fund your active capital.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {depositRequests.map(dep => (
                    <div
                      key={dep.id}
                      className="p-3.5 rounded-2xl neo-box flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                            {dep.referenceId}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              dep.status === 'SETTLED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {dep.status === 'SETTLED' ? 'SETTLED' : 'CLEARING FEDWIRE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3">
                          <span>{dep.originatingBankName}</span>
                          <span>&bull;</span>
                          <span className="font-mono">ABA: {dep.originatingRoutingNumber}</span>
                          {dep.imadOmad && (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono text-[10px]">IMAD: {dep.imadOmad.slice(0, 16)}...</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          +${dep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(dep.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
