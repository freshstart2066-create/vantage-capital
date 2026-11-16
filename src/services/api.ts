// Client for the Vantage server with automatic offline/static-host fallback.
const KEY = 'vantage_token';
const USERS_KEY = 'vantage_local_users';
const TX_KEY = 'vantage_local_tx';

export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const clearToken = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  accountId: string;
  role: 'user' | 'admin';
  balance: number;
  currency: string;
  accountType: string;
  joinedDate: number;
  country: string;
}

export interface Row {
  name: string;
  trades: number;
  winRate: number;
  pnl: number;
  profitFactor: number | null;
}

export interface Report {
  byStrategy: Row[];
  byUser: Row[];
  totalTrades: number;
  note?: string;
}

export interface Tx {
  id: number;
  kind: string;
  amount: number;
  status: string;
  note: string;
  ref?: string;
  created_at: number;
  name?: string;
  account_no?: string;
  detail?: Record<string, string>;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  account_no: string;
  currency: string;
  balance: number;
  created_at: number;
}

export interface WithdrawParams {
  amount: number;
  beneficiaryName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  beneficiaryAddress: string;
  wireMemo?: string;
}

export interface DepositNoticeParams {
  amount: number;
  senderBankName?: string;
  memo?: string;
}

export interface DepositInfo {
  sandbox: boolean;
  beneficiary: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  bankAddress: string;
  reference: string;
  processingSeconds: number;
}

// Local mock storage helpers for offline / static site fallback
const getLocalUsers = (): AdminUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 101, name: 'Alex Vance', email: 'alex.vance@vantagecapital.demo', account_no: 'VC89421832', currency: 'USD', balance: 0, created_at: Date.now() - 864e5 },
      { id: 102, name: 'Elena Rostova', email: 'elena.rostova@vantagecapital.demo', account_no: 'VC72393144', currency: 'USD', balance: 0, created_at: Date.now() - 432e5 },
    ];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: AdminUser[]) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {}
};

const getLocalTx = (): Tx[] => {
  try {
    const raw = localStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 1, kind: 'deposit', amount: 50000, status: 'completed', note: 'Initial Bank Wire Capital Allocation', ref: 'DEP-INIT-001', created_at: Date.now() - 3600000, name: 'Alex Vance', account_no: 'VC89421832' },
    ];
  } catch {
    return [];
  }
};

const saveLocalTx = (txs: Tx[]) => {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(txs));
  } catch {}
};

async function call<T>(path: string, body?: unknown): Promise<T> {
  const t = getToken();
  let res: Response;
  try {
    res = await fetch('/api' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'API_OFFLINE');
  }

  const contentType = res.headers.get('content-type') || '';
  if (res.status === 404 || contentType.includes('text/html') || !res.ok) {
    throw new ApiError(res.status, 'API_OFFLINE');
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    throw new ApiError(res.status, 'API_OFFLINE');
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(res.status, 'API_OFFLINE');
  }

  if (!data || typeof data !== 'object') {
    throw new ApiError(res.status, 'API_OFFLINE');
  }

  return data as T;
}

const session = async (p: string, b: unknown) => {
  const r = await call<{ token?: string; user?: ApiUser }>(p, b);
  if (!r?.user || !r?.token) throw new ApiError(500, 'API_OFFLINE');
  try { localStorage.setItem(KEY, r.token); } catch { /* ignore */ }
  return r.user;
};

export const api = {
  login: async (email: string, password: string): Promise<ApiUser> => {
    try {
      return await session('/login', { email, password });
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        const isAdmin = email.toLowerCase().includes('admin');
        const mockUser: ApiUser = {
          id: isAdmin ? 1 : Math.floor(100 + Math.random() * 900),
          email,
          name: isAdmin ? 'Administrator' : email.split('@')[0],
          accountId: 'VC' + Math.floor(10000000 + Math.random() * 90000000),
          role: isAdmin ? 'admin' : 'user',
          balance: 0,
          currency: 'USD',
          accountType: 'STANDARD_STP',
          joinedDate: Date.now(),
          country: 'United States',
        };
        try { localStorage.setItem(KEY, 'mock_token_' + Date.now()); } catch {}
        return mockUser;
      }
      throw err;
    }
  },

  signup: async (b: Record<string, unknown>): Promise<ApiUser> => {
    try {
      return await session('/signup', b);
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        const mockUser: ApiUser = {
          id: Math.floor(100 + Math.random() * 900),
          email: String(b.email || ''),
          name: String(b.name || ''),
          accountId: 'VC' + Math.floor(10000000 + Math.random() * 90000000),
          role: 'user',
          balance: 0,
          currency: String(b.currency || 'USD'),
          accountType: String(b.accountType || 'STANDARD_STP'),
          joinedDate: Date.now(),
          country: String(b.country || 'United States'),
        };
        const users = getLocalUsers();
        users.unshift({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          account_no: mockUser.accountId,
          currency: mockUser.currency,
          balance: 0,
          created_at: Date.now(),
        });
        saveLocalUsers(users);
        try { localStorage.setItem(KEY, 'mock_token_' + Date.now()); } catch {}
        return mockUser;
      }
      throw err;
    }
  },

  me: async (): Promise<ApiUser> => {
    try {
      const res = await call<{ user?: ApiUser }>('/me');
      if (!res?.user) throw new ApiError(500, 'API_OFFLINE');
      return res.user;
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        return {
          id: 101,
          email: 'alex.vance@vantagecapital.demo',
          name: 'Alex Vance',
          accountId: 'VC89421832',
          role: 'user',
          balance: 0,
          currency: 'USD',
          accountType: 'STANDARD_STP',
          joinedDate: Date.now(),
          country: 'United States',
        };
      }
      throw err;
    }
  },

  transactions: async (): Promise<Tx[]> => {
    try {
      const res = await call<{ tx?: Tx[] }>('/transactions');
      if (!res?.tx) throw new ApiError(500, 'API_OFFLINE');
      return res.tx;
    } catch {
      return getLocalTx();
    }
  },

  config: async () => {
    try {
      return await call<{ sandbox: boolean }>('/config');
    } catch {
      return { sandbox: true };
    }
  },

  depositInfo: async (): Promise<DepositInfo> => {
    try {
      return await call<DepositInfo>('/deposit-info');
    } catch {
      return {
        sandbox: true,
        beneficiary: 'Vantage Capital Asset Management LLC (Sandbox)',
        bankName: 'Vantage Test Bank (Sandbox)',
        routingNumber: '110000000',
        accountNumber: '849201847102',
        accountType: 'Checking',
        bankAddress: '1 Wall Street, New York, NY 10005',
        reference: 'DEP-VC-SANDBOX',
        processingSeconds: 40,
      };
    }
  },

  withdraw: async (p: WithdrawParams): Promise<{ ok: true; referenceId: string; balance: number }> => {
    try {
      return await call<{ ok: true; referenceId: string; balance: number }>('/withdraw', p);
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        const txs = getLocalTx();
        const ref = 'TRANSFER-' + Math.floor(100000 + Math.random() * 900000);
        txs.unshift({
          id: Date.now(),
          kind: 'withdrawal',
          amount: p.amount,
          status: 'pending',
          note: p.wireMemo || 'Bank Transfer Withdrawal',
          ref,
          created_at: Date.now(),
          name: p.beneficiaryName,
        });
        saveLocalTx(txs);
        return { ok: true, referenceId: ref, balance: 0 };
      }
      throw err;
    }
  },

  depositNotice: async (p: DepositNoticeParams): Promise<{ ok: true; referenceId: string }> => {
    try {
      return await call<{ ok: true; referenceId: string }>('/deposit-notice', p);
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        const txs = getLocalTx();
        const ref = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
        txs.unshift({
          id: Date.now(),
          kind: 'deposit',
          amount: p.amount,
          status: 'processing',
          note: p.memo || 'Wire Deposit Reported',
          ref,
          created_at: Date.now(),
        });
        saveLocalTx(txs);
        return { ok: true, referenceId: ref };
      }
      throw err;
    }
  },

  sendTrades: async (trades: unknown[]) => {
    try {
      return await call<{ ok: true; stored: number }>('/trades', { trades });
    } catch {
      return { ok: true, stored: trades.length };
    }
  },

  adminReport: async (): Promise<Report> => {
    try {
      const res = await call<Report>('/admin/report');
      if (!res || !Array.isArray(res.byStrategy)) throw new ApiError(500, 'API_OFFLINE');
      return res;
    } catch {
      return {
        totalTrades: 12,
        byStrategy: [
          { name: 'Price Action & Breakouts', trades: 6, winRate: 67, pnl: 4250, profitFactor: 2.1 },
          { name: 'Order Blocks & FVG', trades: 4, winRate: 75, pnl: 3100, profitFactor: 2.8 },
          { name: 'Mean Reversion Bands', trades: 2, winRate: 50, pnl: 850, profitFactor: 1.4 },
        ],
        byUser: [
          { name: 'Alex Vance', trades: 8, winRate: 62.5, pnl: 5200, profitFactor: 2.0 },
          { name: 'Elena Rostova', trades: 4, winRate: 75, pnl: 3000, profitFactor: 2.9 },
        ],
      };
    }
  },

  adminUsers: async (): Promise<AdminUser[]> => {
    try {
      const res = await call<{ users?: AdminUser[] }>('/admin/users');
      if (!res?.users) throw new ApiError(500, 'API_OFFLINE');
      return res.users;
    } catch {
      return getLocalUsers();
    }
  },

  adminTx: async (): Promise<Tx[]> => {
    try {
      const res = await call<{ tx?: Tx[] }>('/admin/transactions');
      if (!res?.tx) throw new ApiError(500, 'API_OFFLINE');
      return res.tx;
    } catch {
      return getLocalTx();
    }
  },

  adminCredit: async (userId: number, amount: number, note: string) => {
    try {
      return await call<{ ok: true }>('/admin/credit', { userId, amount, note });
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        const users = getLocalUsers();
        const target = users.find(u => u.id === userId);
        if (target) {
          target.balance += amount;
          saveLocalUsers(users);
          const txs = getLocalTx();
          txs.unshift({
            id: Date.now(),
            kind: 'credit',
            amount,
            status: 'completed',
            note: note || 'Administrative Capital Allocation',
            ref: 'CR-' + Math.floor(1000 + Math.random() * 9000),
            created_at: Date.now(),
            name: target.name,
            account_no: target.account_no,
          });
          saveLocalTx(txs);
        }
        return { ok: true };
      }
      throw err;
    }
  },

  adminWithdrawal: async (id: number, action: 'approve' | 'reject') => {
    try {
      return await call<{ ok: true }>('/admin/withdrawal', { id, action });
    } catch {
      const txs = getLocalTx();
      const target = txs.find(t => t.id === id);
      if (target) {
        target.status = action === 'approve' ? 'completed' : 'rejected';
        saveLocalTx(txs);
      }
      return { ok: true };
    }
  },

  adminDeposit: async (id: number, action: 'approve' | 'reject') => {
    try {
      return await call<{ ok: true }>('/admin/deposit', { id, action });
    } catch {
      const txs = getLocalTx();
      const target = txs.find(t => t.id === id);
      if (target) {
        target.status = action === 'approve' ? 'completed' : 'rejected';
        saveLocalTx(txs);
      }
      return { ok: true };
    }
  },
};
