const fetch = require('node-fetch');
require("dotenv").config()
const crypto = require('crypto');
const { ATR } = require('technicalindicators');
const { EMA, RSI, ADX, BollingerBands} = require('technicalindicators');
const technicalindicators = require('technicalindicators');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');// import config
const { getAdvancedMarketMakers } = require('./marketMakers');
const { getAggressiveTakerVolume } = require('./takerVolume');
const { calculateFRVP,calculateMultiTimeframeFRVP } = require('./frvp');
const obvolume = require('./obvolume');
const { getIchimokuTrend } = require('./ichimokuCloud');


/** 
 * Get historical prices for a symbol at 15-minute intervals
 * @param {*} symbol
 * @param {*} limit Number of data points to fetch
 */
async function getHistoricalPrices(symbol, exchangeType = 'binancefutures', limit = 1000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error fetching historical prices: ${response.statusText}`);
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
        console.error('Error in getHistoricalPrices:', error);
        return [];
    }
}

/**
 * Get historical prices for a symbol at 4-hour intervals
 * @param {*} symbol
 * @param {*} limit Number of data points to fetch
 */
async function get1hHistoricalPrices(symbol, exchangeType = 'binancefutures', limit = 1000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error fetching 1h historical prices: ${response.statusText}`);
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
        console.error('Error in get1hHistoricalPrices:', error);
        return [];
    }
}

/**
 * Get the last price for a symbol
 * @param {*} symbol
 */
async function getLastPrice(symbol, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch last price');
        }

        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error('Error fetching last price:', error.message);
        throw error;
    }
}

/**
 * Get historical data for the specified trading pair
 * @param {*} pair
 * @param {*} exchangeType
 */
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
// Advanced Key Levels Detection with Minimum Hits
// ===============================
function findAdvancedKeyLevels(data, windowSize = 50, sensitivity = 0.005, minHits = 3) {
    let keyLevels = [];

    // Detect swing highs and lows
    for (let i = 2; i < data.length - 2; i++) {
        const prev2 = data[i - 2];
        const prev1 = data[i - 1];
        const current = data[i];
        const next1 = data[i + 1];
        const next2 = data[i + 2];

        // Resistance: local high
        if (current.high > prev1.high && current.high > next1.high && current.high > prev2.high && current.high > next2.high) {
            keyLevels.push({ type: 'resistance', price: current.high, time: current.time });
        }

        // Support: local low
        if (current.low < prev1.low && current.low < next1.low && current.low < prev2.low && current.low < next2.low) {
            keyLevels.push({ type: 'support', price: current.low, time: current.time });
        }
    }

    // Group nearby levels into zones
    const groupedLevels = [];
    keyLevels.forEach(level => {
        const existingZone = groupedLevels.find(zone => Math.abs(zone.price - level.price) / level.price < sensitivity);

        if (existingZone) {
            // Combine level into the existing zone
            existingZone.price = (existingZone.price * existingZone.hits + level.price) / (existingZone.hits + 1);
            existingZone.hits += 1;
            existingZone.times.push(level.time);
        } else {
            // Create a new zone
            groupedLevels.push({ ...level, hits: 1, times: [level.time] });
        }
    });

    // Filter: keep only levels tested at least minHits times
    const strongLevels = groupedLevels.filter(level => level.hits >= minHits);

    // Optional: add a weight based on recency (if you want to prioritize recent levels)
    const now = Date.now();
    strongLevels.forEach(level => {
        const recentWeight = level.times.reduce((sum, t) => {
            const age = (now - t) / (1000 * 60 * 60); // hours old
            return sum + 1 / (1 + age);
        }, 0);
        level.weight = recentWeight * level.hits;
    });

    return strongLevels;
}

// ===============================
// Retest Confirmation (on Strong Levels)
// ====================
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
// Your Original Bot Utility Functions
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
    // ATR % of price (volatility-based)
    const atrPercent = (atr / price) * 100;

    // Dynamic tolerance based on volatility
    if (atrPercent > 1.5) return 0.012; // 1.2% tolerance for high volatility
    if (atrPercent > 1.0) return 0.008; // 0.8% tolerance for medium volatility
    return 0.005; // 0.5% tolerance for low volatility
}
// ===============================
// Main Strategy Evaluation Function
// ===============================
async function evaluateStrategy(symbol, exchangeType = 'binancefutures') {
    
 const data1h = await getHistoricalData(symbol, exchangeType, '1h'); // 1-hour candles
    const data4h = await getHistoricalData(symbol, exchangeType, '4h'); // 4-hour candles



    const ema20_1h = calculateEMA(data1h, 20);
    const ema50_1h = calculateEMA(data1h, 50);
    const rsi_1h = calculateRSI(data1h);
    const lastEMA20_1h = ema20_1h.at(-1);
    const lastEMA50_1h = ema50_1h.at(-1);
    const lastRSI1h = rsi_1h.at(-1);

    // Calculate 4h indicators
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

    
    // Calculate ADX with DMI
    const adxResults = ADX.calculate({
        close: data1h.map(d => d.close),
        high: data1h.map(d => d.high),
        low: data1h.map(d => d.low),
        period: 50
    });

    // --- Calculate Supertrend for 1h and 4h ---
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
    const delta = (takers.buyVolume + takers.sellVolume) === 0 ? 0 :
                  ((takers.buyVolume - takers.sellVolume) / (takers.buyVolume + takers.sellVolume)) * 100;

     // Calculate delta from buyVolume and sellVolume (safe check to avoid div by zero)
    const buyVol = takers.buyVolume || 0;
    const sellVol = takers.sellVolume || 0;
    const totalVol = buyVol + sellVol;
    const frvpMulti = await calculateMultiTimeframeFRVP(symbol, ['1h','4h','1d']);
    const frvp1h = calculateFRVP(data1h, 30);
    const tolerance = getFRVPTolerance(latest.atr, latest.close); // pass ATR + price
    const obvTrend = await obvolume(symbol, 50, 0.1); 
    // Get the last ADX and DIs
    const lastADX1h = adxResults.at(-1)?.adx || 0;
    const lastPlusDI = adxResults.at(-1)?.pdi || 0;  // +DI
    const lastMinusDI = adxResults.at(-1)?.mdi || 0; // -D
     const ichimokuTrend = await getIchimokuTrend(symbol);
     console.log(`Ichimoku Trend: ${ichimokuTrend.trend}, Strength: ${ichimokuTrend.strength}`);
  const atr = ATR.calculate({ period: 14, high: data1h.map(c => c.high), low: data1h.map(c => c.low), close: data1h.map(c => c.close) }).at(-1) || 0;
    const tolerance1 = (atr / latest.close) * 100;


    let buyScore = 0;
    let sellScore = 0;

    if (!isSqueezing) {
                    if (ichimokuTrend.strength === 'STRONG') {
                if (ichimokuTrend.trend === 'BULLISH') {
                    buyScore += 1;
                    console.log('Ichimoku: Strong Bullish Trend → +1 buyScore');
                } else if (ichimokuTrend.trend === 'BEARISH') {
                    sellScore += 1;
                    console.log('Ichimoku: Strong Bearish Trend → +1 sellScore');
                }
            // } else if (ichimokuTrend.strength === 'MEDIUM') {
            //     if (ichimokuTrend.trend === 'BULLISH') {
            //         buyScore += 1;
            //         console.log('Ichimoku: Medium Bullish Trend → +1 buyScore');
            //     } else if (ichimokuTrend.trend === 'BEARISH') {
            //         sellScore += 1;
            //         console.log('Ichimoku: Medium Bearish Trend → +1 sellScore');
            //     }
            // }   else {
                console.log('Ichimoku: Weak or Neutral Trend → No score change');
            }
            // Combine Supertrend + ADX + DMI for both 1h and 4h
                if (lastADX1h > 25) { // Trend is strong
                    if (lastST1h?.direction === 'long' && lastST4h?.direction === 'long' && lastPlusDI > lastMinusDI) {
                        buyScore += 2;
                        console.log('Supertrend + ADX + DMI: BUY (1h & 4h long confirmed +2 score)');
                    } else if (lastST1h?.direction === 'short' && lastST4h?.direction === 'short' && lastMinusDI > lastPlusDI) {
                        sellScore += 3;
                        console.log('Supertrend + ADX + DMI: SELL (1h & 4h short confirmed +2 score)');
                    } else {
                        console.log('Supertrend + ADX + DMI: HOLD (Trend mismatch between 1h & 4h)');
                    }
                } else {
                    console.log('Supertrend + ADX + DMI: HOLD (Weak trend, ADX <= 25)');
                }


    //    // Combine Supertrend + ADX into one buy/sell decision
    //     if (lastADX1h > 25) { // Trend is strong
    //         if (lastST1h?.direction === 'long' && lastPlusDI > lastMinusDI) {
    //             buyScore += 2; // Use += instead of =+ to correctly increment
    //             console.log('Supertrend + ADX + DMI: BUY (Strong Uptrend Confirmed +2 score)');
    //         } else if (lastST1h?.direction === 'short' && lastMinusDI > lastPlusDI) {
    //             sellScore += 2;
    //             console.log('Supertrend + ADX + DMI: SELL (Strong Downtrend Confirmed +2 score)');
    //         } else {
    //             console.log('Supertrend + ADX + DMI: HOLD (Trend strength mismatch)');
    //         }
    //     } else {
    //         console.log('Supertrend + ADX + DMI: HOLD (Weak or no trend, ADX <= 25)');
    //     }
 
        // if (latest.close > bbMid1h) {
        //     buyScore++;
        //     console.log('Price vs BB Mid: BUY');
        // } else if (latest.close < bbMid1h) {
        //     sellScore++;
        //     console.log('Price vs BB Mid: SELL');
        // } else {
        //     console.log('Price vs BB Mid: HOLD');
        // }

        // if (bullBand1h === 'bull') {
        //     buyScore++;
        //     console.log('Bollinger Band: BUY');
        // } else if (bullBand1h === 'bear') {
        //     sellScore++;
        //     console.log('Bollinger Band: SELL');
        // } else {
        //     console.log('Bollinger Band: HOLD');
        // }

        // if (lastRSI1h > 50) {
        //     buyScore++;
        //     console.log('RSI: BUY');
        // } else if (lastRSI1h < 45) {
        //     sellScore++;
        //     console.log('RSI: SELL');
        // } else {
        //     console.log('RSI: HOLD');
        // }
        
        if (obvTrend.includes('UPTREND')) {
            buyScore++;
            console.log('OBV Trend indicates UPTREND → Incrementing buyScore');
        } else if (obvTrend.includes('DOWNTREND')) {
            sellScore =+2;
            console.log('OBV Trend indicates DOWNTREND → Incrementing sellScore');
        } else {
            console.log('OBV Trend too weak or no lasting trend → No score change');
        }
    

        // if (lastADX1h > 20) {
        //     buyScore++;
        //     console.log('ADX: Trend Confirmed');
        // } else {
        //     console.log('ADX: Weak Trend / HOLD');
        // }

    //     if (volumeSpike1h) {
    // // Bullish spike: price closed higher than it opened
    // if (latest.close > latest.open) {
    //     buyScore++;
    //     console.log('Volume: BUY (Bullish Volume Spike Detected +1 score)');
    // } 
    // // Bearish spike: price closed lower than it opened
    // else if (latest.close < latest.open) {
    //     sellScore++;
    //     console.log('Volume: SELL (Bearish Volume Spike Detected +1 score)');
    // } 
    // else {
    //     console.log('Volume: HOLD (Doji with spike, no clear direction)');
    // }
    //     } else {
    //         console.log('Volume: HOLD (No Volume Spike)');

    //     }
        if (delta >= 25 && makers.largeBidWalls.length) {
            buyScore++;
            console.log("delta:BUY(makersBidwalls +1buy score)");
        }
            else if (delta <= -25 && makers.largeAskWalls.length){
            sellScore +=2;
            console.log("delta:SEEL(largeAskWalls +1Seel score)");

        } 


        //         if (delta >= 25 && takers.delta > 0 && makers.largeBidWalls.length > 0) {
        //     buyScore++;
        //     console.log("Bullish: Aggressive buyers + strong bid wall support + delta >= 25 ");
        // } else if (delta <= -25 && takers.delta < 0 && makers.largeAskWalls.length > 0) {
        //     sellScore++;
        //     console.log("Bearish: Aggressive sellers + strong ask wall resistance + delta <= -25");
        // }

                        
            const frvp1h = frvpMulti['1h'];
            if (latest.close <= frvp1h.valueAreaLow * (1 + tolerance1) &&
                latest.close >= frvp1h.valueAreaLow * (1 - tolerance1)) {
                    buyScore++;
                console.log("frvp1h: BUY (+1BUY SCORE) ");
            } else if (latest.close <= frvp1h.valueAreaHigh * (1 + tolerance1) &&
                    latest.close >= frvp1h.valueAreaHigh * (1 - tolerance1)){
                        sellScore +=2;
               console.log("frvp1h:  SEE(+1SEEL SCORE) ");
            }         


        // if (isRetestingSupport) {
        //     buyScore++;
        //     console.log('Retest: BUY (Support Retest Confirmed)');
        // } else if (isRetestingResistance) {
        //     console.log('Retest: SELL (Resistance Retest Confirmed)');
        // } else {
        //     console.log('Retest: HOLD (No Retest)');
        // }

        if (engulfing === 'bullishEngulfing') {
            buyScore++;
            console.log('Engulfing Pattern: BUY (Bullish Engulfing Detected)');
        } else if (engulfing === 'bearishEngulfing') {
            sellScore =+2;
            console.log('Engulfing Pattern: SELL (Bearish Engulfing Detected)');
        } else {
            console.log('Engulfing Pattern: HOLD (No Engulfing)');
        }
        // --- Combined BUY block ---
            if (
                (lastEMA20_1h > lastEMA50_1h && lastEMA20_4h > lastEMA50_4h) &&   // EMA alignment bullish
                (lastRSI1h > 50 && lastRSI4h > 50) &&                             // RSI levels bullish
                (rsiSlope1h > 0 && rsiSlope4h > 0)                                // RSI direction bullish
            ) {
                buyScore += 2;
                console.log("✅ Strong BUY: BUY(All bullish conditions aligned +2buyScores)");
            }

            // --- Combined SELL block ---
            if (
                (lastEMA20_1h < lastEMA50_1h && lastEMA20_4h < lastEMA50_4h) &&   // EMA alignment bearish
                (lastRSI1h < 45 && lastRSI4h < 45) &&                             // RSI levels bearish
                (rsiSlope1h < 0 && rsiSlope4h < 0)                                // RSI direction bearish
            ) {
                sellScore += 3;
                console.log("❌ Strong SELL: SEEL(All bearish conditions aligned++2SellScores)");
            }


        // // === EMA Crossover ===
        // const lastEMA20 = ema20_1h.at(-1);
        // const lastEMA50 = ema50_1h.at(-1);

        // if (lastEMA20 > lastEMA50) {
        //     buyScore++;
        //     console.log('EMA Crossover: BUY (EMA20 > EMA50)');
        // } else if (lastEMA20 < lastEMA50) {
        //     sellScore++;
        //     console.log('EMA Crossover: SELL (EMA20 < EMA50)');
        // } else {
        //     console.log('EMA Crossover: HOLD (No crossover)');
        // }
    }

    // console.log("===== MARKET MAKERS =====");
    // console.log("Large Bid Walls:", makers.largeBidWalls);
    // console.log("Large Ask Walls:", makers.largeAskWalls);

    // console.log("===== TAKERS =====");
    // console.log("Buy Volume:", takers.buyVolume);
    // console.log("Sell Volume:", takers.sellVolume);
    // console.log("Delta:", takers.delta);

    // console.log(`BB Width 1h: ${bbWidth1h.toFixed(2)}%, Threshold: 1.22%`);
    // console.log(`Squeeze Active: ${isSqueezing}`);
    // console.log(`Last ST Direction: ${lastST1h?.direction}`);
    // console.log(`Last Close: ${latest.close} | BB Mid: ${bbMid1h}`);
    // console.log(`Bull Band: ${bullBand1h}`);
    // console.log(`RSI 1h: ${lastRSI1h}`);
    // console.log(`ADX 1h: ${lastADX1h}`);
    // console.log(`Volume Check: Current = ${latest.volume}, Previous = ${previous.volume}, Ratio = ${(latest.volume / previous.volume).toFixed(2)}`);
    // console.log(`Strong Key Levels:`, keyLevels);
    // console.log(`Retesting Support: ${isRetestingSupport}, Retesting Resistance: ${isRetestingResistance}`);
    // console.log(`Buy Score: ${buyScore}, Sell Score: ${sellScore}`);

    if (buyScore >= 7) {
        console.log('Final Decision: BUY');
        return { signal: 'BUY', price: latest.close, buyScore, sellScore };
    } else if (sellScore >= 10) {
        console.log('Final Decision: SELL');
        return { signal: 'SELL', price: latest.close, buyScore, sellScore };
    }

    console.log('Final Decision: HOLD');
    return { signal: 'HOLD', price: latest.close, buyScore, sellScore };
}

module.exports = {
  evaluateStrategy,
};