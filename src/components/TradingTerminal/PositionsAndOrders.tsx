import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { Position } from '../../types/trading';
import { X, Edit3, ShieldAlert, Target, AlertOctagon, FileSpreadsheet, Landmark, Plus } from 'lucide-react';
import { WithdrawalModal } from '../Withdrawal/WithdrawalModal';

export const PositionsAndOrders: React.FC = () => {
  const {
    positions,
    pendingOrders,
    closedTrades,
    withdrawalRequests,
    closePosition,
    cancelPendingOrder,
    modifyPosition,
    exportTradesToCSV,
  } = useTrading();

  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'pending' | 'history' | 'withdrawals'>('positions');
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [newSL, setNewSL] = useState<string>('');
  const [newTP, setNewTP] = useState<string>('');

  const openEditModal = (pos: Position) => {
    setEditingPosition(pos);
    setNewSL(pos.sl ? pos.sl.toString() : '');
    setNewTP(pos.tp ? pos.tp.toString() : '');
  };

  const saveEdit = () => {
    if (!editingPosition) return;
    const sl = newSL ? parseFloat(newSL) : undefined;
    const tp = newTP ? parseFloat(newTP) : undefined;
    modifyPosition(editingPosition.id, sl, tp);
    setEditingPosition(null);
  };

  const handleCloseAll = () => {
    if (window.confirm('Are you sure you want to close ALL active positions at market price?')) {
      positions.forEach(p => closePosition(p.id));
    }
  };

  return (
    <div className="neo-box p-4 flex flex-col min-h-[300px]">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
        <div className="flex items-center gap-1.5 neo-inset-sm p-1">
          <button
            onClick={() => setActiveSubTab('positions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'positions'
                ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Open Positions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {positions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pending'
                ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Pending Orders</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {pendingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Closed History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {closedTrades.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('withdrawals')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'withdrawals'
                ? 'bg-[var(--accent-brand)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wire Withdrawals</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {withdrawalRequests.length}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'withdrawals' && (
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="neo-btn py-1 px-2.5 text-xs font-bold text-emerald-400 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request Wire</span>
            </button>
          )}
          {activeSubTab === 'history' && closedTrades.length > 0 && (
            <button
              onClick={exportTradesToCSV}
              className="neo-btn py-1 px-2.5 text-xs text-[var(--accent-brand)] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {activeSubTab === 'positions' && positions.length > 1 && (
            <button
              onClick={handleCloseAll}
              className="neo-btn py-1 px-2.5 text-xs text-[var(--accent-short)] flex items-center gap-1 hover:bg-[var(--accent-short-bg)]"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Close All</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto mt-2">
        {/* SUBTAB 1: OPEN POSITIONS */}
        {activeSubTab === 'positions' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                <th className="py-2 px-2 font-medium">Symbol</th>
                <th className="py-2 px-2 font-medium">Type</th>
                <th className="py-2 px-2 font-medium">Lots</th>
                <th className="py-2 px-2 font-medium">Open Price</th>
                <th className="py-2 px-2 font-medium">Current Price</th>
                <th className="py-2 px-2 font-medium">S/L</th>
                <th className="py-2 px-2 font-medium">T/P</th>
                <th className="py-2 px-2 font-medium">Floating P&L</th>
                <th className="py-2 px-2 font-medium">Method Tag</th>
                <th className="py-2 px-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
              {positions.map(pos => {
                const isBuy = pos.direction === 'BUY';
                const isProfit = pos.pnl >= 0;

                return (
                  <tr key={pos.id} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-[var(--text-primary)]">
                      {pos.symbol}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-[var(--accent-long-bg)] text-[var(--accent-long)]'
                            : 'bg-[var(--accent-short-bg)] text-[var(--accent-short)]'
                        }`}
                      >
                        {pos.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">{pos.lots}</td>
                    <td className="py-2.5 px-2">{pos.openPrice}</td>
                    <td className="py-2.5 px-2">{pos.currentPrice}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">
                      {pos.sl ? pos.sl : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">
                      {pos.tp ? pos.tp : '-'}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`font-bold text-sm ${
                            isProfit ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
                          }`}
                        >
                          {isProfit ? '+' : ''}${pos.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] ${isProfit ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'}`}>
                          ({isProfit ? '+' : ''}{pos.pnlPips}p)
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full neo-inset-sm text-[var(--text-secondary)]">
                        {pos.strategyTag}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(pos)}
                          className="neo-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Modify SL/TP"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => closePosition(pos.id)}
                          className="neo-btn p-1 text-[var(--accent-short)] hover:bg-[var(--accent-short-bg)]"
                          title="Close Position at Market"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {positions.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-[var(--text-muted)] font-sans">
                    No active positions open. Place a market execution order above to test your strategy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* SUBTAB 2: PENDING ORDERS */}
        {activeSubTab === 'pending' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                <th className="py-2 px-2 font-medium">Symbol</th>
                <th className="py-2 px-2 font-medium">Type</th>
                <th className="py-2 px-2 font-medium">Lots</th>
                <th className="py-2 px-2 font-medium">Trigger Price</th>
                <th className="py-2 px-2 font-medium">S/L</th>
                <th className="py-2 px-2 font-medium">T/P</th>
                <th className="py-2 px-2 font-medium">Method Tag</th>
                <th className="py-2 px-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
              {pendingOrders.map(order => (
                <tr key={order.id} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                  <td className="py-2.5 px-2 font-bold text-[var(--text-primary)]">{order.symbol}</td>
                  <td className="py-2.5 px-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent-brand-glow)] text-[var(--accent-brand)]">
                      {order.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">{order.lots}</td>
                  <td className="py-2.5 px-2 font-bold">{order.triggerPrice}</td>
                  <td className="py-2.5 px-2 text-[var(--text-muted)]">{order.sl || '-'}</td>
                  <td className="py-2.5 px-2 text-[var(--text-muted)]">{order.tp || '-'}</td>
                  <td className="py-2.5 px-2">
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full neo-inset-sm text-[var(--text-secondary)]">
                      {order.strategyTag}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => cancelPendingOrder(order.id)}
                      className="neo-btn p-1 text-[var(--accent-short)]"
                      title="Cancel Pending Order"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[var(--text-muted)] font-sans">
                    No pending limit or stop orders currently waiting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* SUBTAB 3: CLOSED HISTORY */}
        {activeSubTab === 'history' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                <th className="py-2 px-2 font-medium">Symbol</th>
                <th className="py-2 px-2 font-medium">Type</th>
                <th className="py-2 px-2 font-medium">Lots</th>
                <th className="py-2 px-2 font-medium">Entry</th>
                <th className="py-2 px-2 font-medium">Exit</th>
                <th className="py-2 px-2 font-medium">Realized P&L</th>
                <th className="py-2 px-2 font-medium">Exit Reason</th>
                <th className="py-2 px-2 font-medium">Method Tag</th>
                <th className="py-2 px-2 font-medium text-right">Close Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-numbers">
              {closedTrades.map(trade => {
                const isBuy = trade.direction === 'BUY';
                const isProfit = trade.pnl >= 0;

                return (
                  <tr key={trade.id} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-[var(--text-primary)]">{trade.symbol}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-[var(--accent-long-bg)] text-[var(--accent-long)]'
                            : 'bg-[var(--accent-short-bg)] text-[var(--accent-short)]'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">{trade.lots}</td>
                    <td className="py-2.5 px-2">{trade.openPrice}</td>
                    <td className="py-2.5 px-2">{trade.closePrice}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`font-bold ${
                          isProfit ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'
                        }`}
                      >
                        {isProfit ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          trade.closeReason === 'TP_HIT'
                            ? 'bg-[var(--accent-long-bg)] text-[var(--accent-long)]'
                            : trade.closeReason === 'SL_HIT'
                            ? 'bg-[var(--accent-short-bg)] text-[var(--accent-short)]'
                            : 'bg-[var(--bg-sunken)] text-[var(--text-muted)]'
                        }`}
                      >
                        {trade.closeReason}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded-full neo-inset-sm text-[var(--text-secondary)]">
                        {trade.strategyTag}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-[11px] text-[var(--text-muted)]">
                      {new Date(trade.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                );
              })}

              {closedTrades.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[var(--text-muted)] font-sans">
                    No closed trades yet. Once you close positions or hit TP/SL, detailed strategy logs appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* 4. Wire Transfers History Table */}
        {activeSubTab === 'withdrawals' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Wire Reference</th>
                <th className="py-2.5 px-3">Date Dispatched</th>
                <th className="py-2.5 px-3">Beneficiary Institution</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Routing (ABA)</th>
                <th className="py-2.5 px-3 text-right">Amount ($ USD)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/40 font-mono-numbers">
              {withdrawalRequests.map(req => (
                <tr key={req.id} className="hover:bg-[var(--bg-sunken)]/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                    {req.referenceId}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)] font-mono text-[11px]">
                    {new Date(req.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-primary)]">
                    {req.bankName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                    {req.accountNumberMasked} ({req.accountType})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[var(--text-muted)]">
                    {req.routingNumber}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                    ${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                        req.status === 'SETTLED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'DISPATCHED_FEDWIRE'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.status === 'SETTLED'
                        ? 'Settled'
                        : req.status === 'DISPATCHED_FEDWIRE'
                        ? 'Dispatched'
                        : 'Processing'}
                    </span>
                  </td>
                </tr>
              ))}

              {withdrawalRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--text-muted)] font-sans">
                    No domestic wire withdrawals recorded yet. Click "Request Wire" to submit a payout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Wire Withdrawal Modal */}
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />

      {/* Edit SL/TP Modal */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="neo-card p-5 w-full max-w-sm relative">
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              Modify Order Protection: {editingPosition.symbol}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Entry: {editingPosition.openPrice} ({editingPosition.direction} {editingPosition.lots} lots)
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-[var(--accent-short)] flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Stop Loss (Price):
                </label>
                <input
                  type="number"
                  step="any"
                  value={newSL}
                  onChange={e => setNewSL(e.target.value)}
                  placeholder="Leave blank for no SL"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--accent-long)] flex items-center gap-1 mb-1">
                  <Target className="w-3.5 h-3.5" />
                  Take Profit (Price):
                </label>
                <input
                  type="number"
                  step="any"
                  value={newTP}
                  onChange={e => setNewTP(e.target.value)}
                  placeholder="Leave blank for no TP"
                  className="neo-input text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPosition(null)}
                className="neo-btn px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="neo-btn neo-btn-primary px-4 py-1.5 text-xs font-bold"
              >
                Update Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
