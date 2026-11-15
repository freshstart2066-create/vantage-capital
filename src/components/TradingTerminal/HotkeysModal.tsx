import React from 'react';
import {
  Keyboard,
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  XCircle,
  Play,
  SkipForward,
  HelpCircle,
} from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    {
      combo: ['Shift', 'B'],
      action: 'Quick Market Buy',
      description: 'Instantly fires 0.10 lot long order on the active instrument',
      icon: <TrendingUp className="w-4 h-4 text-[var(--accent-long)]" />,
    },
    {
      combo: ['Shift', 'S'],
      action: 'Quick Market Sell',
      description: 'Instantly fires 0.10 lot short order on the active instrument',
      icon: <TrendingDown className="w-4 h-4 text-[var(--accent-short)]" />,
    },
    {
      combo: ['Shift', 'C'],
      action: 'Close All Positions',
      description: 'Emergency panic liquidation of all active open market positions',
      icon: <XCircle className="w-4 h-4 text-rose-500" />,
    },
    {
      combo: ['Space'],
      action: 'Replay Play / Pause',
      description: 'Toggles playback of historical bar-by-bar market simulation',
      icon: <Play className="w-4 h-4 text-amber-500" />,
    },
    {
      combo: ['→ (Arrow Right)'],
      action: 'Replay Step 1 Bar',
      description: 'Advances historical candles forward by single bar increment',
      icon: <SkipForward className="w-4 h-4 text-sky-400" />,
    },
    {
      combo: ['?'],
      action: 'Toggle Hotkeys Cheat Sheet',
      description: 'Opens this institutional tactical keyboard mapping dialog',
      icon: <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="neo-box w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[var(--accent-brand)]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Pro Keyboard Hotkeys
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Execute trades, manage risk & control replay with institutional speed
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

        {/* Hotkeys Grid */}
        <div className="my-4 space-y-2.5">
          {hotkeys.map(item => (
            <div
              key={item.action}
              className="p-3 neo-inset rounded-lg flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 neo-box rounded-md shrink-0">
                  {item.icon}
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)] block">
                    {item.action}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {item.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.combo.map(key => (
                  <kbd
                    key={key}
                    className="px-2 py-1 rounded bg-[var(--bg-sunken)] border border-[var(--border-darker)] font-mono text-[11px] font-bold text-[var(--text-primary)] shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="p-3 neo-inset rounded-lg text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Hotkeys are always armed unless typing inside input fields.</span>
        </div>
      </div>
    </div>
  );
};
