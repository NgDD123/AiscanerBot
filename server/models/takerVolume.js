const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

/**
 * Fetch and analyze aggressive taker volume
 * @param {string} symbol - Trading pair
 * @param {number} limit - Number of recent trades
 * @param {string} exchangeType - Exchange type, default 'binancefutures'
 */
async function getAggressiveTakerVolume(symbol, limit = 100, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const url = `${baseUrl}/fapi/v1/aggTrades?symbol=${symbol}&limit=${limit}`;
    
    console.log(`📡 Fetching ${limit} recent trades for ${symbol}...`);

    let trades;
    try {
        const res = await fetch(url);
        trades = await res.json();
    } catch (err) {
        console.error(`❌ Failed to fetch trades for ${symbol}:`, err.message);
        return { buyVolume: 0, sellVolume: 0, delta: 0, imbalanceRatio: 0 };
    }

    let buyVolume = 0;
    let sellVolume = 0;
    let largestBuy = 0;
    let largestSell = 0;

    trades.forEach(trade => {
        const vol = parseFloat(trade.q);
        if (trade.m) {
            sellVolume += vol; // buyer is taker → seller is aggressive
            if (vol > largestSell) largestSell = vol;
        } else {
            buyVolume += vol; // seller is taker → buyer is aggressive
            if (vol > largestBuy) largestBuy = vol;
        }
    });

    const totalVolume = buyVolume + sellVolume;
    const delta = totalVolume === 0 ? 0 : ((buyVolume - sellVolume) / totalVolume) * 100;
    const imbalanceRatio = totalVolume === 0 ? 0 : Math.abs(buyVolume - sellVolume) / totalVolume;

    console.log(`📊 Aggressive Taker Volume for ${symbol}:`);
    console.log(`  Buy Volume: ${buyVolume.toFixed(2)}, Sell Volume: ${sellVolume.toFixed(2)}`);
    console.log(`  Delta: ${delta.toFixed(2)}%`);
    console.log(`  Largest Single Buy: ${largestBuy.toFixed(2)}, Largest Single Sell: ${largestSell.toFixed(2)}`);
    console.log(`  Imbalance Ratio: ${imbalanceRatio.toFixed(2)} (higher = stronger bias)`);

    // Detect strong directional spikes
    const spikeThreshold = 0.25; // 25% imbalance considered strong
    if (imbalanceRatio >= spikeThreshold) {
        console.log(`⚡ Strong directional taker activity detected!`);
    }

    return {
        buyVolume,
        sellVolume,
        delta,
        imbalanceRatio,
        largestBuy,
        largestSell
    };
}

module.exports = { getAggressiveTakerVolume };
