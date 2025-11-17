const express = require('express');
const router = express.Router();
const { findBestTradingPair } = require('../models/bestPairSelector');

// GET: Select the best trading pair using strategy evaluation
router.get('/', async (req, res) => {
  try {
    console.log('➡️ GET /api/best-pair called');

    const exchangeType = req.headers['x-exchange-type']?.toLowerCase() || 'binancefutures';
    console.log('Exchange type received:', exchangeType);

    const bestPair = await findBestTradingPair(exchangeType);

    if (bestPair) {
      res.json({
        status: 'success',
        pair: bestPair.pair,
        signal: bestPair.signal,
        score: bestPair.score,
        strongSupport: bestPair.strongSupport
          ? {
              price: bestPair.strongSupport.price,
              qty: bestPair.strongSupport.qty
            }
          : null,
        strongResistance: bestPair.strongResistance
          ? {
              price: bestPair.strongResistance.price,
              qty: bestPair.strongResistance.qty
            }
          : null
      });
    } else {
      res.status(200).json({
        status: 'no_match',
        message: 'No pair met the strategy threshold or liquidity requirements'
      });
    }
  } catch (error) {
    console.error('❌ Error in /api/best-pair route:', error.message);
    res.status(500).json({ error: 'Failed to determine best trading pair' });
  }
});

module.exports = router;
