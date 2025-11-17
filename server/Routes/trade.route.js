// Routes/trade.route.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { executeTrade } = require('../models/trade.modela');
const { getBinanceBaseUrl, getAccountInfoFromBinance } = require('./binanceConfig');

// Main trade execution route
router.post('/', async (req, res) => {
  try {
    const { apiKey, apiSecretKey, symbol, tradeDecision } = req.body;
    let { exchangeType } = req.body; // raw value from frontend

    const userEmail = req.headers['x-user-email'];
    if (!apiKey || !apiSecretKey || !symbol || !exchangeType) {
      return res.status(400).json({
        error: 'API key, secret, symbol, or exchange type not provided',
        received: { apiKey: !!apiKey, apiSecretKey: !!apiSecretKey, symbol, exchangeType }
      });
    }

    // ✅ Normalize exchangeType (case-insensitive)
    exchangeType = exchangeType.toLowerCase();
    if (exchangeType === 'binancefutures') {
      exchangeType = 'binancefutures';
    } else if (exchangeType === 'binancefuturestestnet') {
      exchangeType = 'binancefuturestestnet';
    } else if (exchangeType === 'binance') {
      exchangeType = 'binance';
    } else {
      return res.status(400).json({
        error: 'Invalid exchange type provided',
        received: exchangeType
      });
    }

    const baseUrl = getBinanceBaseUrl(exchangeType);

    console.log(`[DEBUG] Trade Decision: ${tradeDecision}`);
    console.log(`[DEBUG] Normalized ExchangeType: ${exchangeType}`);

    if (tradeDecision === 'Hold') {
      return res.json({ message: 'No trade executed. Decision is to Hold.' });
    }

    // ✅ Choose correct price endpoint depending on Spot vs Futures
    let priceEndpoint;
    if (exchangeType.includes('futures')) {
      priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;
    } else {
      priceEndpoint = `${baseUrl}/api/v3/ticker/price?symbol=${symbol}`;
    }

    console.log(`[DEBUG] Price endpoint: ${priceEndpoint}`);

    const lastPriceResponse = await fetch(priceEndpoint);
    if (!lastPriceResponse.ok) {
      const errText = await lastPriceResponse.text();
      console.error(`[ERROR] Binance price API for ${symbol}:`, errText);
      return res.status(502).json({ error: 'Failed to fetch last price from Binance', details: errText });
    }

    const { price: lastPrice } = await lastPriceResponse.json();
    console.log(`[DEBUG] Last price for ${symbol}: ${lastPrice}`);

    // ✅ Get account balance
    const accountInfo = await getAccountInfoFromBinance(apiKey, apiSecretKey, exchangeType);
    console.log(`[DEBUG] Account info:`, accountInfo);

    const availableUSDT = parseFloat(
      exchangeType.includes('futures')
        ? accountInfo.availableBalance
        : accountInfo.free // spot
    );

    console.log(`[DEBUG] Available USDT: ${availableUSDT}`);

    if (availableUSDT <= 0) {
      return res.json({ message: 'Insufficient funds for trading', availableUSDT });
    }

    // ✅ Spot not implemented
    if (!exchangeType.includes('futures')) {
      return res.json({ message: 'Spot trading not yet implemented in executeTrade' });
    }

    // ✅ Execute Futures Trade (Limit + Trailing Stop + Stop Loss)
    const tradeResponse = await executeTrade(
      apiKey,
      apiSecretKey,
      symbol,
      tradeDecision,
      parseFloat(lastPrice),
      exchangeType,
      availableUSDT,
      userEmail
    );

    console.log(`[DEBUG] Trade response:`, tradeResponse);
    res.json({ tradeResponse });

  } catch (error) {
    console.error('[FATAL ERROR in /api/execute-trade]:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
