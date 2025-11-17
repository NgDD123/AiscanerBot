// ChartPage.jsx
// Full advanced chart page with many Binance-style indicators,
// safe updates, RSI on its own scale, Ichimoku Cloud (Option A),
// real-time updates, and a Binance-style indicator panel UI.

import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  SMA,
  EMA,
  WMA,
  RSI,
  MACD,
  BollingerBands,
  Stochastic,
  ATR,
  ADX,
  CCI,
  OBV,
  MFI,
} from "technicalindicators";

// ---------------- Utility indicator helpers ----------------

const calcVWAP = (candles) => {
  const out = [];
  let cumPV = 0;
  let cumVol = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typical = (c.high + c.low + c.close) / 3;
    const pv = typical * (c.volume || 0);
    cumPV += pv;
    cumVol += c.volume || 0;
    out.push(cumVol === 0 ? null : cumPV / cumVol);
  }
  return out;
};

const calcDonchian = (closes, period) => {
  if (!closes || closes.length < period) return Array(closes.length).fill(null);
  const upper = [];
  const lower = [];
  for (let i = 0; i < closes.length; i++) {
    if (i - period + 1 < 0) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const window = closes.slice(i - period + 1, i + 1);
    upper.push(Math.max(...window));
    lower.push(Math.min(...window));
  }
  return { upper, lower };
};

const calcIchimoku = (candles, conv = 9, base = 26, spanPeriodB = 52, displacement = 26) => {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);
  const len = candles.length;

  const highest = (arr, period, idx) => Math.max(...arr.slice(Math.max(0, idx - period + 1), idx + 1));
  const lowest = (arr, period, idx) => Math.min(...arr.slice(Math.max(0, idx - period + 1), idx + 1));

  const conversion = Array(len).fill(null);
  const baseLine = Array(len).fill(null);
  const spanA = Array(len).fill(null);
  const spanB = Array(len).fill(null);
  const lagging = Array(len).fill(null);

  for (let i = 0; i < len; i++) {
    if (i >= conv - 1) {
      conversion[i] = (highest(highs, conv, i) + lowest(lows, conv, i)) / 2;
    }
    if (i >= base - 1) {
      baseLine[i] = (highest(highs, base, i) + lowest(lows, base, i)) / 2;
    }
    if (conversion[i] !== null && baseLine[i] !== null) {
      spanA[i] = (conversion[i] + baseLine[i]) / 2;
    }
    if (i >= spanPeriodB - 1) {
      spanB[i] = (highest(highs, spanPeriodB, i) + lowest(lows, spanPeriodB, i)) / 2;
    }
    if (i - displacement >= 0) {
      lagging[i] = closes[i - displacement];
    }
  }

  // For cloud plotting forward displacement: create arrays shifted forward for spanA/spanB
  const spanAForward = Array(len).fill(null);
  const spanBForward = Array(len).fill(null);
  for (let i = 0; i < len; i++) {
    const targetIdx = i + displacement;
    if (targetIdx < len) {
      spanAForward[targetIdx] = spanA[i];
      spanBForward[targetIdx] = spanB[i];
    }
  }

  return {
    conversion,
    baseLine,
    spanA,
    spanB,
    spanAForward,
    spanBForward,
    lagging,
  };
};

const calcSupertrend = (candles, period = 10, multiplier = 3) => {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);
  const atrValues = ATR.calculate({ period, high: highs, low: lows, close: closes });
  const len = candles.length;
  const result = Array(len).fill(null);
  if (!atrValues || atrValues.length === 0) return result;

  let prevFinalUpper = null;
  let prevFinalLower = null;
  let prevTrend = null;

  for (let i = 0; i < len; i++) {
    const atrIdx = i - (period - 1);
    if (atrIdx < 0) continue;
    const atr = atrValues[atrIdx];
    const hl2 = (highs[i] + lows[i]) / 2;
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;
    let finalUpper = basicUpper;
    let finalLower = basicLower;
    if (prevFinalUpper !== null) {
      finalUpper = basicUpper < prevFinalUpper || closes[i - 1] > prevFinalUpper ? basicUpper : prevFinalUpper;
      finalLower = basicLower > prevFinalLower || closes[i - 1] < prevFinalLower ? basicLower : prevFinalLower;
    }
    let trend = prevTrend;
    if (prevTrend === null) {
      trend = closes[i] > finalUpper ? -1 : 1;
    } else {
      if (prevTrend === 1 && closes[i] < finalUpper) trend = 1;
      else if (prevTrend === 1 && closes[i] > finalUpper) trend = -1;
      else if (prevTrend === -1 && closes[i] > finalLower) trend = -1;
      else if (prevTrend === -1 && closes[i] < finalLower) trend = 1;
    }
    result[i] = trend === 1 ? finalLower : finalUpper;
    prevFinalUpper = finalUpper;
    prevFinalLower = finalLower;
    prevTrend = trend;
  }
  return result;
};

const calcKeltner = (candles, emaPeriod = 20, atrPeriod = 10, multiplier = 1.5) => {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const emaValues = EMA.calculate({ period: emaPeriod, values: closes });
  const atrValues = ATR.calculate({ period: atrPeriod, high: highs, low: lows, close: closes });
  const len = candles.length;
  const upper = Array(len).fill(null);
  const lower = Array(len).fill(null);
  for (let i = 0; i < len; i++) {
    const emaIdx = i - (emaPeriod - 1);
    const atrIdx = i - (atrPeriod - 1);
    if (emaIdx < 0 || atrIdx < 0) continue;
    const ema = emaValues[emaIdx];
    const atr = atrValues[atrIdx];
    upper[i] = ema + multiplier * atr;
    lower[i] = ema - multiplier * atr;
  }
  return { upper, lower };
};

// ---------------- Main component ----------------

export default function ChartPage() {
  // Basic UI state
  const [symbol, setSymbol] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("2h");
  const intervals = ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "1w", "1M"];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ candles: [] });
  const [qualifiedPairs, setQualifiedPairs] = useState([]);
  const [showVolume, setShowVolume] = useState(true);

  // Indicators (defaults)
  const [indicators, setIndicators] = useState({
    SMA: { enabled: false, period: 20, color: "#ffb86b" },
    EMA20: { enabled: true, period: 20, color: "#ff9900" },
    EMA50: { enabled: true, period: 50, color: "#00ffff" },
    WMA: { enabled: false, period: 20, color: "#7c4dff" },
    MACD: { enabled: false, fast: 12, slow: 26, signal: 9, color: "#ff4d4d" },
    RSI: { enabled: true, period: 14, color: "#ff00ff" },
    STOCH: { enabled: false, kPeriod: 14, dPeriod: 3, smoothK: 3, colorK: "#00ff00", colorD: "#ff0000" },
    STOCHRSI: { enabled: false, rsiPeriod: 14, stochPeriod: 14, k: 3, d: 3, colorK: "#8be9fd", colorD: "#ff79c6" },
    ATR: { enabled: false, period: 14, color: "#f1fa8c" },
    ADX: { enabled: false, period: 14, color: "#bd93f9" },
    CCI: { enabled: false, period: 20, color: "#50fa7b" },
    OBV: { enabled: false, color: "#66d9ef" },
    MFI: { enabled: false, period: 14, color: "#ffb86b" },
    VWAP: { enabled: false, color: "#ff5555" },
    Bollinger: { enabled: true, period: 20, stdDev: 2, upperColor: "#ffff00", lowerColor: "#ff9900" },
    Supertrend: { enabled: false, period: 10, multiplier: 3, colorUp: "#0f0", colorDown: "#f00" },
    Keltner: { enabled: false, emaPeriod: 20, atrPeriod: 10, multiplier: 1.5, upperColor: "#9bff9b", lowerColor: "#ff9b9b" },
    Donchian: { enabled: false, period: 20, upperColor: "#c8a2ff", lowerColor: "#ffa2d5" },
    Ichimoku: { enabled: true, conv: 9, base: 26, spanB: 52, displacement: 26, colors: { conv: "#00ff9f", base: "#ff9f00", spanA: "#9f00ff", spanB: "#00b0ff", cloudBull: "rgba(20,200,120,0.12)", cloudBear: "rgba(255,80,80,0.12)" } },
    VolumeMA: { enabled: false, period: 20, color: "#8888ff" },
  });

  const [openIndicatorPanel, setOpenIndicatorPanel] = useState(true);
  const [editingIndicator, setEditingIndicator] = useState(null);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef({}); // keys -> { series, areaSeries? }
  const wsRef = useRef(null);

  const exchangeType = useSelector((state) => state.user.exchangeType);

  // Fetch qualified pairs
  useEffect(() => {
    const q = query(collection(db, "qualifiedPairs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pairs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQualifiedPairs(pairs);
      if (pairs.length > 0 && !symbol) setSymbol(pairs[0].pair);
    });
    return () => unsubscribe();
  }, [symbol]);

  // Fetch chart data
  const fetchChartData = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8001/api/chart-data/${symbol}?interval=${selectedInterval}`,
        { headers: { "X-EXCHANGE-TYPE": exchangeType || "binancefutures" } }
      );
      if (!response.ok) throw new Error("Failed to fetch chart data");
      const resData = await response.json();
      const intervalData = resData.data?.[symbol]?.[selectedInterval] || { candles: [] };
      const candles = intervalData.candles.map((c) => ({
        time: Math.floor(c.time / 1000),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume || 0),
      }));
      setData({ candles });
      if (chartContainerRef.current && candles.length) drawChart(candles);
    } catch (err) {
      console.error(err);
      setData({ candles: [] });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup chart
  const cleanupChart = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = {};
      if (chartContainerRef.current) chartContainerRef.current.innerHTML = "";
    }
  };

  // WebSocket updates (Binance)
  const connectWebSocket = () => {
    if (!symbol || !selectedInterval) return;
    const intervalMap = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "2h": "2h", "4h": "4h", "8h": "8h", "1w": "1w", "1M": "1M" };
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${intervalMap[selectedInterval]}`;
    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (e) {
      console.warn("WS connect fail", e);
      return;
    }

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.k) return;
      const k = message.k;
      const candle = {
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v || 0),
      };

      setData((prev) => {
        const newCandles = [...prev.candles];
        const last = newCandles[newCandles.length - 1];
        if (last && last.time === candle.time) newCandles[newCandles.length - 1] = candle;
        else newCandles.push(candle);
        newCandles.sort((a, b) => a.time - b.time);

        if (candleSeriesRef.current) {
          try {
            candleSeriesRef.current.setData(newCandles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
          } catch (e) { console.warn("candle setData error", e); }
        }
        if (volumeSeriesRef.current) {
          try {
            volumeSeriesRef.current.setData(newCandles.map((c) => ({ time: c.time, value: c.volume, color: c.close > c.open ? "#00b07c" : "#ff4d4d" })));
          } catch (e) { console.warn("volume setData error", e); }
        }

        // Defer indicator update slightly to avoid race conditions with chart redraw
        setTimeout(() => updateIndicators(newCandles), 8);

        return { ...prev, candles: newCandles };
      });
    };

    wsRef.current.onopen = () => console.log("WS connected");
    wsRef.current.onerror = (e) => console.error("WS error", e);
    wsRef.current.onclose = () => console.log("WS closed");
  };

  // Draw chart
  const drawChart = (candles) => {
    cleanupChart();
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current?.clientWidth || 900,
      height: 540,
      layout: { backgroundColor: "#071122", textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#11202b" }, horzLines: { color: "#11202b" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderColor: "#263040", timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00b07c",
      downColor: "#ff4d4d",
      borderUpColor: "#00b07c",
      borderDownColor: "#ff4d4d",
      wickUpColor: "#00b07c",
      wickDownColor: "#ff4d4d",
      priceScaleId: "left",
    });
    candleSeries.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "right",
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(candles.map((c) => ({ time: c.time, value: c.volume, color: c.close > c.open ? "#00b07c" : "#ff4d4d" })));

    // Guarantee RSI and other oscillator price scales exist when used
    try {
      chart.priceScale("RSI").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.priceScale("MACD").applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
      chart.priceScale("STOCH").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.priceScale("STOCHRSI").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.priceScale("ATR").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.priceScale("ADX").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.priceScale("OBV").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    } catch (e) { /* ignore if not supported */ }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    updateIndicators(candles);
    connectWebSocket();
  };

  // Update indicators safely
  const updateIndicators = (candles) => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    const safeCreateLine = (key, opts = {}) => {
      if (!indicatorSeriesRef.current[key]) {
        try {
          // opts: { color, priceScaleId, lineWidth, isArea }
          if (opts.isArea) {
            indicatorSeriesRef.current[key] = chartRef.current.addAreaSeries({
              topColor: opts.topColor || "rgba(0,0,0,0.0)",
              bottomColor: opts.bottomColor || "rgba(0,0,0,0.0)",
              lineColor: opts.lineColor || opts.color || "#999",
              lineWidth: opts.lineWidth || 1,
              priceScaleId: opts.priceScaleId || "overlay",
            });
          } else {
            indicatorSeriesRef.current[key] = chartRef.current.addLineSeries({
              color: opts.color || "#999",
              lineWidth: opts.lineWidth || 2,
              priceScaleId: opts.priceScaleId || "overlay",
            });
          }
        } catch (e) {
          console.warn("create series failed", key, e);
          return null;
        }
      } else {
        try {
          // update color & visibility
          indicatorSeriesRef.current[key].applyOptions({
            color: opts.color || opts.lineColor || indicatorSeriesRef.current[key].options?.color,
            visible: true,
          });
        } catch (e) {}
      }
      return indicatorSeriesRef.current[key];
    };

    const safeSetLine = (key, arr) => {
      const series = indicatorSeriesRef.current[key];
      if (!series) return;
      const data = candles.slice(-arr.length).map((c, i) => ({ time: c.time, value: arr[i] })).filter((d) => d.value !== null && d.value !== undefined && !Number.isNaN(d.value));
      try { series.setData(data); } catch (e) { console.warn("setData fail", key, e); }
    };

    // SMA
    if (indicators.SMA.enabled) {
      try {
        const vals = SMA.calculate({ period: indicators.SMA.period, values: closes });
        safeCreateLine("SMA", { color: indicators.SMA.color });
        safeSetLine("SMA", vals);
      } catch (e) { console.warn("SMA error", e); }
    } else if (indicatorSeriesRef.current["SMA"]) indicatorSeriesRef.current["SMA"].applyOptions({ visible: false });

    // EMA20
    if (indicators.EMA20.enabled) {
      try {
        const vals = EMA.calculate({ period: indicators.EMA20.period, values: closes });
        safeCreateLine("EMA20", { color: indicators.EMA20.color });
        safeSetLine("EMA20", vals);
      } catch (e) { console.warn("EMA20 error", e); }
    } else if (indicatorSeriesRef.current["EMA20"]) indicatorSeriesRef.current["EMA20"].applyOptions({ visible: false });

    // EMA50
    if (indicators.EMA50.enabled) {
      try {
        const vals = EMA.calculate({ period: indicators.EMA50.period, values: closes });
        safeCreateLine("EMA50", { color: indicators.EMA50.color });
        safeSetLine("EMA50", vals);
      } catch (e) { console.warn("EMA50 error", e); }
    } else if (indicatorSeriesRef.current["EMA50"]) indicatorSeriesRef.current["EMA50"].applyOptions({ visible: false });

    // WMA
    if (indicators.WMA.enabled) {
      try {
        const vals = WMA.calculate({ period: indicators.WMA.period, values: closes });
        safeCreateLine("WMA", { color: indicators.WMA.color });
        safeSetLine("WMA", vals);
      } catch (e) { console.warn("WMA error", e); }
    } else if (indicatorSeriesRef.current["WMA"]) indicatorSeriesRef.current["WMA"].applyOptions({ visible: false });

    // MACD
    if (indicators.MACD.enabled) {
      try {
        const macd = MACD.calculate({ values: closes, fastPeriod: indicators.MACD.fast, slowPeriod: indicators.MACD.slow, signalPeriod: indicators.MACD.signal, SimpleMAOscillator: false, SimpleMASignal: false });
        const macdVals = macd.map((m) => m.MACD);
        const signalVals = macd.map((m) => m.signal);
        safeCreateLine("MACD", { color: indicators.MACD.color, priceScaleId: "MACD" });
        safeCreateLine("MACDSignal", { color: "#999", priceScaleId: "MACD" });
        try { chartRef.current.priceScale("MACD").applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } }); } catch (e) {}
        safeSetLine("MACD", macdVals);
        safeSetLine("MACDSignal", signalVals);
      } catch (e) { console.warn("MACD error", e); }
    } else {
      if (indicatorSeriesRef.current["MACD"]) indicatorSeriesRef.current["MACD"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["MACDSignal"]) indicatorSeriesRef.current["MACDSignal"].applyOptions({ visible: false });
    }

    // RSI (separate price scale)
    if (indicators.RSI.enabled) {
      try {
        const vals = RSI.calculate({ period: indicators.RSI.period, values: closes });
        safeCreateLine("RSI", { color: indicators.RSI.color, priceScaleId: "RSI" });
        try { chartRef.current.priceScale("RSI").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); } catch (e) {}
        safeSetLine("RSI", vals);
      } catch (e) { console.warn("RSI error", e); }
    } else if (indicatorSeriesRef.current["RSI"]) indicatorSeriesRef.current["RSI"].applyOptions({ visible: false });

    // STOCH
    if (indicators.STOCH.enabled) {
      try {
        const st = Stochastic.calculate({ high: highs, low: lows, close: closes, period: indicators.STOCH.kPeriod, signalPeriod: indicators.STOCH.dPeriod, smooth: indicators.STOCH.smoothK });
        const kVals = st.map((s) => s.k);
        const dVals = st.map((s) => s.d);
        safeCreateLine("STOCH_K", { color: indicators.STOCH.colorK, priceScaleId: "STOCH" });
        safeCreateLine("STOCH_D", { color: indicators.STOCH.colorD, priceScaleId: "STOCH" });
        try { chartRef.current.priceScale("STOCH").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); } catch (e) {}
        safeSetLine("STOCH_K", kVals);
        safeSetLine("STOCH_D", dVals);
      } catch (e) { console.warn("STOCH error", e); }
    } else {
      if (indicatorSeriesRef.current["STOCH_K"]) indicatorSeriesRef.current["STOCH_K"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["STOCH_D"]) indicatorSeriesRef.current["STOCH_D"].applyOptions({ visible: false });
    }

    // STOCHRSI
    if (indicators.STOCHRSI.enabled) {
      try {
        const rsiVals = RSI.calculate({ period: indicators.STOCHRSI.rsiPeriod, values: closes });
        const period = indicators.STOCHRSI.stochPeriod;
        // compute k% for rsi windows
        const rawK = [];
        for (let i = 0; i < rsiVals.length; i++) {
          if (i - (period - 1) < 0) { rawK.push(null); continue; }
          const window = rsiVals.slice(i - period + 1, i + 1);
          const mn = Math.min(...window);
          const mx = Math.max(...window);
          const cur = rsiVals[i];
          const k = mx - mn === 0 ? 0 : ((cur - mn) / (mx - mn)) * 100;
          rawK.push(k);
        }
        const smoothK = SMA.calculate({ period: indicators.STOCHRSI.k, values: rawK.filter(v => v !== null) }) || [];
        const smoothD = SMA.calculate({ period: indicators.STOCHRSI.d, values: smoothK }) || [];
        // align results by padding
        const pad = rawK.length - smoothK.length;
        const kVals = Array(pad).fill(null).concat(smoothK);
        const dVals = Array(pad + smoothK.length - smoothD.length).fill(null).concat(smoothD);
        safeCreateLine("STOCHRSI_K", { color: indicators.STOCHRSI.colorK, priceScaleId: "STOCHRSI" });
        safeCreateLine("STOCHRSI_D", { color: indicators.STOCHRSI.colorD, priceScaleId: "STOCHRSI" });
        try { chartRef.current.priceScale("STOCHRSI").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); } catch (e) {}
        safeSetLine("STOCHRSI_K", kVals);
        safeSetLine("STOCHRSI_D", dVals);
      } catch (e) { console.warn("STOCHRSI error", e); }
    } else {
      if (indicatorSeriesRef.current["STOCHRSI_K"]) indicatorSeriesRef.current["STOCHRSI_K"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["STOCHRSI_D"]) indicatorSeriesRef.current["STOCHRSI_D"].applyOptions({ visible: false });
    }

    // ATR
    if (indicators.ATR.enabled) {
      try {
        const vals = ATR.calculate({ period: indicators.ATR.period, high: highs, low: lows, close: closes });
        safeCreateLine("ATR", { color: indicators.ATR.color, priceScaleId: "ATR" });
        try { chartRef.current.priceScale("ATR").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); } catch (e) {}
        safeSetLine("ATR", vals);
      } catch (e) { console.warn("ATR error", e); }
    } else if (indicatorSeriesRef.current["ATR"]) indicatorSeriesRef.current["ATR"].applyOptions({ visible: false });

    // ADX
    if (indicators.ADX.enabled) {
      try {
        const vals = ADX.calculate({ period: indicators.ADX.period, high: highs, low: lows, close: closes });
        const arr = vals.map((v) => v.adx);
        safeCreateLine("ADX", { color: indicators.ADX.color, priceScaleId: "ADX" });
        try { chartRef.current.priceScale("ADX").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); } catch (e) {}
        safeSetLine("ADX", arr);
      } catch (e) { console.warn("ADX error", e); }
    } else if (indicatorSeriesRef.current["ADX"]) indicatorSeriesRef.current["ADX"].applyOptions({ visible: false });

    // CCI
    if (indicators.CCI.enabled) {
      try {
        const vals = CCI.calculate({ period: indicators.CCI.period, high: highs, low: lows, close: closes });
        safeCreateLine("CCI", { color: indicators.CCI.color, priceScaleId: "CCI" });
        safeSetLine("CCI", vals);
      } catch (e) { console.warn("CCI error", e); }
    } else if (indicatorSeriesRef.current["CCI"]) indicatorSeriesRef.current["CCI"].applyOptions({ visible: false });

    // OBV
    if (indicators.OBV.enabled) {
      try {
        const vals = OBV.calculate({ close: closes, volume: volumes });
        safeCreateLine("OBV", { color: indicators.OBV.color, priceScaleId: "OBV" });
        safeSetLine("OBV", vals);
      } catch (e) { console.warn("OBV error", e); }
    } else if (indicatorSeriesRef.current["OBV"]) indicatorSeriesRef.current["OBV"].applyOptions({ visible: false });

    // MFI
    if (indicators.MFI.enabled) {
      try {
        const vals = MFI.calculate({ period: indicators.MFI.period, high: highs, low: lows, close: closes, volume: volumes });
        safeCreateLine("MFI", { color: indicators.MFI.color, priceScaleId: "MFI" });
        safeSetLine("MFI", vals);
      } catch (e) { console.warn("MFI error", e); }
    } else if (indicatorSeriesRef.current["MFI"]) indicatorSeriesRef.current["MFI"].applyOptions({ visible: false });

    // VWAP
    if (indicators.VWAP.enabled) {
      try {
        const vwap = calcVWAP(candles);
        safeCreateLine("VWAP", { color: indicators.VWAP.color });
        safeSetLine("VWAP", vwap);
      } catch (e) { console.warn("VWAP error", e); }
    } else if (indicatorSeriesRef.current["VWAP"]) indicatorSeriesRef.current["VWAP"].applyOptions({ visible: false });

    // Bollinger
    if (indicators.Bollinger.enabled) {
      try {
        const bb = BollingerBands.calculate({ period: indicators.Bollinger.period, values: closes, stdDev: indicators.Bollinger.stdDev }) || [];
        const upper = Array(candles.length - bb.length).fill(null).concat(bb.map(b => b?.upper ?? null));
        const lower = Array(candles.length - bb.length).fill(null).concat(bb.map(b => b?.lower ?? null));
        safeCreateLine("BollUpper", { color: indicators.Bollinger.upperColor });
        safeCreateLine("BollLower", { color: indicators.Bollinger.lowerColor });
        safeSetLine("BollUpper", upper);
        safeSetLine("BollLower", lower);
      } catch (e) { console.warn("Bollinger error", e); }
    } else {
      if (indicatorSeriesRef.current["BollUpper"]) indicatorSeriesRef.current["BollUpper"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["BollLower"]) indicatorSeriesRef.current["BollLower"].applyOptions({ visible: false });
    }

    // Supertrend
    if (indicators.Supertrend.enabled) {
      try {
        const st = calcSupertrend(candles, indicators.Supertrend.period, indicators.Supertrend.multiplier);
        safeCreateLine("Supertrend", { color: indicators.Supertrend.colorUp });
        safeSetLine("Supertrend", st);
      } catch (e) { console.warn("Supertrend error", e); }
    } else if (indicatorSeriesRef.current["Supertrend"]) indicatorSeriesRef.current["Supertrend"].applyOptions({ visible: false });

    // Keltner
    if (indicators.Keltner.enabled) {
      try {
        const k = calcKeltner(candles, indicators.Keltner.emaPeriod, indicators.Keltner.atrPeriod, indicators.Keltner.multiplier);
        safeCreateLine("KeltnerUpper", { color: indicators.Keltner.upperColor });
        safeCreateLine("KeltnerLower", { color: indicators.Keltner.lowerColor });
        safeSetLine("KeltnerUpper", k.upper);
        safeSetLine("KeltnerLower", k.lower);
      } catch (e) { console.warn("Keltner error", e); }
    } else {
      if (indicatorSeriesRef.current["KeltnerUpper"]) indicatorSeriesRef.current["KeltnerUpper"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["KeltnerLower"]) indicatorSeriesRef.current["KeltnerLower"].applyOptions({ visible: false });
    }

    // Donchian
    if (indicators.Donchian.enabled) {
      try {
        const dc = calcDonchian(closes, indicators.Donchian.period);
        safeCreateLine("DonchianUpper", { color: indicators.Donchian.upperColor });
        safeCreateLine("DonchianLower", { color: indicators.Donchian.lowerColor });
        safeSetLine("DonchianUpper", dc.upper);
        safeSetLine("DonchianLower", dc.lower);
      } catch (e) { console.warn("Donchian error", e); }
    } else {
      if (indicatorSeriesRef.current["DonchianUpper"]) indicatorSeriesRef.current["DonchianUpper"].applyOptions({ visible: false });
      if (indicatorSeriesRef.current["DonchianLower"]) indicatorSeriesRef.current["DonchianLower"].applyOptions({ visible: false });
    }

    // Ichimoku (lines + cloud forward projection + lagging)
    if (indicators.Ichimoku.enabled) {
      try {
        const ich = calcIchimoku(candles, indicators.Ichimoku.conv, indicators.Ichimoku.base, indicators.Ichimoku.spanB, indicators.Ichimoku.displacement);
        // conversion & base line (normal line series)
        safeCreateLine("IchimokuConv", { color: indicators.Ichimoku.colors.conv });
        safeCreateLine("IchimokuBase", { color: indicators.Ichimoku.colors.base });
        safeSetLine("IchimokuConv", ich.conversion);
        safeSetLine("IchimokuBase", ich.baseLine);

        // lagging (plotted backward in same scale) — align by mapping to candle times where value exists
        safeCreateLine("IchimokuLag", { color: indicators.Ichimoku.colors.spanB });
        safeSetLine("IchimokuLag", ich.lagging);

        // For the cloud we use two area series: spanAForward (top) and spanBForward (bottom).
        // We'll create area series with translucent colors. Where spanA > spanB, the top area sits above bottom area, visually producing a "cloud".
        // Note: lightweight-charts doesn't have a native "fill between two series" API; this approach approximates the cloud using area series overlap.
        if (!indicatorSeriesRef.current["IchimokuCloudA"]) {
          indicatorSeriesRef.current["IchimokuCloudA"] = chartRef.current.addAreaSeries({
            topColor: indicators.Ichimoku.colors.cloudBull,
            bottomColor: "rgba(0,0,0,0)",
            lineColor: indicators.Ichimoku.colors.spanA,
            priceScaleId: "overlay",
          });
        }
        if (!indicatorSeriesRef.current["IchimokuCloudB"]) {
          indicatorSeriesRef.current["IchimokuCloudB"] = chartRef.current.addAreaSeries({
            topColor: "rgba(0,0,0,0)",
            bottomColor: indicators.Ichimoku.colors.cloudBear,
            lineColor: indicators.Ichimoku.colors.spanB,
            priceScaleId: "overlay",
          });
        }
        // set cloud data (we will feed forward-shifted arrays)
        safeSetLine("IchimokuCloudA", ich.spanAForward);
        safeSetLine("IchimokuCloudB", ich.spanBForward);
      } catch (e) { console.warn("Ichimoku error", e); }
    } else {
      ["IchimokuConv", "IchimokuBase", "IchimokuLag", "IchimokuCloudA", "IchimokuCloudB"].forEach((k) => {
        if (indicatorSeriesRef.current[k]) indicatorSeriesRef.current[k].applyOptions({ visible: false });
      });
    }

    // Volume MA
    if (indicators.VolumeMA.enabled) {
      try {
        const vm = SMA.calculate({ period: indicators.VolumeMA.period, values: volumes });
        safeCreateLine("VolumeMA", { color: indicators.VolumeMA.color });
        safeSetLine("VolumeMA", vm);
      } catch (e) { console.warn("VolumeMA error", e); }
    } else if (indicatorSeriesRef.current["VolumeMA"]) indicatorSeriesRef.current["VolumeMA"].applyOptions({ visible: false });

    // finished
  };

  const toggleVolume = () => {
    setShowVolume((prev) => {
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions({ visible: !prev });
      }
      return !prev;
    });
  };

  // Toggle indicator
  const toggleIndicator = (key) => {
    setIndicators((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  };

  // Open settings modal
  const openSettings = (key) => setEditingIndicator(key);

  // Save settings (recalculate using in-memory candles)
  const saveIndicatorSettings = () => {
    setEditingIndicator(null);
    if (data.candles.length) updateIndicators(data.candles);
  };

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) chartRef.current.applyOptions({ width: chartContainerRef.current?.clientWidth || 900 });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Init: fetch data when symbol/interval change
  useEffect(() => {
    if (symbol) fetchChartData();
    return cleanupChart;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, selectedInterval]);

  // Update indicators when indicators config changes
  useEffect(() => {
    if (data.candles.length) updateIndicators(data.candles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators]);

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-[#071122] text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-yellow-400">Trading Chart — Advanced (Binance-like)</h1>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-300">Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="px-3 py-2 bg-[#0b1320] border border-gray-700 rounded">
            {qualifiedPairs.map((p) => <option key={p.id} value={p.pair}>{p.pair}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-300">Interval</label>
          {intervals.map((i) => (
            <button key={i} onClick={() => setSelectedInterval(i)} className={`px-3 py-1 rounded ${selectedInterval === i ? "bg-yellow-500 text-black" : "bg-[#0b1320] border border-gray-700"}`}>{i}</button>
          ))}
        </div>

        <button onClick={fetchChartData} className="px-4 py-2 bg-yellow-500 text-black rounded">Refresh</button>
        <button onClick={toggleVolume}>
          {showVolume ? "Hide Volume" : "Show Volume"}
        </button>
        <button onClick={() => setOpenIndicatorPanel((s) => !s)} className="px-4 py-2 bg-blue-500 text-black rounded">Indicators</button>
      </div>

      {openIndicatorPanel && (
        <div className="bg-[#07101a] p-4 rounded border border-gray-700 mb-4">
          <h2 className="text-lg font-semibold mb-2">Indicator Panel</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(indicators).map((key) => (
              <div key={key} className="flex justify-between items-center gap-2 p-2 border border-gray-800 rounded">
                <div>
                  <div className="font-semibold">{key}</div>
                  <div className="text-xs text-gray-400">{indicators[key].enabled ? "visible" : "hidden"}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleIndicator(key)} className={`px-2 py-1 rounded ${indicators[key].enabled ? "bg-yellow-500 text-black" : "bg-gray-700"}`}>{indicators[key].enabled ? "Hide" : "Show"}</button>
                  <button onClick={() => openSettings(key)} className="px-2 py-1 bg-green-500 text-black rounded">Settings</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingIndicator && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#07101a] p-4 rounded w-[420px] border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">{editingIndicator} Settings</h3>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {Object.keys(indicators[editingIndicator]).map((field) => {
                if (field === "enabled") return null;
                const val = indicators[editingIndicator][field];
                return (
                  <div key={field}>
                    <label className="block text-sm mb-1 capitalize">{field}</label>
                    {typeof val === "number" ? (
                      <input type="number" value={val} onChange={(e) => setIndicators(prev => ({ ...prev, [editingIndicator]: { ...prev[editingIndicator], [field]: Number(e.target.value) } }))} className="w-full p-2 rounded bg-[#0b1220] border border-gray-700" />
                    ) : (
                      <input type="color" value={val} onChange={(e) => setIndicators(prev => ({ ...prev, [editingIndicator]: { ...prev[editingIndicator], [field]: e.target.value } }))} className="w-16 h-10 p-1 rounded border border-gray-700" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingIndicator(null)} className="px-3 py-2 bg-gray-600 rounded">Cancel</button>
              <button onClick={saveIndicatorSettings} className="px-3 py-2 bg-yellow-500 text-black rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <div ref={chartContainerRef} className="w-full h-[540px] rounded border border-gray-700 relative overflow-hidden">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-gray-300">Loading chart...</div>}
      </div>
    </div>
  );
}
