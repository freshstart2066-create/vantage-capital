import React, { useState, useId } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Landmark,
  X,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Building,
  User,
  Hash,
  MapPin,
  FileText,
  History,
  Send,
  Zap,
} from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_US_BANKS = [
  'JPMorgan Chase Bank, N.A.',
  'Bank of America, N.A.',
  'Wells Fargo Bank, N.A.',
  'Citibank, N.A.',
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose }) => {
  const { account, user, withdrawalRequests, requestWireWithdrawal } = useTrading();

  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  // Wire Transfer Form Fields
  const [amount, setAmount] = useState<string>('2500');
  const [beneficiaryName, setBeneficiaryName] = useState<string>(user?.name || 'Alex Vance');
  const [bankName, setBankName] = useState<string>('JPMorgan Chase Bank, N.A.');
  const [routingNumber, setRoutingNumber] = useState<string>('021000021');
  const [accountNumber, setAccountNumber] = useState<string>('9821401289');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('9821401289');
  const [accountType, setAccountType] = useState<'CHECKING' | 'SAVINGS'>('CHECKING');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>(
    '383 Madison Ave, New York, NY 10017'
  );
  const [wireMemo, setWireMemo] = useState<string>('Capital Performance Distribution');

  // Submission State
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [recentReceipt, setRecentReceipt] = useState<{
    referenceId: string;
    amount: number;
    bankName: string;
    date: string;
  } | null>(null);

  // Generate unique IDs for aria-describedby accessibility
  const routingHintId = useId();
  const accountHintId = useId();

  if (!isOpen) return null;

  const availableCapital = account.freeMargin;
  const numAmount = parseFloat(amount) || 0;

  const handlePercentageSelect = (pct: number) => {
    const val = Math.max(100, Math.floor((availableCapital * pct) / 100));
    setAmount(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numAmount < 100) {
      setErrorMsg('Minimum domestic wire transfer withdrawal is $100.00 USD.');
      return;
    }
    if (numAmount > availableCapital) {
      setErrorMsg(
        `Withdrawal amount exceeds available capital ($${availableCapital.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}).`
      );
      return;
    }

    const cleanRouting = routingNumber.replace(/\D/g, '');
    if (cleanRouting.length !== 9) {
      setErrorMsg('US Domestic Routing Transit Number (ABA) must be exactly 9 digits.');
      return;
    }

    const cleanAccount = accountNumber.replace(/\D/g, '');
    if (cleanAccount.length < 4 || cleanAccount.length > 17) {
      setErrorMsg('US Domestic Bank Account Number must be between 4 and 17 numeric digits.');
      return;
    }

    if (cleanAccount !== confirmAccountNumber.replace(/\D/g, '')) {
      setErrorMsg('Bank account numbers do not match. Please verify for wire accuracy.');
      return;
    }

    if (!beneficiaryName.trim()) {
      setErrorMsg('Please specify the account holder legal name matching bank records.');
      return;
    }

    if (!beneficiaryAddress.trim()) {
      setErrorMsg('Beneficiary physical address is required under FinCEN wire regulations.');
      return;
    }

    const res = requestWireWithdrawal({
      amount: numAmount,
      beneficiaryName,
      bankName,
      routingNumber: cleanRouting,
      accountNumber: cleanAccount,
      accountType,
      beneficiaryAddress,
      wireMemo,
    });

    if (res.success && res.referenceId) {
      setRecentReceipt({
        referenceId: res.referenceId,
        amount: numAmount,
        bankName,
        date: new Date().toLocaleTimeString(),
      });
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="neo-box w-full max-w-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  USA Domestic Wire Transfer Withdrawal
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Bank transfer Direct
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Capital payout dispatched directly via the Federal Reserve National Settlement Service
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Available Capital Banner */}
        <div className="my-4 p-4 neo-inset rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
              Settled Capital
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
              Margin Committed
            </span>
            <span className="font-mono text-base font-semibold text-[var(--text-secondary)]">
              ${account.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> Withdrawable Capital
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-400">
              ${availableCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tab Navigator: New Request vs History */}
        <div className="grid grid-cols-2 gap-2 p-1 neo-inset-sm rounded-xl mb-4">
          <button
            type="button"
            onClick={() => { setActiveTab('request'); setRecentReceipt(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'request'
                ? 'bg-[var(--accent-brand)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>New Wire Request</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[var(--accent-brand)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Wire History ({withdrawalRequests.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: RECENT RECEIPT SUCCESS VIEW */}
        {/* ======================================================== */}
        {recentReceipt && (
          <div className="p-6 neo-inset rounded-2xl text-center space-y-4 animate-fadeIn my-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Bank transfer Withdrawal Dispatched
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your wire payout instruction has been authenticated and queued for domestic clearing.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 neo-box rounded-xl text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Wire Reference:</span>
                <span className="font-bold text-amber-400">{recentReceipt.referenceId}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Gross Disbursement:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  ${recentReceipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Processing Fee:</span>
                <span className="font-bold text-emerald-400">$0.00 (Standard ECN Waiver)</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Beneficiary Institution:</span>
                <span className="font-bold text-[var(--text-primary)]">{recentReceipt.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Estimated Clearing:</span>
                <span className="font-bold text-emerald-400">Same-Day / Next Business Day</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setActiveTab('history'); setRecentReceipt(null); }}
              className="neo-btn neo-btn-primary py-2.5 px-6 text-xs font-bold rounded-xl"
            >
              View In Wire History &rarr;
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: NEW WIRE REQUEST FORM */}
        {/* ======================================================== */}
        {!recentReceipt && activeTab === 'request' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Withdrawal Amount Section */}
            <div className="space-y-2 p-3.5 neo-inset rounded-xl">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                <label htmlFor="wire-amount" className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Withdrawal Capital Amount ($ USD)</span>
                </label>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Min: $100.00 USD
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold font-mono text-[var(--text-muted)]">
                  $
                </span>
                <input
                  type="text"
                  id="wire-amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  placeholder="2500"
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="neo-input pl-8 py-2.5 text-base font-bold font-mono text-[var(--text-primary)]"
                />
              </div>

              {/* Quick Percentage Chips */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { label: '25%', pct: 25 },
                  { label: '50%', pct: 50 },
                  { label: '75%', pct: 75 },
                  { label: 'Max (100%)', pct: 100 },
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handlePercentageSelect(chip.pct)}
                    className="flex-1 neo-btn py-1 text-xs font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. USA Domestic Wire Banking Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                USA Domestic Beneficiary Bank Account Information
              </h3>

              {/* Beneficiary Name */}
              <div className="space-y-1">
                <label
                  htmlFor="wire-beneficiary"
                  className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Account Holder Full Legal Name</span>
                </label>
                <input
                  type="text"
                  id="wire-beneficiary"
                  name="beneficiary"
                  autoComplete="name"
                  required
                  placeholder="e.g. Alex Vance"
                  value={beneficiaryName}
                  onChange={e => setBeneficiaryName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              {/* Receiving Bank Name */}
              <div className="space-y-1">
                <label
                  htmlFor="wire-bank"
                  className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Receiving Bank Name
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">USA Institutions Only</span>
                </label>
                <input
                  type="text"
                  id="wire-bank"
                  name="bankName"
                  required
                  placeholder="e.g. JPMorgan Chase Bank, N.A."
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />

                {/* Common Banks Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_US_BANKS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBankName(b)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        bankName === b
                          ? 'border-[var(--accent-brand)] bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] font-bold'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {b.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Routing Number (ABA) & Account Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 9-Digit ABA Routing Transit Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wire-routing"
                      className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
                    >
                      <Hash className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>ABA Routing Number (9 Digits)</span>
                    </label>
                  </div>
                  {/* Format hint above the input per modern web guidance */}
                  <span
                    id={routingHintId}
                    className="text-[10px] font-mono text-[var(--text-muted)] block"
                  >
                    Format: Exactly 9 numeric digits
                  </span>
                  <input
                    type="text"
                    id="wire-routing"
                    name="routingNumber"
                    inputMode="numeric"
                    maxLength={9}
                    pattern="\d{9}"
                    required
                    aria-describedby={routingHintId}
                    placeholder="021000021"
                    value={routingNumber}
                    onChange={e => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                    className="neo-input text-xs py-2.5 font-mono"
                  />
                </div>

                {/* Account Type Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 neo-inset rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAccountType('CHECKING')}
                      className={`py-2 text-xs font-bold rounded-md transition-all ${
                        accountType === 'CHECKING'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Checking
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('SAVINGS')}
                      className={`py-2 text-xs font-bold rounded-md transition-all ${
                        accountType === 'SAVINGS'
                          ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Savings
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Number & Confirm Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="wire-account"
                    className="text-xs font-semibold text-[var(--text-secondary)] block"
                  >
                    Bank Account Number
                  </label>
                  <span
                    id={accountHintId}
                    className="text-[10px] font-mono text-[var(--text-muted)] block"
                  >
                    Format: 4 to 17 numeric digits
                  </span>
                  <input
                    type="text"
                    id="wire-account"
                    name="accountNumber"
                    inputMode="numeric"
                    maxLength={17}
                    required
                    aria-describedby={accountHintId}
                    placeholder="e.g. 9821401289"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="neo-input text-xs py-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="wire-confirm-account"
                    className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between"
                  >
                    <span>Confirm Account Number</span>
                    {accountNumber && confirmAccountNumber && (
                      <span
                        className={`text-[10px] font-mono ${
                          accountNumber === confirmAccountNumber
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {accountNumber === confirmAccountNumber ? '✓ Matches' : '✗ Mismatch'}
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                    Verify account digits for safety
                  </span>
                  <input
                    type="text"
                    id="wire-confirm-account"
                    name="confirmAccountNumber"
                    inputMode="numeric"
                    maxLength={17}
                    required
                    placeholder="Re-enter account number"
                    value={confirmAccountNumber}
                    onChange={e => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="neo-input text-xs py-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Beneficiary Physical Address (FinCEN / Patriot Act Domestic Wire Mandate) */}
              <div className="space-y-1">
                <label
                  htmlFor="wire-address"
                  className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Beneficiary Physical Address (USA)
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">FinCEN Bank transfer Requirement</span>
                </label>
                <input
                  type="text"
                  id="wire-address"
                  name="address"
                  autoComplete="street-address"
                  required
                  placeholder="Street Address, City, State, ZIP"
                  value={beneficiaryAddress}
                  onChange={e => setBeneficiaryAddress(e.target.value)}
                  className="neo-input text-xs py-2.5 font-sans"
                />
              </div>

              {/* Wire Memo / Reference */}
              <div className="space-y-1">
                <label
                  htmlFor="wire-memo"
                  className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Wire Transfer Reference Memo (Optional)</span>
                </label>
                <input
                  type="text"
                  id="wire-memo"
                  name="memo"
                  placeholder="e.g. Trader Capital Distribution"
                  value={wireMemo}
                  onChange={e => setWireMemo(e.target.value)}
                  className="neo-input text-xs py-2 font-sans"
                />
              </div>
            </div>

            {/* Institutional Security Notice */}
            <div className="p-3 neo-inset rounded-xl text-[11px] text-[var(--text-muted)] flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)]">Federal Reserve Settlement:</strong>{' '}
                Domestic USA Bank transfer transfers execute in real time. Transfer instructions received prior
                to 16:00 EST are cleared same-day. Zero wire transaction fees are assessed on ECN
                accounts.
              </div>
            </div>

            {/* Authorize Button */}
            <button
              type="submit"
              className="neo-btn neo-btn-primary w-full py-3.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Landmark className="w-4 h-4" />
              <span>
                Authorize Domestic Wire Payout ($
                {numAmount > 0
                  ? numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '0.00'}
                )
              </span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: WIRE TRANSFER HISTORY */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Recorded Bank transfer Disbursements</span>
              <span>All Domestic Transactions</span>
            </div>

            {withdrawalRequests.length === 0 ? (
              <div className="p-8 neo-inset rounded-2xl text-center text-xs text-[var(--text-muted)]">
                No domestic wire withdrawals recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {withdrawalRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3.5 neo-inset rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">
                          {req.referenceId}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                            req.status === 'SETTLED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'DISPATCHED_TRANSFER'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {req.status === 'SETTLED'
                            ? 'Bank transfer Settled'
                            : req.status === 'DISPATCHED_TRANSFER'
                            ? 'Dispatched to Fed'
                            : 'Pending Clearing'}
                        </span>
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                        <span>{req.bankName}</span>
                        <span>&bull;</span>
                        <span className="font-mono">{req.accountNumberMasked}</span>
                        <span>&bull;</span>
                        <span>{req.accountType}</span>
                      </div>

                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(req.timestamp).toLocaleString()} &bull; Routing: {req.routingNumber}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                        ${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Net: ${req.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
  );
};
