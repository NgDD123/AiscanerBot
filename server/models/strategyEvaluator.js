const fetch = require('node-fetch');
require("dotenv").config();
const crypto = require('crypto');
const { ATR } = require('technicalindicators');
const { EMA, RSI, ADX, BollingerBands } = require('technicalindicators');
const technicalindicators = require('technicalindicators');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');
const { getAdvancedMarketMakers } = require('./marketMakers');
const { getAggressiveTakerVolume } = require('./takerVolume');
const { calculateFRVP, calculateMultiTimeframeFRVP } = require('./frvp');
const obvolume = require('./obvolume');
const { getIchimokuTrend } = require('./ichimokuCloud');

// ===============================
// Historical Data Fetchers
// ===============================
async function getHistoricalData(pair, exchangeType = 'binancefutures', interval = '1h') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${pair}&interval=${interval}&limit=1000`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
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
        console.error('Error fetching historical data:', error.message);
        throw error;
    }
}

// ===============================
// Key Levels Detection
// ===============================
function findAdvancedKeyLevels(data, windowSize = 50, sensitivity = 0.005, minHits = 3) {
    let keyLevels = [];

    for (let i = 2; i < data.length - 2; i++) {
        const prev2 = data[i - 2];
        const prev1 = data[i - 1];
        const current = data[i];
        const next1 = data[i + 1];
        const next2 = data[i + 2];

        if (current.high > prev1.high && current.high > next1.high && current.high > prev2.high && current.high > next2.high) {
            keyLevels.push({ type: 'resistance', price: current.high, time: current.time });
        }
        if (current.low < prev1.low && current.low < next1.low && current.low < prev2.low && current.low < next2.low) {
            keyLevels.push({ type: 'support', price: current.low, time: current.time });
        }
    }

    const groupedLevels = [];
    keyLevels.forEach(level => {
        const existingZone = groupedLevels.find(zone => Math.abs(zone.price - level.price) / level.price < sensitivity);

        if (existingZone) {
            existingZone.price = (existingZone.price * existingZone.hits + level.price) / (existingZone.hits + 1);
            existingZone.hits += 1;
            existingZone.times.push(level.time);
        } else {
            groupedLevels.push({ ...level, hits: 1, times: [level.time] });
        }
    });

    const strongLevels = groupedLevels.filter(level => level.hits >= minHits);

    const now = Date.now();
    strongLevels.forEach(level => {
        const recentWeight = level.times.reduce((sum, t) => {
            const age = (now - t) / (1000 * 60 * 60);
            return sum + 1 / (1 + age);
        }, 0);
        level.weight = recentWeight * level.hits;
    });

    return strongLevels;
}

function isRetestingLevel(latest, keyLevels, tolerance = 0.002) {
    for (const level of keyLevels) {
        if (level.type === 'support' && Math.abs(latest.low - level.price) / level.price < tolerance) {
            return { type: 'support', level: level.price, hits: level.hits };
        }
        if (level.type === 'resistance' && Math.abs(latest.high - level.price) / level.price < tolerance) {
            return { type: 'resistance', level: level.price, hits: level.hits };
        }
    }
    return null;
}

// ===============================
// Indicators
// ===============================
function calculateBBWidth(bbUpper, bbLower, bbMid) {
    return ((bbUpper - bbLower) / bbMid) * 100;
}

function calculateEMA(data, period) {
    return EMA.calculate({ values: data.map(d => d?.close), period });
}

function calculateRSI(data, period = 14) {
    return RSI.calculate({ values: data.map(d => d?.close), period });
}

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

function calculateSupertrend(candles, period = 100, multiplier = 4) {
    const atrValues = ATR.calculate({
        period,
        high: candles.map(c => c.high),
        low: candles.map(c => c.low),
        close: candles.map(c => c?.close),
    });

    const supertrend = [];
    for (let i = period; i < candles.length; i++) {
        const hl2 = (candles[i].high + candles[i].low) / 2;
        const upperBand = hl2 + multiplier * atrValues[i - period];
        const lowerBand = hl2 - multiplier * atrValues[i - period];
        const prevClose = candles[i - 1]?.close;
        const direction = prevClose <= upperBand ? 'long' : 'short';
        supertrend.push({ time: candles[i].time, upperBand, lowerBand, direction });
    }
    return supertrend;
}

function isEngulfing(current, previous, minBodySize = 0.5, minVolume = 10000) {
    const currentBody = Math.abs(current?.close - current.open);
    const previousBody = Math.abs(previous?.close - previous.open);
    if (current.volume < minVolume || currentBody < minBodySize) return false;

    if (
        previous.open > previous?.close &&
        current.open < current?.close &&
        current.open < previous?.close &&
        current.close > previous?.open
    ) {
        return 'bullishEngulfing';
    }
    if (
        previous.open < previous?.close &&
        current.open > current?.close &&
        current.open > previous?.close &&
        current.close < previous?.open
    ) {
        return 'bearishEngulfing';
    }
    return null;
}

function getFRVPTolerance(atr, price) {
    const atrPercent = (atr / price) * 100;

    if (atrPercent > 1.5) return 0.012;
    if (atrPercent > 1.0) return 0.008;
    return 0.005;
}

// ===============================
// Strategy Evaluation
// ===============================
async function evaluateStrategy(symbol, exchangeType = 'binancefutures') {
    const data1h = await getHistoricalData(symbol, exchangeType, '1h');
    const data4h = await getHistoricalData(symbol, exchangeType, '4h');

    const ema20_1h = calculateEMA(data1h, 20);
    const ema50_1h = calculateEMA(data1h, 50);
    const rsi_1h = calculateRSI(data1h);
    const lastEMA20_1h = ema20_1h.at(-1);
    const lastEMA50_1h = ema50_1h.at(-1);
    const lastRSI1h = rsi_1h.at(-1);

    const ema20_4h = calculateEMA(data4h, 20);
    const ema50_4h = calculateEMA(data4h, 50);
    const rsi_4h = calculateRSI(data4h);
    const lastEMA20_4h = ema20_4h.at(-1);
    const lastEMA50_4h = ema50_4h.at(-1);
    const lastRSI4h = rsi_4h.at(-1);

    const rsiSlope1h = calculateSlope(rsi_1h.slice(-5));
    const rsiSlope4h = calculateSlope(rsi_4h.slice(-5));

    const bb1h = BollingerBands.calculate({
        period: 100,
        values: data1h.map(c => c.close),
        stdDev: 2,
    });
    const lastBB = bb1h.at(-1);
    const bbUpper1h = lastBB.upper;
    const bbLower1h = lastBB.lower;
    const bbMid1h = lastBB.middle;

    const latest = data1h[data1h.length - 1];
    const previous = data1h[data1h.length - 2];

    const adxResults = ADX.calculate({
        close: data1h.map(d => d.close),
        high: data1h.map(d => d.high),
        low: data1h.map(d => d.low),
        period: 50
    });

    const supertrend1h = calculateSupertrend(data1h, 100, 4);
    const lastST1h = supertrend1h.at(-1);

    const supertrend4h = calculateSupertrend(data4h, 100, 4);
    const lastST4h = supertrend4h.at(-1);

    const bbWidth1h = calculateBBWidth(bbUpper1h, bbLower1h, bbMid1h);
    const isSqueezing = bbWidth1h < 1.22;

    const engulfing = isEngulfing(latest, previous, 0.5, 10000);
    const bullBand1h = latest.close > bbMid1h ? 'bull' : 'bear';
    const volumeSpike1h = latest.volume > previous.volume * 1.2;

    const keyLevels = findAdvancedKeyLevels(data1h, 50, 0.005, 3);
    const retestResult = isRetestingLevel(latest, keyLevels, 0.002);
    const isRetestingSupport = retestResult?.type === 'support';
    const isRetestingResistance = retestResult?.type === 'resistance';

    const makers = await getAdvancedMarketMakers(symbol);
    const takers = await getAggressiveTakerVolume(symbol);
    const buyVol = takers?.buyVolume || 0;
    const sellVol = takers?.sellVolume || 0;
    const totalVol = buyVol + sellVol;
    const delta = totalVol === 0 ? 0 : ((buyVol - sellVol) / totalVol) * 100;

    const frvpMulti = await calculateMultiTimeframeFRVP(symbol, ['1h', '4h', '1d']);
    const atr = ATR.calculate({ period: 14, high: data1h.map(c => c.high), low: data1h.map(c => c.low), close: data1h.map(c => c.close) }).at(-1) || 0;
    const tolerance1 = (atr / latest.close) * 100;

    const obvTrend = await obvolume(symbol, 50, 0.1);
    const ichimokuTrend = await getIchimokuTrend(symbol);
    console.log(`Ichimoku Trend: ${ichimokuTrend.trend}, Strength: ${ichimokuTrend.strength}`);

    const lastADX1h = adxResults.at(-1)?.adx || 0;
    const lastPlusDI = adxResults.at(-1)?.pdi || 0;
    const lastMinusDI = adxResults.at(-1)?.mdi || 0;

    let buyScore = 0;
    let sellScore = 0;

    if (!isSqueezing) {
        if (ichimokuTrend.strength === 'STRONG') {
            if (ichimokuTrend.trend === 'BULLISH') {
                buyScore++;
                console.log('Ichimoku: Strong Bullish Trend → +1 buyScore');
            } else if (ichimokuTrend.trend === 'BEARISH') {
                sellScore += 2;
                console.log('Ichimoku: Strong Bearish Trend → +1 sellScore');
            } else {
                console.log('Ichimoku: Weak or Neutral Trend → No score change');
            }
        }

        if (lastADX1h > 25) {
            if (lastST1h?.direction === 'long' && lastST4h?.direction === 'long' && lastPlusDI > lastMinusDI) {
                buyScore += 2;
                console.log('Supertrend + ADX + DMI: BUY (1h & 4h long confirmed +2 score)');
            } else if (lastST1h?.direction === 'short' && lastST4h?.direction === 'short' && lastMinusDI > lastPlusDI) {
                sellScore += 2;
                console.log('Supertrend + ADX + DMI: SELL (1h & 4h short confirmed +2 score)');
            } else {
                console.log('Supertrend + ADX + DMI: HOLD (Trend mismatch between 1h & 4h)');
            }
        } else {
            console.log('Supertrend + ADX + DMI: HOLD (Weak trend, ADX <= 25)');
        }

        if (obvTrend.includes('UPTREND')) {
            buyScore++;
            console.log('OBV Trend indicates UPTREND → Incrementing buyScore');
        } else if (obvTrend.includes('DOWNTREND')) {
            sellScore += 2;
            console.log('OBV Trend indicates DOWNTREND → Incrementing sellScore');
        } else {
            console.log('OBV Trend too weak or no lasting trend → No score change');
        }

        if (delta >= 20 && makers?.largeBidWalls?.length > 0) {
            buyScore += 1;
            console.log("✅ Delta BUY → Aggressive buyers + Bid walls (+2 buyScore)");
        } else if (delta <= -20 && makers?.largeAskWalls?.length > 0) {
            sellScore += 2;
            console.log("❌ Delta SELL → Aggressive sellers + Ask walls (+2 sellScore)");
        } else {
            console.log("Delta/Makers condition not met → No score change");
        }

        const frvp1h = frvpMulti['1h'];
        if (latest.close <= frvp1h.valueAreaLow * (1 + tolerance1) &&
            latest.close >= frvp1h.valueAreaLow * (1 - tolerance1)) {
            buyScore++;
            console.log("frvp1h: BUY (+1BUY SCORE) ");
        } else if (latest.close <= frvp1h.valueAreaHigh * (1 + tolerance1) &&
            latest.close >= frvp1h.valueAreaHigh * (1 - tolerance1)) {
            sellScore++;
            console.log("frvp1h: SELL (+1SELL SCORE) ");
        }

        if (engulfing === 'bullishEngulfing') {
            buyScore++;
            console.log('Engulfing Pattern: BUY (Bullish Engulfing Detected)');
        } else if (engulfing === 'bearishEngulfing') {
            sellScore++;
            console.log('Engulfing Pattern: SELL (Bearish Engulfing Detected)');
        } else {
            console.log('Engulfing Pattern: HOLD (No Engulfing)');
        }

        if ((lastEMA20_1h > lastEMA50_1h && lastEMA20_4h > lastEMA50_4h) &&
            (lastRSI1h > 50 && lastRSI4h > 50) &&
            (rsiSlope1h > 0 && rsiSlope4h > 0)) {
            buyScore += 2;
            console.log("✅ Strong BUY: BUY(All bullish conditions aligned +2buyScores)");
        }

        if ((lastEMA20_1h < lastEMA50_1h && lastEMA20_4h < lastEMA50_4h) &&
            (lastRSI1h < 45 && lastRSI4h < 45) &&
            (rsiSlope1h < 0 && rsiSlope4h < 0)) {
            sellScore += 2;
            console.log("❌ Strong SELL: SELL(All bearish conditions aligned +2SellScores)");
        }
    }

    if (buyScore >= 7) {
        console.log('Final Decision: BUY');
        return { signal: 'BUY', price: latest.close, buyScore, sellScore };
    } else if (sellScore >= 6) {
        console.log('Final Decision: SELL');
        return { signal: 'SELL', price: latest.close, buyScore, sellScore };
    }

    console.log('Final Decision: HOLD');
    return { signal: 'HOLD', price: latest.close, buyScore, sellScore };
}

module.exports = {
    evaluateStrategy,
};
