import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  X,
  Gauge,
  History,
} from 'lucide-react';

export const BarReplayToolbar: React.FC = () => {
  const {
    replayState,
    startReplay,
    stepReplay,
    togglePlayReplay,
    setReplaySpeed,
    exitReplay,
  } = useTrading();

  if (!replayState.isActive) {
    return (
      <button
        onClick={() => startReplay()}
        className="neo-btn py-1 px-2.5 text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1.5 transition-all"
        title="Activate Historical Bar Replay to test your strategy bar-by-bar"
      >
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Bar Replay</span>
      </button>
    );
  }

  const progressPercent = Math.round(
    ((replayState.currentIndex + 1) / Math.max(1, replayState.totalCandles)) * 100
  );

  return (
    <div className="w-full mb-2 p-2.5 neo-inset rounded-lg flex flex-wrap items-center justify-between gap-2 border border-amber-500/30 bg-amber-500/5 animate-fadeIn">
      {/* Left: Replay Status & Bar Count */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Replay Mode
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Bar {replayState.currentIndex + 1} / {replayState.totalCandles} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Middle: Tactical Playback Controls */}
      <div className="flex items-center gap-1.5">
        {/* Rewind to start */}
        <button
          onClick={() => startReplay(15)}
          className="neo-btn p-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="Rewind to start of Replay"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlayReplay}
          className={`neo-btn px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${
            replayState.isPlaying
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'text-[var(--text-primary)]'
          }`}
          title={replayState.isPlaying ? 'Pause Replay (Space)' : 'Play Replay (Space)'}
        >
          {replayState.isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Step Forward 1 Bar */}
        <button
          onClick={stepReplay}
          disabled={replayState.isPlaying}
          className="neo-btn px-2 py-1 text-xs text-[var(--text-primary)] flex items-center gap-1 disabled:opacity-40"
          title="Step Forward 1 Bar (ArrowRight)"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Step</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 ml-1 neo-inset-sm p-0.5">
          <Gauge className="w-3 h-3 text-[var(--text-muted)] mx-1 hidden sm:block" />
          {([1, 2, 5] as const).map(spd => (
            <button
              key={spd}
              onClick={() => setReplaySpeed(spd)}
              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-all ${
                replayState.speed === spd
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Exit Replay */}
      <button
        onClick={exitReplay}
        className="neo-btn py-1 px-2 text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1"
        title="Exit Replay and return to Live Market feed"
      >
        <X className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit</span>
      </button>
    </div>
  );
};
