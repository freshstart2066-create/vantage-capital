const KEY = 'vantage_token';
const USERS_KEY = 'vantage_local_users';
const TX_KEY = 'vantage_local_tx';

export const getToken = () => localStorage.getItem(KEY);
export const clearToken = () => localStorage.removeItem(KEY);

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

export interface Tx {
  id: number;
  kind: string;
  amount: number;
  status: string;
  note: string;
  created_at: number;
  name?: string;
  account_no?: string;
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
      { id: 1, kind: 'deposit', amount: 50000, status: 'approved', note: 'Wire Transfer Reference DEP-VC-89421', created_at: Date.now() - 3600000, name: 'Alex Vance', account_no: 'VC89421832' },
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
  try {
    const res = await fetch('/api' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 404) {
      throw new Error('API_404_OFFLINE');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as T;
  } catch (err: unknown) {
    if ((err as Error).message === 'API_404_OFFLINE' || (err as Error).message.includes('fetch')) {
      throw new Error('API_OFFLINE');
    }
    throw err;
  }
}

const session = async (p: string, b: unknown) => {
  const r = await call<{ token: string; user: ApiUser }>(p, b);
  localStorage.setItem(KEY, r.token);
  return r.user;
};

export const api = {
  login: async (email: string, password: string): Promise<ApiUser> => {
    try {
      return await session('/login', { email, password });
    } catch (err: unknown) {
      if ((err as Error).message === 'API_OFFLINE') {
        // Fallback for static hosting
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
        localStorage.setItem(KEY, 'mock_token_' + Date.now());
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
        localStorage.setItem(KEY, 'mock_token_' + Date.now());
        return mockUser;
      }
      throw err;
    }
  },

  me: async (): Promise<ApiUser> => {
    try {
      return await call<{ user: ApiUser }>('/me').then(r => r.user);
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

  adjust: async (delta: number) => {
    try {
      return await call<{ balance: number }>('/account/adjust', { delta });
    } catch {
      return { balance: 0 };
    }
  },

  withdraw: async (amount: number, note?: string) => {
    try {
      return await call<{ balance: number }>('/withdraw', { amount, note });
    } catch {
      return { balance: 0 };
    }
  },

  transactions: async (): Promise<Tx[]> => {
    try {
      return await call<{ tx: Tx[] }>('/transactions').then(r => r.tx);
    } catch {
      return getLocalTx();
    }
  },

  adminUsers: async (): Promise<AdminUser[]> => {
    try {
      return await call<{ users: AdminUser[] }>('/admin/users').then(r => r.users);
    } catch {
      return getLocalUsers();
    }
  },

  adminTx: async (): Promise<Tx[]> => {
    try {
      return await call<{ tx: Tx[] }>('/admin/transactions').then(r => r.tx);
    } catch {
      return getLocalTx();
    }
  },

  adminCredit: async (userId: number, amount: number, note: string) => {
    try {
      return await call('/admin/credit', { userId, amount, note });
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
      return await call('/admin/withdrawal', { id, action });
    } catch {
      const txs = getLocalTx();
      const target = txs.find(t => t.id === id);
      if (target) {
        target.status = action === 'approve' ? 'approved' : 'rejected';
        saveLocalTx(txs);
      }
      return { ok: true };
    }
  },
};
