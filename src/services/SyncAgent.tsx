import { useEffect, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { api, ApiError, getToken } from './api';

// Server ledger is the source of truth for real funds. This agent only READS it (balance + request statuses)
// and uploads simulated trade results for review. It never pushes a balance to the server.
export const SyncAgent = () => {
  const { user, applyServerLedger, reconcileRequests, signOut, closedTrades } = useTrading();
  const sentTrades = useRef(new Set<string>());
  const fns = useRef({ applyServerLedger, reconcileRequests, signOut });
  fns.current = { applyServerLedger, reconcileRequests, signOut };

  useEffect(() => {
    if (!user || !getToken()) return;
    let alive = true;
    const pull = async () => {
      try {
        const [me, txs] = await Promise.all([api.me(), api.transactions()]);
        if (!alive) return;
        fns.current.applyServerLedger(me.balance, me.email);
        fns.current.reconcileRequests(txs);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) fns.current.signOut(); // expired or invalid session
        /* otherwise: transient, retry next tick */
      }
    };
    void pull();
    const t = setInterval(pull, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload closed (simulated) trades in chunks so strategy results can be reviewed by the admin
  useEffect(() => {
    if (!user || !getToken()) return;
    const fresh = closedTrades.filter(t => !sentTrades.current.has(t.id)).slice(0, 200);
    if (!fresh.length) return;
    api.sendTrades(fresh).then(() => fresh.forEach(t => sentTrades.current.add(t.id))).catch(() => { /* retry on next change */ });
  }, [closedTrades, user]);

  return null;
};
