const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

/**
 * Fetch historical prices for any timeframe
 */
async function getHistoricalPrices(symbol, interval = '1h', exchangeType = 'binancefutures', limit = 1000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Error fetching ${interval} prices: ${response.statusText}`);
        const data = await response.json();
        return data.map(d => ({
            time: d[0],
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5])
        }));
    } catch (error) {
        console.error('Error in getHistoricalPrices:', error);
        return [];
    }
}

/**
 * Calculate Average True Range (ATR)
 */
function calculateATR(data, period = 14) {
    const trs = [];
    for (let i = 1; i < data.length; i++) {
        const highLow = data[i].high - data[i].low;
        const highClose = Math.abs(data[i].high - data[i - 1].close);
        const lowClose = Math.abs(data[i].low - data[i - 1].close);
        trs.push(Math.max(highLow, highClose, lowClose));
    }
    const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
    return atr;
}

/**
 * Fixed Range Volume Profile with adaptive buckets and weighted volume
 */
function calculateFRVP(data, valueAreaPercent = 0.7, minBuckets = 50, maxBuckets = 150) {
    if (!data || data.length === 0) return null;

    // Adaptive buckets based on ATR
    const atr = calculateATR(data);
    const minPrice = Math.min(...data.map(c => c.low));
    const maxPrice = Math.max(...data.map(c => c.high));
    const range = maxPrice - minPrice;
    let buckets = Math.min(maxBuckets, Math.max(minBuckets, Math.ceil(range / atr)));
    const bucketSize = range / buckets;

    const volumeProfile = new Array(buckets).fill(0);

    // Weighted volume: more weight towards close price
    for (const candle of data) {
        const candleLowIndex = Math.floor((candle.low - minPrice) / bucketSize);
        const candleHighIndex = Math.floor((candle.high - minPrice) / bucketSize);

        for (let i = candleLowIndex; i <= candleHighIndex; i++) {
            if (i >= 0 && i < buckets) {
                const weight = 0.5 + 0.5 * ((candle.close - candle.low) / (candle.high - candle.low || 1));
                volumeProfile[i] += candle.volume * weight / (candleHighIndex - candleLowIndex + 1);
            }
        }
    }

    // POC
    let pocIndex = volumeProfile.indexOf(Math.max(...volumeProfile));
    const pocPrice = minPrice + pocIndex * bucketSize + bucketSize / 2;

    // Value Area
    const totalVolume = volumeProfile.reduce((a, b) => a + b, 0);
    let cumVolume = 0, lowIndex = pocIndex, highIndex = pocIndex;
    const targetVolume = totalVolume * valueAreaPercent;

    while (cumVolume < targetVolume) {
        const volLow = volumeProfile[lowIndex - 1] || 0;
        const volHigh = volumeProfile[highIndex + 1] || 0;

        if (volLow > volHigh) {
            lowIndex = Math.max(0, lowIndex - 1);
            cumVolume += volLow;
        } else {
            highIndex = Math.min(buckets - 1, highIndex + 1);
            cumVolume += volHigh;
        }

        if (lowIndex === 0 && highIndex === buckets - 1) break;
    }

    return {
        poc: pocPrice,
        valueAreaLow: minPrice + lowIndex * bucketSize,
        valueAreaHigh: minPrice + highIndex * bucketSize,
        volumeProfile,
    };
}

/**
 * Multi-timeframe FRVP
 */
async function calculateMultiTimeframeFRVP(symbol, timeframes = ['1h','4h','1d'], valueAreaPercent = 0.7) {
    const results = {};
    for (const tf of timeframes) {
        const data = await getHistoricalPrices(symbol, tf);
        if (!data.length) continue;
        results[tf] = calculateFRVP(data, valueAreaPercent);
    }
    return results;
}

module.exports = {
    calculateFRVP,
    calculateMultiTimeframeFRVP
};
