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

        // BASIC FIELDS
        pair: bestPair.pair,
        signal: bestPair.signal,
        score: bestPair.score,

        // SUPPORT & RESISTANCE
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
          : null,

        // 🔥🔥🔥 IMPORTANT — ADD EVERYTHING BELOW 🔥🔥🔥
        ltp: bestPair.ltp,
        pipDistance: bestPair.pipDistance,
        profitPercent: bestPair.profitPercent,
        stopLoss: bestPair.stopLoss,
        stopLossPips: bestPair.stopLossPips,
        riskRewardRatio: bestPair.riskRewardRatio,
        suggestedLeverage: bestPair.suggestedLeverage,
        largeBidWalls: bestPair.largeBidWalls,
        largeAskWalls: bestPair.largeAskWalls
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
