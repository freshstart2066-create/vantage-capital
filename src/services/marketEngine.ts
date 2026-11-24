import type { Instrument, Candle, Timeframe } from '../types/trading';

// Generate synthetic but realistic historical candles for any instrument & timeframe
export function generateHistoricalCandles(instrument: Instrument, timeframe: Timeframe, count: number = 100): Candle[] {
  const now = Date.now();
  
  let intervalMs = 60 * 1000; // 1M
  if (timeframe === '5M') intervalMs = 5 * 60 * 1000;
  if (timeframe === '15M') intervalMs = 15 * 60 * 1000;
  if (timeframe === '1H') intervalMs = 60 * 60 * 1000;
  if (timeframe === '4H') intervalMs = 4 * 60 * 60 * 1000;
  if (timeframe === '1D') intervalMs = 24 * 60 * 60 * 1000;

  // Base price and relative volatility
  let price = instrument.currentPrice;
  const volatility = price * (instrument.category === 'forex' ? 0.0008 : instrument.category === 'prediction' ? 0.006 : 0.0035);

  // Generate backward in time
  const tempPrices: { open: number; high: number; low: number; close: number; volume: number; time: number }[] = [];

  for (let i = 0; i < count; i++) {
    const candleTime = now - (count - 1 - i) * intervalMs;
    const change = (Math.random() - 0.49) * volatility;
    const open = price;
    let close = Math.max(open + change, price * 0.5);
    if (instrument.category === 'prediction') {
      close = Math.min(0.99, Math.max(0.01, close));
    }
    const high = Math.max(open, close) + Math.random() * volatility * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * 0.8;
    const volume = Math.floor(Math.random() * 500) + 50;

    tempPrices.push({
      time: candleTime,
      open: Number(open.toFixed(instrument.digits)),
      high: Number(high.toFixed(instrument.digits)),
      low: Number(low.toFixed(instrument.digits)),
      close: Number(close.toFixed(instrument.digits)),
      volume,
    });

    price = close;
  }

  // Shift prices so the final candle ends right around instrument.currentPrice
  const lastClose = tempPrices[tempPrices.length - 1].close;
  const ratio = instrument.currentPrice / (lastClose || 1);

  return tempPrices.map(c => {
    let open = c.open * ratio;
    let high = c.high * ratio;
    let low = c.low * ratio;
    let close = c.close * ratio;
    if (instrument.category === 'prediction') {
      open = Math.min(0.99, Math.max(0.01, open));
      high = Math.min(0.99, Math.max(0.01, high));
      low = Math.min(0.99, Math.max(0.01, low));
      close = Math.min(0.99, Math.max(0.01, close));
    }
    return {
      time: c.time,
      open: Number(open.toFixed(instrument.digits)),
      high: Number(high.toFixed(instrument.digits)),
      low: Number(low.toFixed(instrument.digits)),
      close: Number(close.toFixed(instrument.digits)),
      volume: c.volume,
    };
  });
}

// Fetch live web rates to anchor our instruments to authentic real-world prices
export async function fetchLiveMarketRates(): Promise<Partial<Record<string, number>>> {
  const updates: Partial<Record<string, number>> = {};

  try {
    // 1. Forex via Open Exchange Rates Public API
    const forexRes = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) });
    if (forexRes.ok) {
      const data = await forexRes.json();
      if (data && data.rates) {
        if (data.rates.EUR) updates['EUR/USD'] = 1 / data.rates.EUR;
        if (data.rates.GBP) updates['GBP/USD'] = 1 / data.rates.GBP;
        if (data.rates.JPY) updates['USD/JPY'] = data.rates.JPY;
        if (data.rates.AUD) updates['AUD/USD'] = 1 / data.rates.AUD;
        if (data.rates.CAD) updates['USD/CAD'] = data.rates.CAD;
        if (data.rates.GBP && data.rates.JPY) {
          updates['GBP/JPY'] = (1 / data.rates.GBP) * data.rates.JPY;
        }
      }
    }
  } catch {
    // Fallback quietly to internal high-precision drift
  }

  try {
    // 2. Gold and Bitcoin via Binance public API
    const cryptoRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["PAXGUSDT","BTCUSDT"]', {
      signal: AbortSignal.timeout(4000),
    });
    if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      for (const item of cryptoData) {
        if (item.symbol === 'PAXGUSDT') {
          updates['XAU/USD'] = parseFloat(item.price);
        }
        if (item.symbol === 'BTCUSDT') {
          updates['BTC/USD'] = parseFloat(item.price);
        }
      }
    }
  } catch {
    // Fallback quietly
  }

  return updates;
}

// Simulate realistic micro-ticks for a single instrument
export function simulateTick(instrument: Instrument): Instrument {
  const pip = instrument.pipSize;
  const isForex = instrument.category === 'forex';
  const isCrypto = instrument.category === 'crypto';
  const isPrediction = instrument.category === 'prediction';
  
  // Dynamic tick step based on asset class
  let tickMagnitude = pip;
  if (isForex) {
    tickMagnitude = (Math.random() - 0.495) * pip * 1.5;
  } else if (isCrypto) {
    tickMagnitude = (Math.random() - 0.495) * 8.0;
  } else if (isPrediction) {
    tickMagnitude = (Math.random() - 0.495) * 0.008;
  } else {
    tickMagnitude = (Math.random() - 0.495) * 0.12;
  }

  let newPrice = Math.max(instrument.currentPrice + tickMagnitude, pip * 10);
  if (isPrediction) {
    newPrice = Math.min(0.99, Math.max(0.01, instrument.currentPrice + tickMagnitude));
  }
  const halfSpread = (instrument.spread * pip) / 2;
  const bid = Number((newPrice - halfSpread).toFixed(instrument.digits));
  const ask = Number((newPrice + halfSpread).toFixed(instrument.digits));
  const high24h = isPrediction ? Math.min(0.99, Math.max(instrument.high24h, newPrice)) : Math.max(instrument.high24h, newPrice);
  const low24h = isPrediction ? Math.max(0.01, Math.min(instrument.low24h, newPrice)) : Math.min(instrument.low24h, newPrice);
  
  // 24h change drift slightly
  const change24h = Number((instrument.change24h + (tickMagnitude / (newPrice || 1)) * 10).toFixed(2));

  return {
    ...instrument,
    currentPrice: Number(newPrice.toFixed(instrument.digits)),
    bid,
    ask,
    high24h: Number(high24h.toFixed(instrument.digits)),
    low24h: Number(low24h.toFixed(instrument.digits)),
    change24h,
  };
}
