const express = require("express");
const axios = require("axios");
const router = express.Router();

// Import automatic symbol picker
const { fetchAutomaticTradingPairs } = require("../models/topPairsFetcher");

// Import strategy evaluator
const { evaluateStrategy } = require("../models/strategyEvaluator");

// Import full indicator engine
const { computeChartMultiTimeframe } = require("../models/chartModel");

// ---------------- Helper: Fetch Binance Historical Data ----------------
async function getHistoricalData(symbol, interval) {
  try {
    const response = await axios.get(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=500`
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

// =====================================================================
//  MAIN ROUTE
// =====================================================================
router.get("/:symbol?", async (req, res) => {
  try {
    const exchangeType = req.query.exchangeType?.toLowerCase() || "binancefutures";

    // Custom or default intervals
    const intervals = req.query.interval
      ? req.query.interval.split(",").map(i => i.trim())
      : ["15m", "30m", "1h", "2h", "4h"];

    // Symbol or automatic top pairs
    const symbols = req.params.symbol
      ? [req.params.symbol.toUpperCase()]
      : await fetchAutomaticTradingPairs(exchangeType);

    console.log(`🔹 Fetching chart data for: ${symbols.join(", ")} (${exchangeType})`);

    const results = {};

    // -----------------------------------------------------------------
    // LOOP SYMBOLS
    // -----------------------------------------------------------------
    for (const symbol of symbols) {
      console.log(`\n📊 PROCESSING SYMBOL: ${symbol}`);
      const dataByTimeframe = {};

      // --------------------------------------------------------------
      // LOOP TIMEFRAMES
      // --------------------------------------------------------------
      for (const interval of intervals) {
        console.log(`  🔹 Fetching timeframe: ${interval}`);

        let strategyData = {};
        let candles = [];

        // Try strategy evaluator
        try {
          strategyData = await evaluateStrategy(symbol, exchangeType, interval);
          candles = strategyData?.candles || [];
        } catch (err) {
          console.warn(`⚠️ Strategy evaluator failed for ${symbol} ${interval}:`, err.message);
        }

        // If strategyEvaluator failed → fallback to Binance API
        if (!candles.length) {
          console.log("  ⚙️ No candles from strategy — fallback to Binance API");
          candles = await getHistoricalData(symbol, interval);
        }

        const sliced = candles.slice(-500);

        // --------------------------------------------------------------
        // 🔥 RUN INDICATORS HERE
        // --------------------------------------------------------------
        const indicators = computeChartMultiTimeframe(sliced);

        // --------------------------------------------------------------
        // PACK INTO RESPONSE
        // --------------------------------------------------------------
        dataByTimeframe[interval] = {
          symbol,
          interval,
          exchangeType,
          latest: sliced[sliced.length - 1] || null,
          strategy: strategyData?.strategy || {},
          candles: sliced,
          indicators, // FULL INDICATOR PACKAGE
        };

        console.log(`  ✅ Completed: ${interval}`);
      }

      results[symbol] = dataByTimeframe;
      console.log(`✅ Finished symbol: ${symbol}`);
      console.log("-------------------------------------------------------------");
    }

    // FINAL RESPONSE
    res.json({
      exchangeType,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error in /api/chart-data:", error.message);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

module.exports = router;
