import React, { useCallback, useEffect, useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { api, type AdminUser, type Tx } from '../../services/api';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const field = 'rounded-lg border border-slate-400/40 bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-brand)]';

export const AdminDashboard: React.FC = () => {
  const { user } = useTrading();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try { setUsers(await api.adminUsers()); setTx(await api.adminTx()); } catch (e) { setMsg((e as Error).message); }
  }, []);
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user, load]);

  if (user?.role !== 'admin') return <p className="p-8 text-sm text-[var(--text-muted)]">This page is for administrators.</p>;

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
