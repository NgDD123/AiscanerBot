const express = require('express');
const morgan = require('morgan');
const fetch = require('node-fetch');
require("dotenv").config()
const crypto = require('crypto');
const { ATR } = require('technicalindicators');
const { EMA, RSI, ADX, BollingerBands} = require('technicalindicators');
require('dotenv').config();
const cors = require('cors');
const schedule = require('node-schedule');
// const paymentRouter = require('./Routes/payment');
const paymentRouter = require('./Routes/payment2.route');
const userRouter = require('./Routes/user.route');
const paymentsFetcherCron = require('./config/paymentsFetcherCron');
const { initFirebase } = require('./firebase');
const usersFetcherCron = require('./config/usersFetcherCron');
const mailRoute = require('./Routes/mail.route');
const blogRoute = require('./Routes/blog.route');
const logger = require("./utils/util.logger");
const SendMailMessage = require("./services/sendMail.svc");
const loggerFormat = require("./utils/logger-format");
const requestLogger = require("./utils/request-logger");
const { getBinanceBaseUrl } = require('./Routes/binanceConfig');
const bestpairRoute = require ('./Routes/bestPair')
const evaluateStrategyRoute = require ('./Routes/evaluateStrategy')
const toppairsRoute = require ('./Routes/topPairs')
const { evaluateStrategy } = require('./models/strategyEvaluator'); 
const chartRoutes = require('./Routes/chartData');
const { executeTrade } = require('./models/trade.model'); // NEW: separate executeTrade
const { getAdvancedMarketMakers } = require('./models/marketMakers');

// different logger instances

const tradingLogger = logger("/trading");
const userLogger = logger("/admin/users");

const app = express();

app.use(express.urlencoded({ extended: true }));
//init fireabse
// initFirebase()

// Enable CORS
app.use(cors({ origin: "*" }));

// Parse JSON bodies
app.use(express.json());

app.use(morgan('dev'));
app.use(morgan(loggerFormat, { stream: requestLogger.stream }));
app.get('/api/health', (req, res) => {
    res.send('OK');
  });
  
app.use('/payment', paymentRouter);
app.use('/user', userRouter);
app.use('/contacts', mailRoute);
app.use('/blogs', blogRoute);
app.use('/api/top-pairs', toppairsRoute);
app.use('/evaluatestarategy', evaluateStrategyRoute )
app.use('/api/best-pair', bestpairRoute )
app.use('/api/chart-data', chartRoutes);

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

// Helper: normalize exchange type string
function normalizeExchangeType(exchangeType) {
    if (!exchangeType) return null;
    const type = exchangeType.toLowerCase();
    if (type === 'binancefutures') return 'binancefutures';
    if (type === 'binancefuturestestnet' || type === 'binancetestnet') return 'binancefuturestestnet';
    if (type === 'binance') return 'binance';
    throw new Error('Invalid exchange type provided');
}


app.get('/api/trade-decision', async (req, res) => {
    try {
        const symbol = req.query.symbol;
        const exchangeType = req.headers['x-exchange-type']?.toLowerCase() || 'binancefutures';

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol not provided' });
        }

        // 1️⃣ Strategy signals
        const strategyResult = await evaluateStrategy(symbol);
        console.log("[DEBUG] Strategy Result:", strategyResult);

        // 2️⃣ Market maker strong levels (support / resistance)
        const {
            strongSupport,
            strongResistance
        } = await getAdvancedMarketMakers(symbol, 1000, exchangeType);

        console.log("[DEBUG] Market Maker Levels:", {
            strongSupport: strongSupport?.price,
            strongResistance: strongResistance?.price
        });

        // 3️⃣ Decision logic
        let decision = "Hold";
        if (strategyResult.signal === "BUY") decision = "Buy";
        if (strategyResult.signal === "SELL") decision = "Sell";

        tradingLogger.info(
            `Trade decision fetched successfully | Decision: ${decision} | Signal: ${strategyResult.signal}`
        );

        // 4️⃣ Send FULL response including strong levels
        return res.json({
            decision,
            signalDetails: strategyResult,
            strongSupport: strongSupport?.price || null,
            strongResistance: strongResistance?.price || null
        });

    } catch (error) {
        console.log("Error calculating trade decision:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



/**
 * Get Binance Futures Account Information
 */
async function getAccountInfoFromBinance(apiKey, apiSecretKey, exchangeType) {
    try {
        const baseUrl = getBinanceBaseUrl(exchangeType);
        let endpoint;

        if (exchangeType === 'binancefuturestestnet' || exchangeType === 'binancefutures') {
            endpoint = `${baseUrl}/fapi/v2/account`; // Futures account endpoint
        } else if (exchangeType === 'binance') {
            endpoint = `${baseUrl}/api/v3/account`; // Spot account endpoint
        } else {
            throw new Error('Unsupported exchange type');
        }

        const timestamp = Date.now();
        const queryString = `recvWindow=5000&timestamp=${timestamp}`; // Added recvWindow
        const signature = crypto.createHmac('sha256', apiSecretKey)
            .update(queryString)
            .digest('hex');

        const url = `${endpoint}?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error('Binance API error response:', responseText);
            throw new Error(`Error fetching account info: ${response.status} ${response.statusText} - ${responseText}`);
        }

        const data = JSON.parse(responseText);

        let usdtBalance;

        if (exchangeType === 'binancefuturestestnet' || exchangeType === 'binancefutures') {
            if (!data || !data.assets || data.assets.length === 0) {
                throw new Error('Account data is empty or unavailable');
            }

            usdtBalance = data.assets.find(asset => asset.asset === 'USDT');
        } else if (exchangeType === 'binance') {
            if (!data || !data.balances || data.balances.length === 0) {
                throw new Error('Account data is empty or unavailable');
            }

            usdtBalance = data.balances.find(balance => balance.asset === 'USDT');
        }

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

        // Normalize exchange types to include binance, binancefutures, and binancetestnet
        let formattedExchangeType;

        if (exchangeType.toLowerCase() === 'binancefutures') {
            formattedExchangeType = 'binancefutures';
        } else if (exchangeType.toLowerCase() === 'binancefuturestestnet' || exchangeType.toLowerCase() === 'binancetestnet') {
            formattedExchangeType = 'binancefuturestestnet';
        } else if (exchangeType.toLowerCase() === 'binance') {
            formattedExchangeType = 'binance';
        } else {
            throw new Error('Invalid exchange type provided');
        }

        // Store the API keys under the formatted exchange type
        exchangeApiKeys[formattedExchangeType] = { apiKey, apiSecretKey };

        // Return the formatted exchange type to the frontend for correct future requests
        res.json({ 
            success: true, 
            message: 'API keys set successfully', 
            accountId: generateAccountId(),
            exchangeType: formattedExchangeType  // Send it back for consistent future use
        });
    } catch (error) {
        console.error('Error setting API keys:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * Get Binance Futures USDT Balance
 */
app.get('/api/usdt-balance', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecretKey = req.headers['x-api-secret-key'];
        let exchangeType = req.headers['x-exchange-type'];

        if (!apiKey || !apiSecretKey || !exchangeType) {
            throw new Error('API key, secret, or exchange type not provided');
        }

        // Normalize exchangeType (make it lowercase to handle inconsistent casing from frontend)
        exchangeType = exchangeType.toLowerCase();

        if (exchangeType === 'binancefutures') {
            exchangeType = 'binancefutures';
        } else if (exchangeType === 'binancefuturestestnet' || exchangeType === 'binancefuturestestnet') {
            exchangeType = 'binancefuturestestnet';
        } else if (exchangeType === 'binance') {
            exchangeType = 'binance';
        } else {
            throw new Error('Invalid exchange type provided');
        }

        const usdtBalance = await getAccountInfoFromBinance(apiKey, apiSecretKey, exchangeType);
        res.json({ usdtBalance });
    } catch (error) {
        console.error('Error fetching USDT balance:', error);
        res.status(500).json({ error: error.message });
    }
});


// Fetch position info from Binance account
async function fetchPositionInfo(symbol, apiKey, apiSecretKey, exchangeType) {
    try {
        const baseUrl = getBinanceBaseUrl(exchangeType);
        const queryString = `timestamp=${Date.now()}&symbol=${symbol}`;
        const signature = crypto.createHmac('sha256', apiSecretKey).update(queryString).digest('hex');
        const url = `${baseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`;
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

async function getOpenOrders(apiKey, apiSecretKey, exchangeType) {
    try {
        const baseUrl = getBinanceBaseUrl(exchangeType);
        const endpoint = `${baseUrl}/fapi/v1/openOrders`;
        const queryString = `timestamp=${Date.now()}`;
        const signature = crypto.createHmac('sha256', apiSecretKey).update(queryString).digest('hex');
        const url = `${endpoint}?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from Binance:', errorText);
            throw new Error(`Failed to fetch open orders: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching open orders:', error.message);
        throw new Error('Failed to fetch open orders');
    }
}
// routes/openOrdersRoute.js or inside app.js if not modularized

app.get('/api/open-orders', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecretKey = req.headers['x-api-secret-key'];
    const exchangeType = req.headers['x-exchange-type'];

    if (!apiKey || !apiSecretKey || !exchangeType) {
      return res.status(400).json({ error: 'API key, secret, and exchange type must be provided in headers' });
    }

    const normalizedExchangeType = normalizeExchangeType(exchangeType);
    const openOrders = await getOpenOrders(apiKey, apiSecretKey, normalizedExchangeType);

    res.json({ openOrders });
  } catch (error) {
    console.error('Error fetching open orders:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// Function to close all open orders
async function closeAllOpenOrders(apiKey, apiSecretKey, exchangeType, symbol) {
    try {
        if (!symbol) throw new Error('Symbol is required');

        const baseUrl = getBinanceBaseUrl(exchangeType);
        const timestamp = Date.now();
        const queryString = `symbol=${symbol}&timestamp=${timestamp}`;
        const signature = crypto.createHmac('sha256', apiSecretKey)
            .update(queryString)
            .digest('hex');

        const url = `${baseUrl}/fapi/v1/allOpenOrders?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'X-MBX-APIKEY': apiKey,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error closing all open orders:', errorText);
            throw new Error(`Failed to close all open orders: ${response.status} ${response.statusText}`);
        }

        const responseBody = await response.json();
        return responseBody;
    } catch (error) {
        console.error('Error in closeAllOpenOrders:', error.message);
        throw new Error('Failed to close all open orders');
    }
}

// API Route for Closing All Open Orders
app.delete('/api/close-all-open-orders', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecretKey = req.headers['x-api-secret-key'];
        const exchangeType = normalizeExchangeType(req.headers['x-exchange-type']);
        const symbol = req.query.symbol;

        if (!apiKey || !apiSecretKey || !exchangeType) {
            return res.status(400).json({
                status: 'error',
                message: 'API key, secret, and exchange type must be provided in the headers'
            });
        }

        const result = await closeAllOpenOrders(apiKey, apiSecretKey, exchangeType, symbol);
        res.status(200).json({
            status: 'success',
            message: 'All open orders closed successfully.',
            data: result
        });
    } catch (error) {
        console.error('Error in /api/close-all-open-orders:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});


async function getOpenPositions(apiKey, apiSecretKey, exchangeType) {
    try {
        const baseUrl = getBinanceBaseUrl(exchangeType);
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto.createHmac('sha256', apiSecretKey).update(queryString).digest('hex');
        const url = `${baseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`;
        console.log("Requesting URL:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from Binance:', errorText);
            throw new Error(`Failed to fetch open positions: ${response.status} ${response.statusText}`);
        }

        const positionData = await response.json();
        const openPositions = positionData.filter(position => parseFloat(position.positionAmt) !== 0);

        return openPositions;
    } catch (error) {
        console.error('Error fetching open positions:', error.message);
        throw new Error('Failed to fetch open position');
    }
}


// Function to notify user about new open position
async function notifyUserAboutPosition(userEmail, orderDetails, stopLossPrice, activationPrice) {
    try {
        const subject = `New Open Position Alert: ${position.symbol}`;
        const body = `
            Your market order has been executed and position is now open:
            Symbol: ${orderDetails.symbol}
            Entry Price: ${orderDetails.entryPrice}
            Position Size: ${orderDetails.positionAmt}
            Position Side: ${orderDetails.positionSide}
            Unrealized PNL: ${orderDetails.unRealizedProfit}
            Quantity: ${orderDetails.executedQty}
            Stop Loss Price: ${stopLossPrice}
            Activation Price: ${activationPrice}
        `;

        await SendMailMessage({ email: userEmail, subject, body });
        tradingLogger.info(`Email notification sent to ${userEmail} for position ${orderDetails.symbol}`);
    } catch (error) {
        tradingLogger.error(`Failed to send email notification: ${error}`);
    }
}
app.get('/api/open-positions', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecretKey = req.headers['x-api-secret-key'];
        const exchangeType = req.headers['x-exchange-type'];

        if (!apiKey || !apiSecretKey || !exchangeType) {
            return res.status(400).json({ error: 'API key, secret, and exchange type must be provided in headers' });
        }

        const normalizedExchangeType = normalizeExchangeType(exchangeType);
        const openPositions = await getOpenPositions(apiKey, apiSecretKey, normalizedExchangeType);

        res.json({ openPositions });
    } catch (error) {
        console.error('Error fetching open positions:', error.message);
        res.status(500).json({ error: error.message });
    }
});


// Function to close a specific open position
async function closePosition(symbol, apiKey, apiSecretKey, exchangeType) {
    try {
        // Step 1: Get current position
        const baseUrl = getBinanceBaseUrl(exchangeType);
        const timestamp = Date.now();
        const query = `timestamp=${timestamp}`;
        const signature = sign(query, apiSecretKey);
        const positions = await fetch(`${baseUrl}/fapi/v2/positionRisk?${query}&signature=${signature}`, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        const positionsData = await positions.json();

        const position = positionsData.find(p => p.symbol === symbol);
        if (!position) throw new Error('Position not found');

        const quantity = Math.abs(parseFloat(position.positionAmt)); // always positive

        if (quantity === 0) {
            return { message: 'No open position to close.' };
        }

        // Step 2: Close position with market order
        const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY'; // if long -> sell, if short -> buy
        const closeQuery = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${Date.now()}`;
        const closeSignature = sign(closeQuery, apiSecretKey);

        const response = await fetch(`${baseUrl}/fapi/v1/order?${closeQuery}&signature=${closeSignature}`, {
            method: 'POST',
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error closing position:', errorText);
            throw new Error(`Failed to close position: ${response.status} ${response.statusText}`);
        }
        const responseBody = await response.json();
        console.log('Response Data:', responseBody);

        return responseBody;

    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

app.post('/api/close-position', async (req, res) => {
    try {
        const { symbol, positionSide } = req.body;
        const apiKey = req.headers['x-api-key'];
        const apiSecretKey = req.headers['x-api-secret-key'];
        const exchangeType = req.headers['x-exchange-type'];

        if (!apiKey || !apiSecretKey || !exchangeType || !symbol || !positionSide) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const baseUrl = getBinanceBaseUrl(exchangeType);
        const timestamp = Date.now();
        const query = `symbol=${symbol}&side=${positionSide === 'LONG' ? 'SELL' : 'BUY'}&type=MARKET&positionSide=${positionSide}&quantity=0.1&timestamp=${timestamp}`;
        const signature = sign(query, apiSecretKey);
        const url = `${baseUrl}/fapi/v1/order?${query}&signature=${signature}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to close position');
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in /api/close-position:', error.message);
        res.status(500).json({ error: error.message });
    }
});



// route:
app.post('/api/execute-trade', async (req, res) => {
  console.log("------ [DEBUG] /api/execute-trade ROUTE CALLED ------");

  try {
    const { apiKey, apiSecretKey, symbol, tradeDecision, options } = req.body;
    let { exchangeType, strongSupport, strongResistance } = req.body;
    const userEmail = req.headers['x-user-email'] || null;

    console.log("[DEBUG] Incoming Body:", { symbol, tradeDecision, strongSupport, strongResistance, options });
    console.log("[DEBUG] Incoming Headers: x-user-email =", userEmail);

    if (!apiKey || !apiSecretKey || !symbol || !exchangeType) {
      return res.status(400).json({ error: 'API key, secret, symbol, or exchange type not provided' });
    }

    if (!tradeDecision) return res.status(400).json({ error: 'tradeDecision is required (Buy / Sell / Hold)' });

    exchangeType = exchangeType.toLowerCase().trim();
    if (!['binance', 'binancefutures', 'binancefuturestestnet', 'binancetestnet'].includes(exchangeType)) {
      return res.status(400).json({ error: 'Invalid exchange type provided', received: exchangeType });
    }

    if (tradeDecision.toLowerCase() === 'hold') {
      console.log("[DEBUG] decision hold");
      return res.json({ message: 'No trade executed. Decision is Hold.' });
    }

    // Fetch last price
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const priceEndpoint = exchangeType.includes('futures')
      ? `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`
      : `${baseUrl}/api/v3/ticker/price?symbol=${symbol}`;

    const lastPriceResp = await fetch(priceEndpoint);
    if (!lastPriceResp.ok) return res.status(502).json({ error: 'Failed to fetch last price' });
    const { price: lastPrice } = await lastPriceResp.json();

    // Fetch account info
    const accountInfo = await getAccountInfoFromBinance(apiKey, apiSecretKey, exchangeType);
    const availableUSDT = parseFloat(exchangeType.includes('futures') ? accountInfo.availableBalance : accountInfo.free);
    if (!availableUSDT || availableUSDT <= 0) return res.status(400).json({ error: 'Insufficient funds', availableUSDT });

    if (!exchangeType.includes('futures')) {
      return res.status(400).json({ error: 'Spot trading not implemented. Use a futures exchangeType.' });
    }

    // ⚡ AUTO-FETCH STRONG SUPPORT/RESISTANCE if missing
    if (!strongSupport || !strongResistance) {
      console.log("[DEBUG] Missing support/resistance, fetching from market makers...");
      const marketData = await getAdvancedMarketMakers(symbol, 1000, exchangeType);
      strongSupport = marketData.strongSupport?.price ?? lastPrice;
      strongResistance = marketData.strongResistance?.price ?? lastPrice;
      console.log("[DEBUG] Auto-fetched strongSupport:", strongSupport, "strongResistance:", strongResistance);
    }

    console.log("[DEBUG] Calling executeTrade() engine...");
    const tradeResponse = await executeTrade(
      apiKey,
      apiSecretKey,
      symbol,
      tradeDecision,
      parseFloat(lastPrice),
      exchangeType,
      availableUSDT,
      userEmail,
      strongSupport,
      strongResistance,
      3,
      options ?? {}
    );

    console.log("[DEBUG] Trade Response:", tradeResponse);

    return res.json({ success: true, tradeResponse });

  } catch (err) {
    console.error("[FATAL ERROR] /api/execute-trade crashed:", err.message);
    return res.status(500).json({ error: err.message, stack: err.stack });
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
        const decisionResponse = await fetch('http://localhost:8001/api/execute-trade', {
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
        const assetInfoResponse = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
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
        activeTrades[symbol] = { apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice, exchangeType };

        // Start monitoring the trade
        monitorTrade(symbol, apiKey, apiSecretKey, decision, quantity, takeProfitPrice, stopLossPrice, exchangeType);
    } catch (error) {
        console.error('Error scheduling job:', error);
    }
}

// Function to get the last price of a symbol
async function getLastPrice(symbol) {
    const response = await fetch(`${baseUrl}/v1/ticker/price?symbol=${symbol}`);
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