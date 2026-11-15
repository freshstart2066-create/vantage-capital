import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type {
  Instrument,
  Position,
  PendingOrder,
  ClosedTrade,
  AccountState,
  Candle,
  Timeframe,
  OrderDirection,
  PendingOrderType,
  ActiveTab,
  StrategyStats,
  UserProfile,
  PriceAlert,
  CurrencyStrength,
  ReplayState,
  PropEvaluationState,
  WithdrawalRequest,
  DepositRequest,
  ManagedClient,
} from '../types/trading';
import { INITIAL_INSTRUMENTS } from '../data/initialInstruments';
import {
  generateHistoricalCandles,
  fetchLiveMarketRates,
  simulateTick,
} from '../services/marketEngine';

const STORAGE_KEYS = {
  ACCOUNT: 'vantage_account_state',
  POSITIONS: 'vantage_positions',
  PENDING: 'vantage_pending_orders',
  CLOSED: 'vantage_closed_trades',
  THEME: 'color-scheme',
  TAGS: 'vantage_strategy_tags',
  SETTINGS: 'vantage_user_settings',
  USER: 'vantage_user_session',
  ALERTS: 'vantage_price_alerts',
  PROP_EVAL: 'vantage_prop_evaluation',
  WITHDRAWALS: 'vantage_wire_withdrawals',
  DEPOSITS: 'vantage_deposits',
  CLIENTS: 'vantage_clients',
};

const DEFAULT_STARTING_BALANCE = 0;

const DEFAULT_STRATEGY_TAGS = [
  'Pullback EMA 20/50',
  'Key Level Breakout',
  'Support/Resistance Bounce',
  'Order Block Reversal',
  'High-Volatility Scalp',
  'Trend Continuation',
  'Custom Method Testing',
];

interface TradingContextType {
  instruments: Instrument[];
  activeInstrument: Instrument;
  candles: Candle[];
  timeframe: Timeframe;
  positions: Position[];
  pendingOrders: PendingOrder[];
  closedTrades: ClosedTrade[];
  account: AccountState;
  activeTab: ActiveTab;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  strategyTags: string[];
  soundEnabled: boolean;
  slippageEnabled: boolean;
  liveFeedConnected: boolean;
  stats: StrategyStats;
  toastMessage: { text: string; type: 'success' | 'danger' | 'info' } | null;
  user: UserProfile | null;

  // New Institutional Features
  priceAlerts: PriceAlert[];
  currencyStrengths: CurrencyStrength[];
  replayState: ReplayState;
  propEvaluation: PropEvaluationState;

  // Actions
  signIn: (email: string, name?: string, tier?: string) => void;
  signUp: (
    name: string,
    email: string,
    tier: string,
    strategyFocus?: string,
    accountType?: 'ECN_RAW' | 'STANDARD_STP',
    baseCurrency?: 'USD' | 'EUR' | 'GBP'
  ) => void;
  signOut: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setActiveInstrument: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSound: () => void;
  toggleSlippage: () => void;
  addStrategyTag: (tag: string) => void;
  executeMarketOrder: (
    direction: OrderDirection,
    lots: number,
    leverage: number,
    sl?: number,
    tp?: number,
    strategyTag?: string,
    notes?: string
  ) => boolean;
  placePendingOrder: (
    type: PendingOrderType,
    triggerPrice: number,
    lots: number,
    leverage: number,
    sl?: number,
    tp?: number,
    strategyTag?: string
  ) => boolean;
  closePosition: (id: string, reason?: 'MANUAL' | 'TP_HIT' | 'SL_HIT') => void;
  closeAllPositions: () => void;
  cancelPendingOrder: (id: string) => void;
  modifyPosition: (id: string, sl?: number, tp?: number) => void;
  resetAccount: (newBalance?: number) => void;
  exportTradesToCSV: () => void;
  clearToast: () => void;

  // Price Alert Actions
  addPriceAlert: (targetPrice: number, condition: 'ABOVE' | 'BELOW', note?: string) => void;
  removePriceAlert: (id: string) => void;

  // Bar Replay Engine Actions
  startReplay: (startIndex?: number) => void;
  stepReplay: () => void;
  togglePlayReplay: () => void;
  setReplaySpeed: (speed: 1 | 2 | 5) => void;
  exitReplay: () => void;

  // Strategy Pre-Deployment Risk Guard Actions
  setPropTier: (tier: number) => void;
  resetPropEvaluation: () => void;

  // USA Local Wire Transfer Withdrawals
  withdrawalRequests: WithdrawalRequest[];
  requestWireWithdrawal: (params: {
    amount: number;
    beneficiaryName: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    beneficiaryAddress: string;
    wireMemo?: string;
  }) => { success: boolean; error?: string; referenceId?: string };

  // Incoming Wire Deposits
  depositRequests: DepositRequest[];
  requestWireDeposit: (params: {
    amount: number;
    originatorName: string;
    originatingBankName: string;
    originatingRoutingNumber: string;
    imadOmad?: string;
    wireMemo?: string;
  }) => void;

  // Managed Clients (AUM)
  managedClients: ManagedClient[];
  allocateStrategyToClient: (clientId: string, strategyName: string) => void;

  // Administrative Capital Allocation Action
  adminSetAccountBalance: (newBalance: number, targetAccountId?: string, memo?: string) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Web Audio API beep for tactile physical trading desk feedback
function playTradingSound(type: 'buy' | 'sell' | 'close' | 'win' | 'alert') {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'buy') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'sell') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.12); // D5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'win') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.09); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // Ignore audio restrictions
  }
}

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage
  const [instruments, setInstruments] = useState<Instrument[]>(INITIAL_INSTRUMENTS);
  const [activeSymbol, setActiveSymbol] = useState<string>('EUR/USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) return 'terminal';
    } catch {}
    return 'auth'; // Login screen is the FIRST to be seen!
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [slippageEnabled, setSlippageEnabled] = useState<boolean>(true);
  const [liveFeedConnected, setLiveFeedConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // User Authentication State — defaults to null (no user logged in)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Strategy Tags
  const [strategyTags, setStrategyTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      return saved ? JSON.parse(saved) : DEFAULT_STRATEGY_TAGS;
    } catch {
      return DEFAULT_STRATEGY_TAGS;
    }
  });

  // Account State
  const [account, setAccount] = useState<AccountState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      balance: DEFAULT_STARTING_BALANCE,
      equity: DEFAULT_STARTING_BALANCE,
      margin: 0,
      freeMargin: DEFAULT_STARTING_BALANCE,
      marginLevel: 0,
      startingBalance: DEFAULT_STARTING_BALANCE,
      currency: 'USD',
    };
  });

  // Positions
  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Pending Orders
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PENDING);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Closed Trades
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLOSED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Strategy Pre-Deployment Risk Guard State
  const [propEvaluation, setPropEvaluation] = useState<PropEvaluationState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROP_EVAL);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      tier: DEFAULT_STARTING_BALANCE,
      profitTargetPercent: 10,
      maxDailyLossPercent: 5,
      maxTotalDrawdownPercent: 10,
      currentDayLoss: 0,
      currentDrawdown: 0,
      peakEquity: DEFAULT_STARTING_BALANCE,
      status: 'IN_PROGRESS',
    };
  });

  // USA Local Wire Transfer Withdrawals State
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'wd_initial_1',
        referenceId: 'FEDWIRE-784102',
        amount: 2500,
        fee: 0,
        netAmount: 2500,
        beneficiaryName: 'Alex Vance',
        bankName: 'JPMorgan Chase Bank, N.A.',
        routingNumber: '021000021',
        accountNumberMasked: '•••• 8912',
        accountType: 'CHECKING',
        beneficiaryAddress: '383 Madison Ave, New York, NY 10017',
        wireMemo: 'Capital Performance Payout',
        timestamp: Date.now() - 3 * 24 * 3600 * 1000,
        status: 'SETTLED',
        estimatedArrival: 'Settled via Fedwire',
      },
    ];
  });

  // Incoming Wire Deposit State
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'dep_initial_1',
        referenceId: 'DEP-VC-89421',
        amount: 50000,
        originatorName: 'Alex Vance',
        originatingBankName: 'JPMorgan Chase Bank, N.A.',
        originatingRoutingNumber: '021000021',
        imadOmad: '20241115MMQFMPBJ000091',
        wireMemo: 'Initial Capital Deposit',
        timestamp: Date.now() - 14 * 24 * 3600 * 1000,
        status: 'SETTLED',
      },
    ];
  });

  // Managed Clients (AUM) State
  const [managedClients, setManagedClients] = useState<ManagedClient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'client_1',
        name: 'Harrison Family Trust',
        accountId: 'VC-C-00291',
        mandateType: 'SOVEREIGN',
        allocatedCapital: 250000,
        currentEquity: 267450,
        strategyName: 'Global Macro Diversified',
        deployedAt: Date.now() - 90 * 24 * 3600 * 1000,
        managementFeePct: 1.5,
        incentiveFeePct: 20,
        highWaterMark: 267450,
        status: 'ACTIVE',
      },
      {
        id: 'client_2',
        name: 'Meridian Capital Partners LLC',
        accountId: 'VC-C-00482',
        mandateType: 'INSTITUTIONAL_PRIME',
        allocatedCapital: 100000,
        currentEquity: 108920,
        strategyName: 'Systematic Trend Following',
        deployedAt: Date.now() - 60 * 24 * 3600 * 1000,
        managementFeePct: 1.0,
        incentiveFeePct: 15,
        highWaterMark: 108920,
        status: 'ACTIVE',
      },
      {
        id: 'client_3',
        name: 'Pacific Coast Endowment Fund',
        accountId: 'VC-C-00611',
        mandateType: 'ACCREDITED',
        allocatedCapital: 50000,
        currentEquity: 49100,
        strategyName: 'Balanced Risk Allocation',
        deployedAt: Date.now() - 45 * 24 * 3600 * 1000,
        managementFeePct: 1.0,
        incentiveFeePct: 10,
        highWaterMark: 51200,
        status: 'ACTIVE',
      },
      {
        id: 'client_4',
        name: 'Blackthorn Private Wealth',
        accountId: 'VC-C-00784',
        mandateType: 'PRIVATE_WEALTH',
        allocatedCapital: 10000,
        currentEquity: 10000,
        strategyName: 'Conservative Income Strategy',
        deployedAt: Date.now() - 2 * 24 * 3600 * 1000,
        managementFeePct: 1.5,
        incentiveFeePct: 10,
        highWaterMark: 10000,
        status: 'PENDING_DEPLOYMENT',
      },
    ];
  });

  // Theme Management (following modern-web-guidance)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    return systemIsDark ? 'dark' : 'light';
  }, [theme, systemIsDark]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (newTheme === 'system') {
      try {
        localStorage.removeItem(STORAGE_KEYS.THEME);
      } catch {}
      if (meta) meta.setAttribute('content', 'light dark');
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      } catch {}
      if (meta) meta.setAttribute('content', newTheme);
    }
  };

  // Find active instrument
  const activeInstrument = useMemo(() => {
    return instruments.find(i => i.symbol === activeSymbol) || instruments[0];
  }, [instruments, activeSymbol]);

  // Raw historical candles dataset
  const [rawCandles, setRawCandles] = useState<Candle[]>(() => {
    return generateHistoricalCandles(INITIAL_INSTRUMENTS[0], '5M', 130);
  });

  // Bar Replay Engine State
  const [replayState, setReplayState] = useState<ReplayState>({
    isActive: false,
    isPlaying: false,
    currentIndex: 80,
    totalCandles: 130,
    speed: 1,
  });

  // Update raw candles when symbol or timeframe changes
  useEffect(() => {
    const fresh = generateHistoricalCandles(activeInstrument, timeframe, 130);
    setRawCandles(fresh);
    setReplayState(prev => ({
      ...prev,
      totalCandles: fresh.length,
      currentIndex: prev.isActive ? Math.min(prev.currentIndex, fresh.length - 1) : fresh.length - 1,
    }));
  }, [activeSymbol, timeframe]);

  // Derived visible candles: sliced if Replay mode is active
  const candles = useMemo(() => {
    if (!replayState.isActive) return rawCandles;
    return rawCandles.slice(0, replayState.currentIndex + 1);
  }, [rawCandles, replayState.isActive, replayState.currentIndex]);

  // Persist storage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
      localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pendingOrders));
      localStorage.setItem(STORAGE_KEYS.CLOSED, JSON.stringify(closedTrades));
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(strategyTags));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(priceAlerts));
      localStorage.setItem(STORAGE_KEYS.PROP_EVAL, JSON.stringify(propEvaluation));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawalRequests));
      localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(depositRequests));
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(managedClients));
    } catch {}
  }, [account, positions, pendingOrders, closedTrades, strategyTags, priceAlerts, propEvaluation, withdrawalRequests, depositRequests, managedClients]);

  // 2. Live Market Feed Fetcher (anchors to real live rates)
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      const rates = await fetchLiveMarketRates();
      if (!isMounted) return;
      if (Object.keys(rates).length > 0) {
        setLiveFeedConnected(true);
        setInstruments(prev =>
          prev.map(inst => {
            const livePrice = rates[inst.symbol];
            if (livePrice && livePrice > 0) {
              const diff = (inst.spread * inst.pipSize) / 2;
              return {
                ...inst,
                currentPrice: Number(livePrice.toFixed(inst.digits)),
                bid: Number((livePrice - diff).toFixed(inst.digits)),
                ask: Number((livePrice + diff).toFixed(inst.digits)),
                isRealtime: true,
              };
            }
            return inst;
          })
        );
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Poll live anchor rates every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 3. High-Frequency Tick Simulation Engine (Micro-ticks every 450ms for realistic action)
  const instrumentsRef = useRef(instruments);
  instrumentsRef.current = instruments;

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const pendingRef = useRef(pendingOrders);
  pendingRef.current = pendingOrders;

  const accountRef = useRef(account);
  accountRef.current = account;

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    const tickInterval = setInterval(() => {
      // Choose 1 to 3 random instruments to tick in each cycle
      setInstruments(prev => {
        return prev.map(inst => {
          // 40% probability of tick per cycle
          if (Math.random() < 0.4 || inst.symbol === activeSymbol) {
            return simulateTick(inst);
          }
          return inst;
        });
      });
    }, 550);

    return () => clearInterval(tickInterval);
  }, [activeSymbol]);

  // Update current open candle on every tick of active instrument (when not in replay)
  useEffect(() => {
    if (replayState.isActive) return;
    setRawCandles(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const price = activeInstrument.currentPrice;
      const updated = {
        ...last,
        close: price,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        volume: last.volume + 1,
      };
      return [...prev.slice(0, -1), updated];
    });
  }, [activeInstrument.currentPrice, replayState.isActive]);

  // Bar Replay Engine Auto-Play Timer
  useEffect(() => {
    if (!replayState.isActive || !replayState.isPlaying) return;

    const intervalMs = Math.max(250, Math.floor(1200 / replayState.speed));
    const timer = setInterval(() => {
      setReplayState(prev => {
        if (prev.currentIndex >= rawCandles.length - 1) {
          setToastMessage({ text: 'Bar Replay reached the latest market candle.', type: 'info' });
          return { ...prev, isPlaying: false };
        }
        const nextIdx = prev.currentIndex + 1;
        const replayBar = rawCandles[nextIdx];
        if (replayBar) {
          setInstruments(insts =>
            insts.map(inst => {
              if (inst.symbol === activeSymbol) {
                const diff = (inst.spread * inst.pipSize) / 2;
                return {
                  ...inst,
                  currentPrice: replayBar.close,
                  bid: Number((replayBar.close - diff).toFixed(inst.digits)),
                  ask: Number((replayBar.close + diff).toFixed(inst.digits)),
                };
              }
              return inst;
            })
          );
        }
        return { ...prev, currentIndex: nextIdx };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [replayState.isActive, replayState.isPlaying, replayState.speed, rawCandles, activeSymbol]);

  // Price Alerts Trigger Engine
  useEffect(() => {
    if (priceAlerts.length === 0) return;
    let hasAlertFired = false;

    setPriceAlerts(prev =>
      prev.map(alert => {
        if (alert.triggered) return alert;
        const inst = instruments.find(i => i.symbol === alert.symbol);
        if (!inst) return alert;

        const isHit =
          (alert.condition === 'ABOVE' && inst.currentPrice >= alert.targetPrice) ||
          (alert.condition === 'BELOW' && inst.currentPrice <= alert.targetPrice);

        if (isHit) {
          hasAlertFired = true;
          setToastMessage({
            text: `🔔 Price Alert Triggered: ${alert.symbol} reached ${alert.targetPrice}${alert.note ? ` (${alert.note})` : ''}`,
            type: 'info',
          });
          return { ...alert, triggered: true };
        }
        return alert;
      })
    );

    if (hasAlertFired && soundEnabled) {
      playTradingSound('alert');
    }
  }, [instruments, soundEnabled]);

  // 4. Position P&L & TP/SL Engine Loop
  useEffect(() => {
    const currentInstruments = instruments;
    let newPositions = [...positions];
    let newClosedTrades = [...closedTrades];
    let hasClosed = false;

    // Check TP/SL triggers and update floating P&L
    newPositions = newPositions.map(pos => {
      const inst = currentInstruments.find(i => i.symbol === pos.symbol);
      if (!inst) return pos;

      const currentPrice = pos.direction === 'BUY' ? inst.bid : inst.ask;
      const priceDiff = pos.direction === 'BUY' ? currentPrice - pos.openPrice : pos.openPrice - currentPrice;
      const pnlPips = Number((priceDiff / inst.pipSize).toFixed(1));

      // Calculate Dollar P&L
      let pnl = 0;
      if (inst.category === 'forex') {
        // Standard forex formula: (Price diff / current price or pip value) * lots * contract size
        // For USD quote (EUR/USD, GBP/USD), 1 pip = $10 per 1.0 lot
        if (pos.symbol.endsWith('/USD')) {
          pnl = pnlPips * 10 * pos.lots;
        } else if (pos.symbol.startsWith('USD/')) {
          pnl = (priceDiff / currentPrice) * pos.lots * inst.lotSize;
        } else {
          pnl = pnlPips * 9.5 * pos.lots;
        }
      } else {
        // Equities / Commodities / Crypto
        pnl = priceDiff * pos.lots * inst.lotSize;
      }
      pnl = Number(pnl.toFixed(2));

      // Check TP Trigger
      if (pos.tp && pos.tp > 0) {
        if ((pos.direction === 'BUY' && currentPrice >= pos.tp) || (pos.direction === 'SELL' && currentPrice <= pos.tp)) {
          hasClosed = true;
          newClosedTrades.unshift({
            id: 'closed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            symbol: pos.symbol,
            direction: pos.direction,
            lots: pos.lots,
            openPrice: pos.openPrice,
            closePrice: currentPrice,
            sl: pos.sl,
            tp: pos.tp,
            pnl,
            pnlPips,
            openTime: pos.openTime,
            closeTime: Date.now(),
            closeReason: 'TP_HIT',
            strategyTag: pos.strategyTag,
            notes: pos.notes,
          });
          if (soundRef.current) playTradingSound('win');
          setToastMessage({ text: `Take Profit Hit! +$${pnl.toLocaleString()} on ${pos.symbol}`, type: 'success' });
          return null as unknown as Position;
        }
      }

      // Check SL Trigger
      if (pos.sl && pos.sl > 0) {
        if ((pos.direction === 'BUY' && currentPrice <= pos.sl) || (pos.direction === 'SELL' && currentPrice >= pos.sl)) {
          hasClosed = true;
          newClosedTrades.unshift({
            id: 'closed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            symbol: pos.symbol,
            direction: pos.direction,
            lots: pos.lots,
            openPrice: pos.openPrice,
            closePrice: currentPrice,
            sl: pos.sl,
            tp: pos.tp,
            pnl,
            pnlPips,
            openTime: pos.openTime,
            closeTime: Date.now(),
            closeReason: 'SL_HIT',
            strategyTag: pos.strategyTag,
            notes: pos.notes,
          });
          if (soundRef.current) playTradingSound('close');
          setToastMessage({ text: `Stop Loss Triggered: -$${Math.abs(pnl).toLocaleString()} on ${pos.symbol}`, type: 'danger' });
          return null as unknown as Position;
        }
      }

      return {
        ...pos,
        currentPrice,
        pnl,
        pnlPips,
      };
    }).filter(Boolean) as Position[];

    // Check Pending Orders
    const remainingPending: PendingOrder[] = [];
    for (const order of pendingOrders) {
      const inst = currentInstruments.find(i => i.symbol === order.symbol);
      if (!inst) {
        remainingPending.push(order);
        continue;
      }

      let triggered = false;
      let fillPrice = order.triggerPrice;

      if (order.type === 'BUY_LIMIT' && inst.ask <= order.triggerPrice) {
        triggered = true;
        fillPrice = inst.ask;
      } else if (order.type === 'SELL_LIMIT' && inst.bid >= order.triggerPrice) {
        triggered = true;
        fillPrice = inst.bid;
      } else if (order.type === 'BUY_STOP' && inst.ask >= order.triggerPrice) {
        triggered = true;
        fillPrice = inst.ask;
      } else if (order.type === 'SELL_STOP' && inst.bid <= order.triggerPrice) {
        triggered = true;
        fillPrice = inst.bid;
      }

      if (triggered) {
        const notional = fillPrice * order.lots * inst.lotSize;
        const margin = Number((notional / order.leverage).toFixed(2));
        newPositions.unshift({
          id: 'pos_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          symbol: order.symbol,
          direction: order.type.startsWith('BUY') ? 'BUY' : 'SELL',
          lots: order.lots,
          openPrice: fillPrice,
          currentPrice: fillPrice,
          sl: order.sl,
          tp: order.tp,
          leverage: order.leverage,
          margin,
          pnl: 0,
          pnlPips: 0,
          openTime: Date.now(),
          strategyTag: order.strategyTag,
        });
        setToastMessage({ text: `Pending Order Filled: ${order.type} on ${order.symbol} @ ${fillPrice}`, type: 'info' });
        if (soundRef.current) playTradingSound(order.type.startsWith('BUY') ? 'buy' : 'sell');
      } else {
        remainingPending.push(order);
      }
    }

    // Recalculate Account Equity & Margins
    const totalFloatingPnl = newPositions.reduce((acc, p) => acc + p.pnl, 0);
    const totalMargin = newPositions.reduce((acc, p) => acc + p.margin, 0);

    let updatedBalance = account.balance;
    if (hasClosed) {
      // Difference between old closed trades count and new
      const closedDiff = newClosedTrades.length - closedTrades.length;
      if (closedDiff > 0) {
        for (let i = 0; i < closedDiff; i++) {
          updatedBalance += newClosedTrades[i].pnl;
        }
      }
    }

    const equity = Number((updatedBalance + totalFloatingPnl).toFixed(2));
    const freeMargin = Number(Math.max(equity - totalMargin, 0).toFixed(2));
    const marginLevel = totalMargin > 0 ? Number(((equity / totalMargin) * 100).toFixed(1)) : 0;

    setPositions(newPositions);
    if (hasClosed) setClosedTrades(newClosedTrades);
    if (remainingPending.length !== pendingOrders.length) setPendingOrders(remainingPending);

    setAccount({
      ...account,
      balance: Number(updatedBalance.toFixed(2)),
      equity,
      margin: totalMargin,
      freeMargin,
      marginLevel,
    });
  }, [instruments]);

  // Execute Market Order
  const executeMarketOrder = (
    direction: OrderDirection,
    lots: number,
    leverage: number,
    sl?: number,
    tp?: number,
    strategyTag?: string,
    notes?: string
  ): boolean => {
    const inst = activeInstrument;
    let basePrice = direction === 'BUY' ? inst.ask : inst.bid;

    // Simulate realistic market execution slippage (0 to 0.4 pips)
    if (slippageEnabled) {
      const slippagePips = (Math.random() * 0.4) * inst.pipSize;
      basePrice = direction === 'BUY' ? basePrice + slippagePips : basePrice - slippagePips;
      basePrice = Number(basePrice.toFixed(inst.digits));
    }

    const notional = basePrice * lots * inst.lotSize;
    const requiredMargin = Number((notional / leverage).toFixed(2));

    if (requiredMargin > account.freeMargin) {
      setToastMessage({ text: 'Insufficient Free Margin to open position!', type: 'danger' });
      return false;
    }

    const newPos: Position = {
      id: 'pos_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      symbol: inst.symbol,
      direction,
      lots,
      openPrice: basePrice,
      currentPrice: basePrice,
      sl: sl && sl > 0 ? sl : undefined,
      tp: tp && tp > 0 ? tp : undefined,
      leverage,
      margin: requiredMargin,
      pnl: 0,
      pnlPips: 0,
      openTime: Date.now(),
      strategyTag: strategyTag || 'Manual Trade',
      notes,
    };

    setPositions(prev => [newPos, ...prev]);
    if (soundEnabled) playTradingSound(direction === 'BUY' ? 'buy' : 'sell');
    setToastMessage({
      text: `${direction} Order Executed: ${lots} Lots ${inst.symbol} @ ${basePrice}`,
      type: 'success',
    });
    return true;
  };

  // Place Pending Order
  const placePendingOrder = (
    type: PendingOrderType,
    triggerPrice: number,
    lots: number,
    leverage: number,
    sl?: number,
    tp?: number,
    strategyTag?: string
  ): boolean => {
    const newOrder: PendingOrder = {
      id: 'pnd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      symbol: activeInstrument.symbol,
      type,
      triggerPrice,
      lots,
      leverage,
      sl: sl && sl > 0 ? sl : undefined,
      tp: tp && tp > 0 ? tp : undefined,
      createTime: Date.now(),
      strategyTag: strategyTag || 'Limit Strategy',
    };

    setPendingOrders(prev => [newOrder, ...prev]);
    setToastMessage({ text: `Pending Order Placed: ${type} @ ${triggerPrice}`, type: 'info' });
    return true;
  };

  // Close Open Position Manually
  const closePosition = (id: string, reason: 'MANUAL' | 'TP_HIT' | 'SL_HIT' = 'MANUAL') => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;

    const inst = instruments.find(i => i.symbol === pos.symbol) || activeInstrument;
    const currentPrice = pos.direction === 'BUY' ? inst.bid : inst.ask;

    const closed: ClosedTrade = {
      id: 'closed_' + Date.now(),
      symbol: pos.symbol,
      direction: pos.direction,
      lots: pos.lots,
      openPrice: pos.openPrice,
      closePrice: currentPrice,
      sl: pos.sl,
      tp: pos.tp,
      pnl: pos.pnl,
      pnlPips: pos.pnlPips,
      openTime: pos.openTime,
      closeTime: Date.now(),
      closeReason: reason,
      strategyTag: pos.strategyTag,
      notes: pos.notes,
    };

    setPositions(prev => prev.filter(p => p.id !== id));
    setClosedTrades(prev => [closed, ...prev]);
    setAccount(prev => {
      const newBal = Number((prev.balance + pos.pnl).toFixed(2));
      return {
        ...prev,
        balance: newBal,
        equity: newBal, // will recalculate with other positions on next tick
      };
    });

    if (soundEnabled) playTradingSound(pos.pnl >= 0 ? 'win' : 'close');
    setToastMessage({
      text: `Closed ${pos.direction} ${pos.symbol}: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toLocaleString()}`,
      type: pos.pnl >= 0 ? 'success' : 'danger',
    });
  };

  // Close All Open Positions Immediately (Panic / Shift+C Hotkey)
  const closeAllPositions = () => {
    if (positions.length === 0) {
      setToastMessage({ text: 'No active positions to close.', type: 'info' });
      return;
    }
    const currentPositions = [...positions];
    let totalClosedPnl = 0;
    const newClosed: ClosedTrade[] = [];

    currentPositions.forEach(pos => {
      const inst = instruments.find(i => i.symbol === pos.symbol) || activeInstrument;
      const currentPrice = pos.direction === 'BUY' ? inst.bid : inst.ask;
      totalClosedPnl += pos.pnl;
      newClosed.unshift({
        id: 'closed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        symbol: pos.symbol,
        direction: pos.direction,
        lots: pos.lots,
        openPrice: pos.openPrice,
        closePrice: currentPrice,
        sl: pos.sl,
        tp: pos.tp,
        pnl: pos.pnl,
        pnlPips: pos.pnlPips,
        openTime: pos.openTime,
        closeTime: Date.now(),
        closeReason: 'MANUAL',
        strategyTag: pos.strategyTag,
        notes: pos.notes,
      });
    });

    setPositions([]);
    setClosedTrades(prev => [...newClosed, ...prev]);
    setAccount(prev => {
      const newBal = Number((prev.balance + totalClosedPnl).toFixed(2));
      return {
        ...prev,
        balance: newBal,
        equity: newBal,
        margin: 0,
        freeMargin: newBal,
        marginLevel: 0,
      };
    });

    if (soundEnabled) playTradingSound(totalClosedPnl >= 0 ? 'win' : 'close');
    setToastMessage({
      text: `Closed ${currentPositions.length} positions. Net P&L: ${totalClosedPnl >= 0 ? '+' : ''}$${totalClosedPnl.toLocaleString()}`,
      type: totalClosedPnl >= 0 ? 'success' : 'danger',
    });
  };

  // Price Alert Management
  const addPriceAlert = (targetPrice: number, condition: 'ABOVE' | 'BELOW', note?: string) => {
    const newAlert: PriceAlert = {
      id: 'alt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      symbol: activeInstrument.symbol,
      targetPrice,
      condition,
      triggered: false,
      createdAt: Date.now(),
      note,
    };
    setPriceAlerts(prev => [newAlert, ...prev]);
    setToastMessage({
      text: `Alert Set: ${activeInstrument.symbol} ${condition === 'ABOVE' ? '≥' : '≤'} ${targetPrice}`,
      type: 'info',
    });
  };

  const removePriceAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
    setToastMessage({ text: 'Price alert removed', type: 'info' });
  };

  // Bar Replay Engine Actions
  const startReplay = (startIndex?: number) => {
    const defaultIdx = Math.max(15, Math.floor(rawCandles.length * 0.6));
    const idx = startIndex !== undefined ? Math.min(rawCandles.length - 2, Math.max(5, startIndex)) : defaultIdx;
    setReplayState({
      isActive: true,
      isPlaying: false,
      currentIndex: idx,
      totalCandles: rawCandles.length,
      speed: 1,
    });
    // Set active price to replay bar close
    const replayBar = rawCandles[idx];
    if (replayBar) {
      setInstruments(insts =>
        insts.map(inst => {
          if (inst.symbol === activeSymbol) {
            const diff = (inst.spread * inst.pipSize) / 2;
            return {
              ...inst,
              currentPrice: replayBar.close,
              bid: Number((replayBar.close - diff).toFixed(inst.digits)),
              ask: Number((replayBar.close + diff).toFixed(inst.digits)),
            };
          }
          return inst;
        })
      );
    }
    setToastMessage({ text: `Bar Replay Active: Rewound to bar #${idx + 1}. Press Play or Step to advance.`, type: 'info' });
  };

  const stepReplay = () => {
    setReplayState(prev => {
      if (prev.currentIndex >= rawCandles.length - 1) {
        setToastMessage({ text: 'Reached end of historical dataset', type: 'info' });
        return prev;
      }
      const nextIdx = prev.currentIndex + 1;
      const replayBar = rawCandles[nextIdx];
      if (replayBar) {
        setInstruments(insts =>
          insts.map(inst => {
            if (inst.symbol === activeSymbol) {
              const diff = (inst.spread * inst.pipSize) / 2;
              return {
                ...inst,
                currentPrice: replayBar.close,
                bid: Number((replayBar.close - diff).toFixed(inst.digits)),
                ask: Number((replayBar.close + diff).toFixed(inst.digits)),
              };
            }
            return inst;
          })
        );
      }
      return { ...prev, currentIndex: nextIdx };
    });
  };

  const togglePlayReplay = () => {
    setReplayState(prev => {
      const nextPlaying = !prev.isPlaying;
      if (nextPlaying && prev.currentIndex >= rawCandles.length - 1) {
        // rewind slightly if at the end
        return { ...prev, isPlaying: true, currentIndex: Math.max(0, rawCandles.length - 30) };
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  };

  const setReplaySpeed = (speed: 1 | 2 | 5) => {
    setReplayState(prev => ({ ...prev, speed }));
  };

  const exitReplay = () => {
    setReplayState(prev => ({ ...prev, isActive: false, isPlaying: false }));
    setToastMessage({ text: 'Exited Bar Replay. Resumed live market feed.', type: 'info' });
  };

  // Pre-Deployment Strategy Risk & Allocation Controls
  const setPropTier = (tier: number) => {
    setPropEvaluation(prev => ({
      ...prev,
      tier,
      peakEquity: tier,
      currentDrawdown: 0,
      currentDayLoss: 0,
      status: 'IN_PROGRESS',
    }));
    resetAccount(tier);
    setToastMessage({ text: `Portfolio Allocation Mandate updated to $${tier.toLocaleString()}`, type: 'success' });
  };

  const resetPropEvaluation = () => {
    setPropEvaluation(prev => ({
      ...prev,
      peakEquity: prev.tier,
      currentDrawdown: 0,
      currentDayLoss: 0,
      status: 'IN_PROGRESS',
    }));
    resetAccount(propEvaluation.tier);
    setToastMessage({ text: 'Strategy Forward-Testing Risk Monitor Reset', type: 'info' });
  };

  // USA Local Wire Transfer Withdrawal Request Action
  const requestWireWithdrawal = (params: {
    amount: number;
    beneficiaryName: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    beneficiaryAddress: string;
    wireMemo?: string;
  }): { success: boolean; error?: string; referenceId?: string } => {
    const {
      amount,
      beneficiaryName,
      bankName,
      routingNumber,
      accountNumber,
      accountType,
      beneficiaryAddress,
      wireMemo,
    } = params;

    if (amount < 100) {
      const err = 'Minimum wire withdrawal amount is $100.00 USD.';
      setToastMessage({ text: err, type: 'danger' });
      return { success: false, error: err };
    }

    if (amount > account.freeMargin) {
      const err = `Insufficient available capital. Maximum withdrawable: $${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      setToastMessage({ text: err, type: 'danger' });
      return { success: false, error: err };
    }

    const cleanRouting = routingNumber.replace(/\D/g, '');
    if (cleanRouting.length !== 9) {
      const err = 'US domestic routing number must be exactly 9 digits.';
      setToastMessage({ text: err, type: 'danger' });
      return { success: false, error: err };
    }

    const cleanAccount = accountNumber.replace(/\D/g, '');
    if (cleanAccount.length < 4 || cleanAccount.length > 17) {
      const err = 'US domestic bank account number must be between 4 and 17 digits.';
      setToastMessage({ text: err, type: 'danger' });
      return { success: false, error: err };
    }

    const refNum = `FEDWIRE-${Math.floor(100000 + Math.random() * 900000)}`;
    const last4 = cleanAccount.slice(-4);
    const masked = `•••• ${last4}`;

    const newRequest: WithdrawalRequest = {
      id: 'wd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refNum,
      amount,
      fee: 0,
      netAmount: amount,
      beneficiaryName: beneficiaryName.trim(),
      bankName: bankName.trim(),
      routingNumber: cleanRouting,
      accountNumberMasked: masked,
      accountType,
      beneficiaryAddress: beneficiaryAddress.trim(),
      wireMemo: wireMemo?.trim() || 'Capital Payout',
      timestamp: Date.now(),
      status: 'PROCESSING',
      estimatedArrival: 'Same-day Fedwire (Cutoff 16:00 EST)',
    };

    // Deduct immediately from balance and free margin
    setAccount(prev => {
      const updatedBalance = Number((prev.balance - amount).toFixed(2));
      const updatedEquity = Number((prev.equity - amount).toFixed(2));
      const updatedFreeMargin = Number(Math.max(updatedEquity - prev.margin, 0).toFixed(2));
      return {
        ...prev,
        balance: updatedBalance,
        equity: updatedEquity,
        freeMargin: updatedFreeMargin,
      };
    });

    setWithdrawalRequests(prev => [newRequest, ...prev]);

    if (soundEnabled) playTradingSound('win');
    setToastMessage({
      text: `Wire withdrawal submitted: $${amount.toLocaleString()} via Fedwire (${refNum})`,
      type: 'success',
    });

    // Simulate Fedwire network dispatch confirmation
    setTimeout(() => {
      setWithdrawalRequests(prev =>
        prev.map(r =>
          r.referenceId === refNum ? { ...r, status: 'DISPATCHED_FEDWIRE' } : r
        )
      );
    }, 6000);

    return { success: true, referenceId: refNum };
  };

  // Incoming Wire Deposit Request Action
  const requestWireDeposit = (params: {
    amount: number;
    originatorName: string;
    originatingBankName: string;
    originatingRoutingNumber: string;
    imadOmad?: string;
    wireMemo?: string;
  }): void => {
    const { amount, originatorName, originatingBankName, originatingRoutingNumber, imadOmad, wireMemo } = params;
    const refNum = `DEP-VC-${Math.floor(10000 + Math.random() * 90000)}`;

    const newDeposit: DepositRequest = {
      id: 'dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refNum,
      amount,
      originatorName: originatorName.trim(),
      originatingBankName: originatingBankName.trim(),
      originatingRoutingNumber: originatingRoutingNumber.replace(/\D/g, ''),
      imadOmad: imadOmad?.trim(),
      wireMemo: wireMemo?.trim(),
      timestamp: Date.now(),
      status: 'PENDING_CONFIRMATION',
    };

    setDepositRequests(prev => [newDeposit, ...prev]);

    // Credit account immediately
    setAccount(prev => {
      const updatedBalance = Number((prev.balance + amount).toFixed(2));
      const updatedEquity = Number((prev.equity + amount).toFixed(2));
      const updatedFreeMargin = Number(Math.max(updatedEquity - prev.margin, 0).toFixed(2));
      return {
        ...prev,
        balance: updatedBalance,
        equity: updatedEquity,
        freeMargin: updatedFreeMargin,
      };
    });

    if (soundEnabled) playTradingSound('win');
    setToastMessage({
      text: `Incoming wire received: $${amount.toLocaleString()} from ${originatorName} (${refNum})`,
      type: 'success',
    });

    // Settle after 2 seconds
    setTimeout(() => {
      setDepositRequests(prev =>
        prev.map(d => d.referenceId === refNum ? { ...d, status: 'SETTLED' } : d)
      );
    }, 2000);
  };

  // Allocate strategy to a managed client account
  const allocateStrategyToClient = (clientId: string, strategyName: string): void => {
    setManagedClients(prev =>
      prev.map(c =>
        c.id === clientId
          ? { ...c, strategyName, status: 'ACTIVE', deployedAt: Date.now() }
          : c
      )
    );
    setToastMessage({
      text: `Strategy "${strategyName}" allocated to client account`,
      type: 'success',
    });
  };

  // Monitor Prop Evaluation state on account equity updates
  useEffect(() => {
    setPropEvaluation(prev => {
      const tier = prev.tier || account.startingBalance || 50000;
      const peakEquity = Math.max(prev.peakEquity, account.equity);
      const currentDrawdown = Math.max(0, peakEquity - account.equity);
      const maxDrawdownLimit = (tier * prev.maxTotalDrawdownPercent) / 100;
      const profitTargetLimit = (tier * prev.profitTargetPercent) / 100;
      const profit = account.equity - tier;

      let status: PropEvaluationState['status'] = 'IN_PROGRESS';
      if (profit >= profitTargetLimit) {
        status = 'PASSED';
      } else if (currentDrawdown >= maxDrawdownLimit) {
        status = 'FAILED_DRAWDOWN';
      } else if (prev.currentDayLoss >= (tier * prev.maxDailyLossPercent) / 100) {
        status = 'FAILED_DAILY';
      }

      return {
        ...prev,
        tier,
        peakEquity,
        currentDrawdown,
        status,
      };
    });
  }, [account.equity, account.startingBalance]);

  // Dynamic Relative Currency Strength Computation
  const currencyStrengths: CurrencyStrength[] = useMemo(() => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
    const scores: Record<string, { totalChange: number; count: number }> = {
      USD: { totalChange: 0, count: 0 },
      EUR: { totalChange: 0, count: 0 },
      GBP: { totalChange: 0, count: 0 },
      JPY: { totalChange: 0, count: 0 },
      AUD: { totalChange: 0, count: 0 },
      CAD: { totalChange: 0, count: 0 },
    };

    instruments.forEach(inst => {
      if (inst.category !== 'forex') return;
      const [base, quote] = inst.symbol.split('/');
      if (scores[base]) {
        scores[base].totalChange += inst.change24h;
        scores[base].count += 1;
      }
      if (scores[quote]) {
        scores[quote].totalChange -= inst.change24h;
        scores[quote].count += 1;
      }
    });

    return currencies.map(cur => {
      const data = scores[cur];
      const avgChange = data.count > 0 ? data.totalChange / data.count : 0;
      // Map avgChange (-1.5% to +1.5%) to 15 - 85 scale
      const rawScore = 50 + avgChange * 28;
      const score = Math.max(12, Math.min(88, Math.round(rawScore)));
      const trend: 'STRONG' | 'MODERATE' | 'WEAK' = score >= 58 ? 'STRONG' : score <= 42 ? 'WEAK' : 'MODERATE';
      return {
        currency: cur,
        score,
        trend,
        change24h: Number(avgChange.toFixed(2)),
      };
    }).sort((a, b) => b.score - a.score);
  }, [instruments]);

  // Cancel Pending Order
  const cancelPendingOrder = (id: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id));
    setToastMessage({ text: 'Pending Order Cancelled', type: 'info' });
  };

  // Modify Position SL/TP
  const modifyPosition = (id: string, sl?: number, tp?: number) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id === id) {
          return { ...p, sl: sl && sl > 0 ? sl : undefined, tp: tp && tp > 0 ? tp : undefined };
        }
        return p;
      })
    );
    setToastMessage({ text: 'Protection Parameters Updated (TP / SL)', type: 'info' });
  };

  // Reset Account for fresh testing
  const resetAccount = (newBalance: number = DEFAULT_STARTING_BALANCE) => {
    setPositions([]);
    setPendingOrders([]);
    setClosedTrades([]);
    setAccount({
      balance: newBalance,
      equity: newBalance,
      margin: 0,
      freeMargin: newBalance,
      marginLevel: 0,
      startingBalance: newBalance,
      currency: 'USD',
    });
    setToastMessage({ text: `Account Reset. Capitalized to $${newBalance.toLocaleString()}`, type: 'info' });
  };

  // Add Strategy Tag
  const addStrategyTag = (tag: string) => {
    if (!tag.trim() || strategyTags.includes(tag)) return;
    setStrategyTags(prev => [...prev, tag.trim()]);
  };

  // Export Trading History to CSV
  const exportTradesToCSV = () => {
    if (closedTrades.length === 0) {
      setToastMessage({ text: 'No closed trades to export yet!', type: 'info' });
      return;
    }

    const headers = ['ID', 'Symbol', 'Direction', 'Lots', 'Open Price', 'Close Price', 'Stop Loss', 'Take Profit', 'PnL ($)', 'Pips', 'Open Time', 'Close Time', 'Close Reason', 'Strategy Tag', 'Notes'];
    const rows = closedTrades.map(t => [
      t.id,
      t.symbol,
      t.direction,
      t.lots,
      t.openPrice,
      t.closePrice,
      t.sl || '',
      t.tp || '',
      t.pnl,
      t.pnlPips,
      new Date(t.openTime).toISOString(),
      new Date(t.closeTime).toISOString(),
      t.closeReason,
      `"${t.strategyTag.replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vantage_capital_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage({ text: 'Trading journal exported successfully!', type: 'success' });
  };

  // Sign In Action
  const signIn = (email: string, name?: string, tier?: string) => {
    const selectedTier = tier || 'Unfunded Mandate';
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      name: name || email.split('@')[0],
      email,
      accountId: 'VC-' + Math.floor(10000 + Math.random() * 90000),
      tier: selectedTier,
      accountType: 'ECN_RAW',
      baseCurrency: 'USD',
      twoFactorEnabled: true,
      joinedDate: Date.now(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    } catch {}
    setToastMessage({ text: `Welcome back, ${newUser.name}! Session authenticated.`, type: 'success' });
    setActiveTab('terminal');
  };

  // Sign Up Action — new users start with $0.00 Active Capital!
  const signUp = (
    name: string,
    email: string,
    tier: string,
    strategyFocus?: string,
    accountType?: 'ECN_RAW' | 'STANDARD_STP',
    baseCurrency?: 'USD' | 'EUR' | 'GBP'
  ) => {
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      name,
      email,
      accountId: 'VC-' + Math.floor(10000 + Math.random() * 90000),
      tier,
      strategyFocus: strategyFocus || 'Custom Strategy',
      accountType: accountType || 'ECN_RAW',
      baseCurrency: baseCurrency || 'USD',
      twoFactorEnabled: false,
      joinedDate: Date.now(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    } catch {}

    // NEW SIGNUPS START AT $0.00 BALANCE!
    // Balance is only updated when the firm owner allocates capital or an inbound wire clears.
    resetAccount(0);
    setToastMessage({
      text: `Account created for ${name}! Active Capital is $0.00 USD (Awaiting Capital Allocation / Wire Deposit).`,
      type: 'info',
    });
    setActiveTab('profile');
  };

  // Sign Out Action
  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
    } catch {}
    resetAccount(0);
    setToastMessage({ text: 'Signed out of session.', type: 'info' });
    setActiveTab('auth');
  };

  // Administrative Capital Allocation Action
  const adminSetAccountBalance = (newBalance: number, targetAccountId?: string, memo?: string) => {
    const cleanBalance = Math.max(0, Number(newBalance.toFixed(2)));
    setAccount({
      balance: cleanBalance,
      equity: cleanBalance,
      margin: 0,
      freeMargin: cleanBalance,
      marginLevel: 0,
      startingBalance: cleanBalance,
      currency: 'USD',
    });
    setToastMessage({
      text: `Capital allocated: $${cleanBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD ${targetAccountId ? `for ${targetAccountId}` : ''} ${memo ? `(${memo})` : ''}`,
      type: 'success',
    });
  };

  // Update User Profile
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setToastMessage({ text: 'Trader profile preferences saved successfully.', type: 'success' });
  };

  // Compute Statistics for Method Validation
  const stats: StrategyStats = useMemo(() => {
    const totalTrades = closedTrades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        profitFactor: 0,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        maxDrawdown: 0,
        maxDrawdownAmount: 0,
        avgWin: 0,
        avgLoss: 0,
        riskRewardRatio: 0,
        expectancy: 0,
        bestTrade: 0,
        worstTrade: 0,
        tagsSummary: [],
      };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;

    closedTrades.forEach(t => {
      if (t.pnl > 0) {
        winningTrades++;
        grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(t.pnl);
      }
      if (t.pnl > bestTrade) bestTrade = t.pnl;
      if (t.pnl < worstTrade) worstTrade = t.pnl;
    });

    const netProfit = Number((grossProfit - grossLoss).toFixed(2));
    const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(1));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
    const avgWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
    const avgLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;
    const riskRewardRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : 0;

    // Mathematical expectancy: (WinRate * AvgWin) - (LossRate * AvgLoss)
    const winProb = winningTrades / totalTrades;
    const lossProb = losingTrades / totalTrades;
    const expectancy = Number((winProb * avgWin - lossProb * avgLoss).toFixed(2));

    // Calculate Max Drawdown from closed equity progression
    let peak = account.startingBalance;
    let runningBalance = account.startingBalance;
    let maxDdAmount = 0;
    let maxDdPercent = 0;

    // Reconstruct trade sequence oldest to newest
    const chronological = [...closedTrades].reverse();
    for (const tr of chronological) {
      runningBalance += tr.pnl;
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const dd = peak - runningBalance;
      if (dd > maxDdAmount) {
        maxDdAmount = dd;
        maxDdPercent = (dd / peak) * 100;
      }
    }

    // Breakdown by strategy tag
    const tagMap = new Map<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }>();
    closedTrades.forEach(t => {
      const tag = t.strategyTag || 'Untagged';
      const cur = tagMap.get(tag) || { trades: 0, wins: 0, pnl: 0, grossProfit: 0, grossLoss: 0 };
      cur.trades++;
      cur.pnl += t.pnl;
      if (t.pnl > 0) {
        cur.wins++;
        cur.grossProfit += t.pnl;
      } else {
        cur.grossLoss += Math.abs(t.pnl);
      }
      tagMap.set(tag, cur);
    });

    const tagsSummary = Array.from(tagMap.entries()).map(([tag, data]) => ({
      tag,
      trades: data.trades,
      winRate: Number(((data.wins / data.trades) * 100).toFixed(1)),
      pnl: Number(data.pnl.toFixed(2)),
      profitFactor: data.grossLoss > 0 ? Number((data.grossProfit / data.grossLoss).toFixed(2)) : data.grossProfit > 0 ? 99 : 0,
    })).sort((a, b) => b.pnl - a.pnl);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor,
      netProfit,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      maxDrawdown: Number(maxDdPercent.toFixed(1)),
      maxDrawdownAmount: Number(maxDdAmount.toFixed(2)),
      avgWin,
      avgLoss,
      riskRewardRatio,
      expectancy,
      bestTrade: bestTrade === -Infinity ? 0 : Number(bestTrade.toFixed(2)),
      worstTrade: worstTrade === Infinity ? 0 : Number(worstTrade.toFixed(2)),
      tagsSummary,
    };
  }, [closedTrades, account.startingBalance]);

  return (
    <TradingContext.Provider
      value={{
        instruments,
        activeInstrument,
        candles,
        timeframe,
        positions,
        pendingOrders,
        closedTrades,
        account,
        activeTab,
        theme,
        resolvedTheme,
        strategyTags,
        soundEnabled,
        slippageEnabled,
        liveFeedConnected,
        stats,
        toastMessage,
        user,
        priceAlerts,
        currencyStrengths,
        replayState,
        propEvaluation,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
        setActiveInstrument: setActiveSymbol,
        setTimeframe,
        setActiveTab,
        setTheme,
        toggleSound: () => setSoundEnabled(prev => !prev),
        toggleSlippage: () => setSlippageEnabled(prev => !prev),
        addStrategyTag,
        executeMarketOrder,
        placePendingOrder,
        closePosition,
        closeAllPositions,
        cancelPendingOrder,
        modifyPosition,
        resetAccount,
        exportTradesToCSV,
        clearToast: () => setToastMessage(null),
        addPriceAlert,
        removePriceAlert,
        startReplay,
        stepReplay,
        togglePlayReplay,
        setReplaySpeed,
        exitReplay,
        setPropTier,
        resetPropEvaluation,
        withdrawalRequests,
        requestWireWithdrawal,
        depositRequests,
        requestWireDeposit,
        managedClients,
        allocateStrategyToClient,
        adminSetAccountBalance,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
