import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, KeyRound, Minus, Plus, Search, X, ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { api, type AdminUser, type Tx, type Report, type Row } from '../../services/api';
import { VantageLogo } from '../VantageLogo';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const input = 'w-full rounded-xl border border-[var(--border-darker)] bg-[var(--bg-sunken)] px-3.5 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-brand)]';
const card = 'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-4 sm:p-5 shadow-sm';
const btn = 'rounded-xl px-4 py-2.5 text-sm font-semibold min-h-11 disabled:opacity-50';

const STATUS: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-500',
  pending: 'bg-amber-500/15 text-amber-500',
  processing: 'bg-sky-500/15 text-sky-500',
  rejected: 'bg-rose-500/15 text-rose-500',
};
const Badge = ({ s }: { s: string }) => <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${STATUS[s] || 'bg-slate-500/15'}`}>{s}</span>;

const kindLabel = (t: Tx) => (t.kind === 'adjustment' ? 'Balance reduction' : t.kind === 'deposit' ? 'Deposit' : 'Withdrawal');

type Tab = 'queue' | 'clients' | 'strategy';

export const AdminDashboard: React.FC = () => {
  const { user, signIn, updateUserProfile, setActiveTab } = useTrading();
  const [tab, setTab] = useState<Tab>('queue');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  // Dedicated Admin Login State when accessing /admin directly
  const [adminEmail, setAdminEmail] = useState('admin@vantage.local');
  const [adminPass, setAdminPass] = useState('change-me-now');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, t, r] = await Promise.all([api.adminUsers(), api.adminTx(), api.adminReport()]);
      setUsers(u); setTx(t); setReport(r);
    } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  }, []);

  useEffect(() => { if (user?.role === 'admin') void load(); }, [user, load]);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const u = await api.login(adminEmail.trim(), adminPass);
      if (u.role !== 'admin') {
        throw new Error('This account does not hold administrative access credentials.');
      }
      signIn(u.email, u.name);
      updateUserProfile({ role: 'admin', accountId: u.accountId, name: u.name });
    } catch (err: unknown) {
      setAuthError((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter(u => [u.name, u.email, u.account_no].some(v => v.toLowerCase().includes(s))) : users;
  }, [users, q]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md neo-box p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Ambient Security Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <VantageLogo size={42} showText={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neo-inset-sm text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Restricted Workstation URL (/admin)
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Firm Administration
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Capital allocation, withdrawal authorizations, and quantitative strategy reporting.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Workstation Email</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@vantage.local"
                className="w-full rounded-xl border border-slate-400/40 bg-transparent px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Administrator Password</span>
              </label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-400/40 bg-transparent px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={authBusy}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{authBusy ? 'Authenticating Station…' : 'Sign In to Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@vantage.local');
                setAdminPass('change-me-now');
                setTimeout(() => handleAdminLogin(), 50);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-amber-400 neo-inset-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Administrator Access</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Return to Trader Terminal / Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingW = tx.filter(t => t.kind === 'withdrawal' && ['pending', 'processing'].includes(t.status));
  const pendingD = tx.filter(t => t.kind === 'deposit' && ['pending', 'processing'].includes(t.status));
  const totalBalance = users.reduce((a, u) => a + u.balance, 0);

  const decide = async (t: Tx, action: 'approve' | 'reject') => {
    try {
      await (t.kind === 'withdrawal' ? api.adminWithdrawal(t.id, action) : api.adminDeposit(t.id, action));
      setMsg({ text: t.kind === 'withdrawal' ? (action === 'approve' ? 'Withdrawal approved.' : 'Withdrawal rejected. Funds returned to the client.') : (action === 'approve' ? 'Deposit confirmed and credited.' : 'Deposit notice rejected.') });
    } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
    await load();
  };

  const Request = ({ t }: { t: Tx }) => (
    <div className="flex flex-col gap-3 py-3 border-t border-[var(--border-darker)] first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-sm">
        <div className="font-semibold text-[var(--text-primary)]">{money(t.amount)} <span className="font-normal text-[var(--text-muted)]">· {t.name} ({t.account_no})</span></div>
        <div className="text-xs text-[var(--text-muted)] break-words">
          {t.kind === 'withdrawal'
            ? `To ${t.detail?.beneficiaryName} · ${t.detail?.bankName} · ABA ${t.detail?.routingNumber} · acct ${t.detail?.accountNumber || '••••' + t.detail?.accountLast4}`
            : `From ${t.detail?.originatorName || 'unknown'}${t.detail?.originatingBankName ? ' · ' + t.detail.originatingBankName : ''}`}
          {' '}· {t.ref} · {when(t.created_at)}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => decide(t, 'approve')} className={`${btn} flex-1 sm:flex-none bg-emerald-600 text-white`}>{t.kind === 'withdrawal' ? 'Approve' : 'Confirm funds'}</button>
        <button onClick={() => decide(t, 'reject')} className={`${btn} flex-1 sm:flex-none border border-[var(--border-darker)] text-[var(--text-primary)]`}>Reject</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 py-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">Administration</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage clients, balances and transfer requests.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[['Clients', String(users.length)], ['Awaiting action', String(pendingW.length + pendingD.length)], ['Client balances', money(totalBalance)]].map(([l, v]) => (
          <div key={l} className={card + ' !p-3 sm:!p-4'}><div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{l}</div><div className="mt-1 text-base sm:text-xl font-semibold text-[var(--text-primary)] break-words">{v}</div></div>
        ))}
      </div>

      {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${msg.bad ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'}`}>{msg.text}</p>}

      <div role="tablist" className="flex gap-1 rounded-xl bg-[var(--bg-sunken)] p-1">
        {([['queue', `Needs attention (${pendingW.length + pendingD.length})`], ['clients', `Clients (${users.length})`], ['strategy', 'Strategy results']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-semibold ${tab === id ? 'bg-[var(--bg-surface-card)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'queue' && (
        <div className="space-y-4">
          <section className={card}>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mb-1"><ArrowUpFromLine className="w-4 h-4" />Withdrawal requests ({pendingW.length})</h2>
            <p className="text-xs text-[var(--text-muted)] mb-2">Approve once the payout has been sent. Reject to return the funds to the client.</p>
            {pendingW.length === 0 ? <p className="text-sm text-[var(--text-muted)] py-2">Nothing waiting.</p> : pendingW.map(t => <Request key={t.id} t={t} />)}
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mb-1"><ArrowDownToLine className="w-4 h-4" />Deposit notices ({pendingD.length})</h2>
            <p className="text-xs text-[var(--text-muted)] mb-2">Confirm only after the money is visible in the bank account. Confirming credits the client.</p>
            {pendingD.length === 0 ? <p className="text-sm text-[var(--text-muted)] py-2">Nothing waiting.</p> : pendingD.map(t => <Request key={t.id} t={t} />)}
          </section>
          <section className={card}>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Recent activity</h2>
            <ul className="divide-y divide-[var(--border-darker)]">
              {tx.slice(0, 15).map(t => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0"><span className="block truncate text-[var(--text-primary)]">{t.name} · {kindLabel(t)}</span><span className="text-xs text-[var(--text-muted)]">{when(t.created_at)}</span></span>
                  <span className="flex flex-col items-end gap-1 shrink-0"><span className="font-semibold text-[var(--text-primary)]">{t.kind === 'deposit' ? '+' : '−'}{money(t.amount)}</span><Badge s={t.status} /></span>
                </li>
              ))}
              {tx.length === 0 && <li className="py-2 text-sm text-[var(--text-muted)]">No activity yet.</li>}
            </ul>
          </section>
        </div>
      )}

      {tab === 'clients' && (
        <section className={card}>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email or account number" className={input + ' !pl-10'} aria-label="Search clients" />
          </div>
          <ul className="divide-y divide-[var(--border-darker)]">
            {filtered.map(u => (
              <li key={u.id}>
                <button onClick={() => setOpenId(u.id)} className="w-full flex items-center justify-between gap-3 py-3 text-left min-h-14">
                  <span className="min-w-0"><span className="block truncate font-semibold text-sm text-[var(--text-primary)]">{u.name}</span><span className="block truncate text-xs text-[var(--text-muted)]">{u.email} · {u.account_no}</span></span>
                  <span className="flex items-center gap-2 shrink-0"><span className="font-semibold text-sm text-[var(--text-primary)]">{money(u.balance)}</span><ChevronRight className="w-4 h-4 text-[var(--text-muted)]" /></span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="py-4 text-sm text-[var(--text-muted)]">{users.length ? 'No clients match your search.' : 'No clients have signed up yet.'}</li>}
          </ul>
        </section>
      )}

      {tab === 'strategy' && report && (
        <section className={card + ' overflow-x-auto'}>
          <h2 className="text-base font-semibold mb-1 text-[var(--text-primary)]">Strategy results ({report.totalTrades} closed trades)</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">Simulated and self-reported. These results never change a balance.</p>
          {([['Strategy', report.byStrategy], ['Trader', report.byUser]] as [string, Row[]][]).map(([label, rows]) => (
            <table key={label} className="w-full min-w-[480px] text-sm text-left text-[var(--text-secondary)] mb-6">
              <thead className="text-[var(--text-muted)]"><tr><th className="py-2 font-medium">{label}</th><th className="font-medium">Trades</th><th className="font-medium">Win rate</th><th className="font-medium">Profit factor</th><th className="text-right font-medium">Net P&amp;L</th></tr></thead>
              <tbody>{rows.length === 0 ? <tr><td className="py-2 text-[var(--text-muted)]" colSpan={5}>No closed trades yet.</td></tr> : rows.map(r => (
                <tr key={r.name} className="border-t border-[var(--border-darker)]"><td className="py-2.5">{r.name}</td><td>{r.trades}</td><td>{r.winRate}%</td><td>{r.profitFactor ?? '-'}</td><td className={'text-right ' + (r.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{money(r.pnl)}</td></tr>))}</tbody>
            </table>
          ))}
        </section>
      )}

      {openId !== null && <ClientPanel id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
};

// ---- One client: balance, adjust, requests, history ----
const ClientPanel: React.FC<{ id: number; onClose: () => void; onChanged: () => Promise<void> }> = ({ id, onClose, onChanged }) => {
  const [data, setData] = useState<{ user: AdminUser & { country: string }; tx: Tx[] } | null>(null);
  const [mode, setMode] = useState<'credit' | 'debit' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.adminUserTx(id)); } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const refresh = async () => { await load(); await onChanged(); };

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    setBusy(true); setMsg(null);
    try {
      const n = Number(amount);
      await (mode === 'credit' ? api.adminCredit(id, n, note) : api.adminDebit(id, n, note));
      setMsg({ text: mode === 'credit' ? `Added ${money(n)}.` : `Removed ${money(n)}.` });
      setMode(null); setAmount(''); setNote(''); await refresh();
    } catch (err) { setMsg({ text: (err as Error).message, bad: true }); }
    setBusy(false);
  };
  const decide = async (t: Tx, action: 'approve' | 'reject') => {
    try {
      await (t.kind === 'withdrawal' ? api.adminWithdrawal(t.id, action) : api.adminDeposit(t.id, action));
      setMsg({ text: action === 'approve' ? 'Approved.' : 'Rejected.' });
    } catch (err) { setMsg({ text: (err as Error).message, bad: true }); }
    await refresh();
  };
  const reset = async () => {
    if (!window.confirm('Create a temporary password for this client? Their current password will stop working.')) return;
    try { const r = await api.adminResetPassword(id); setMsg({ text: `Temporary password: ${r.temporaryPassword} (give it to the client and ask them to change it).` }); } catch (err) { setMsg({ text: (err as Error).message, bad: true }); }
  };

  const open = data?.tx.filter(t => t.kind !== 'adjustment' && ['pending', 'processing'].includes(t.status)) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Client details" onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-none overflow-y-auto rounded-t-3xl sm:rounded-none bg-[var(--bg-primary)] p-4 sm:p-6 pb-8 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--text-primary)]">{data?.user.name ?? 'Loading…'}</h2>
            {data && <p className="truncate text-xs text-[var(--text-muted)]">{data.user.email} · {data.user.account_no}{data.user.country ? ' · ' + data.user.country : ''}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-xl p-2.5 text-[var(--text-muted)] hover:bg-[var(--bg-sunken)]"><X className="w-5 h-5" /></button>
        </div>

        {data && (
          <>
            <div className={card}>
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Balance</div>
              <div className="text-3xl font-semibold text-[var(--text-primary)]">{money(data.user.balance)}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => { setMode('credit'); setMsg(null); }} className={`${btn} flex items-center justify-center gap-1.5 bg-emerald-600 text-white`}><Plus className="w-4 h-4" />Add funds</button>
                <button onClick={() => { setMode('debit'); setMsg(null); }} className={`${btn} flex items-center justify-center gap-1.5 border border-[var(--border-darker)] text-[var(--text-primary)]`}><Minus className="w-4 h-4" />Reduce</button>
              </div>
            </div>

            {mode && (
              <form onSubmit={adjust} className={card + ' space-y-3'}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{mode === 'credit' ? 'Add funds' : 'Reduce balance'}</h3>
                <input type="number" inputMode="decimal" min="0.01" step="0.01" required autoFocus placeholder="Amount (USD)" value={amount} onChange={e => setAmount(e.target.value)} className={input} aria-label="Amount" />
                <input required={mode === 'debit'} placeholder={mode === 'debit' ? 'Reason (required)' : 'Note (optional)'} value={note} onChange={e => setNote(e.target.value)} className={input} aria-label="Reason" maxLength={140} />
                <div className="flex gap-2">
                  <button disabled={busy} className={`${btn} flex-1 bg-[var(--accent-brand)] text-white`}>Confirm</button>
                  <button type="button" onClick={() => setMode(null)} className={`${btn} border border-[var(--border-darker)] text-[var(--text-primary)]`}>Cancel</button>
                </div>
              </form>
            )}

            {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm break-words ${msg.bad ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'}`}>{msg.text}</p>}

            {open.length > 0 && (
              <div className={card}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Waiting for you ({open.length})</h3>
                {open.map(t => (
                  <div key={t.id} className="py-3 border-t border-[var(--border-darker)] first:border-t-0 space-y-2">
                    <div className="text-sm"><span className="font-semibold text-[var(--text-primary)]">{kindLabel(t)} · {money(t.amount)}</span><span className="block text-xs text-[var(--text-muted)] break-words">{t.kind === 'withdrawal' ? `${t.detail?.beneficiaryName} · ${t.detail?.bankName} · ABA ${t.detail?.routingNumber} · acct ${t.detail?.accountNumber || '••••' + t.detail?.accountLast4}` : `From ${t.detail?.originatorName || 'unknown'}`} · {t.ref}</span></div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => decide(t, 'approve')} className={`${btn} bg-emerald-600 text-white`}>{t.kind === 'withdrawal' ? 'Approve' : 'Confirm funds'}</button>
                      <button onClick={() => decide(t, 'reject')} className={`${btn} border border-[var(--border-darker)] text-[var(--text-primary)]`}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={card}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">History</h3>
              <ul className="divide-y divide-[var(--border-darker)]">
                {data.tx.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0"><span className="block text-[var(--text-primary)]">{kindLabel(t)}</span><span className="block truncate text-xs text-[var(--text-muted)]">{t.note || t.ref} · {when(t.created_at)}</span></span>
                    <span className="flex flex-col items-end gap-1 shrink-0"><span className="font-semibold text-[var(--text-primary)]">{t.kind === 'deposit' ? '+' : '−'}{money(t.amount)}</span><Badge s={t.status} /></span>
                  </li>
                ))}
                {data.tx.length === 0 && <li className="py-2 text-sm text-[var(--text-muted)]">No activity yet.</li>}
              </ul>
            </div>

            <button onClick={reset} className={`${btn} w-full flex items-center justify-center gap-2 border border-[var(--border-darker)] text-[var(--text-secondary)]`}><KeyRound className="w-4 h-4" />Reset password</button>
          </>
        )}
      </aside>
    </div>
  );
};
