import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { OrderDirection, PendingOrderType } from '../../types/trading';
import { ShieldAlert, Target, Plus, Zap, Clock, Calculator, Percent, ClipboardList, ChevronDown, ChevronUp, Check } from 'lucide-react';

// Pre-Trade Checklist types
type MarketRegime = 'Trending' | 'Ranging' | 'Breakout' | 'Reversal';
const MARKET_REGIMES: MarketRegime[] = ['Trending', 'Ranging', 'Breakout', 'Reversal'];
const CONFLUENCE_OPTIONS = [
  'EMA Pullback',
  'Key Level Support/Resistance',
  'Fair Value Gap (FVG)',
  'Order Block',
  'Trend Line Break',
  'Pattern Breakout',
] as const;

export const OrderPanel: React.FC = () => {
  const {
    activeInstrument,
    account,
    strategyTags,
    addStrategyTag,
    executeMarketOrder,
    placePendingOrder,
  } = useTrading();

  // Order mode: Market vs Pending
  const [orderMode, setOrderMode] = useState<'market' | 'pending'>('market');
  const [pendingType, setPendingType] = useState<PendingOrderType>('BUY_LIMIT');
  const [triggerPrice, setTriggerPrice] = useState<string>('');

  // Sizing and Leverage
  const [lots, setLots] = useState<number>(0.5);
  const [leverage, setLeverage] = useState<number>(100);

  // Risk parameters
  const [slPrice, setSlPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');

  // Risk Calculator state
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [riskPercent, setRiskPercent] = useState<number>(1.0); // 1%

  // Strategy tag
  const [selectedTag, setSelectedTag] = useState<string>(strategyTags[0] || 'Manual Trade');
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Pre-Trade Checklist state
  const [checklistOpen, setChecklistOpen] = useState<boolean>(false);
  const [selectedRegime, setSelectedRegime] = useState<MarketRegime | null>(null);
  const [selectedConfluence, setSelectedConfluence] = useState<Set<string>>(new Set());
  const [tradeRationale, setTradeRationale] = useState<string>('');

  // Required margin calculation
  const notionalValue = useMemo(() => {
    return activeInstrument.currentPrice * lots * activeInstrument.lotSize;
  }, [activeInstrument, lots]);

  const requiredMargin = useMemo(() => {
    return Number((notionalValue / leverage).toFixed(2));
  }, [notionalValue, leverage]);

  // R:R ratio computation from SL/TP
  const rrRatio = useMemo(() => {
    const sl = parseFloat(slPrice);
    const tp = parseFloat(tpPrice);
    const price = activeInstrument.currentPrice;
    if (!slPrice || !tpPrice || isNaN(sl) || isNaN(tp) || sl <= 0 || tp <= 0) return null;
    const slDist = Math.abs(price - sl);
    const tpDist = Math.abs(price - tp);
    if (slDist === 0) return null;
    return tpDist / slDist;
  }, [slPrice, tpPrice, activeInstrument.currentPrice]);

  // Checklist validity
  const checklistValid = !checklistOpen || (selectedRegime !== null && selectedConfluence.size > 0);

  // Dollar pip value for current lot size
  const pipDollarValue = useMemo(() => {
    if (activeInstrument.category === 'forex') {
      if (activeInstrument.symbol.endsWith('/USD')) return 10 * lots;
      return (10 * lots) / activeInstrument.currentPrice;
    }
    return lots * activeInstrument.pipSize * activeInstrument.lotSize;
  }, [activeInstrument, lots]);

  // Quick lot presets
  const quickLots = [0.05, 0.1, 0.5, 1.0, 2.0, 5.0];

  // Automatic Position Sizing calculation based on % risk & Stop Loss distance
  const calculateLotsByRisk = () => {
    if (!slPrice) return;
    const slVal = parseFloat(slPrice);
    if (isNaN(slVal) || slVal <= 0) return;

    const priceDiff = Math.abs(activeInstrument.currentPrice - slVal);
    const pipsDiff = priceDiff / activeInstrument.pipSize;
    if (pipsDiff <= 0) return;

    const maxRiskDollars = (account.equity * riskPercent) / 100;

    let calculatedLots = 0.1;
    if (activeInstrument.category === 'forex') {
      // 1 pip on 1.0 lot = ~$10
      calculatedLots = maxRiskDollars / (pipsDiff * 10);
    } else {
      // Equities: price difference * shares = risk dollars
      calculatedLots = maxRiskDollars / priceDiff;
    }

    // Clamp between 0.01 and 50 lots
    const finalLots = Math.max(0.01, Math.min(50, Number(calculatedLots.toFixed(2))));
    setLots(finalLots);
  };

  const handleExecute = (direction: OrderDirection) => {
    if (!checklistValid) return;

    const sl = slPrice ? parseFloat(slPrice) : undefined;
    const tp = tpPrice ? parseFloat(tpPrice) : undefined;

    const combinedNotes = [
      notes,
      tradeRationale,
      selectedRegime ? `[${selectedRegime}]` : '',
      selectedConfluence.size > 0 ? `(${Array.from(selectedConfluence).join(', ')})` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (orderMode === 'market') {
      executeMarketOrder(direction, lots, leverage, sl, tp, selectedTag, combinedNotes || undefined);
    } else {
      const trig = parseFloat(triggerPrice);
      if (isNaN(trig) || trig <= 0) return;
      placePendingOrder(pendingType, trig, lots, leverage, sl, tp, selectedTag);
    }

    // Reset checklist after submission
    setSelectedRegime(null);
    setSelectedConfluence(new Set());
    setTradeRationale('');
    setChecklistOpen(false);
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      addStrategyTag(newTagInput.trim());
      setSelectedTag(newTagInput.trim());
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const toggleConfluence = (option: string) => {
    setSelectedConfluence(prev => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  return (
    <div className="neo-box p-4 flex flex-col h-full">
      {/* Mode Selector (Market Execution vs Pending Order) */}
      <div className="grid grid-cols-2 gap-2 p-1 neo-inset-sm mb-3">
        <button
          onClick={() => setOrderMode('market')}
          className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            orderMode === 'market'
              ? 'bg-[var(--accent-brand)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Market Execution</span>
        </button>

        <button
          onClick={() => {
            setOrderMode('pending');
            if (!triggerPrice) {
              setTriggerPrice(activeInstrument.currentPrice.toFixed(activeInstrument.digits));
            }
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            orderMode === 'pending'
              ? 'bg-[var(--accent-brand)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Order</span>
        </button>
      </div>

      {/* Pending Order Type selector */}
      {orderMode === 'pending' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select
            value={pendingType}
            onChange={e => setPendingType(e.target.value as PendingOrderType)}
            className="neo-input text-xs col-span-1"
          >
            <option value="BUY_LIMIT">Buy Limit</option>
            <option value="SELL_LIMIT">Sell Limit</option>
            <option value="BUY_STOP">Buy Stop</option>
            <option value="SELL_STOP">Sell Stop</option>
          </select>

          <input
            type="number"
            step="any"
            placeholder="Trigger Price"
            value={triggerPrice}
            onChange={e => setTriggerPrice(e.target.value)}
            className="neo-input text-xs col-span-1"
          />
        </div>
      )}

      {/* Lot / Volume Sizing */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">
            Volume ({activeInstrument.category === 'stock' ? 'Shares' : 'Lots'}):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalculator(prev => !prev)}
              className="text-[10px] text-[var(--accent-brand)] hover:underline flex items-center gap-0.5 font-bold"
            >
              <Calculator className="w-3 h-3" />
              <span>Risk % Sizer</span>
            </button>
            <span className="font-mono text-[var(--text-muted)]">
              ~${pipDollarValue.toFixed(2)}/pip
            </span>
          </div>
        </div>

        {/* Risk % Sizer expansion */}
        {showCalculator && (
          <div className="p-2 neo-inset-sm rounded-lg space-y-2 mb-2 animate-fadeIn text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Percent className="w-3 h-3" /> Risk % of Equity:
              </span>
              <div className="flex items-center gap-1">
                {[0.5, 1.0, 2.0].map(p => (
                  <button
                    key={p}
                    onClick={() => setRiskPercent(p)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      riskPercent === p ? 'bg-[var(--accent-brand)] text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Risk Dollar Cap:</span>
              <span className="font-bold font-mono text-[var(--accent-short)]">
                ${((account.equity * riskPercent) / 100).toFixed(2)}
              </span>
            </div>

            <button
              onClick={calculateLotsByRisk}
              disabled={!slPrice}
              className="w-full py-1 rounded bg-[var(--accent-brand)] text-white text-[11px] font-bold disabled:opacity-40"
            >
              {slPrice ? 'Auto-Calculate Volume from SL' : 'Enter Stop Loss First'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLots(prev => Math.max(0.01, Number((prev - 0.1).toFixed(2))))}
            className="neo-btn px-2.5 py-1 text-xs"
          >
            -
          </button>
          <input
            type="number"
            min="0.01"
            step="0.05"
            value={lots}
            onChange={e => setLots(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            className="neo-input text-center text-sm font-bold"
          />
          <button
            onClick={() => setLots(prev => Number((prev + 0.1).toFixed(2)))}
            className="neo-btn px-2.5 py-1 text-xs"
          >
            +
          </button>
        </div>

        {/* Quick lot preset buttons */}
        <div className="grid grid-cols-6 gap-1 pt-1">
          {quickLots.map(q => (
            <button
              key={q}
              onClick={() => setLots(q)}
              className={`py-1 text-[11px] font-mono rounded-md neo-btn-sm text-center transition-all ${
                lots === q ? 'bg-[var(--accent-brand)] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Leverage Selector */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">Leverage:</span>
          <span className="font-mono text-[var(--text-muted)]">Req Margin: ${requiredMargin}</span>
        </div>

        <div className="flex items-center gap-1.5 neo-inset-sm p-1">
          {[10, 50, 100, 200, 500].map(lev => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`flex-1 py-1 text-[11px] font-mono rounded transition-all ${
                leverage === lev
                  ? 'bg-[var(--accent-brand)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              1:{lev}
            </button>
          ))}
        </div>
      </div>

      {/* Stop Loss & Take Profit Protection Inputs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-short)]">
            <ShieldAlert className="w-3 h-3" />
            <span>Stop Loss</span>
          </div>
          <input
            type="number"
            step="any"
            placeholder="SL Price"
            value={slPrice}
            onChange={e => setSlPrice(e.target.value)}
            className="neo-input text-xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-long)]">
            <Target className="w-3 h-3" />
            <span>Take Profit</span>
          </div>
          <input
            type="number"
            step="any"
            placeholder="TP Price"
            value={tpPrice}
            onChange={e => setTpPrice(e.target.value)}
            className="neo-input text-xs"
          />
        </div>
      </div>

      {/* Strategy / Method Tagging */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">Method Rule / Setup Tag:</span>
          <button
            onClick={() => setIsAddingTag(prev => !prev)}
            className="text-[10px] font-bold text-[var(--accent-brand)] hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>{isAddingTag ? 'Cancel' : 'New Setup'}</span>
          </button>
        </div>

        {isAddingTag ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="e.g. 5M Pullback EMA"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              className="neo-input text-xs py-1.5"
            />
            <button
              onClick={handleAddNewTag}
              className="neo-btn neo-btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
            >
              Add
            </button>
          </div>
        ) : (
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="neo-input text-xs"
          >
            {strategyTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Method notes / entry confirmation reason..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="neo-input text-[11px] py-1 text-[var(--text-muted)]"
        />
      </div>

      {/* Margin Warning */}
      {requiredMargin > account.freeMargin && (
        <div className="p-2 mb-3 rounded-lg bg-[var(--accent-short-bg)] text-[var(--accent-short)] text-[11px] font-semibold border border-[var(--accent-short)]/30">
          ⚠️ Required margin (${requiredMargin}) exceeds free margin (${account.freeMargin.toLocaleString()}).
        </div>
      )}

      {/* Pre-Trade Checklist */}
      <div className="mb-3 neo-inset-sm rounded-xl overflow-hidden">
        {/* Header / Toggle */}
        <button
          onClick={() => setChecklistOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-brand)] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
            Pre-Trade Checklist
            <span className="text-[10px] font-bold text-[var(--accent-short)] uppercase tracking-wide">(Required)</span>
            {!checklistOpen && checklistValid && selectedRegime && (
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">✓ Done</span>
            )}
          </span>
          {checklistOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </button>

        {/* Expandable Body */}
        {checklistOpen && (
          <div className="px-3 pb-3 space-y-3 border-t border-[var(--border-subtle)]">

            {/* a) Market Regime */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                Market Regime <span className="text-[var(--accent-short)]">*</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MARKET_REGIMES.map(regime => (
                  <button
                    key={regime}
                    onClick={() => setSelectedRegime(regime)}
                    className={`py-1.5 px-1 text-[10px] font-semibold rounded-lg transition-all ${
                      selectedRegime === regime
                        ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                        : 'neo-btn text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {regime}
                  </button>
                ))}
              </div>
            </div>

            {/* b) Technical Confluence */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                Technical Confluence <span className="text-[var(--accent-short)]">*</span>
                <span className="ml-1 text-[10px] font-normal normal-case">(select ≥1)</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {CONFLUENCE_OPTIONS.map(option => {
                  const active = selectedConfluence.has(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleConfluence(option)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full border transition-all ${
                        active
                          ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-brand)]/50 hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {active && <Check className="w-2.5 h-2.5" />}
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* c) Risk:Reward Ratio */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Risk : Reward Ratio</div>
              <div className="neo-inset-sm rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">Calculated R:R</span>
                {rrRatio !== null ? (
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    1 : {rrRatio.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] italic">Set SL &amp; TP to calculate R:R</span>
                )}
              </div>
            </div>

            {/* d) Trade Rationale Note */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Trade Rationale</div>
              <textarea
                rows={3}
                value={tradeRationale}
                onChange={e => setTradeRationale(e.target.value)}
                placeholder="Describe the specific setup: why this entry, what invalidates it..."
                className="neo-input text-[11px] w-full resize-none text-[var(--text-muted)] placeholder:text-[var(--text-muted)]/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Execution Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          onClick={() => handleExecute('SELL')}
          disabled={requiredMargin > account.freeMargin || !checklistValid}
          title={!checklistValid ? 'Complete required Pre-Trade Checklist criteria first' : undefined}
          className="neo-btn neo-btn-sell py-3 px-3 flex flex-col items-center justify-center rounded-xl disabled:opacity-50"
        >
          <div className="text-xs font-bold uppercase tracking-wider">SELL / SHORT</div>
          <div className="text-sm font-mono font-extrabold">{activeInstrument.bid.toFixed(activeInstrument.digits)}</div>
        </button>

        <button
          onClick={() => handleExecute('BUY')}
          disabled={requiredMargin > account.freeMargin || !checklistValid}
          title={!checklistValid ? 'Complete required Pre-Trade Checklist criteria first' : undefined}
          className="neo-btn neo-btn-buy py-3 px-3 flex flex-col items-center justify-center rounded-xl disabled:opacity-50"
        >
          <div className="text-xs font-bold uppercase tracking-wider">BUY / LONG</div>
          <div className="text-sm font-mono font-extrabold">{activeInstrument.ask.toFixed(activeInstrument.digits)}</div>
        </button>
      </div>

      {/* Spread & Commission footnote */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-3 mt-2 border-t border-[var(--border-subtle)] font-mono">
        <span>Spread: {activeInstrument.spread} pips</span>
        <span>Commission: $0.00 (Zero-Fee)</span>
      </div>
    </div>
  );
};
