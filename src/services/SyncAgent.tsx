import { useEffect, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { api, getToken } from './api';

// Keeps the server balance (admin deposits, withdrawals) and the terminal balance (trading P&L) in step.
export const SyncAgent = () => {
  const { user, account, adminSetAccountBalance } = useTrading();
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

  return null;
};
