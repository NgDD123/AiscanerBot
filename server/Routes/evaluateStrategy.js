// Assuming you have express app already set up:
const express = require('express');
const router = express.Router();
const { evaluateStrategy } = require('../models/strategyEvaluator'); // adjust path as needed

// POST or GET endpoint to evaluate a symbol
router.get('/api/evaluate-strategy/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await evaluateStrategy(symbol);
    res.json({
      symbol,
      signal: result.signal,
      price: result.price,
      buyScore: result.buyScore,
      sellScore: result.sellScore,
    });
  } catch (error) {
    console.error('Error evaluating strategy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/api/historical-data/:pair', async (req, res) => {
    try {
        const { pair } = req.params;
        const { exchangeType = 'binancefutures' } = req.query;

        const historicalData = await getHistoricalData(pair, exchangeType);
        res.json({ historicalData });
    } catch (error) {
        console.error('Error fetching historical data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;


