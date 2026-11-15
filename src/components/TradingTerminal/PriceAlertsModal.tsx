import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Bell,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Volume2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({ isOpen, onClose }) => {
  const { activeInstrument, priceAlerts, addPriceAlert, removePriceAlert } = useTrading();

  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>(() => {
    const diff = activeInstrument.pipSize * 20;
    return (activeInstrument.currentPrice + diff).toFixed(activeInstrument.digits);
  });
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const currentPrice = activeInstrument.currentPrice;

  const handleQuickOffset = (pips: number) => {
    const newPrice = currentPrice + pips * activeInstrument.pipSize;
    setTargetPrice(newPrice.toFixed(activeInstrument.digits));
    setCondition(pips >= 0 ? 'ABOVE' : 'BELOW');
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    addPriceAlert(priceNum, condition, note.trim() || undefined);
    setNote('');
  };

  // Filter alerts for current instrument or all
  const instrumentAlerts = priceAlerts.filter(a => a.symbol === activeInstrument.symbol);
  const otherAlerts = priceAlerts.filter(a => a.symbol !== activeInstrument.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="neo-box w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-amber-500">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Price Level Alerts
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Real-time chime & toast triggers when price crosses your key levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neo-btn p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Symbol Info & Quick Offsets */}
        <div className="my-4 p-3 neo-inset rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Active Instrument
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--text-primary)]">
                {activeInstrument.symbol}
              </span>
              <span className="font-mono text-sm font-semibold text-[var(--accent-brand)]">
                {currentPrice.toFixed(activeInstrument.digits)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQuickOffset(15)}
              className="neo-btn py-1 px-2 text-[11px] font-mono text-[var(--accent-long)]"
            >
              +15 pips
            </button>
            <button
              type="button"
              onClick={() => handleQuickOffset(30)}
              className="neo-btn py-1 px-2 text-[11px] font-mono text-[var(--accent-long)]"
            >
              +30 pips
            </button>
            <button
              type="button"
              onClick={() => handleQuickOffset(-15)}
              className="neo-btn py-1 px-2 text-[11px] font-mono text-[var(--accent-short)]"
            >
              -15 pips
            </button>
          </div>
        </div>

        {/* New Alert Form */}
        <form onSubmit={handleAddAlert} className="space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                Condition
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 neo-inset rounded-lg">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all ${
                    condition === 'ABOVE'
                      ? 'bg-[var(--accent-long)] text-white shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>≥ Above</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all ${
                    condition === 'BELOW'
                      ? 'bg-[var(--accent-short)] text-white shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>≤ Below</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                Target Trigger Price
              </label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                required
                className="w-full neo-input py-2 px-3 text-sm font-mono text-[var(--text-primary)]"
                placeholder={currentPrice.toString()}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
              Strategy Setup Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Wait for 15M breaker block rejection"
              className="w-full neo-input py-2 px-3 text-xs text-[var(--text-primary)]"
            />
          </div>

          <button
            type="submit"
            className="w-full neo-btn py-2.5 px-4 text-xs font-bold text-white bg-[var(--accent-brand)] hover:opacity-95 flex items-center justify-center gap-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Price Alert</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Configured Alerts ({priceAlerts.length})</span>
            <span className="text-[10px] lowercase font-normal flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-amber-500" /> audio chime enabled
            </span>
          </h3>

          {priceAlerts.length === 0 ? (
            <div className="p-4 text-center neo-inset rounded-lg text-xs text-[var(--text-muted)]">
              No active price alerts. Set a level above to be notified instantly on tick crossings.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {instrumentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-2.5 neo-inset rounded-lg flex items-center justify-between gap-3 text-xs ${
                    alert.triggered ? 'opacity-60 bg-[var(--bg-sunken)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {alert.triggered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-[var(--text-primary)]">{alert.symbol}</span>
                        <span
                          className={
                            alert.condition === 'ABOVE'
                              ? 'text-[var(--accent-long)] font-semibold'
                              : 'text-[var(--accent-short)] font-semibold'
                          }
                        >
                          {alert.condition === 'ABOVE' ? '≥' : '≤'} {alert.targetPrice}
                        </span>
                      </div>
                      {alert.note && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">
                          {alert.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        alert.triggered
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {alert.triggered ? 'TRIGGERED' : 'ARMED'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePriceAlert(alert.id)}
                      className="neo-btn p-1 text-[var(--text-muted)] hover:text-rose-500"
                      title="Remove Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {otherAlerts.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">
                    Other Symbols ({otherAlerts.length})
                  </span>
                  {otherAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="p-2 neo-inset rounded-lg flex items-center justify-between text-xs mb-1.5"
                    >
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {alert.symbol} {alert.condition === 'ABOVE' ? '≥' : '≤'} {alert.targetPrice}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePriceAlert(alert.id)}
                        className="neo-btn p-1 text-[var(--text-muted)] hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
