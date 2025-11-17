const express = require("express");
const axios = require("axios");
const router = express.Router();

// Import top pairs fetcher
const { fetchAutomaticTradingPairs } = require("../models/topPairsFetcher");

// Import strategy evaluator
const { evaluateStrategy } = require("../models/strategyEvaluator");

// Utility to fetch Binance historical data
async function getHistoricalData(symbol, interval) {
  try {
    const response = await axios.get(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=150`
    );

    return response.data.map(c => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  } catch (err) {
    console.error(`❌ Failed to fetch Binance data for ${symbol} ${interval}:`, err.message);
    return [];
  }
}

router.get("/:symbol?", async (req, res) => {
  try {
    const exchangeType = req.query.exchangeType?.toLowerCase() || "binancefutures";

    // Intervals from query or default to 15m, 30m, 1h, 2h, 4h
    const intervals = req.query.interval
      ? req.query.interval.split(",").map(i => i.trim())
      : ["15m", "30m", "1h", "2h", "4h"];

    // Fetch either provided symbol or automatic top pairs
    const symbols = req.params.symbol
      ? [req.params.symbol.toUpperCase()]
      : await fetchAutomaticTradingPairs(exchangeType);

    console.log(`🔹 Fetching chart data for symbols: ${symbols.join(", ")} (${exchangeType})`);

    const results = {};

    for (const symbol of symbols) {
      console.log(`\n📊 Processing symbol: ${symbol}`);
      const dataByTimeframe = {};

      for (const interval of intervals) {
        console.log(`  🔹 Fetching data for interval: ${interval}`);

        let strategyData = {};
        let candles = [];

        try {
          strategyData = await evaluateStrategy(symbol, exchangeType, interval);
          candles = strategyData?.candles || [];
        } catch (err) {
          console.warn(`⚠️ Strategy evaluation failed for ${symbol} ${interval}:`, err.message);
        }

        // If strategyEvaluator didn't fetch candles, fallback to Binance API
        if (!candles.length) {
          console.log(`⚙️ No candles returned by strategyEvaluator — fetching from Binance...`);
          candles = await getHistoricalData(symbol, interval);
        }

        const sliced = candles.slice(-150);

        dataByTimeframe[interval] = {
          symbol,
          interval,
          exchangeType,
          latest: sliced[sliced.length - 1] || null,
          strategy: strategyData?.strategy || {},
          candles: sliced,
        };

        console.log(`  ✅ Completed interval: ${interval}`);
      }

      results[symbol] = dataByTimeframe;
      console.log(`✅ Finished processing symbol: ${symbol}`);
      console.log("-------------------------------------------------------------");
    }

    res.json({
      exchangeType,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error in /api/chart-data:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

module.exports = router;
