export type AssetCategory = 'forex' | 'stock' | 'commodity' | 'crypto';

export interface Instrument {
  symbol: string;
  name: string;
  category: AssetCategory;
  currentPrice: number;
  bid: number;
  ask: number;
  spread: number; // in pips or cents
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  digits: number; // decimal places (e.g. 5 for EUR/USD, 3 for USD/JPY, 2 for AAPL)
  lotSize: number; // 100,000 for forex standard lot, 1 for stock share
  pipSize: number; // 0.0001 for EUR/USD, 0.01 for USD/JPY, 0.01 for AAPL
  marginRequirement: number; // percentage e.g. 0.01 for 1:100 leverage
  description?: string;
  isRealtime?: boolean;
}

export type OrderDirection = 'BUY' | 'SELL';

export type PendingOrderType = 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';

export interface Position {
  id: string;
  symbol: string;
  direction: OrderDirection;
  lots: number;
  openPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  leverage: number;
  margin: number;
  pnl: number;
  pnlPips: number;
  openTime: number;
  strategyTag: string;
  notes?: string;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  type: PendingOrderType;
  lots: number;
  triggerPrice: number;
  sl?: number;
  tp?: number;
  leverage: number;
  createTime: number;
  strategyTag: string;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  direction: OrderDirection;
  lots: number;
  openPrice: number;
  closePrice: number;
  sl?: number;
  tp?: number;
  pnl: number;
  pnlPips: number;
  openTime: number;
  closeTime: number;
  closeReason: 'TP_HIT' | 'SL_HIT' | 'MANUAL' | 'MARGIN_CALL';
  strategyTag: string;
  notes?: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  startingBalance: number;
  currency: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '1D';

export interface StrategyStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdown: number; // %
  maxDrawdownAmount: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  tagsSummary: {
    tag: string;
    trades: number;
    winRate: number;
    pnl: number;
    profitFactor: number;
  }[];
}

export interface ChartDrawing {
  id: string;
  symbol: string;
  type: 'hline' | 'trendline' | 'fib' | 'box';
  price1: number;
  price2?: number;
  time1: number;
  time2?: number;
  color: string;
  label?: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  title: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  actual?: string;
  forecast: string;
  previous: string;
}

export interface PropEvaluationState {
  enabled: boolean;
  tier: number; // e.g. 50000
  profitTargetPercent: number; // e.g. 10% ($5000)
  maxDailyLossPercent: number; // e.g. 5% ($2500)
  maxTotalDrawdownPercent: number; // e.g. 10% ($5000)
  currentDayLoss: number;
  currentDrawdown: number;
  peakEquity: number;
  status: 'IN_PROGRESS' | 'PASSED' | 'FAILED_DAILY' | 'FAILED_DRAWDOWN';
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: number;
  note?: string;
}

export interface CurrencyStrength {
  currency: string;
  score: number; // 0 to 100
  trend: 'STRONG' | 'MODERATE' | 'WEAK';
  change24h: number;
}

export interface ReplayState {
  isActive: boolean;
  isPlaying: boolean;
  currentIndex: number;
  totalCandles: number;
  speed: 1 | 2 | 5;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountId: string;
  tier: string;
  strategyFocus?: string;
  joinedDate: number;
  accountType?: 'ECN_RAW' | 'STANDARD_STP';
  baseCurrency?: 'USD' | 'EUR' | 'GBP';
  twoFactorEnabled?: boolean;
  kycStatus?: 'VERIFIED_TIER_2' | 'PENDING' | 'TIER_1';
  deskLocation?: string;
  savedBankName?: string;
  savedRoutingNumber?: string;
  savedAccountNumberMasked?: string;
  savedAccountType?: 'CHECKING' | 'SAVINGS';
  savedAddress?: string;
}

export interface WithdrawalRequest {
  id: string;
  referenceId: string; // e.g. FEDWIRE-849201
  amount: number;
  fee: number;
  netAmount: number;
  beneficiaryName: string;
  bankName: string;
  routingNumber: string; // 9-digit ABA Fedwire
  accountNumberMasked: string; // e.g. •••• 4892
  accountType: 'CHECKING' | 'SAVINGS';
  beneficiaryAddress: string;
  wireMemo?: string;
  timestamp: number;
  status: 'PROCESSING' | 'DISPATCHED_FEDWIRE' | 'SETTLED';
  estimatedArrival: string;
}

// Deposit / Incoming Wire
export interface DepositRequest {
  id: string;
  referenceId: string; // e.g. DEP-VC-89421
  amount: number;
  originatorName: string;
  originatingBankName: string;
  originatingRoutingNumber: string;
  imadOmad?: string;
  wireMemo?: string;
  timestamp: number;
  status: 'PENDING_CONFIRMATION' | 'SETTLED';
}

export interface ManagedClient {
  id: string;
  name: string;
  accountId: string;
  mandateType: 'PRIVATE_WEALTH' | 'ACCREDITED' | 'INSTITUTIONAL_PRIME' | 'SOVEREIGN';
  allocatedCapital: number;
  currentEquity: number;
  strategyName: string;
  deployedAt: number;
  managementFeePct: number;
  incentiveFeePct: number;
  highWaterMark: number;
  status: 'ACTIVE' | 'PENDING_DEPLOYMENT' | 'REBALANCING';
}

export type ActiveTab =
  | 'auth'
  | 'home'
  | 'terminal'
  | 'strategy_lab'
  | 'calendar'
  | 'markets'
  | 'company'
  | 'compliance'
  | 'settings'
  | 'profile';
