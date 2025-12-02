// ChartPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function ChartPage() {
  const [symbol, setSymbol] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("2h");
  const intervals = ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "1w", "1M"];
  const [qualifiedPairs, setQualifiedPairs] = useState([]);
  const widgetRef = useRef(null);

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

  // ---------------- Map interval to TradingView ----------------
  const tvInterval = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "8h": "480",
    "1w": "W",
    "1M": "M",
  };

  // ---------------- Load TradingView Chart ----------------
  const loadTradingView = useCallback(() => {
    if (!symbol) return;

    // Clear old widget
    if (widgetRef.current) {
      widgetRef.current.innerHTML = "";
    }

    // Create new widget
    new window.TradingView.widget({
      autosize: true,
      symbol: `${symbol}`,
      interval: tvInterval[selectedInterval] || "120",
      container_id: "tv_chart_container",
      theme: "dark",
      style: "1",
      toolbar_bg: "#0a0f1e",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      withdateranges: true,
      details: true,
      hotlist: true,
      calendar: true,
      studies: ["MACD@tv-basicstudies", "RSI@tv-basicstudies"],
    });
  }, [symbol, selectedInterval]);

  // ---------------- Reload Chart on symbol/interval change ----------------
  useEffect(() => {
    if (window.TradingView) {
      loadTradingView();
    }
  }, [symbol, selectedInterval, loadTradingView]);

  return (
    <div className="w-full h-full text-white p-4">
      {/* ---------------- Top Controls ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        
        {/* Symbol Selector */}
        <div>
          <label className="font-bold mr-2">Pairs:</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[#0b0b15] px-3 py-2 rounded border border-gray-700"
          >
            {qualifiedPairs.map((p) => (
              <option key={p.id} value={p.pair}>
                {p.pair}
              </option>
            ))}
          </select>
        </div>

        {/* Interval Selector */}
        <div>
          <label className="font-bold mr-2">Interval:</label>
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="bg-[#0b0b15] px-3 py-2 rounded border border-gray-700"
          >
            {intervals.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------- TradingView Chart Container ---------------- */}
      <div
        id="tv_chart_container"
        ref={widgetRef}
        style={{ width: "100%", height: "700px" }}
        className="rounded-xl overflow-hidden border border-gray-800"
      ></div>
    </div>
  );
}
