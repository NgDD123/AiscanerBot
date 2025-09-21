// backend/routes/topPairs.js
const express = require('express');
const router = express.Router();
const { fetchAutomaticTradingPairs } = require('../models/topPairsFetcher'); // Ensure correct path

router.get('/', async (req, res) => {
  try {
    // Log when the route is hit and the incoming header
    console.log('➡️ GET /api/top-pairs called');
    const exchangeType = req.headers['x-exchange-type']?.toLowerCase() || 'binancefutures';
    console.log('Exchange type received:', exchangeType);

    // Call the fetch function with the exchange type
    const topPairs = await fetchAutomaticTradingPairs(exchangeType);
    console.log("✅ Top Pairs fetched:");
    console.dir(topPairs, { depth: null, colors: true }); // This will display nested objects fully
    // Respond with the data
    res.json(topPairs);
  } catch (error) {
    console.error('❌ Error in top pairs route:', error.message);
    res.status(500).json({ error: 'Failed to fetch top pairs' });
  }
});

module.exports = router;
