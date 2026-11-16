import { useEffect, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { api, getToken } from './api';

// Keeps the server balance (admin deposits, withdrawals) and the terminal balance (trading P&L) in step.
export const SyncAgent = () => {
  const { user, account, adminSetAccountBalance, closedTrades, withdrawalRequests } = useTrading();
  const sentTrades = useRef(new Set<string>());
  const seenWd = useRef<Set<string> | null>(null);
  const last = useRef<number | null>(null);
  const bal = useRef(account.balance);
  bal.current = account.balance;

  useEffect(() => {
    if (!user || !getToken()) { last.current = null; return; }
    let alive = true;
    const pull = async () => {
      try {
        const srv = (await api.me()).balance;
        if (!alive) return;
        if (last.current === null || (Math.abs(bal.current - last.current) < 0.005 && Math.abs(srv - last.current) >= 0.005)) {
          last.current = srv;
          if (Math.abs(bal.current - srv) >= 0.005) adminSetAccountBalance(srv);
        }
      } catch { /* offline: retry next tick */ }
    };
    void pull();
    const t = setInterval(pull, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (last.current === null || !getToken()) return;
    const delta = account.balance - last.current;
    if (Math.abs(delta) < 0.005) return;
    const prev = last.current;
    last.current = account.balance;
    api.adjust(delta).catch(() => { last.current = prev; });
  }, [account.balance]);

  // Upload closed trades so strategy results can be reviewed by the admin
  useEffect(() => {
    if (!user || !getToken()) return;
    const fresh = closedTrades.filter(t => !sentTrades.current.has(t.id));
    if (!fresh.length) return;
    api.sendTrades(fresh).then(() => fresh.forEach(t => sentTrades.current.add(t.id))).catch(() => {});
  }, [closedTrades, user]);

  // Send new withdrawal requests to the admin queue (requests that existed before sign-in are skipped)
  useEffect(() => {
    if (!user || !getToken()) { seenWd.current = null; return; }
    if (seenWd.current === null) { seenWd.current = new Set(withdrawalRequests.map(w => w.id)); return; }
    for (const w of withdrawalRequests) {
      if (seenWd.current.has(w.id)) continue;
      seenWd.current.add(w.id);
      api.withdrawalRequest(w.amount).catch(() => {});
    }
  }, [withdrawalRequests, user]);

  return null;
};
