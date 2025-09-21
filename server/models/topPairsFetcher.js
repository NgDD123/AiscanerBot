const axios = require('axios');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

let cache = {
  data: null,
  lastFetched: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MIN_PAIR_AGE_DAYS = 365;        // must be older than 1 year
const MIN_VOLUME_USDT = 10_000_000;   // 10M USDT daily volume
const MAX_DAILY_CHANGE = 50;          // avoid >50% pump/dump in 24h
const MIN_TRADE_COUNT = 1000;         // must have at least 1000 trades/day
const MAX_SPREAD_PERCENT = 0.5;       // order book spread must be <0.5%

async function fetchOrderBookSpread(baseUrl, symbol) {
  try {
    const depthRes = await axios.get(`${baseUrl}/fapi/v1/depth`, {
      params: { symbol, limit: 5 }
    });
    const bids = depthRes.data.bids;
    const asks = depthRes.data.asks;
    if (!bids.length || !asks.length) return 100; // suspicious if no book
    const bestBid = parseFloat(bids[0][0]);
    const bestAsk = parseFloat(asks[0][0]);
    return ((bestAsk - bestBid) / bestBid) * 100;
  } catch (err) {
    console.warn(`⚠️ Spread check failed for ${symbol}:`, err.message);
    return 100; // fail safe: mark as bad
  }
}

const fetchAutomaticTradingPairs = async (exchangeType) => {
  console.log("📥 fetchAutomaticTradingPairs called with:", exchangeType);
  try {
    const now = Date.now();
    const normalizedExchangeType = exchangeType.toLowerCase();
    const baseUrl = getBinanceBaseUrl(normalizedExchangeType);

    // ✅ Return cached data if still valid
    if (cache.data && (now - cache.lastFetched < CACHE_DURATION)) {
      console.log('⏳ Returning cached top pairs data...');
      return cache.data;
    }

    // Fetch all tradable perpetual USDT pairs
    const exchangeInfoResponse = await axios.get(`${baseUrl}/fapi/v1/exchangeInfo`);
    const allPairs = exchangeInfoResponse.data.symbols.filter(
      symbol =>
        symbol.status === 'TRADING' &&
        symbol.contractType === 'PERPETUAL' &&
        symbol.quoteAsset === 'USDT'
    );

    // Fetch 24h ticker stats
    const priceChangeResponse = await axios.get(`${baseUrl}/fapi/v1/ticker/24hr`);

    const maturedPairs = [];
    for (const ticker of priceChangeResponse.data) {
      const pairInfo = allPairs.find(pair => pair.symbol === ticker.symbol);
      if (!pairInfo) continue;

      // 1. Check if pair is older than 1 year
      const ageDays = (Date.now() - pairInfo.onboardDate) / (1000 * 60 * 60 * 24);
      if (ageDays < MIN_PAIR_AGE_DAYS) continue;

      // 2. Check if pair has at least 10M USDT daily volume
      if (parseFloat(ticker.quoteVolume) < MIN_VOLUME_USDT) continue;

      // 3. Avoid extreme pump & dump (±50% daily)
      if (Math.abs(parseFloat(ticker.priceChangePercent)) > MAX_DAILY_CHANGE) continue;

      // 4. Require at least 1000 trades per day
      if (parseInt(ticker.count, 10) < MIN_TRADE_COUNT) continue;

      // 5. Check order book spread
      const spread = await fetchOrderBookSpread(baseUrl, ticker.symbol);
      if (spread > MAX_SPREAD_PERCENT) continue;

      maturedPairs.push(ticker);
    }

    // 🔥 Top 20 Volatile
    const topVolatilePairs = [...maturedPairs]
      .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
      .slice(0, 20)
      .map(ticker => ticker.symbol);

    // 🚀 Top 20 Gainers
    const topGainerPairs = [...maturedPairs]
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
      .slice(0, 20)
      .map(ticker => ticker.symbol);

    // 💰 Top 20 by Volume
    const topVolumePairs = [...maturedPairs]
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map(ticker => ticker.symbol);

    const result = {
      topVolatilePairs,
      topGainerPairs,
      topVolumePairs
    };

    // ✅ Cache result
    cache = {
      data: result,
      lastFetched: now
    };

    console.log(`✅ Fetched ${maturedPairs.length} mature & safe pairs`);
    return result;

  } catch (error) {
    console.error('❌ Error fetching automatic trading pairs:', error.message);
    return {
      topVolatilePairs: [],
      topGainerPairs: [],
      topVolumePairs: []
    };
  }
};

module.exports = { fetchAutomaticTradingPairs };
