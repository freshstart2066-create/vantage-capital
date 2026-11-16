import React, { useCallback, useEffect, useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { api, type AdminUser, type Tx, type Report, type Row } from '../../services/api';
import { VantageLogo } from '../VantageLogo';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const field = 'rounded-lg border border-slate-400/40 bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-brand)]';

export const AdminDashboard: React.FC = () => {
  const { user, setActiveTab, signIn, updateUserProfile } = useTrading();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  // Dedicated Admin Login State when accessing /admin directly
  const [adminEmail, setAdminEmail] = useState('admin@vantage.local');
  const [adminPass, setAdminPass] = useState('change-me-now');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const load = useCallback(async () => {
    try { setUsers(await api.adminUsers()); setTx(await api.adminTx()); setReport(await api.adminReport()); } catch (e) { setMsg((e as Error).message); }
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

  const credit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCredit(Number(userId), Number(amount), note);
      setMsg('Deposit added.'); setAmount(''); setNote(''); await load();
    } catch (err) { setMsg((err as Error).message); }
  };
  const decide = async (id: number, action: 'approve' | 'reject') => { await api.adminWithdrawal(id, action); await load(); };
  const pending = tx.filter(t => t.kind === 'withdrawal' && t.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Admin</h1>
      {msg && <p role="status" className="text-sm text-[var(--accent-brand)]">{msg}</p>}

      <section>
        <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Add funds to an account</h2>
        <form onSubmit={credit} className="flex flex-wrap gap-3">
          <select value={userId} onChange={e => setUserId(e.target.value)} className={field + ' min-w-56'} aria-label="User">
            <option value="">Choose a user</option>
            {users.map(u => <option key={u.id} value={u.id} className="text-slate-900">{u.name} ({u.account_no})</option>)}
          </select>
          <input type="number" min="0" step="0.01" placeholder="Amount (USD)" value={amount} onChange={e => setAmount(e.target.value)} className={field + ' w-40'} aria-label="Amount" />
          <input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className={field + ' flex-1 min-w-40'} aria-label="Note" />
          <button className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Add funds</button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Withdrawal requests ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No pending requests.</p> : pending.map(t => (
          <div key={t.id} className="flex items-center justify-between border-b border-slate-400/20 py-2 text-sm text-[var(--text-secondary)]">
            <span>{t.name} ({t.account_no}) requested {money(t.amount)}</span>
            <span className="flex gap-2">
              <button onClick={() => decide(t.id, 'approve')} className="rounded-md bg-emerald-600 px-3 py-1 text-white">Approve</button>
              <button onClick={() => decide(t.id, 'reject')} className="rounded-md border border-slate-400/50 px-3 py-1">Reject</button>
            </span>
          </div>
        ))}
      </section>

      {report && (
        <section className="overflow-x-auto">
          <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Strategy results ({report.totalTrades} closed trades)</h2>
          {([['Strategy', report.byStrategy], ['Trader', report.byUser]] as [string, Row[]][]).map(([label, rows]) => (
            <table key={label} className="w-full text-sm text-left text-[var(--text-secondary)] mb-6">
              <thead className="text-[var(--text-muted)]"><tr><th className="py-2">{label}</th><th>Trades</th><th>Win rate</th><th>Profit factor</th><th className="text-right">Net P&amp;L</th></tr></thead>
              <tbody>{rows.length === 0 ? <tr><td className="py-2 text-[var(--text-muted)]" colSpan={5}>No closed trades yet.</td></tr> : rows.map(r => (
                <tr key={r.name} className="border-t border-slate-400/20"><td className="py-2">{r.name}</td><td>{r.trades}</td><td>{r.winRate}%</td><td>{r.profitFactor ?? '-'}</td><td className={'text-right ' + (r.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{money(r.pnl)}</td></tr>))}</tbody>
            </table>
          ))}
        </section>
      )}

      <section className="overflow-x-auto">
        <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Users ({users.length})</h2>
        <table className="w-full text-sm text-left text-[var(--text-secondary)]">
          <thead className="text-[var(--text-muted)]"><tr><th className="py-2">Name</th><th>Email</th><th>Account</th><th className="text-right">Balance</th></tr></thead>
          <tbody>{users.map(u => <tr key={u.id} className="border-t border-slate-400/20"><td className="py-2">{u.name}</td><td>{u.email}</td><td>{u.account_no}</td><td className="text-right">{money(u.balance)}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="overflow-x-auto">
        <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Recent activity</h2>
        <table className="w-full text-sm text-left text-[var(--text-secondary)]">
          <tbody>{tx.slice(0, 25).map(t => <tr key={t.id} className="border-t border-slate-400/20"><td className="py-2">{new Date(t.created_at).toLocaleString()}</td><td>{t.name}</td><td className="capitalize">{t.kind}</td><td>{money(t.amount)}</td><td className="capitalize">{t.status}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
};
