// ChartPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function ChartPage() {
  const [symbol, setSymbol] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("2h");
  const intervals = ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "1w", "1M"];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ candles: [], indicators: {} });
  const [qualifiedPairs, setQualifiedPairs] = useState([]);
  const [showVolume, setShowVolume] = useState(true);
  const [activeIndicators, setActiveIndicators] = useState({});

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef({}); // { indicatorKey: { line, area, hist, ... } }
  const macdChartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const wsRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const exchangeType = useSelector((state) => state.user.exchangeType);

  // ---------------- Fetch qualified pairs from Firebase ----------------
  useEffect(() => {
    const q = query(collection(db, "qualifiedPairs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pairs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQualifiedPairs(pairs);
      if (pairs.length > 0 && !symbol) setSymbol(pairs[0].pair);
    });
    return () => unsubscribe();
  }, [symbol]);

  // ---------------- API fetch ----------------
  const fetchChartData = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8001/api/chart-data/${symbol}?interval=${selectedInterval}`,
        { headers: { "X-EXCHANGE-TYPE": exchangeType || "binancefutures" } }
      );
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const json = await res.json();
      const intervalData = json.data?.[symbol]?.[selectedInterval] || { candles: [], indicators: {} };
      const candles = (intervalData.candles || []).map((c) => ({
        time: Math.floor(c.time / 1000),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume || 0),
      }));
      const indicators = intervalData.indicators || {};
      setData({ candles, indicators });

      if (chartContainerRef.current && candles.length) drawChart(candles, indicators);
    } catch (e) {
      console.error("fetchChartData error:", e);
      setData({ candles: [], indicators: {} });
      cleanupChart();
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedInterval, exchangeType]);

  // ---------------- Cleanup chart ----------------
  const cleanupChart = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { }
      wsRef.current = null;
    }

    if (chartRef.current) { try { chartRef.current.remove(); } catch (e) { } chartRef.current = null; }
    if (macdChartRef.current) { try { macdChartRef.current.remove(); } catch (e) { } macdChartRef.current = null; }
    if (rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch (e) { } rsiChartRef.current = null; }

    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
    indicatorSeriesRef.current = {};
    if (chartContainerRef.current) chartContainerRef.current.innerHTML = "";

    if (resizeObserverRef.current) {
      try { resizeObserverRef.current.disconnect(); } catch (e) { }
      resizeObserverRef.current = null;
    }
  }, []);

  // ---------------- WebSocket updates ----------------
const connectWebSocket = useCallback(() => {
  if (!symbol || !selectedInterval) return;

  // close existing socket
  if (wsRef.current) {
    try { wsRef.current.close(); } catch (e) {}
    wsRef.current = null;
  }

  const intervalMap = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "8h": "8h", "1w": "1w", "1M": "1M",
  };

  const lower = symbol.toLowerCase();
  const wsUrl = `wss://stream.binance.com:9443/ws/${lower}@kline_${intervalMap[selectedInterval]}`;

  try {
    wsRef.current = new WebSocket(wsUrl);
  } catch (err) {
    console.error("WS init failed", err);
    return;
  }

  wsRef.current.onopen = () => {
    console.log("WS connected", wsUrl);

    // Keep chart always centered on latest price
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  };

  wsRef.current.onerror = (e) => console.error("WS error", e);
  wsRef.current.onclose = () => console.log("WS closed");

  wsRef.current.onmessage = (event) => {
    try {
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

        if (last && last.time === candle.time) {
          newCandles[newCandles.length - 1] = candle;
        } else {
          newCandles.push(candle);
          if (newCandles.length > 2000) newCandles.shift();
        }

        // ---- REAL-TIME CANDLE UPDATE ----
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
        }

        // ---- REAL-TIME VOLUME UPDATE ----
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: candle.time,
            value: candle.volume,
            color: candle.close > candle.open ? "#00b07c" : "#ff4d4d",
          });
        }

        // ---- LIVE PRICE SCALE UPDATING ----
        if (chartRef.current) {
          chartRef.current.priceScale('left').applyOptions({ autoScale: true });
        }

        return { ...prev, candles: newCandles };
      });
    } catch (err) {
      console.error("WS message parse error", err);
    }
  };
}, [symbol, selectedInterval]);

  // ---------------- helpers to create series ----------------
  const addLine = (chartObj, key, options = {}) => {
    try {
      const s = chartObj.addLineSeries({
        color: options.color || "#999",
        lineWidth: options.lineWidth ?? 1,
        priceScaleId: options.priceScaleId === "overlay" ? undefined : options.priceScaleId,
      });
      indicatorSeriesRef.current[key] = indicatorSeriesRef.current[key] || {};
      indicatorSeriesRef.current[key].line = s;
      return s;
    } catch (err) {
      console.error("addLine error", err);
      return null;
    }
  };

  const addArea = (chartObj, key, options = {}) => {
    try {
      const s = chartObj.addAreaSeries({
        topColor: options.topColor || "rgba(0,0,0,0.08)",
        bottomColor: options.bottomColor || "rgba(0,0,0,0.00)",
        lineWidth: options.lineWidth ?? 0,
      });
      indicatorSeriesRef.current[key] = indicatorSeriesRef.current[key] || {};
      indicatorSeriesRef.current[key].area = s;
      return s;
    } catch (err) {
      console.error("addArea error", err);
      return null;
    }
  };

  const addHistogram = (chartObj, key, options = {}) => {
    try {
      const s = chartObj.addHistogramSeries({
        color: options.color || "rgba(255, 165, 0, 0.9)",
        lineWidth: options.lineWidth ?? 1,
        priceFormat: options.priceFormat || undefined,
      });
      indicatorSeriesRef.current[key] = indicatorSeriesRef.current[key] || {};
      indicatorSeriesRef.current[key].hist = s;
      return s;
    } catch (err) {
      console.error("addHistogram error", err);
      return null;
    }
  };

  // ---------------- Draw chart ----------------
  const drawChart = useCallback((candles, indicators) => {
    cleanupChart();

    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    container.innerHTML = "";

    // create wrappers
    const mainDiv = document.createElement("div");
    const macdDiv = document.createElement("div");
    const rsiDiv = document.createElement("div");

    mainDiv.style.width = "100%";
    mainDiv.style.height = "420px";
    macdDiv.style.width = "100%";
    macdDiv.style.height = "120px";
    rsiDiv.style.width = "100%";
    rsiDiv.style.height = "100px";

    container.appendChild(mainDiv);
    container.appendChild(macdDiv);
    container.appendChild(rsiDiv);

    // MAIN CHART
    const chart = createChart(mainDiv, {
      width: mainDiv.clientWidth || 900,
      height: 420,
      layout: { backgroundColor: "#071122", textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#11202b" }, horzLines: { color: "#11202b" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { visible: true },
      timeScale: { borderColor: "#263040", timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00b07c", downColor: "#ff4d4d",
      borderUpColor: "#00b07c", borderDownColor: "#ff4d4d",
      wickUpColor: "#00b07c", wickDownColor: "#ff4d4d",
      priceScaleId: "candles",
    });

    const formattedCandles = candles.map((c) => ({
      time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    }));
    candleSeries.setData(formattedCandles);

    // volume
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      color: "#4682b4",
      priceScaleId: "volume",
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(candles.map(c => ({ time: c.time, value: c.volume, color: c.close > c.open ? "#00b07c" : "#ff4d4d" })));

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // MACD CHART
    const macdChart = createChart(macdDiv, {
      width: macdDiv.clientWidth || 900,
      height: 120,
      layout: { backgroundColor: "#071122", textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#071122" }, horzLines: { color: "#071122" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderVisible: false, timeVisible: false },
    });
    macdChartRef.current = macdChart;

    // RSI CHART
    const rsiChart = createChart(rsiDiv, {
      width: rsiDiv.clientWidth || 900,
      height: 100,
      layout: { backgroundColor: "#071122", textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#071122" }, horzLines: { color: "#071122" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderVisible: false, timeVisible: false },
    });
    rsiChartRef.current = rsiChart;

    // initialize activeIndicators
    const initIndicators = {};
    Object.keys(indicators || {}).forEach(k => (initIndicators[k] = true));
    setActiveIndicators(initIndicators);

    // parse all indicators using *candles* for alignment (IMPORTANT)
    try {
      Object.keys(indicators || {}).forEach((key) => {
        try {
          const payload = indicators[key];

          // MACD (array of objects) -> macd, signal, hist
          if (key.toLowerCase().includes("macd")) {
            const arr = Array.isArray(payload) ? payload : [];
            const macdData = [], signalData = [], histData = [];
            for (let i = 0; i < arr.length; i++) {
              const item = arr[i];
              const t = candles[i] ? candles[i].time : null;
              if (!t) continue;
              const macdVal = item?.MACD ?? item?.macd ?? (typeof item === "number" ? item : null);
              const sigVal = item?.signal ?? item?.Signal ?? item?.sig ?? null;
              const histVal = item?.histogram ?? item?.hist ?? (macdVal != null && sigVal != null ? macdVal - sigVal : null);
              if (macdVal != null) macdData.push({ time: t, value: Number(macdVal) });
              if (sigVal != null) signalData.push({ time: t, value: Number(sigVal) });
              if (histVal != null) histData.push({ time: t, value: Number(histVal) });
            }
            const macdLine = addLine(macdChart, `${key}.macd`, { color: "#ffa500", lineWidth: 2 });
            const signalLine = addLine(macdChart, `${key}.signal`, { color: "#00aaff", lineWidth: 2 });
            const histSeries = addHistogram(macdChart, `${key}.hist`, { color: undefined });
            if (macdLine) macdLine.setData(macdData);
            if (signalLine) signalLine.setData(signalData);
            if (histSeries) histSeries.setData(histData);
            return;
          }

          // Ichimoku
          if (key.toLowerCase().includes("ichimoku")) {
            const ich = payload || {};
            const tenkan = ich.conversion || ich.tenkan || [];
            const kijun = ich.baseLine || ich.kijun || [];
            const spanA = ich.spanA || ich.senkouA || ich.spanAForward || [];
            const spanB = ich.spanB || ich.senkouB || ich.spanBForward || [];
            const chikou = ich.lagging || ich.chikou || [];

            const buildSeries = (arr) => {
              const out = [];
              for (let i = 0; i < arr.length; i++) {
                const v = arr[i];
                const t = candles[i] ? candles[i].time : null;
                if (t == null || v == null || v === undefined) continue;
                out.push({ time: t, value: Number(v) });
              }
              return out;
            };

            const tenkanLine = addLine(chart, `${key}.tenkan`, { color: "#ffcc00", lineWidth: 1 });
            const kijunLine = addLine(chart, `${key}.kijun`, { color: "#00ccff", lineWidth: 1 });
            const spanALine = addArea(chart, `${key}.senkouA`, { topColor: "rgba(0,200,150,0.12)", bottomColor: "rgba(0,200,150,0.02)" });
            const spanBLine = addArea(chart, `${key}.senkouB`, { topColor: "rgba(200,50,150,0.10)", bottomColor: "rgba(200,50,150,0.02)" });
            const chikouLine = addLine(chart, `${key}.chikou`, { color: "#a0a0a0", lineWidth: 1 });

            if (tenkanLine) tenkanLine.setData(buildSeries(tenkan));
            if (kijunLine) kijunLine.setData(buildSeries(kijun));
            if (spanALine) spanALine.setData(buildSeries(spanA));
            if (spanBLine) spanBLine.setData(buildSeries(spanB));
            if (chikouLine) chikouLine.setData(buildSeries(chikou));
            return;
          }

          // Supertrend (single array of values)
          if (key.toLowerCase().includes("supertrend")) {
            const arr = Array.isArray(payload) ? payload : [];
            const sdata = [];
            for (let i = 0; i < arr.length; i++) {
              const v = arr[i];
              const t = candles[i] ? candles[i].time : null;
              if (t == null || v == null || v === undefined) continue;
              sdata.push({ time: t, value: Number(v) });
            }
            const sline = addLine(chart, `${key}.line`, { color: "#00ff88", lineWidth: 2 });
            if (sline) sline.setData(sdata);
            return;
          }

          // Bollinger (array of objects with upper/middle/lower OR object of arrays)
          if (key.toLowerCase().includes("bollinger") || key.toLowerCase().includes("boll")) {
            // two possible shapes: array [{upper,middle,lower}, ...] OR { upper:[], middle:[], lower:[] }
            const up = [], mid = [], low = [];
            if (Array.isArray(payload)) {
              for (let i = 0; i < payload.length; i++) {
                const v = payload[i];
                const t = candles[i] ? candles[i].time : null;
                if (!t || !v) continue;
                up.push({ time: t, value: Number(v.upper ?? v.top ?? null) });
                mid.push({ time: t, value: Number(v.middle ?? v.mid ?? v.ma ?? null) });
                low.push({ time: t, value: Number(v.lower ?? v.bottom ?? null) });
              }
            } else if (payload && payload.upper && payload.middle && payload.lower) {
              for (let i = 0; i < payload.upper.length; i++) {
                const t = candles[i] ? candles[i].time : null;
                if (!t) continue;
                up.push({ time: t, value: Number(payload.upper[i]) });
                mid.push({ time: t, value: Number(payload.middle[i]) });
                low.push({ time: t, value: Number(payload.lower[i]) });
              }
            }
            const upLine = addLine(chart, `${key}.upper`, { color: "#8888ff" });
            const midLine = addLine(chart, `${key}.mid`, { color: "#999999" });
            const lowLine = addLine(chart, `${key}.lower`, { color: "#ff8888" });
            if (upLine) upLine.setData(up);
            if (midLine) midLine.setData(mid);
            if (lowLine) lowLine.setData(low);
            return;
          }

          // Keltner, Donchian, VWAP, SMA, EMA, WMA, RSI, ATR, ADX, CCI, OBV, MFI, etc.
          if (Array.isArray(payload)) {
            const isPrim = payload.every(v => v === null || typeof v === "number" || typeof v === "string");
            if (isPrim) {
              const ser = [];
              for (let i = 0; i < payload.length; i++) {
                const v = payload[i];
                const t = candles[i] ? candles[i].time : null;
                if (t == null || v == null || v === undefined) continue;
                ser.push({ time: t, value: Number(v) });
              }
              if (key.toLowerCase().includes("rsi")) {
                const s = addLine(rsiChart, key, { color: "#ffcc00", lineWidth: 2 });
                if (s) s.setData(ser);
                const ref30 = rsiChart.addLineSeries({ color: "rgba(255,255,255,0.12)" });
                const ref70 = rsiChart.addLineSeries({ color: "rgba(255,255,255,0.12)" });
                ref30.setData(ser.map(pt => ({ time: pt.time, value: 30 })));
                ref70.setData(ser.map(pt => ({ time: pt.time, value: 70 })));
              } else {
                const s = addLine(chart, key, { color: undefined });
                if (s) s.setData(ser);
              }
              return;
            }
          }

          // object with upper/lower (Keltner/Donchian)
          if (payload && typeof payload === "object" && payload.upper && payload.lower) {
            const up = [], low = [];
            for (let i = 0; i < payload.upper.length; i++) {
              const t = candles[i] ? candles[i].time : null;
              if (!t) continue;
              up.push({ time: t, value: Number(payload.upper[i]) });
              low.push({ time: t, value: Number(payload.lower[i]) });
            }
            const upLine = addLine(chart, `${key}.upper`, { color: "#66c2a5" });
            const lowLine = addLine(chart, `${key}.lower`, { color: "#fc8d62" });
            if (upLine) upLine.setData(up);
            if (lowLine) lowLine.setData(low);
            return;
          }

          // VWAP (array)
          if (key.toLowerCase().includes("vwap")) {
            const ser = [];
            for (let i = 0; i < payload.length; i++) {
              const v = payload[i];
              const t = candles[i] ? candles[i].time : null;
              if (!t || v == null) continue;
              ser.push({ time: t, value: Number(v) });
            }
            const s = addLine(chart, key, { color: "#ff99cc" });
            if (s) s.setData(ser);
            return;
          }

          // fallback: try to map any array-like values into a line
          if (payload && typeof payload === "object" && !Array.isArray(payload)) {
            // nothing matched; skip (we logged below)
            return;
          }
        } catch (err) {
          console.error(`Error parsing indicator ${key}:`, err);
        }
      });
    } catch (err) {
      console.error("Error building indicators:", err);
    }

    // resize observer
    const ro = new ResizeObserver(() => {
      try {
        if (mainDiv.clientWidth && chart) chart.applyOptions({ width: mainDiv.clientWidth });
        if (macdChartRef.current) macdChartRef.current.applyOptions({ width: macdDiv.clientWidth });
        if (rsiChartRef.current) rsiChartRef.current.applyOptions({ width: rsiDiv.clientWidth });
      } catch (e) { /* ignore */ }
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    // connect WS (after chart exists)
    connectWebSocket();
  }, [cleanupChart, connectWebSocket]);

  // ---------------- Refresh indicators (re-fetch from backend) ----------------
  const refreshIndicators = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8001/api/chart-data/${symbol}?interval=${selectedInterval}`,
        { headers: { "X-EXCHANGE-TYPE": exchangeType || "binancefutures" } }
      );
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const json = await res.json();
      const intervalData = json.data?.[symbol]?.[selectedInterval] || { candles: [], indicators: {} };
      const indicators = intervalData.indicators || {};
      setData((prev) => ({ ...prev, indicators }));
      if (chartRef.current && data.candles && data.candles.length) {
        drawChart(data.candles, indicators);
      } else {
        fetchChartData();
      }
    } catch (err) {
      console.error("refreshIndicators error", err);
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedInterval, exchangeType, drawChart, fetchChartData, data.candles]);

  // ---------------- Toggle indicator (simple behavior: refresh to re-render) ----------------
  const toggleIndicator = (key) => {
    const newActive = { ...activeIndicators, [key]: !activeIndicators[key] };
    setActiveIndicators(newActive);
    // easiest robust approach: re-run drawChart using current candles and indicators (preserves alignment)
    if (data.candles && data.candles.length) {
      // create a filtered indicator object for rendering
      const filtered = {};
      Object.keys(data.indicators || {}).forEach(k => {
        if (newActive[k]) filtered[k] = data.indicators[k];
      });
      // redraw with only active indicators
      drawChart(data.candles, filtered);
    }
  };

  // ---------------- Effects ----------------
  useEffect(() => { fetchChartData(); }, [symbol, selectedInterval, fetchChartData]);
  useEffect(() => () => cleanupChart(), [cleanupChart]);

  return (
    <div style={{ color: "#d1d4dc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Chart: {symbol || "—"}</h3>

        <select value={selectedInterval} onChange={e => setSelectedInterval(e.target.value)}>
          {intervals.map(i => <option key={i} value={i}>{i}</option>)}
        </select>

        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Select pair</option>
          {qualifiedPairs.map(p => <option key={p.id} value={p.pair}>{p.pair}</option>)}
        </select>

        <button onClick={() => fetchChartData()} style={{ marginLeft: 8 }}>Reload</button>
        <button onClick={() => refreshIndicators()}>Refresh indicators</button>

        <label style={{ marginLeft: 8 }}>
          <input type="checkbox" checked={showVolume} onChange={e => setShowVolume(e.target.checked)} /> Show Volume
        </label>

        {loading && <span style={{ marginLeft: 12 }}>Loading...</span>}
      </div>

      <div style={{ marginBottom: 10 }}>
        {Object.keys(data.indicators || {}).map((key) => (
          <button
            key={key}
            onClick={() => toggleIndicator(key)}
            style={{
              marginRight: "6px",
              backgroundColor: activeIndicators[key] ? "#00b07c" : "#555",
              color: "#fff",
              border: "none",
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <div ref={chartContainerRef} style={{ width: "100%" }} />
    </div>
  );
}
