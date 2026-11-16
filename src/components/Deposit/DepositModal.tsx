import React, { useCallback, useEffect, useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { api, type DepositInfo } from '../../services/api';
import { X, Copy, Check, CheckCircle2, AlertCircle, Loader2, ArrowDownToLine, History, Clock } from 'lucide-react';

interface DepositModalProps { isOpen: boolean; onClose: () => void; }

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const QUICK = [1000, 5000, 10000, 50000];

// Server status -> label shown to the user
const STEPS = ['Transfer reported', 'Processing', 'Completed'];
const stepIndex = (s: string) => (s === 'completed' ? 2 : s === 'processing' ? 1 : 0);

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { depositRequests, applyServerLedger, reconcileRequests } = useTrading();
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');
  const [info, setInfo] = useState<DepositInfo | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [copied, setCopied] = useState('');
  const [amount, setAmount] = useState('5000');
  const [senderBank, setSenderBank] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState<{ ref: string; amount: number; status: string } | null>(null);

  // Load this user's deposit account when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadErr('');
    api.depositInfo().then(setInfo).catch(e => setLoadErr((e as Error).message));
  }, [isOpen]);

  const refresh = useCallback(async () => {
    const [me, txs] = await Promise.all([api.me(), api.transactions()]);
    applyServerLedger(me.balance, me.email);
    reconcileRequests(txs);
    return txs;
  }, [applyServerLedger, reconcileRequests]);

  // While a deposit is in flight, poll until it is completed or rejected
  const trackedRef = tracking?.ref;
  const trackedDone = tracking?.status === 'completed' || tracking?.status === 'rejected';
  useEffect(() => {
    if (!isOpen || !trackedRef || trackedDone) return;
    let alive = true;
    const t = setInterval(async () => {
      try {
        const txs = await refresh();
        const mine = txs.find(x => x.ref === trackedRef);
        if (alive && mine) setTracking(cur => (cur ? { ...cur, status: mine.status } : cur));
      } catch { /* transient: keep polling */ }
    }, 2500);
    return () => { alive = false; clearInterval(t); };
  }, [isOpen, trackedRef, trackedDone, refresh]);

  if (!isOpen) return null;

  const copy = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard unavailable */ }
    setCopied(label);
    setTimeout(() => setCopied(''), 1800);
  };

  const rows: { label: string; value: string; mono?: boolean }[] = info ? [
    { label: 'Beneficiary', value: info.beneficiary },
    { label: 'Bank', value: info.bankName },
    { label: 'Routing number (ABA)', value: info.routingNumber, mono: true },
    { label: 'Account number', value: info.accountNumber, mono: true },
    { label: 'Account type', value: info.accountType },
    { label: 'Reference / memo', value: info.reference, mono: true },
  ] : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setError('Enter the amount you transferred.');
    setError(''); setBusy(true);
    try {
      const r = await api.depositNotice({ amount: n, senderBankName: senderBank.trim() || undefined, memo: info?.reference });
      setTracking({ ref: r.referenceId, amount: n, status: 'pending' });
      void refresh().catch(() => {});
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  const reset = () => { setTracking(null); setError(''); setTab('deposit'); };
  const badge = (s: string) => s === 'SETTLED' ? ['Completed', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30']
    : s === 'REJECTED' ? ['Rejected', 'bg-rose-500/10 text-rose-400 border-rose-500/30']
    : s === 'PROCESSING' ? ['Processing', 'bg-sky-500/10 text-sky-400 border-sky-500/30']
    : ['Pending', 'bg-amber-500/10 text-amber-400 border-amber-500/30'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Deposit funds">
      <div className="neo-box w-full max-w-xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><ArrowDownToLine className="w-5 h-5 text-[var(--accent-brand)]" />Deposit funds</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Send a bank transfer, then confirm it here.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="neo-btn p-2 text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
        </div>

        {info?.sandbox && (
          <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
            <span className="font-semibold text-slate-100">Depository Instructions:</span> Use the institutional wire details below to initiate settlement. Submit the transfer notice to record your deposit.
          </div>
        )}

        <div className="mt-4 flex gap-1 neo-inset-sm p-1 rounded-xl text-xs font-semibold" role="tablist">
          {(['deposit', 'history'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${tab === t ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md' : 'text-[var(--text-muted)]'}`}>
              {t === 'deposit' ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
              {t === 'deposit' ? 'Deposit' : `History (${depositRequests.length})`}
            </button>
          ))}
        </div>

        {tab === 'history' && (
          <div className="mt-4 space-y-2">
            {depositRequests.length === 0 && <p className="text-sm text-[var(--text-muted)] py-6 text-center">No deposits yet.</p>}
            {depositRequests.map(d => { const [label, cls] = badge(d.status); return (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-3.5 py-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{money(d.amount)}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">{d.referenceId} · {new Date(d.timestamp).toLocaleString()}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase border ${cls}`}>{label}</span>
              </div>); })}
          </div>
        )}

        {tab === 'deposit' && !tracking && (
          <div className="mt-5 space-y-5">
            {loadErr && <div role="alert" className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{loadErr}</div>}
            {!info && !loadErr && <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="w-4 h-4 animate-spin" />Loading your deposit account…</div>}

            {info && (
              <section aria-labelledby="dep-step1">
                <h3 id="dep-step1" className="text-sm font-semibold text-[var(--text-primary)]"><span className="text-[var(--accent-brand)]">1.</span> Transfer to this account</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Use your bank's app to send a wire or ACH transfer. Put the reference in the memo so we can match it to you.</p>
                <dl className="mt-3 rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                  {rows.map(r => (
                    <div key={r.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{r.label}</dt>
                        <dd className={`text-sm text-[var(--text-primary)] break-all ${r.mono ? 'font-mono' : ''}`}>{r.value}</dd>
                      </div>
                      <button type="button" onClick={() => copy(r.label, r.value)} className="neo-btn px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 shrink-0" aria-label={`Copy ${r.label}`}>
                        {copied === r.label ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                      </button>
                    </div>
                  ))}
                </dl>
                <button type="button" onClick={() => copy('all', rows.map(r => `${r.label}: ${r.value}`).join('\n'))} className="mt-2 text-xs font-semibold text-[var(--accent-brand)] hover:underline">
                  {copied === 'all' ? 'Copied all details' : 'Copy all details'}
                </button>
              </section>
            )}

            {info && (
              <form onSubmit={submit} noValidate aria-labelledby="dep-step2">
                <h3 id="dep-step2" className="text-sm font-semibold text-[var(--text-primary)]"><span className="text-[var(--accent-brand)]">2.</span> Confirm your transfer</h3>
                {error && <div role="alert" className="mt-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                <label htmlFor="dep-amount" className="mt-3 block text-xs font-semibold text-[var(--text-secondary)]">Amount you sent (USD)</label>
                <input id="dep-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="mt-1 w-full rounded-lg border border-slate-400/40 bg-transparent px-3 py-2.5 text-sm font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-brand)]" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK.map(q => <button key={q} type="button" onClick={() => setAmount(String(q))} className="neo-btn px-2.5 py-1 text-[11px] font-semibold">{money(q)}</button>)}
                </div>
                <label htmlFor="dep-bank" className="mt-3 block text-xs font-semibold text-[var(--text-secondary)]">Your bank (optional)</label>
                <input id="dep-bank" value={senderBank} onChange={e => setSenderBank(e.target.value)} placeholder="e.g. Chase"
                  className="mt-1 w-full rounded-lg border border-slate-400/40 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-brand)]" />
                <button type="submit" disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--accent-brand)] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}I have sent the transfer
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'deposit' && tracking && (
          <div className="mt-5" aria-live="polite">
            <div className="rounded-xl border border-[var(--border-subtle)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold font-mono text-[var(--text-primary)]">{money(tracking.amount)}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">{tracking.ref}</div>
                </div>
                {tracking.status === 'completed' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : tracking.status === 'rejected' ? <AlertCircle className="w-8 h-8 text-rose-400" /> : <Clock className="w-8 h-8 text-amber-400" />}
              </div>
              <ol className="mt-4 space-y-3">
                {STEPS.map((label, i) => {
                  const rejected = tracking.status === 'rejected';
                  const done = !rejected && stepIndex(tracking.status) >= i;
                  const current = !rejected && stepIndex(tracking.status) === i && tracking.status !== 'completed';
                  return (
                    <li key={label} className="flex items-center gap-3 text-sm">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${done ? 'bg-emerald-500 text-white' : 'border border-slate-400/50 text-[var(--text-muted)]'}`}>
                        {done && !current ? <Check className="w-3.5 h-3.5" /> : current ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                      </span>
                      <span className={done ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)]'}>{label}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-xs text-[var(--text-secondary)]">
                {tracking.status === 'completed' ? 'Funds have arrived and your balance is updated.'
                  : tracking.status === 'rejected' ? 'This deposit was rejected. No funds were added.'
                  : 'We are verifying your transfer. You can close this window; the status updates in History.'}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={reset} className="neo-btn flex-1 py-2.5 text-xs font-bold">New deposit</button>
              <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--accent-brand)] py-2.5 text-xs font-bold text-white">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
