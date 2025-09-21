const express = require('express');
const fetch = require('node-fetch');
require("dotenv").config()
const crypto = require('crypto');
const { SMA, StochasticRSI, EMA, MACD, RSI } = require('technicalindicators');
require('dotenv').config();
const cors = require('cors');
const schedule = require('node-schedule');
// const paymentRouter = require('./Routes/payment');
const paymentRouter = require('./Routes/payment2.route');
const userRouter = require('./Routes/user.route');
const paymentsFetcherCron = require('./config/paymentsFetcherCron');
const { initFirebase } = require('./firebase');
const usersFetcherCron = require('./config/usersFetcherCron');
const app = express();
app.use(express.urlencoded({ extended: true }));


//init fireabse
initFirebase()

// Enable CORS
app.use(cors({ origin: "*" }));

// Parse JSON bodies
app.use(express.json());
app.use('/payment', paymentRouter);
app.use('/user', userRouter);

// Middleware for logging requests (optional)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});


// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Trading Bot Server!' });
});
// paymentsFetcherCron.start()
usersFetcherCron.start()
/**
 * Store API keys for connected exchanges
 */
let exchangeApiKeys = {};

/**
 * Get historical prices for a symbol at 15-minute intervals
 * @param {*} symbol
 * @param {*} limit Number of data points to fetch
 */
async function getHistoricalPrices(symbol, limit) {
    const endpoint = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=2h&limit=${limit}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error fetching historical prices: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getHistoricalPrices:', error);
        return [];
    }
}

/**
 * Get the last price for a symbol
 * @param {*} symbol
 */
async function getLastPrice(symbol) {
    try {
        const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
        if (!response.ok) {
            throw new Error('Failed to fetch last price');
        }
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error('Error fetching last price:', error);
        throw error;
    }
}

/**
 * Get historical data for the specified trading pair
 */
app.get('/api/historical-data/:pair', async (req, res) => {
    try {
        const { pair } = req.params;
        const historicalData = await getHistoricalData(pair);
        res.json({ historicalData });
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Get historical data for the specified trading pair
 * @param {*} pair
 */
async function getHistoricalData(pair) {
    try {
        const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${pair}&interval=2h&limit=100`);
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
}

/**
 * Calculate Moving Average
 * @param {*} data
 * @param {*} period
 */
function calculateMovingAverage(data, period) {
    if (!data || data.length === 0 || data.length < period) {
        return null;
    }

    let sum = 0;
    for (let i = data.length - period; i < data.length; i++) {
        sum += data[i];
    }

    return sum / period;
}



/**
 * Calculate EMA for the specified period
 * @param {*} data
 * @param {*} period
 */
function calculateEMA(data, period) {
    return EMA.calculate({ values: data, period });
}

/**
 * Calculate MACD
 * @param {*} data
 */
function calculateMACD(data) {
    const input = {
        values: data,
        fastPeriod: 12,   // Typically 12-period
        slowPeriod: 26,   // Typically 26-period
        signalPeriod: 9,  // Typically 9-period for signal line
        SimpleMAOscillator: false,
        SimpleMASignal: false
    };
    return MACD.calculate(input);
}
/**
 * Calculate RSI for a given period
 * @param {Array} data - Closing prices array
 * @param {Number} period - The period for RSI calculation (default is 14)
 */
function calculateRSI(data, period = 14) {
    return RSI.calculate({ values: data, period });
}





/**
 /**
 * Identify Candlestick Patterns
 * @param {*} data
 */
function identifyCandlestickPattern(data) {
    const currentCandle = data[data.length - 1];
    const previousCandle = data[data.length - 2];
    const thirdCandle = data[data.length - 3];
    const fourthCandle = data[data.length - 4];

    // Bullish Patterns

    // Bullish Engulfing Pattern
    if (
        previousCandle[1] < previousCandle[4] &&
        currentCandle[1] > currentCandle[4] &&
        currentCandle[4] > previousCandle[1] &&
        currentCandle[1] < previousCandle[4]
    ) {
        return 'bullishEngulfing';
    }

    // Hammer Pattern
    if (
        currentCandle[1] > currentCandle[4] &&
        (currentCandle[4] - currentCandle[3]) >= 2 * (currentCandle[1] - currentCandle[4])
    ) {
        return 'hammer';
    }

    // Morning Star Pattern
    if (
        fourthCandle && // Ensure there are enough candles
        thirdCandle[1] > thirdCandle[4] && // Long bearish candle
        Math.abs(previousCandle[1] - previousCandle[4]) <= (thirdCandle[1] - thirdCandle[4]) * 0.3 && // Small indecisive candle
        currentCandle[4] > thirdCandle[4] && // Long bullish candle
        currentCandle[1] < previousCandle[4] &&
        currentCandle[4] > previousCandle[1]
    ) {
        return 'morningStar';
    }

    // Piercing Line Pattern
    if (
        previousCandle[1] > previousCandle[4] && // Bearish candle
        currentCandle[1] < currentCandle[4] && // Bullish candle
        currentCandle[1] < previousCandle[4] && // Gap down
        currentCandle[4] > previousCandle[4] + (previousCandle[1] - previousCandle[4]) / 2 // Closes above the midpoint of the previous candle
    ) {
        return 'piercingLine';
    }

    // Three White Soldiers Pattern
    if (
        thirdCandle && // Ensure there are enough candles
        thirdCandle[1] < thirdCandle[4] && // First bullish candle
        previousCandle[1] < previousCandle[4] && // Second bullish candle
        currentCandle[1] < currentCandle[4] && // Third bullish candle
        thirdCandle[4] < previousCandle[1] && // Close higher than the previous candle's close
        previousCandle[4] < currentCandle[1] // Close higher than the previous candle's close
    ) {
        return 'threeWhiteSoldiers';
    }




    // Rising Three Methods Pattern
    if (
        fourthCandle && // Ensure there are enough candles
        fourthCandle[1] < fourthCandle[4] && // Long bullish candle
        thirdCandle[1] > thirdCandle[4] && // Series of small bearish/neutral candles
        previousCandle[1] > previousCandle[4] &&
        currentCandle[1] < currentCandle[4] && // Long bullish candle
        currentCandle[4] > fourthCandle[4] // Close above the first bullish candle's close
    ) {
        return 'risingThreeMethods';
    }



    // Bearish Patterns

    // Bearish Engulfing Pattern
    if (
        previousCandle[1] > previousCandle[4] &&
        currentCandle[1] < currentCandle[4] &&
        currentCandle[4] < previousCandle[1] &&
        currentCandle[1] > previousCandle[4]
    ) {
        return 'bearishEngulfing';
    }

    // Shooting Star Pattern
    if (
        currentCandle[1] < currentCandle[4] &&
        (currentCandle[2] - currentCandle[4]) >= 2 * (currentCandle[1] - currentCandle[4])
    ) {
        return 'shootingStar';
    }

    // Evening Star Pattern
    if (
        fourthCandle && // Ensure there are enough candles
        thirdCandle[1] < thirdCandle[4] && // Long bullish candle
        Math.abs(previousCandle[1] - previousCandle[4]) <= (thirdCandle[1] - thirdCandle[4]) * 0.3 && // Small indecisive candle
        currentCandle[4] < previousCandle[4] && // Long bearish candle
        currentCandle[4] < thirdCandle[1] // Closes below the midpoint of the first candle
    ) {
        return 'eveningStar';
    }

    // Three Black Crows Pattern
    if (
        thirdCandle && // Ensure there are enough candles
        thirdCandle[1] > thirdCandle[4] && // First bearish candle
        previousCandle[1] > previousCandle[4] && // Second bearish candle
        currentCandle[1] > currentCandle[4] && // Third bearish candle
        thirdCandle[4] > previousCandle[1] && // Close lower than the previous candle's close
        previousCandle[4] > currentCandle[1] // Close lower than the previous candle's close
    ) {
        return 'threeBlackCrows';
    }


    // Falling Three Methods Pattern
    if (
        fourthCandle && // Ensure there are enough candles
        fourthCandle[1] > fourthCandle[4] && // Long bearish candle
        thirdCandle[1] < thirdCandle[4] && // Series of small bullish/neutral candles
        previousCandle[1] < previousCandle[4] &&
        currentCandle[1] > currentCandle[4] && // Long bearish candle
        currentCandle[4] < fourthCandle[4] // Close below the first bearish candle's close
    ) {
        return 'fallingThreeMethods';
    }

    return 'noPattern';
}

/**
 * Calculate Stochastic RSI
 * @param {*} data
 */
function calculateStochasticRSI(data) {
    if (!data || data.length === 0) {
        return null;
    }

    const input = {
        values: data,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
    };

    const stochRSI = StochasticRSI.calculate(input);
    const lastStochRSI = stochRSI[stochRSI.length - 1];

    if (lastStochRSI.k < 10) {
        return 'Oversold';
    } else if (lastStochRSI.k > 90) {
        return 'Overbought';
    } else {
        return 'Neutral';
    }
}


/**
 * Calculate support levels from historical prices
 * @param {*} closingPrices
 */
function calculateSupportLevels(closingPrices) {
    const supportLevels = [];
    let consecutiveTests = 0;
    let currentLevel = null;

    for (let i = 0; i < closingPrices.length - 1; i++) {
        const currentPrice = closingPrices[i];
        const nextPrice = closingPrices[i + 1];

        if (currentLevel === null) {
            currentLevel = currentPrice;
            consecutiveTests = 1;
        } else {
            if (nextPrice === currentLevel) {
                consecutiveTests++;
            } else {
                if (consecutiveTests >= 3) {  // If the price tests the same level multiple times
                    supportLevels.push(currentLevel);  // It's identified as a support level
                }
                currentLevel = null;
                consecutiveTests = 0;
            }
        }
    }

    return supportLevels;
}


/**
 * Calculate resistance levels from historical prices
 * @param {*} closingPrices
 */
function calculateResistanceLevels(closingPrices) {
    const resistanceLevels = [];
    let consecutiveTests = 0;
    let currentLevel = null;

    for (let i = 0; i < closingPrices.length - 1; i++) {
        const currentPrice = closingPrices[i];
        const nextPrice = closingPrices[i + 1];

        if (currentLevel === null) {
            currentLevel = currentPrice;
            consecutiveTests = 1;
        } else {
            if (nextPrice === currentLevel) {
                consecutiveTests++;
            } else {
                if (consecutiveTests >= 2) {
                    resistanceLevels.push(currentLevel);
                }
                currentLevel = null;
                consecutiveTests = 0;
            }
        }
    }

    return resistanceLevels;
}


/**
 * Integrating MACD, EMA, and Trend Analysis in decision making
 * @param {*} lastPrice
 * @param {*} lastMA100
 * @param {*} lastMA50
 * @param {*} lastMA21
 * @param {*} lastEMA50
 * @param {*} lastEMA21
 * @param {*} macdSignal
 * @param {*} lastRSI
 * @param {*} lastCandlestickPattern
 * @param {*} lastStochasticRSI
 * @param {*} spotLevels
 * @param {*} resistanceLevels
 */
const getTradeDecision = (
    lastPrice,
    lastMA100,
    lastMA50,
    lastMA21,
    lastEMA50,
    lastEMA21,
    macdSignal,
    lastRSI,
    lastCandlestickPattern,
    lastStochasticRSI,
    spotLevels,
    resistanceLevels
) => {
    let buySignals = 0;
    let sellSignals = 0;

    // Ensure all inputs are available
    if (
        lastPrice !== undefined &&
        lastMA100 !== undefined &&
        lastMA50 !== undefined &&
        lastMA21 !== undefined &&
        lastEMA50 !== undefined &&
        lastEMA21 !== undefined &&
        macdSignal !== undefined &&
        lastRSI !== undefined &&
        lastCandlestickPattern !== undefined &&
        lastStochasticRSI !== undefined &&
        spotLevels !== undefined &&
        resistanceLevels !== undefined
    ) {
        // Analyze Trend Direction
        const isUptrend = lastPrice > lastMA100 && lastRSI > 50 && macdSignal.histogram > 0;
        const isDowntrend = lastPrice < lastMA100 && lastRSI < 50 && macdSignal.histogram < 0;

        // Decision based on Trend Direction
        if (isUptrend) {
            buySignals++;  // Reinforce buy signals
        }
        if (isDowntrend) {
            sellSignals++; // Reinforce sell signals
        }

        // Adjust Indicators Based on Trend
        const trendWeight = isUptrend ? 1.5 : isDowntrend ? 0.5 : 1;

        // Decision based on SMA (Weighted by trend)
        if (lastMA100 < lastMA50 && lastMA21 < lastMA50) {
            buySignals += trendWeight;
        }
        if (lastMA100 > lastMA50 && lastMA21 > lastMA50) {
            sellSignals += trendWeight;
        }

        // Decision based on EMA (Weighted by trend)
        if (lastEMA21 > lastEMA50) {
            buySignals += trendWeight;
        } else if (lastEMA21 < lastEMA50) {
            sellSignals += trendWeight;
        }

        // Decision based on MACD (Weighted by trend)
        if (macdSignal.histogram > 0) {
            buySignals += trendWeight;
        } else if (macdSignal.histogram < 0) {
            sellSignals += trendWeight;
        }

        // Decision based on Candlestick Patterns (Weighted by trend)
        if (
            lastCandlestickPattern === 'bullishEngulfing' ||
            lastCandlestickPattern === 'morningStar' ||
            lastCandlestickPattern === 'piercingLine' ||
            lastCandlestickPattern === 'threeWhiteSoldiers' ||
            lastCandlestickPattern === 'risingThreeMethods'
        ) {
            buySignals += trendWeight;
        }

        if (
            lastCandlestickPattern === 'bearishEngulfing' ||
            lastCandlestickPattern === 'shootingStar' ||
            lastCandlestickPattern === 'eveningStar' ||
            lastCandlestickPattern === 'threeBlackCrows' ||
            lastCandlestickPattern === 'fallingThreeMethods'
        ) {
            sellSignals += trendWeight;
        }

        // Decision based on Stochastic RSI (Weighted by trend)
        if (lastStochasticRSI === 'Oversold') {
            buySignals += trendWeight;
        }
        if (lastStochasticRSI === 'Overbought') {
            sellSignals += trendWeight;
        }

        // Decision based on Spot Levels (Weighted by trend)
        if (spotLevels.length >= 3) {
            buySignals += trendWeight;
        }

        // Decision based on Resistance Levels (Weighted by trend)
        if (resistanceLevels.length >= 3) {
            sellSignals += trendWeight;
        }
    }

    // Determine final decision based on the number of buy and sell signals
    if (buySignals > sellSignals) {
        return 'Buy';
    } else if (sellSignals > buySignals) {
        return 'Sell';
    } else {
        return 'Hold';
    }

};




/**
 * Get Binance Futures Account Information
 */
async function getAccountInfoFromBinance(apiKey, apiSecretKey) {
    try {
        const endpoint = 'https://fapi.binance.com/fapi/v2/account';
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto.createHmac('sha256', apiSecretKey)
            .update(queryString)
            .digest('hex');

        const url = `${endpoint}?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url); // Log the URL being requested
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        if (!response.ok) {
            console.log(response, "===here is the response ===")
            console.log("=========apiKey=", apiKey, "====", apiSecretKey)
            throw new Error(`Error fetching account info: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Check if data.assets exists and is not empty
        if (!data || !data.assets || data.assets.length === 0) {
            console.log("insufficient balance))))))))))))))))))")
            throw new Error('Account data is empty or unavailable');
        }

        // Find the USDT balance
        const usdtBalance = data.assets?.find(asset => asset.asset === 'USDT');
        if (!usdtBalance) {
            throw new Error('USDT balance not found in account data');
        }
        return usdtBalance;
    } catch (error) {
        console.error('Error fetching account information:', error);
        throw error;
    }
}

/**
 * Set API keys for the connected exchange
 */
app.post('/api/set-api-keys', async (req, res) => {
    try {
        const { exchangeType, apiKey, apiSecretKey } = req.body;
        if (!exchangeType || !apiKey || !apiSecretKey) {
            throw new Error('Exchange type, API key, or API secret key not provided');
        }

        // Ensure the exchangeType is consistent with the client-side
        const formattedExchangeType = exchangeType === 'binancefutures' ? 'binancefutures' : 'binance';

        // Store the API keys
        exchangeApiKeys[formattedExchangeType] = { apiKey, apiSecretKey };

        res.json({ success: true, message: 'API keys set successfully', accountId: generateAccountId() });
    } catch (error) {
        console.error('Error setting API keys:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * Get API keys for the connected exchange
 */
app.get('/api/get-api-keys/:exchangeType', (req, res) => {
    try {
        const { exchangeType } = req.params;
        if (!exchangeType || !exchangeApiKeys[exchangeType]) {
            throw new Error('API keys not found for the specified exchange');
        }
        const { apiKey, apiSecretKey } = exchangeApiKeys[exchangeType];
        res.json({ apiKey, apiSecretKey });
    } catch (error) {
        console.error('Error getting API keys:', error);
        res.status(400).json({ error: error.message });
    }
});


/**
 * Calculate and return the trading decision
 */
app.get('/api/trade-decision', async (req, res) => {
    try {
        const symbol = req.query.symbol; // Retrieve symbol from query parameter
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol not provided' });
        }

        // Fetch 100 historical data points (e.g., 15-minute intervals)
        const historicalPrices = await getHistoricalPrices(symbol, 100);
        const closingPrices = historicalPrices.map(price => parseFloat(price[4]));

        // Extract the latest price
        const lastPrice = closingPrices[closingPrices.length - 1];

        // Calculate Moving Averages
        const lastMA100 = calculateMovingAverage(closingPrices, 100);
        const lastMA50 = calculateMovingAverage(closingPrices, 50);
        const lastMA21 = calculateMovingAverage(closingPrices, 21);

        // Calculate EMA
        const lastEMA50 = calculateEMA(closingPrices, 50);
        const lastEMA21 = calculateEMA(closingPrices, 21);

        // Calculate MACD
        const macdSignal = calculateMACD(closingPrices);

        // Calculate RSI
        const lastRSI = calculateRSI(closingPrices, 14); // RSI with a 14-period window

        // Identify Candlestick Pattern
        const lastCandlestickPattern = identifyCandlestickPattern(historicalPrices);

        // Calculate Stochastic RSI
        const lastStochasticRSI = calculateStochasticRSI(closingPrices);

        // Calculate Support and Resistance Levels
        const spotLevels = calculateSupportLevels(closingPrices); // Replace with appropriate function
        const resistanceLevels = calculateResistanceLevels(closingPrices);

        // Get Trade Decision
        const decision = getTradeDecision(
            lastPrice,
            lastMA100,
            lastMA50,
            lastMA21,
            lastEMA50[lastEMA50.length - 1], // Use the most recent EMA value
            lastEMA21[lastEMA21.length - 1], // Use the most recent EMA value
            macdSignal[macdSignal.length - 1], // Most recent MACD signal
            lastRSI[lastRSI.length - 1], // Use the most recent RSI value
            lastCandlestickPattern,
            lastStochasticRSI,
            spotLevels,
            resistanceLevels
        );

        // Log details for debugging
        console.log({
            lastPrice,
            lastMA100,
            lastMA50,
            lastMA21,
            lastEMA50: lastEMA50[lastEMA50.length - 1],
            lastEMA21: lastEMA21[lastEMA21.length - 1],
            macdSignal: macdSignal[macdSignal.length - 1],
            lastRSI: lastRSI[lastRSI.length - 1],
            lastCandlestickPattern,
            lastStochasticRSI,
            spotLevels,
            resistanceLevels,
            decision
        });

        // Send the decision back in response
        res.json({ decision });
    } catch (error) {
        console.error('Error fetching trading decision:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



/**
 * Get Binance Futures USDT Balance
 */
app.get('/api/usdt-balance', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecretKey = req.headers['x-api-secret-key'];

        if (!apiKey || !apiSecretKey) {
            throw new Error('API key or secret not provided');
        }

        const usdtBalance = await getAccountInfoFromBinance(apiKey, apiSecretKey);
        res.json({ usdtBalance });
    } catch (error) {
        console.error('Error fetching USDT balance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch position info from Binance account
async function fetchPositionInfo(symbol, apiKey, apiSecretKey) {
    try {
        const queryString = `timestamp=${Date.now()}&symbol=${symbol}`;
        const signature = crypto.createHmac('sha256', apiSecretKey).update(queryString).digest('hex');
        const url = `https://fapi.binance.com/fapi/v2/positionRisk?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url);

        const positionFetch = await fetch(url, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });
        if (!positionFetch.ok) {
            throw new Error('Failed to fetch position info');
        }

        const positionData = await positionFetch.json();
        const positionInfo = positionData.find(position => position.symbol === symbol);
        if (!positionInfo) {
            throw new Error('Position info not found');
        }

        return positionInfo;
    } catch (error) {
        console.error('Error fetching position info:', error);
        throw new Error('Failed to fetch position info');
    }
}

// Execute a trade on Binance with trailing stop order
async function executeTrade(apiKey, apiSecretKey, symbol, decision, lastPrice, availableUSDT) {
    try {
        if (!apiKey || !apiSecretKey || !symbol || !decision || !lastPrice || isNaN(lastPrice) || !availableUSDT || isNaN(availableUSDT)) {
            throw new Error('Invalid input parameters');
        }

        // Helper function to fetch Binance server time
        async function getServerTime() {
            const serverTimeResponse = await fetch('https://fapi.binance.com/fapi/v1/time');
            if (!serverTimeResponse.ok) {
                throw new Error('Failed to fetch Binance server time');
            }
            const serverTimeData = await serverTimeResponse.json();
            return serverTimeData.serverTime;
        }

        // Step 1: Fetch Binance server time
        let serverTime = await getServerTime();

        const action = decision === 'Buy' ? 'BUY' : 'SELL';
        const url = `https://fapi.binance.com/fapi/v1/order`;

        // Step 2: Fetch asset precision from Binance API
        const assetInfoResponse = await fetch(`https://fapi.binance.com/fapi/v1/exchangeInfo`);
        if (!assetInfoResponse.ok) {
            throw new Error('Failed to fetch asset information from Binance API');
        }
        const assetInfo = await assetInfoResponse.json();
        const symbolInfo = assetInfo.symbols.find(asset => asset.symbol === symbol);
        const quantityPrecision = symbolInfo ? symbolInfo.quantityPrecision : 8;
        const pricePrecision = symbolInfo ? symbolInfo.pricePrecision : 8;

        // Calculate the quantity based on available USDT balance
        let adjustedQuantity = (availableUSDT / lastPrice).toFixed(quantityPrecision);
        adjustedQuantity = parseFloat(adjustedQuantity);
        if (isNaN(adjustedQuantity) || adjustedQuantity <= 0) {
            throw new Error('Quantity is not a valid positive number');
        }

        // Step 3: Set leverage to 1x if not already set
        const leverageUrl = 'https://fapi.binance.com/fapi/v1/leverage';
        const leverageParams = {
            symbol,
            leverage: 1,
            timestamp: serverTime
        };

        const leverageQueryString = Object.entries(leverageParams).map(([key, value]) => `${key}=${value}`).join('&');
        const leverageSignature = crypto.createHmac('sha256', apiSecretKey).update(leverageQueryString).digest('hex');

        const leverageResponse = await fetch(`${leverageUrl}?${leverageQueryString}&signature=${leverageSignature}`, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        const leverageData = await leverageResponse.json();
        if (!leverageResponse.ok) {
            console.error('Binance API error response:', leverageData);
            throw new Error(`Failed to set leverage: ${leverageData.msg || 'Unknown error'}`);
        }

        console.log('Leverage set to 1x:', leverageData);

        // Step 4: Place the Market Order
        serverTime = await getServerTime(); // Re-fetch server time
        const marketOrderParams = {
            symbol,
            side: action,
            type: 'MARKET',
            quantity: adjustedQuantity,
            timestamp: serverTime,
        };

        const marketOrderQueryString = Object.entries(marketOrderParams).map(([key, value]) => `${key}=${value}`).join('&');
        const marketOrderSignature = crypto.createHmac('sha256', apiSecretKey).update(marketOrderQueryString).digest('hex');

        const marketOrderResponse = await fetch(`${url}?${marketOrderQueryString}&signature=${marketOrderSignature}`, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        const marketOrderData = await marketOrderResponse.json();
        if (!marketOrderResponse.ok) {
            console.error('Binance API error response:', marketOrderData);
            throw new Error(`Failed to execute market ${action.toLowerCase()} order: ${marketOrderData.msg || 'Unknown error'}`);
        }

        console.log('Market order executed:', marketOrderData);

        // Step 5: Set the Trailing Stop-Market Order
        serverTime = await getServerTime(); // Re-fetch server time
        const callbackRate = 2; // 2% callback rate

        let activationPrice;
        if (action === 'BUY') {
            activationPrice = lastPrice * 1.02; // 2% higher for long positions
        } else {
            activationPrice = lastPrice * 0.98; // 2% lower for short positions
        }

        const trailingStopParams = {
            symbol,
            side: action === 'BUY' ? 'SELL' : 'BUY',
            type: 'TRAILING_STOP_MARKET',
            quantity: adjustedQuantity,
            callbackRate,
            reduceOnly: true,
            activationPrice: activationPrice.toFixed(pricePrecision),
            timestamp: serverTime,
        };

        const trailingStopQueryString = Object.entries(trailingStopParams).map(([key, value]) => `${key}=${value}`).join('&');
        const trailingStopSignature = crypto.createHmac('sha256', apiSecretKey).update(trailingStopQueryString).digest('hex');

        const trailingStopResponse = await fetch(`${url}?${trailingStopQueryString}&signature=${trailingStopSignature}`, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        const trailingStopData = await trailingStopResponse.json();
        if (!trailingStopResponse.ok) {
            console.error('Binance API error response:', trailingStopData);
            throw new Error(`Failed to set trailing stop order: ${trailingStopData.msg || 'Unknown error'}`);
        }

        console.log('Trailing stop order set:', trailingStopData);

        // Step 6: Set the Stop-Loss Order
        serverTime = await getServerTime(); // Re-fetch server time

        let stopLossPrice;
        if (action === 'BUY') {
            stopLossPrice = lastPrice * 0.95; // 5% below for long positions
        } else {
            stopLossPrice = lastPrice * 1.05; // 5% above for short positions
        }

        stopLossPrice = parseFloat(stopLossPrice.toFixed(pricePrecision));

        if (isNaN(stopLossPrice) || stopLossPrice <= 0) {
            throw new Error('Calculated stop-loss price is invalid.');
        }

        console.log(`Calculated stop-loss price for ${symbol}: ${stopLossPrice}`);

        const stopLossParams = {
            symbol,
            side: action === 'BUY' ? 'SELL' : 'BUY',
            type: 'STOP_MARKET',
            quantity: adjustedQuantity,
            reduceOnly: true,
            stopPrice: stopLossPrice,
            timestamp: serverTime,
        };

        const stopLossQueryString = Object.entries(stopLossParams).map(([key, value]) => `${key}=${value}`).join('&');
        const stopLossSignature = crypto.createHmac('sha256', apiSecretKey).update(stopLossQueryString).digest('hex');

        const stopLossResponse = await fetch(`${url}?${stopLossQueryString}&signature=${stopLossSignature}`, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        const stopLossData = await stopLossResponse.json();
        if (!stopLossResponse.ok) {
            console.error('Binance API error response:', stopLossData);
            throw new Error(`Failed to set stop-loss order: ${stopLossData.msg || 'Unknown error'}`);
        }

        console.log('Stop-loss order set:', stopLossData);

        // Return the combined response for market, trailing stop, and stop-loss orders
        return {
            leverage: leverageData,
            marketOrder: marketOrderData,
            trailingStopOrder: trailingStopData,
            stopLossOrder: stopLossData
        };

    } catch (error) {
        console.error('Error executing trade:', error.message);
        throw new Error('Failed to execute trade');
    }
}



// Execute a trade based on the trading decision
app.post('/api/execute-trade', async (req, res) => {
    try {
        const { apiKey, apiSecretKey, symbol } = req.body; // Retrieve symbol from request body
        if (!apiKey || !apiSecretKey || !symbol) {
            throw new Error('API key, secret, or symbol not provided');
        }

        const decisionResponse = await fetch(`http://localhost:8001/api/trade-decision?symbol=${symbol}`); // Pass symbol to the trade-decision endpoint
        if (!decisionResponse.ok) {
            throw new Error('Failed to fetch trading decision');
        }
        const { decision } = await decisionResponse.json();

        console.log(`Trade Decision: ${decision}`);
        // If decision is Hold, do not execute a trade
        if (decision === 'Hold') {
            return res.json({ message: 'No trade executed. Decision is to Hold.' });
        }

        const lastPriceResponse = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`); // Fetch last price based on symbol
        if (!lastPriceResponse.ok) {
            throw new Error('Failed to fetch last price from Binance API');
        }
        const { price: lastPrice } = await lastPriceResponse.json();

        // Fetch account information to get the available USDT balance
        const accountInfo = await getAccountInfoFromBinance(apiKey, apiSecretKey);
        const availableUSDT = parseFloat(accountInfo.availableBalance);
        console.log('Available USDT:', availableUSDT); // Log the available USDT

        if (availableUSDT <= 0) {
            return res.json({ message: 'Insufficient funds for trading' });
        }

        // Execute trade based on the decision and provided symbol
        const tradeResponse = await executeTrade(apiKey, apiSecretKey, symbol, decision, parseFloat(lastPrice), availableUSDT);
        res.json({ tradeResponse });
    } catch (error) {
        console.error('Error executing trade:', error.message);
        res.status(500).json({ error: error });
    }
});



// Generate a random account ID
function generateAccountId() {
    return Math.floor(1000 + Math.random() * 9000);
}
const activeTrades = {};

// Schedule a job to execute trade and monitor it
async function scheduleJob() {
    try {
        console.log('Scheduling trade monitoring...');

        if (!exchangeApiKeys['binancefutures'] || !exchangeApiKeys['binancefutures'].apiKey || !exchangeApiKeys['binancefutures'].apiSecretKey) {
            throw new Error('API keys for Binance Futures are not set');
        }

        const { apiKey, apiSecretKey } = exchangeApiKeys['binancefutures'];
        const decisionResponse = await fetch('http://localhost:8000/api/execute-trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, apiSecretKey }),
        });

        if (!decisionResponse.ok) {
            throw new Error('Failed to execute trade');
        }

        const { tradeResponse } = await decisionResponse.json();
        console.log('Trade executed successfully:', tradeResponse);

        // Assuming the tradeResponse contains the necessary data
        const { symbol, quantity, decision, lastPrice } = tradeResponse;

        // Fetch asset precision from Binance API
        const assetInfoResponse = await fetch(`https://fapi.binance.com/fapi/v1/exchangeInfo`);
        if (!assetInfoResponse.ok) {
            throw new Error('Failed to fetch asset information from Binance API');
        }
        const assetInfo = await assetInfoResponse.json();
        const symbolInfo = assetInfo.symbols.find(asset => asset.symbol === symbol);
        const precision = symbolInfo ? symbolInfo.pricePrecision : 8; // Default precision if not found

        // Calculate Take Profit and Stop Loss prices
        const takeProfitPrice = parseFloat((decision === 'Buy' ? lastPrice * 1.07 : lastPrice * 0.93).toFixed(precision)); // Take profit at +7%, stop loss at -2%
        const stopLossPrice = parseFloat((decision === 'Buy' ? lastPrice * 0.98 : lastPrice * 1.02).toFixed(precision));

        // Store active trade
        activeTrades[symbol] = { apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice };

        // Start monitoring the trade
        monitorTrade(symbol, apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice);
    } catch (error) {
        console.error('Error scheduling job:', error);
    }
}

// Function to get the last price of a symbol
async function getLastPrice(symbol) {
    const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
        throw new Error('Failed to fetch last price from Binance API');
    }
    const { price } = await response.json();
    return parseFloat(price);
}

// Monitor active trades for take profit or stop loss conditions
async function monitorActiveTrades() {
    try {
        console.log('Monitoring active trades for take profit or stop loss...');

        for (const [symbol, trade] of Object.entries(activeTrades)) {
            const { apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice } = trade;
            const currentPrice = await getLastPrice(symbol);

            if ((decision === 'Buy' && (currentPrice >= takeProfitPrice || currentPrice <= stopLossPrice)) ||
                (decision === 'Sell' && (currentPrice <= takeProfitPrice || currentPrice >= stopLossPrice))) {
                console.log(`Take profit or stop loss condition met for ${symbol}. Closing position.`);
                await executeTrade(apiKey, apiSecretKey, symbol, decision, currentPrice, quantity);
                delete activeTrades[symbol]; // Remove trade from activeTrades
            }
        }
    } catch (error) {
        console.error('Error monitoring active trades:', error);
    }
}

// Schedule monitoring of active trades
setInterval(monitorActiveTrades, 60000); // Check every minute

// Function to start monitoring the trade
function monitorTrade(symbol, apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice) {
    // This function will run in the background to monitor the trade
    console.log(`Started monitoring trade for ${symbol}`);
}



module.exports = app;