import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  KeyRound,
  Minus,
  Plus,
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Building2,
  Wallet
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { api, type AdminUser, type Tx, type Report, type Row } from '../../services/api';
import { VantageLogo } from '../VantageLogo';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const inputCls = 'w-full rounded-md border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';
const cardCls = 'rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-sm';
const btnCls = 'rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5';

const STATUS: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  processing: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};
const Badge = ({ s }: { s: string }) => (
  <span className={`rounded px-2 py-0.5 text-[11px] font-mono font-medium capitalize ${STATUS[s] || 'bg-slate-800 text-slate-300'}`}>
    {s}
  </span>
);

const kindLabel = (t: Tx) => (t.kind === 'adjustment' ? 'Balance adjustment' : t.kind === 'deposit' ? 'Wire deposit' : 'Wire withdrawal');

type Tab = 'allocation' | 'queue' | 'clients' | 'strategy';

export const AdminDashboard: React.FC = () => {
  const { user, signIn, updateUserProfile, setActiveTab, adminSetAccountBalance } = useTrading();
  const [tab, setTab] = useState<Tab>('allocation');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  // Dedicated Direct Allocation State
  const [allocTargetId, setAllocTargetId] = useState<string>('active');
  const [allocAmount, setAllocAmount] = useState<string>('50000');
  const [allocMode, setAllocMode] = useState<'credit' | 'set' | 'debit'>('credit');
  const [allocNote, setAllocNote] = useState<string>('Institutional Capital Allocation');
  const [allocBusy, setAllocBusy] = useState<boolean>(false);

  // Dedicated Admin Login State when accessing /admin directly
  const [adminEmail, setAdminEmail] = useState('admin@vantage.local');
  const [adminPass, setAdminPass] = useState('change-me-now');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, t, r] = await Promise.all([api.adminUsers(), api.adminTx(), api.adminReport()]);
      setUsers(u); setTx(t); setReport(r);
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') void load();
  }, [user, load]);

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

  const handleExecuteAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(allocAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      setMsg({ text: 'Please enter a valid amount above zero.', bad: true });
      return;
    }

    setAllocBusy(true);
    setMsg(null);

    try {
      if (allocTargetId === 'active') {
        // Direct allocation to the active workstation session
        if (allocMode === 'set') {
          adminSetAccountBalance(amountNum, 'Active Workstation', allocNote);
        } else if (allocMode === 'debit') {
          adminSetAccountBalance(Math.max(0, amountNum), 'Active Workstation', allocNote);
        } else {
          adminSetAccountBalance(amountNum, 'Active Workstation', allocNote);
        }
        setMsg({ text: `Successfully allocated ${money(amountNum)} to active workstation session.` });
      } else {
        const uid = parseInt(allocTargetId, 10);
        const targetUser = users.find(u => u.id === uid);
        const userName = targetUser?.name || `Client #${uid}`;

        if (allocMode === 'credit') {
          await api.adminCredit(uid, amountNum, allocNote);
          setMsg({ text: `Credited ${money(amountNum)} to ${userName}.` });
        } else if (allocMode === 'set') {
          await api.adminSetBalance(uid, amountNum, allocNote);
          setMsg({ text: `Account balance for ${userName} set to ${money(amountNum)}.` });
        } else {
          await api.adminDebit(uid, amountNum, allocNote);
          setMsg({ text: `Deducted ${money(amountNum)} from ${userName}.` });
        }
      }
      await load();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Allocation request failed.', bad: true });
    } finally {
      setAllocBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter(u => [u.name, u.email, u.account_no].some(v => v.toLowerCase().includes(s))) : users;
  }, [users, q]);

  // Unauthenticated Admin Portal Login (Institutional Minimalist)
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/95 p-8 shadow-xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <VantageLogo size={36} showText={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Restricted Workstation (/admin)
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              Firm Administration
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Capital allocation, fund disbursements, and portfolio risk oversight.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Administrator Email</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@vantage.local"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Security Credentials</span>
              </label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="••••••••••••"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={authBusy}
              className="w-full py-2.5 px-4 rounded-md font-semibold text-xs bg-slate-100 hover:bg-white text-slate-900 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{authBusy ? 'Verifying Credentials…' : 'Access Administration Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@vantage.local');
                setAdminPass('change-me-now');
                setTimeout(() => handleAdminLogin(), 50);
              }}
              className="w-full py-2 px-3 rounded text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Admin Access (Development)</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Return to Trader Terminal
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
      setMsg({
        text: t.kind === 'withdrawal'
          ? (action === 'approve' ? 'Withdrawal approved and marked dispatched.' : 'Withdrawal rejected. Funds returned to client balance.')
          : (action === 'approve' ? 'Deposit confirmed and credited to client ledger.' : 'Deposit notice rejected.')
      });
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
    }
    await load();
  };

  const RequestRow = ({ t }: { t: Tx }) => (
    <div className="flex flex-col gap-3 py-3 border-t border-slate-800 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-sm">
        <div className="font-semibold text-slate-100 font-mono">
          {money(t.amount)} <span className="font-normal font-sans text-slate-400">· {t.name} ({t.account_no})</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5 break-words">
          {t.kind === 'withdrawal'
            ? `To ${t.detail?.beneficiaryName} · ${t.detail?.bankName} · ABA ${t.detail?.routingNumber} · acct ${t.detail?.accountNumber || '••••' + t.detail?.accountLast4}`
            : `From ${t.detail?.originatorName || 'Client'}${t.detail?.originatingBankName ? ' · ' + t.detail.originatingBankName : ''}`}
          {' '}· Ref: <span className="font-mono text-slate-300">{t.ref}</span> · {when(t.created_at)}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => decide(t, 'approve')}
          className={`${btnCls} bg-emerald-600 hover:bg-emerald-500 text-white`}
        >
          {t.kind === 'withdrawal' ? 'Approve Transfer' : 'Confirm Funds'}
        </button>
        <button
          onClick={() => decide(t, 'reject')}
          className={`${btnCls} border border-slate-700 hover:bg-slate-800 text-slate-300`}
        >
          Reject
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 py-2">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Treasury & Administration Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Institutional capital allocation, depository transfer approvals, and client oversight.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('terminal')}
            className="rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            Open Trading Terminal →
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={cardCls}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Total Clients</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-100">{users.length}</div>
        </div>
        <div className={cardCls}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Transfers Pending Review</div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-400">{pendingW.length + pendingD.length}</div>
        </div>
        <div className={cardCls}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Total Client Capital</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-100">{money(totalBalance)}</div>
        </div>
      </div>

      {/* Status Notifications */}
      {msg && (
        <div className={`rounded-md p-3.5 text-xs sm:text-sm flex items-center justify-between border ${msg.bad ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          <div className="flex items-center gap-2">
            {msg.bad ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 text-xs sm:text-sm font-semibold">
        {([
          ['allocation', 'Capital Allocation Controller'],
          ['queue', `Transfer Queue (${pendingW.length + pendingD.length})`],
          ['clients', `Client Directory (${users.length})`],
          ['strategy', 'Strategy Analytics'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
              tab === id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: CAPITAL ALLOCATION CONTROLLER */}
      {tab === 'allocation' && (
        <div className="space-y-5">
          <section className={cardCls}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100">
                Direct Capital Allocation & Balance Controller
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Allocate, override, or adjust withdrawable trading capital on the institutional ledger with instant synchronization.
            </p>

            <form onSubmit={handleExecuteAllocation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Client Account</span>
                  </label>
                  <select
                    value={allocTargetId}
                    onChange={e => setAllocTargetId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="active">Active Session ({user?.name || 'Administrator'})</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.account_no}) — Current: {money(u.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operation Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Operation Type</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAllocMode('credit')}
                      className={`py-1.5 text-xs font-semibold rounded ${allocMode === 'credit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      + Add Funds
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocMode('set')}
                      className={`py-1.5 text-xs font-semibold rounded ${allocMode === 'set' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      = Set Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocMode('debit')}
                      className={`py-1.5 text-xs font-semibold rounded ${allocMode === 'debit' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      − Reduce
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount & Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capital Amount (USD)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Presets:
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {['10000', '25000', '50000', '100000', '250000', '500000', '1000000'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAllocAmount(p)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded border ${allocAmount === p ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
                    >
                      ${parseInt(p, 10).toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAllocAmount('0')}
                    className={`px-2 py-1 text-xs font-mono rounded border ${allocAmount === '0' ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400'}`}
                  >
                    $0 (Reset)
                  </button>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 50000.00"
                  value={allocAmount}
                  onChange={e => setAllocAmount(e.target.value)}
                  className={`${inputCls} text-base font-mono font-bold`}
                />
              </div>

              {/* Memo Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Audit Memo / Reason
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={allocNote}
                  onChange={e => setAllocNote(e.target.value)}
                  placeholder="e.g. Approved Capital Allocation"
                  className={inputCls}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={allocBusy}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {allocBusy
                      ? 'Executing Allocation…'
                      : `Authorize & Update Balance (${money(parseFloat(allocAmount) || 0)})`}
                  </span>
                </button>
              </div>
            </form>
          </section>

          {/* Quick Roster Table */}
          <section className={cardCls}>
            <h2 className="text-base font-bold text-slate-100 mb-3">
              Allocated Client Accounts
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 font-medium">Client Name</th>
                    <th className="py-2.5 font-medium">Email</th>
                    <th className="py-2.5 font-medium">Account ID</th>
                    <th className="py-2.5 font-medium text-right">Available Capital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-semibold text-slate-100">{u.name}</td>
                      <td className="py-2.5 text-slate-400">{u.email}</td>
                      <td className="py-2.5 font-mono text-slate-400">{u.account_no}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-100 text-right">{money(u.balance)}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">No client accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: TRANSFER QUEUE */}
      {tab === 'queue' && (
        <div className="space-y-4">
          <section className={cardCls}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-100 mb-1">
              <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Requests ({pendingW.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Review and approve outbound wire disbursements. Rejection returns reserved capital to client balance.
            </p>
            {pendingW.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No pending withdrawal requests awaiting review.</p>
            ) : (
              pendingW.map(t => <RequestRow key={t.id} t={t} />)
            )}
          </section>

          <section className={cardCls}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-100 mb-1">
              <ArrowDownToLine className="w-4 h-4 text-sky-400" />
              <span>Inbound Wire Deposit Notices ({pendingD.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Confirm only after incoming wire is verified settled at depository institution. Confirmation credits client ledger.
            </p>
            {pendingD.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No pending wire deposit notices.</p>
            ) : (
              pendingD.map(t => <RequestRow key={t.id} t={t} />)
            )}
          </section>

          <section className={cardCls}>
            <h2 className="text-base font-bold text-slate-100 mb-2">
              Recent Treasury Activity
            </h2>
            <ul className="divide-y divide-slate-800">
              {tx.slice(0, 15).map(t => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-slate-200 font-medium">
                      {t.name} · {kindLabel(t)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t.note ? `${t.note} · ` : ''}Ref: {t.ref} · {when(t.created_at)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-semibold font-mono text-slate-200">
                      {t.kind === 'deposit' ? '+' : '−'}{money(t.amount)}
                    </span>
                    <Badge s={t.status} />
                  </span>
                </li>
              ))}
              {tx.length === 0 && <li className="py-2 text-xs text-slate-500">No activity logged yet.</li>}
            </ul>
          </section>
        </div>
      )}

      {/* TAB 3: CLIENT DIRECTORY */}
      {tab === 'clients' && (
        <section className={cardCls}>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by client name, email, or account number…"
              className={`${inputCls} !pl-10`}
            />
          </div>

          <ul className="divide-y divide-slate-800">
            {filtered.map(u => (
              <li key={u.id}>
                <button
                  onClick={() => setOpenId(u.id)}
                  className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-slate-800/30 px-2 rounded transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-sm text-slate-100">{u.name}</span>
                    <span className="block truncate text-xs text-slate-400 font-mono">{u.email} · {u.account_no}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm font-mono text-slate-100">{money(u.balance)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-6 text-center text-xs text-slate-500">
                {users.length ? 'No clients match your search query.' : 'No registered clients found.'}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* TAB 4: STRATEGY ANALYTICS */}
      {tab === 'strategy' && report && (
        <section className={`${cardCls} overflow-x-auto`}>
          <h2 className="text-base font-bold text-slate-100 mb-1">
            Quantitative Model Analytics ({report.totalTrades} Closed Executions)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Audited trade performance data from discretionary and algorithmic strategies.
          </p>

          {([['Strategy Models', report.byStrategy], ['Traders & Desks', report.byUser]] as [string, Row[]][]).map(([label, rows]) => (
            <div key={label} className="mb-6 last:mb-0">
              <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">{label}</h3>
              <table className="w-full min-w-[480px] text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 font-medium">Identifier</th>
                    <th className="py-2 font-medium">Trades</th>
                    <th className="py-2 font-medium">Win Rate</th>
                    <th className="py-2 font-medium">Profit Factor</th>
                    <th className="text-right font-medium">Net Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.length === 0 ? (
                    <tr>
                      <td className="py-3 text-xs text-slate-500" colSpan={5}>No trade history recorded yet.</td>
                    </tr>
                  ) : (
                    rows.map(r => (
                      <tr key={r.name} className="hover:bg-slate-800/20">
                        <td className="py-2.5 font-medium text-slate-200">{r.name}</td>
                        <td className="py-2.5 font-mono">{r.trades}</td>
                        <td className="py-2.5 font-mono">{r.winRate}%</td>
                        <td className="py-2.5 font-mono">{r.profitFactor ?? '-'}</td>
                        <td className={`text-right font-mono font-bold ${r.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {money(r.pnl)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}

      {/* Client Detail Slide-Over Drawer */}
      {openId !== null && (
        <ClientPanel id={openId} onClose={() => setOpenId(null)} onChanged={load} />
      )}
    </div>
  );
};

// ---- Client Detail Drawer (Flat Institutional Style) ----
const ClientPanel: React.FC<{ id: number; onClose: () => void; onChanged: () => Promise<void> }> = ({ id, onClose, onChanged }) => {
  const [data, setData] = useState<{ user: AdminUser & { country: string }; tx: Tx[] } | null>(null);
  const [mode, setMode] = useState<'credit' | 'debit' | 'set' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.adminUserTx(id));
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const refresh = async () => {
    await load();
    await onChanged();
  };

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    setBusy(true);
    setMsg(null);
    try {
      const n = Number(amount);
      if (mode === 'set') {
        await api.adminSetBalance(id, n, note);
        setMsg({ text: `Balance set to ${money(n)}.` });
      } else if (mode === 'credit') {
        await api.adminCredit(id, n, note);
        setMsg({ text: `Credited ${money(n)}.` });
      } else {
        await api.adminDebit(id, n, note);
        setMsg({ text: `Deducted ${money(n)}.` });
      }
      setMode(null);
      setAmount('');
      setNote('');
      await refresh();
    } catch (err) {
      setMsg({ text: (err as Error).message, bad: true });
    } finally {
      setBusy(false);
    }
  };

  const decide = async (t: Tx, action: 'approve' | 'reject') => {
    try {
      await (t.kind === 'withdrawal' ? api.adminWithdrawal(t.id, action) : api.adminDeposit(t.id, action));
      setMsg({ text: action === 'approve' ? 'Request approved.' : 'Request rejected.' });
    } catch (err) {
      setMsg({ text: (err as Error).message, bad: true });
    }
    await refresh();
  };

  const reset = async () => {
    if (!window.confirm('Generate a temporary password for this client? Their existing password will be revoked.')) return;
    try {
      const r = await api.adminResetPassword(id);
      setMsg({ text: `Temporary password: ${r.temporaryPassword} (Provide this to the client).` });
    } catch (err) {
      setMsg({ text: (err as Error).message, bad: true });
    }
  };

  const open = data?.tx.filter(t => t.kind !== 'adjustment' && ['pending', 'processing'].includes(t.status)) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/70 backdrop-blur-xs" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Client Account Detail"
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-none overflow-y-auto rounded-t-2xl sm:rounded-none bg-slate-900 border-l border-slate-800 p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-100">{data?.user.name ?? 'Loading…'}</h2>
            {data && (
              <p className="truncate text-xs text-slate-400 font-mono mt-0.5">
                {data.user.email} · {data.user.account_no}{data.user.country ? ` · ${data.user.country}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {data && (
          <>
            {/* Balance Card */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Ledger Balance</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{money(data.user.balance)}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setMode('credit'); setMsg(null); }}
                  className="rounded bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Funds
                </button>
                <button
                  onClick={() => { setMode('set'); setMsg(null); }}
                  className="rounded bg-sky-600 hover:bg-sky-500 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-1"
                >
                  Set Exact
                </button>
                <button
                  onClick={() => { setMode('debit'); setMsg(null); }}
                  className="rounded border border-slate-700 hover:bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  Reduce
                </button>
              </div>
            </div>

            {/* Adjust Form */}
            {mode && (
              <form onSubmit={adjust} className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {mode === 'credit' ? 'Add Funds to Balance' : mode === 'set' ? 'Override Balance (Exact)' : 'Deduct Capital'}
                </h3>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="Amount (USD)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Reason / Note (optional)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className={inputCls}
                  maxLength={140}
                />
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    className="flex-1 rounded bg-sky-600 hover:bg-sky-500 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="rounded border border-slate-700 py-1.5 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {msg && (
              <p className={`rounded p-3 text-xs break-words ${msg.bad ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {msg.text}
              </p>
            )}

            {/* Pending Requests for this client */}
            {open.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Actions ({open.length})</h3>
                {open.map(t => (
                  <div key={t.id} className="py-2 border-t border-slate-800 first:border-t-0 space-y-2">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-100">{kindLabel(t)}: {money(t.amount)}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{t.ref}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => decide(t, 'approve')}
                        className="rounded bg-emerald-600 hover:bg-emerald-500 py-1 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(t, 'reject')}
                        className="rounded border border-slate-700 hover:bg-slate-800 py-1 text-xs text-slate-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ledger History</h3>
              <ul className="divide-y divide-slate-800">
                {data.tx.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                    <span className="min-w-0">
                      <span className="block text-slate-200 font-medium">{kindLabel(t)}</span>
                      <span className="block truncate text-[11px] text-slate-500">{t.note || t.ref} · {when(t.created_at)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="font-semibold font-mono text-slate-200">
                        {t.kind === 'deposit' ? '+' : '−'}{money(t.amount)}
                      </span>
                      <Badge s={t.status} />
                    </span>
                  </li>
                ))}
                {data.tx.length === 0 && <li className="py-2 text-xs text-slate-500">No activity yet.</li>}
              </ul>
            </div>

            <button
              onClick={reset}
              className="w-full rounded border border-slate-800 hover:bg-slate-800/60 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Issue Temporary Password</span>
            </button>
          </>
        )}
      </aside>
    </div>
  );
};
