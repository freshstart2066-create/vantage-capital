import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useTrading } from '../../context/TradingContext';
import type { Timeframe } from '../../types/trading';
import {
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  BarChart2,
  Minus,
  TrendingUp,
  Grid,
  Trash2,
  Layers,
  MousePointer,
  Bell,
} from 'lucide-react';
import { BarReplayToolbar } from './BarReplayToolbar';
import { PriceAlertsModal } from './PriceAlertsModal';

interface Drawing {
  id: string;
  type: 'hline' | 'trendline' | 'fib';
  p1: { x: number; y: number; price: number };
  p2?: { x: number; y: number; price: number };
  color: string;
  label?: string;
}

export const ChartContainer: React.FC = () => {
  const {
    activeInstrument,
    candles,
    timeframe,
    setTimeframe,
    positions,
    resolvedTheme,
    executeMarketOrder,
    priceAlerts,
  } = useTrading();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Indicators & Modal toggles
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showDOM, setShowDOM] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  // Drawing Tools state
  const [drawTool, setDrawTool] = useState<'cursor' | 'hline' | 'trendline' | 'fib'>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number; price: number } | null>(null);

  // Crosshair state
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const timeframes: Timeframe[] = ['1M', '5M', '15M', '1H', '4H', '1D'];

  // Current open positions on this active instrument
  const activePositions = useMemo(() => {
    return positions.filter(p => p.symbol === activeInstrument.symbol);
  }, [positions, activeInstrument.symbol]);

  // Moving Averages and Indicators Calculation
  const indicators = useMemo(() => {
    if (!candles || candles.length === 0) return { sma20: [], ema50: [], upperBB: [], lowerBB: [], rsi: [] };

    const closes = candles.map(c => c.close);

    // SMA 20
    const sma20: (number | null)[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < 19) {
        sma20.push(null);
      } else {
        const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
        sma20.push(sum / 20);
      }
    }

    // EMA 50
    const ema50: (number | null)[] = [];
    const k = 2 / (50 + 1);
    let prevEma: number | null = null;
    for (let i = 0; i < closes.length; i++) {
      if (i < 49) {
        ema50.push(null);
      } else if (i === 49) {
        const sum = closes.slice(0, 50).reduce((a, b) => a + b, 0);
        prevEma = sum / 50;
        ema50.push(prevEma);
      } else {
        prevEma = closes[i] * k + (prevEma as number) * (1 - k);
        ema50.push(prevEma);
      }
    }

    // Bollinger Bands (20, 2)
    const upperBB: (number | null)[] = [];
    const lowerBB: (number | null)[] = [];
    for (let i = 0; i < closes.length; i++) {
      const ma = sma20[i];
      if (ma === null) {
        upperBB.push(null);
        lowerBB.push(null);
      } else {
        const slice = closes.slice(i - 19, i + 1);
        const variance = slice.reduce((acc, val) => acc + Math.pow(val - ma, 2), 0) / 20;
        const stdDev = Math.sqrt(variance);
        upperBB.push(ma + stdDev * 2);
        lowerBB.push(ma - stdDev * 2);
      }
    }

    // RSI 14
    const rsi: (number | null)[] = [];
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      if (i < 14) {
        avgGain += gain;
        avgLoss += loss;
        rsi.push(null);
      } else if (i === 14) {
        avgGain = (avgGain + gain) / 14;
        avgLoss = (avgLoss + loss) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return { sma20, ema50, upperBB, lowerBB, rsi };
  }, [candles]);

  // Synthetic Level 2 Depth of Market (DOM)
  const domLevels = useMemo(() => {
    const ask = activeInstrument.ask;
    const bid = activeInstrument.bid;
    const pip = activeInstrument.pipSize;

    const asks = [
      { price: Number((ask + pip * 4).toFixed(activeInstrument.digits)), vol: 48, total: 198 },
      { price: Number((ask + pip * 3).toFixed(activeInstrument.digits)), vol: 35, total: 150 },
      { price: Number((ask + pip * 2).toFixed(activeInstrument.digits)), vol: 62, total: 115 },
      { price: Number((ask + pip * 1).toFixed(activeInstrument.digits)), vol: 28, total: 53 },
      { price: Number(ask.toFixed(activeInstrument.digits)), vol: 25, total: 25 },
    ];

    const bids = [
      { price: Number(bid.toFixed(activeInstrument.digits)), vol: 32, total: 32 },
      { price: Number((bid - pip * 1).toFixed(activeInstrument.digits)), vol: 45, total: 77 },
      { price: Number((bid - pip * 2).toFixed(activeInstrument.digits)), vol: 58, total: 135 },
      { price: Number((bid - pip * 3).toFixed(activeInstrument.digits)), vol: 40, total: 175 },
      { price: Number((bid - pip * 4).toFixed(activeInstrument.digits)), vol: 65, total: 240 },
    ];

    return { asks, bids };
  }, [activeInstrument]);

  // Main Canvas Drawing Routine
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const isDark = resolvedTheme === 'dark';

    // Theme colors
    const bgColor = isDark ? '#141a24' : '#e6ebf4';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const bullColor = isDark ? '#10b981' : '#059669';
    const bearColor = isDark ? '#f43f5e' : '#e11d48';

    // Background Clear
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padRight = 68; // Price axis
    const chartHeight = showRSI ? height - 90 : height - 30;
    const chartWidth = width - padRight;

    // Visible slice (show last 65 candles)
    const visibleCount = Math.min(candles.length, 65);
    const visibleCandles = candles.slice(-visibleCount);
    const offsetIndex = candles.length - visibleCount;

    // Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;

      const globalIdx = offsetIndex + i;
      if (showSMA && indicators.sma20[globalIdx]) {
        minPrice = Math.min(minPrice, indicators.sma20[globalIdx]!);
        maxPrice = Math.max(maxPrice, indicators.sma20[globalIdx]!);
      }
      if (showEMA && indicators.ema50[globalIdx]) {
        minPrice = Math.min(minPrice, indicators.ema50[globalIdx]!);
        maxPrice = Math.max(maxPrice, indicators.ema50[globalIdx]!);
      }
      if (showBollinger && indicators.upperBB[globalIdx]) {
        maxPrice = Math.max(maxPrice, indicators.upperBB[globalIdx]!);
      }
      if (showBollinger && indicators.lowerBB[globalIdx]) {
        minPrice = Math.min(minPrice, indicators.lowerBB[globalIdx]!);
      }
    }

    // Add breathing room
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.06;
    maxPrice += priceRange * 0.06;
    const effectiveRange = maxPrice - minPrice;

    // Coordinate converters
    const getX = (index: number) => (index / (visibleCount - 1)) * (chartWidth - 20) + 10;
    const getY = (val: number) => chartHeight - ((val - minPrice) / effectiveRange) * chartHeight;

    // 1. Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;

    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const y = (chartHeight / priceSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      const priceVal = maxPrice - (i / priceSteps) * effectiveRange;
      ctx.fillStyle = textColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceVal.toFixed(activeInstrument.digits), chartWidth + 6, y + 4);
    }

    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const x = (chartWidth / timeSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }

    // 2. Volume Histogram
    const volHeight = chartHeight * 0.16;
    const candleWidth = Math.max((chartWidth / visibleCount) * 0.65, 3);

    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const x = getX(i);
      const vH = (c.volume / (maxVolume || 1)) * volHeight;
      const isBull = c.close >= c.open;
      ctx.fillStyle = isBull ? (isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.18)') : (isDark ? 'rgba(244, 63, 94, 0.18)' : 'rgba(225, 29, 72, 0.18)');
      ctx.fillRect(x - candleWidth / 2, chartHeight - vH, candleWidth, vH);
    }

    // 3. Bollinger Bands
    if (showBollinger) {
      ctx.beginPath();
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = indicators.upperBB[offsetIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const val = indicators.lowerBB[offsetIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.05)';
      ctx.fill();

      ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 4. Candlesticks
    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const x = getX(i);
      const isBull = c.close >= c.open;
      const color = isBull ? bullColor : bearColor;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      const topY = getY(Math.max(c.open, c.close));
      const botY = getY(Math.min(c.open, c.close));
      const bodyH = Math.max(botY - topY, 1.5);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyH);
    }

    // 5. SMA 20
    if (showSMA) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = indicators.sma20[offsetIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 6. EMA 50
    if (showEMA) {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = indicators.ema50[offsetIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 7. Render User Chart Drawings (Support/Resistance, Trendlines, Fib)
    drawings.forEach(d => {
      ctx.strokeStyle = d.color;
      ctx.fillStyle = d.color;
      ctx.lineWidth = 1.5;

      if (d.type === 'hline') {
        const y = getY(d.p1.price);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`Key Level: ${d.p1.price.toFixed(activeInstrument.digits)}`, 10, y - 4);
      } else if (d.type === 'trendline' && d.p2) {
        const y1 = getY(d.p1.price);
        const y2 = getY(d.p2.price);
        ctx.beginPath();
        ctx.moveTo(d.p1.x, y1);
        ctx.lineTo(d.p2.x, y2);
        ctx.stroke();
      } else if (d.type === 'fib' && d.p2) {
        const yTop = getY(Math.max(d.p1.price, d.p2.price));
        const yBot = getY(Math.min(d.p1.price, d.p2.price));
        const fibH = yBot - yTop;
        const levels = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

        levels.forEach(lvl => {
          const lvlY = yTop + fibH * lvl;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(0, lvlY);
          ctx.lineTo(chartWidth, lvlY);
          ctx.stroke();

          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillText(`Fib ${(lvl * 100).toFixed(1)}%`, chartWidth - 60, lvlY - 2);
        });
        ctx.setLineDash([]);
      }
    });

    // 8. Active Positions Lines (Entry / SL / TP)
    activePositions.forEach(pos => {
      const entryY = getY(pos.openPrice);
      const isBuy = pos.direction === 'BUY';

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isBuy ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = isBuy ? '#10b981' : '#f43f5e';
      ctx.fillRect(chartWidth + 2, entryY - 9, 62, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${pos.direction} ${pos.lots}L`, chartWidth + 33, entryY + 3);

      if (pos.tp && pos.tp > 0) {
        const tpY = getY(pos.tp);
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(chartWidth, tpY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillRect(chartWidth + 2, tpY - 8, 48, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`TP ${pos.tp.toFixed(activeInstrument.digits)}`, chartWidth + 26, tpY + 3);
      }

      if (pos.sl && pos.sl > 0) {
        const slY = getY(pos.sl);
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(chartWidth, slY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.fillRect(chartWidth + 2, slY - 8, 48, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SL ${pos.sl.toFixed(activeInstrument.digits)}`, chartWidth + 26, slY + 3);
      }
    });

    // 8.5 Price Alerts Lines
    const instrumentAlerts = priceAlerts.filter(a => a.symbol === activeInstrument.symbol && !a.triggered);
    instrumentAlerts.forEach(alt => {
      const altY = getY(alt.targetPrice);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, altY);
      ctx.lineTo(chartWidth, altY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(chartWidth + 2, altY - 8, 62, 16);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🔔 ${alt.targetPrice}`, chartWidth + 33, altY + 3);
    });

    // 9. Live Current Price Line
    const currentPriceY = getY(activeInstrument.currentPrice);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = isDark ? '#3b82f6' : '#2563eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, currentPriceY);
    ctx.lineTo(chartWidth, currentPriceY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb';
    ctx.fillRect(chartWidth, currentPriceY - 10, padRight, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(activeInstrument.currentPrice.toFixed(activeInstrument.digits), chartWidth + padRight / 2, currentPriceY + 4);

    // 10. RSI Panel
    if (showRSI) {
      const rsiTop = height - 75;
      const rsiH = 55;

      ctx.fillStyle = isDark ? '#10141d' : '#dae1ec';
      ctx.fillRect(0, rsiTop, chartWidth, rsiH);

      const y70 = rsiTop + rsiH * 0.3;
      const y30 = rsiTop + rsiH * 0.7;

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(chartWidth, y70);
      ctx.moveTo(0, y30);
      ctx.lineTo(chartWidth, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = textColor;
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('70', chartWidth + 6, y70 + 3);
      ctx.fillText('30', chartWidth + 6, y30 + 3);

      ctx.beginPath();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.4;
      let rsiStarted = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = indicators.rsi[offsetIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = rsiTop + rsiH - (val / 100) * rsiH;
          if (!rsiStarted) {
            ctx.moveTo(x, y);
            rsiStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.fillText('RSI (14)', 8, rsiTop + 12);
    }

    // 11. Crosshair & Tooltip
    if (mousePos && mousePos.x < chartWidth && mousePos.y < chartHeight) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const cursorPrice = maxPrice - (mousePos.y / chartHeight) * effectiveRange;
      ctx.fillStyle = isDark ? '#1e293b' : '#334155';
      ctx.fillRect(chartWidth, mousePos.y - 9, padRight, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cursorPrice.toFixed(activeInstrument.digits), chartWidth + padRight / 2, mousePos.y + 4);

      const closestIdx = Math.round(((mousePos.x - 10) / (chartWidth - 20)) * (visibleCount - 1));
      if (closestIdx >= 0 && closestIdx < visibleCandles.length) {
        const c = visibleCandles[closestIdx];
        const dateStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        ctx.fillStyle = isDark ? 'rgba(15, 20, 28, 0.88)' : 'rgba(240, 244, 250, 0.88)';
        ctx.fillRect(8, 8, 290, 22);
        ctx.strokeStyle = gridColor;
        ctx.strokeRect(8, 8, 290, 22);

        ctx.fillStyle = textColor;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${dateStr}  O: ${c.open}  H: ${c.high}  L: ${c.low}  C: ${c.close}  V: ${c.volume}`, 14, 23);
      }
    }
  }, [
    activeInstrument,
    candles,
    indicators,
    mousePos,
    resolvedTheme,
    showSMA,
    showEMA,
    showBollinger,
    showRSI,
    drawings,
    activePositions,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  // Handle Canvas Click for Drawing Tools
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawTool === 'cursor') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padRight = 68;
    const chartHeight = showRSI ? rect.height - 90 : rect.height - 30;
    const chartWidth = rect.width - padRight;
    if (x >= chartWidth || y >= chartHeight) return;

    // Convert y to price
    const visibleCount = Math.min(candles.length, 65);
    const visibleCandles = candles.slice(-visibleCount);
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.06;
    maxPrice += priceRange * 0.06;
    const effectiveRange = maxPrice - minPrice;
    const clickedPrice = maxPrice - (y / chartHeight) * effectiveRange;

    if (drawTool === 'hline') {
      const newD: Drawing = {
        id: 'drw_' + Date.now(),
        type: 'hline',
        p1: { x, y, price: clickedPrice },
        color: '#f59e0b',
      };
      setDrawings(prev => [...prev, newD]);
    } else if (drawTool === 'trendline' || drawTool === 'fib') {
      if (!drawingStart) {
        setDrawingStart({ x, y, price: clickedPrice });
      } else {
        const newD: Drawing = {
          id: 'drw_' + Date.now(),
          type: drawTool,
          p1: drawingStart,
          p2: { x, y, price: clickedPrice },
          color: drawTool === 'fib' ? '#38bdf8' : '#10b981',
        };
        setDrawings(prev => [...prev, newD]);
        setDrawingStart(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`neo-box p-4 flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : 'w-full h-[540px]'
      }`}
    >
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        {/* Symbol Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {activeInstrument.symbol}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase bg-[var(--bg-sunken)] text-[var(--text-muted)] border border-[var(--border-darker)]">
              {activeInstrument.category}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono-numbers text-xs">
            <span className="text-[var(--text-muted)]">Spread:</span>
            <span className="font-semibold text-[var(--text-primary)]">{activeInstrument.spread} pips</span>
          </div>

          <div className="hidden md:flex items-center gap-2 font-mono-numbers text-xs">
            <span className="text-[var(--text-muted)]">24h:</span>
            <span className={`font-semibold ${activeInstrument.change24h >= 0 ? 'text-[var(--accent-long)]' : 'text-[var(--accent-short)]'}`}>
              {activeInstrument.change24h >= 0 ? '+' : ''}{activeInstrument.change24h}%
            </span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 neo-inset-sm p-1">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                timeframe === tf
                  ? 'bg-[var(--accent-brand)] text-white shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators and Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSMA(prev => !prev)}
            className={`neo-btn py-1 px-2.5 text-xs ${showSMA ? 'text-[#38bdf8] font-bold border-[#38bdf8]/40' : 'text-[var(--text-muted)]'}`}
            title="SMA 20 Period"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SMA</span>
          </button>

          <button
            onClick={() => setShowEMA(prev => !prev)}
            className={`neo-btn py-1 px-2.5 text-xs ${showEMA ? 'text-[#f59e0b] font-bold border-[#f59e0b]/40' : 'text-[var(--text-muted)]'}`}
            title="EMA 50 Period"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>EMA</span>
          </button>

          <button
            onClick={() => setShowBollinger(prev => !prev)}
            className={`neo-btn py-1 px-2.5 text-xs ${showBollinger ? 'text-[var(--accent-brand)] font-bold' : 'text-[var(--text-muted)]'}`}
            title="Bollinger Bands (20, 2)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>BB</span>
          </button>

          <button
            onClick={() => setShowRSI(prev => !prev)}
            className={`neo-btn py-1 px-2.5 text-xs ${showRSI ? 'text-[#a855f7] font-bold' : 'text-[var(--text-muted)]'}`}
            title="Relative Strength Index"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>RSI</span>
          </button>

          <button
            onClick={() => setShowDOM(prev => !prev)}
            className={`neo-btn py-1 px-2.5 text-xs ${showDOM ? 'text-[var(--accent-long)] font-bold' : 'text-[var(--text-muted)]'}`}
            title="Level 2 Depth of Market"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DOM</span>
          </button>

          <button
            onClick={() => setIsAlertsOpen(true)}
            className={`neo-btn py-1 px-2.5 text-xs flex items-center gap-1.5 ${
              priceAlerts.some(a => a.symbol === activeInstrument.symbol && !a.triggered)
                ? 'text-amber-500 font-bold border-amber-500/40'
                : 'text-[var(--text-muted)]'
            }`}
            title="Price Level Alerts & Sound Chimes"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alerts</span>
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="neo-btn p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bar Replay Toolbar (Docked) */}
      <div className="pt-2">
        <BarReplayToolbar />
      </div>

      {/* Drawing Toolbar Ribbon */}
      <div className="flex items-center justify-between py-1.5 px-2 mt-1 mb-1 neo-inset-sm rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Tools:</span>
          <button
            onClick={() => { setDrawTool('cursor'); setDrawingStart(null); }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
              drawTool === 'cursor' ? 'bg-[var(--accent-brand)] text-white' : 'text-[var(--text-muted)]'
            }`}
          >
            <MousePointer className="w-3 h-3" />
            <span>Pointer</span>
          </button>

          <button
            onClick={() => { setDrawTool('hline'); setDrawingStart(null); }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
              drawTool === 'hline' ? 'bg-[#f59e0b] text-white' : 'text-[var(--text-muted)]'
            }`}
            title="Click chart to place Support / Resistance Horizontal Level"
          >
            <Minus className="w-3 h-3" />
            <span>Key Level</span>
          </button>

          <button
            onClick={() => { setDrawTool('trendline'); setDrawingStart(null); }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
              drawTool === 'trendline' ? 'bg-[var(--accent-long)] text-white' : 'text-[var(--text-muted)]'
            }`}
            title="Click 2 points to draw a Trendline"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Trendline</span>
          </button>

          <button
            onClick={() => { setDrawTool('fib'); setDrawingStart(null); }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
              drawTool === 'fib' ? 'bg-[#38bdf8] text-white' : 'text-[var(--text-muted)]'
            }`}
            title="Click 2 points to draw Fibonacci Retracements"
          >
            <Grid className="w-3 h-3" />
            <span>Fib Retracement</span>
          </button>
        </div>

        {drawings.length > 0 && (
          <button
            onClick={() => setDrawings([])}
            className="text-[11px] text-[var(--accent-short)] hover:underline flex items-center gap-1 font-semibold"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Drawings ({drawings.length})</span>
          </button>
        )}
      </div>

      {/* Main Chart Body + Optional DOM sidecar */}
      <div className="relative flex-1 w-full h-full min-h-[340px] flex gap-2">
        {/* Canvas Area */}
        <div className="relative flex-1 w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`w-full h-full block rounded-lg ${
              drawTool !== 'cursor' ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }}
            onMouseLeave={() => setMousePos(null)}
          />
        </div>

        {/* DOM Sidecar Panel (Level 2 Depth of Market) */}
        {showDOM && (
          <div className="w-[190px] h-full neo-inset p-2.5 rounded-xl flex flex-col justify-between text-xs font-mono-numbers animate-fadeIn">
            <div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider pb-1.5 border-b border-[var(--border-darker)] flex items-center justify-between">
                <span>Depth of Market</span>
                <span className="text-[var(--accent-long)]">L2 DOM</span>
              </div>

              {/* Asks (Sell Liquidity) */}
              <div className="space-y-1 pt-1.5">
                {domLevels.asks.map((lvl, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--accent-short)] font-semibold">{lvl.price}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--text-muted)] text-[10px]">{lvl.vol}L</span>
                      <div className="w-8 h-1.5 rounded bg-[var(--accent-short-bg)] overflow-hidden">
                        <div className="h-full bg-[var(--accent-short)]" style={{ width: `${(lvl.vol / 70) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Spread Indicator */}
              <div className="my-2 py-1 bg-[var(--bg-sunken)] rounded text-center text-[10px] text-[var(--text-muted)] font-semibold border-y border-[var(--border-darker)]">
                Spread: {activeInstrument.spread} pips
              </div>

              {/* Bids (Buy Liquidity) */}
              <div className="space-y-1">
                {domLevels.bids.map((lvl, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--accent-long)] font-semibold">{lvl.price}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--text-muted)] text-[10px]">{lvl.vol}L</span>
                      <div className="w-8 h-1.5 rounded bg-[var(--accent-long-bg)] overflow-hidden">
                        <div className="h-full bg-[var(--accent-long)]" style={{ width: `${(lvl.vol / 70) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Micro Market Execution inside DOM */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[var(--border-darker)]">
              <button
                onClick={() => executeMarketOrder('SELL', 0.1, 100, undefined, undefined, 'DOM Quick Execution')}
                className="neo-btn neo-btn-sell py-1.5 text-[10px] font-bold"
              >
                Sell 0.1L
              </button>
              <button
                onClick={() => executeMarketOrder('BUY', 0.1, 100, undefined, undefined, 'DOM Quick Execution')}
                className="neo-btn neo-btn-buy py-1.5 text-[10px] font-bold"
              >
                Buy 0.1L
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status / Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] font-mono-numbers">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-long)]"></span>
            <span>Bid: {activeInstrument.bid.toFixed(activeInstrument.digits)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-short)]"></span>
            <span>Ask: {activeInstrument.ask.toFixed(activeInstrument.digits)}</span>
          </div>
          <div className="hidden sm:inline">
            High: {activeInstrument.high24h.toFixed(activeInstrument.digits)} | Low: {activeInstrument.low24h.toFixed(activeInstrument.digits)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showSMA && <span className="text-[#38bdf8]">SMA(20)</span>}
          {showEMA && <span className="text-[#f59e0b]">EMA(50)</span>}
          {showBollinger && <span className="text-[var(--accent-brand)]">BB(20,2)</span>}
          {showRSI && <span className="text-[#a855f7]">RSI(14)</span>}
        </div>
      </div>

      {/* Price Alerts Modal */}
      <PriceAlertsModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
    </div>
  );
};
