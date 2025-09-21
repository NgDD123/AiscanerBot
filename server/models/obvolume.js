const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');
const { OBV } = require('technicalindicators');

/**
 * Fetch historical prices from Binance Futures
 */
async function getHistoricalPrices(symbol, interval = '1h', exchangeType = 'binancefutures', limit = 1000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Error fetching ${interval} historical prices: ${response.statusText}`);
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
        console.error(`Error in getHistoricalPrices (${interval}):`, error);
        return [];
    }
}

/**
 * Calculate slope of an array (linear regression slope)
 */
function calculateSlope(arr) {
    const n = arr.length;
    const xMean = (n - 1) / 2;
    const yMean = arr.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (arr[i] - yMean);
        denominator += (i - xMean) ** 2;
    }
    return numerator / denominator;
}

/**
 * Detect lasting OBV + price trends using multi-timeframe confirmation
 */
async function obvolume(symbol, lookback = 5, minStrength = 0.01) {
    // --- Fetch 1h and 4h candles ---
    const candles1h = await getHistoricalPrices(symbol, '1h');
    const candles4h = await getHistoricalPrices(symbol, '4h');

    if (!candles1h.length || !candles4h.length) return 'No sufficient data';

    // --- Helper to calculate trend for a timeframe ---
    const calcTrend = (candles) => {
        const closes = candles.map(c => c.close);
        const volumes = candles.map(c => c.volume);
        const obvValues = OBV.calculate({ close: closes, volume: volumes });

        if (candles.length < lookback || obvValues.length < lookback) return { trend: 'INSUFFICIENT', strength: 0 };

        const recentCloses = closes.slice(-lookback);
        const recentOBV = obvValues.slice(-lookback);

        const priceSlope = calculateSlope(recentCloses);
        const obvSlope = calculateSlope(recentOBV);
        const combinedStrength = Math.sqrt(priceSlope ** 2 + obvSlope ** 2);

        const uptrend = priceSlope > 0 && obvSlope > 0;
        const downtrend = priceSlope < 0 && obvSlope < 0;

        if (combinedStrength < minStrength) return { trend: 'WEAK', strength: combinedStrength.toFixed(4) };
        if (uptrend) return { trend: 'UPTREND', strength: combinedStrength.toFixed(4) };
        if (downtrend) return { trend: 'DOWNTREND', strength: combinedStrength.toFixed(4) };
        return { trend: 'NEUTRAL', strength: combinedStrength.toFixed(4) };
    };

    const trend1h = calcTrend(candles1h);
    const trend4h = calcTrend(candles4h);

    // --- Multi-timeframe confirmation ---
    if (trend1h.trend === 'UPTREND' && trend4h.trend === 'UPTREND') {
        return `STRONG MULTI-TF UPTREND ✅ | 1h Strength: ${trend1h.strength}, 4h Strength: ${trend4h.strength}`;
    } else if (trend1h.trend === 'DOWNTREND' && trend4h.trend === 'DOWNTREND') {
        return `STRONG MULTI-TF DOWNTREND ❌ | 1h Strength: ${trend1h.strength}, 4h Strength: ${trend4h.strength}`;
    } else {
        return `No confirmed multi-TF trend | 1h: ${trend1h.trend}, 4h: ${trend4h.trend}`;
    }
}

// Example usage:
// obvolume('BTCUSDT', 5, 0.02).then(console.log);

module.exports = obvolume;
