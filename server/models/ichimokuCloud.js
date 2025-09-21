const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

/**
 * Fetch historical prices from Binance Futures
 */
async function getHistoricalPrices(symbol, interval = '1h', limit = 1000, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error fetching ${interval} historical prices: ${response.statusText}`);
        }
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
        console.error(`Error in getHistoricalPrices(${interval}):`, error);
        return [];
    }
}

/**
 * Calculate Ichimoku Cloud lines
 */
function calculateIchimoku(data) {
    const tenkanPeriod = 26;
    const kijunPeriod = 52;
    const senkouSpanBPeriod = 100;
    const result = [];

    for (let i = 0; i < data.length; i++) {
        const sliceTenkan = data.slice(Math.max(0, i - tenkanPeriod + 1), i + 1);
        const sliceKijun = data.slice(Math.max(0, i - kijunPeriod + 1), i + 1);
        const sliceSenkouB = data.slice(Math.max(0, i - senkouSpanBPeriod + 1), i + 1);

        const highTenkan = Math.max(...sliceTenkan.map(d => d.high));
        const lowTenkan = Math.min(...sliceTenkan.map(d => d.low));
        const tenkan = (highTenkan + lowTenkan) / 2;

        const highKijun = Math.max(...sliceKijun.map(d => d.high));
        const lowKijun = Math.min(...sliceKijun.map(d => d.low));
        const kijun = (highKijun + lowKijun) / 2;

        const highSenkouB = Math.max(...sliceSenkouB.map(d => d.high));
        const lowSenkouB = Math.min(...sliceSenkouB.map(d => d.low));
        const senkouB = (highSenkouB + lowSenkouB) / 2;

        const senkouA = (tenkan + kijun) / 2;

        const chikou = i >= kijunPeriod ? data[i - kijunPeriod].close : data[0].close;

        result.push({
            time: data[i].time,
            tenkan,
            kijun,
            senkouA,
            senkouB,
            chikou,
            close: data[i].close
        });
    }
    return result;
}

/**
 * Determine trend strength
 */
function detectIchimokuTrend(ichimokuData) {
    const last = ichimokuData.at(-1);

    const priceAboveCloud = last.close > Math.max(last.senkouA, last.senkouB);
    const priceBelowCloud = last.close < Math.min(last.senkouA, last.senkouB);

    const bullishAlignment = last.tenkan > last.kijun;
    const bearishAlignment = last.tenkan < last.kijun;

    const cloudBullish = last.senkouA > last.senkouB;
    const cloudBearish = last.senkouA < last.senkouB;

    let trend = 'NEUTRAL';
    let strength = 'WEAK';

    if (priceAboveCloud && bullishAlignment && cloudBullish) {
        trend = 'BULLISH';
        strength = 'STRONG';
    } else if (priceAboveCloud && (bullishAlignment || cloudBullish)) {
        trend = 'BULLISH';
        strength = 'MEDIUM';
    } else if (priceBelowCloud && bearishAlignment && cloudBearish) {
        trend = 'BEARISH';
        strength = 'STRONG';
    } else if (priceBelowCloud && (bearishAlignment || cloudBearish)) {
        trend = 'BEARISH';
        strength = 'MEDIUM';
    }

    return { trend, strength, last };
}

/**
 * Main function with Multi-Timeframe Check (1h + 4h)
 */
async function getIchimokuTrend(symbol) {
    // Fetch 1h prices
    const prices1h = await getHistoricalPrices(symbol, '1h');
    if (!prices1h.length) return { trend: 'NEUTRAL', strength: 'WEAK' };
    const ichimoku1h = calculateIchimoku(prices1h);
    const trend1h = detectIchimokuTrend(ichimoku1h);

    // Fetch 4h prices
    const prices4h = await getHistoricalPrices(symbol, '4h');
    if (!prices4h.length) return { trend: 'NEUTRAL', strength: 'WEAK' };
    const ichimoku4h = calculateIchimoku(prices4h);
    const trend4h = detectIchimokuTrend(ichimoku4h);

    // Multi-timeframe filter: only act if both agree
    if (trend1h.trend === trend4h.trend && trend1h.trend !== 'NEUTRAL') {
        return {
            trend: trend1h.trend,
            strength: trend1h.strength === 'STRONG' && trend4h.strength === 'STRONG'
                ? 'STRONG'
                : 'MEDIUM',
            details: { oneHour: trend1h, fourHour: trend4h }
        };
    }

    // If they disagree → no trade
    return {
        trend: 'NEUTRAL',
        strength: 'WEAK',
        details: { oneHour: trend1h, fourHour: trend4h }
    };
}

module.exports = {
    getIchimokuTrend
};
