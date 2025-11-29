// server/routes/chartRoute.js
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const { computeChartMultiTimeframe } = require("../models/chartModel");

// ---------------- In-memory cache ----------------
const cache = new Map(); // key = `${symbol}_${interval}`, value = { data, timestamp }
const CACHE_DURATION = 1000 * 60 * 2; // 2 minutes

// ---------------- Helper to fetch Binance candles ----------------
const fetchCandles = async (symbol, interval = "1h", limit = 200) => {
  const cacheKey = `${symbol}_${interval}`;
  const now = Date.now();

  // Return cached data if valid
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();

    const candles = data.map(k => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    }));

    // Save to cache
    cache.set(cacheKey, { data: candles, timestamp: now });

    return candles;
  } catch (err) {
    console.error(`Error fetching Binance candles for ${symbol} ${interval}:`, err);
    return [];
  }
};

// ---------------- Fetch all USDT symbols ----------------
const fetchSymbols = async () => {
  try {
    const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await res.json();
    return data.symbols
      .filter(s => s.quoteAsset === "USDT" && s.status === "TRADING")
      .map(s => s.symbol);
  } catch (err) {
    console.error("Error fetching Binance symbols:", err);
    return ["BTCUSDT"]; // fallback
  }
};

// ---------------- Timeframes ----------------
const intervals = ["1m","5m","15m","30m","1h","2h","4h","8h","1w","1M"];

// ---------------- /api/chart Route ----------------
router.get("/chart", async (req, res) => {
  try {
    let { symbols } = req.query;

    // If no symbols passed, fetch top USDT pairs automatically
    if (!symbols) {
      symbols = await fetchSymbols();
    } else if (typeof symbols === "string") {
      symbols = symbols.split(",");
    }

    const result = { data: {} };

    for (const symbol of symbols) {
      result.data[symbol] = {};

      for (const timeframe of intervals) {
        const candles = await fetchCandles(symbol, timeframe, 200);
        if (!candles || candles.length === 0) {
          result.data[symbol][timeframe] = { candles: [], indicators: {} };
          continue;
        }

        const indicators = computeChartMultiTimeframe(candles);

        result.data[symbol][timeframe] = {
          candles,
          indicators: {
            SMA20: indicators.SMA20,
            EMA20: indicators.EMA20,
            EMA50: indicators.EMA50,
            WMA20: indicators.WMA20,
            RSI14: indicators.RSI14,
            MACD: {
              macd: indicators.MACD.map(v => v?.MACD ?? null),
              signal: indicators.MACD.map(v => v?.signal ?? null),
              histogram: indicators.MACD.map(v => v?.histogram ?? null),
            },
            Bollinger20: {
              upper: indicators.Bollinger20.map(v => v?.upper ?? null),
              middle: indicators.Bollinger20.map(v => v?.middle ?? null),
              lower: indicators.Bollinger20.map(v => v?.lower ?? null),
            },
            STOCH: {
              k: indicators.STOCH.map(v => v?.k ?? null),
              d: indicators.STOCH.map(v => v?.d ?? null),
            },
            ATR14: indicators.ATR14,
            ADX14: indicators.ADX14,
            CCI20: indicators.CCI20,
            OBV: indicators.OBV,
            MFI14: indicators.MFI14,
            VWAP: indicators.VWAP,
            Supertrend: indicators.Supertrend,
            Keltner: {
              upper: indicators.Keltner.upper,
              lower: indicators.Keltner.lower,
            },
            Donchian20: {
              upper: indicators.Donchian20.upper,
              lower: indicators.Donchian20.lower,
            },
            Ichimoku: {
              conversion: indicators.Ichimoku.conversion,
              base: indicators.Ichimoku.baseLine,
              spanA: indicators.Ichimoku.spanA,
              spanB: indicators.Ichimoku.spanB,
              spanAForward: indicators.Ichimoku.spanAForward,
              spanBForward: indicators.Ichimoku.spanBForward,
              lagging: indicators.Ichimoku.lagging,
            },
          },
        };
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Chart API Error:", err);
    res.status(500).json({ error: "Server error fetching chart data" });
  }
});

module.exports = router;
