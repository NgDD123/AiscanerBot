const crypto = require('crypto');
const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');
const { getAdvancedMarketMakers } = require('./marketMakers');

/**
 * Fetch actual USDT balance
 */
const getUSDTBalance = async (apiKey, apiSecretKey, exchangeType) => {
  const baseUrl = getBinanceBaseUrl(exchangeType);
  const ts = Date.now();
  const queryString = `recvWindow=5000&timestamp=${ts}`;
  const signature = crypto.createHmac('sha256', apiSecretKey)
    .update(queryString)
    .digest('hex');

  const url = `${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`;
  const res = await fetch(url, { method: 'GET', headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch account info');

  const usdtAsset = data.assets.find(a => a.asset === 'USDT');
  return parseFloat(usdtAsset?.walletBalance || 0);
};

/**
 * Helper to sign requests
 */
const sign = (paramsObj, apiSecretKey) => {
  const qs = new URLSearchParams(paramsObj).toString();
  const sig = crypto.createHmac('sha256', apiSecretKey).update(qs).digest('hex');
  return { qs, sig };
};

/**
 * Helper to retry a function
 */
const retry = async (fn, retries = 3, delay = 500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) console.log(`[retry] attempt ${attempt}`);
      return await fn();
    } catch (err) {
      console.log(`[retry] attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

/**
 * Fetch Binance server time
 */
const getServerTime = async (exchangeType) => {
  const r = await fetch(`${getBinanceBaseUrl(exchangeType)}/fapi/v1/time`);
  if (!r.ok) throw new Error('Failed to fetch server time');
  return (await r.json()).serverTime;
};

/**
 * Place signed order
 */
const placeOrderSigned = async (apiKey, apiSecretKey, exchangeType, params) => {
  params.timestamp = await getServerTime(exchangeType);
  const { qs, sig } = sign(params, apiSecretKey);
  const url = `${getBinanceBaseUrl(exchangeType)}/fapi/v1/order?${qs}&signature=${sig}`;
  const r = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await r.json();
  if (!r.ok || data?.code) throw new Error(data.msg || JSON.stringify(data));
  return data;
};

/**
 * Monitor LIMIT order until filled
 */
const waitForOrderFill = async (apiKey, apiSecretKey, exchangeType, symbol, orderId) => {
  const baseUrl = getBinanceBaseUrl(exchangeType);
  let filled = false;
  let orderData = null;

  while (!filled) {
    const ts = Date.now();
    const params = { symbol, orderId, recvWindow: 5000, timestamp: ts };
    const { qs, sig } = sign(params, apiSecretKey);
    const url = `${baseUrl}/fapi/v1/order?${qs}&signature=${sig}`;
    const r = await fetch(url, { headers: { 'X-MBX-APIKEY': apiKey } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.msg || 'Failed to fetch order status');

    orderData = data;
    if (data.status === 'FILLED') filled = true;
    else await new Promise(r => setTimeout(r, 1000));
  }

  return orderData;
};

/**
 * Fetch klines for ATR calculation
 */
const fetchKlines = async (symbol, exchangeType, interval = '5m', limit = 14) => {
  const r = await fetch(`${getBinanceBaseUrl(exchangeType)}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!r.ok) throw new Error('Failed to fetch klines');
  return await r.json();
};

/**
 * Compute ATR
 */
const computeATR = (klines) => {
  if (!klines || klines.length < 2) return null;
  const trs = [];
  for (let i = 1; i < klines.length; i++) {
    const prevClose = +klines[i - 1][4];
    const high = +klines[i][2];
    const low = +klines[i][3];
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  return trs.reduce((a, b) => a + b, 0) / trs.length;
};

/**
 * Main executeTrade function
 */
async function executeTrade(
  apiKey,
  apiSecretKey,
  symbol,
  decision,
  lastPrice,
  exchangeType,
  userEmail = null,
  strongSupport = null,
  strongResistance = null,
  maxRetries = 3,
  options = {}
) {
  const cfg = {
    monitorIntervalMs: 3000,
    monitorTimeoutMs: 120000,
    snapshots: 1,
    snapshotIntervalMs: 1200,
    stopAtrMultiplier: 1.0,
    tpAtrMultiplier: 2.0,
    trailingAtrMultiplier: 0.5,
    fallbackStopPct: 0.015,
    trailingCallbackRatePct: 1.5,
    klinesIntervalForAtr: '5m',
    klinesLimitForAtr: 14,
    ...options
  };

  const log = (msg, data = {}) => { console.log(msg, data); if (typeof cfg.log === 'function') cfg.log(msg, data); };

  const exType = exchangeType.toLowerCase().trim();
  if (!['binancefutures', 'binancefuturestestnet', 'binancetestnet'].includes(exType))
    throw new Error('Only Binance Futures supported for this function');

  if (decision.toLowerCase() === 'hold') return { message: 'Decision is HOLD, no trade placed' };

  // fetch USDT
  const availableUSDT = await getUSDTBalance(apiKey, apiSecretKey, exType);
  if (!availableUSDT || availableUSDT <= 0) throw new Error('Insufficient USDT balance');

  // fetch exchange info
  const baseUrl = getBinanceBaseUrl(exType);
  const infoRes = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
  if (!infoRes.ok) throw new Error('Failed to fetch exchangeInfo');
  const info = await infoRes.json();
  const symbolInfo = info.symbols.find(s => s.symbol === symbol);
  if (!symbolInfo) throw new Error(`Symbol ${symbol} not found`);

  const qtyPrecision = symbolInfo.quantityPrecision ?? 8;
  const pricePrecision = symbolInfo.pricePrecision ?? 8;
  const lotFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE') || {};
  const stepSize = parseFloat(lotFilter.stepSize ?? '1');
  const minQty = parseFloat(lotFilter.minQty ?? '1');
  const maxQty = parseFloat(lotFilter.maxQty ?? Number.MAX_SAFE_INTEGER);
  const priceFilter = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER') || {};
  const tickSize = parseFloat(priceFilter.tickSize ?? '0.00001');
  const minNotional = parseFloat(symbolInfo.filters.find(f => f.filterType === 'MIN_NOTIONAL')?.notional || '10');

  const fixPrice = (p) => parseFloat((Math.round(p / tickSize) * tickSize).toFixed(pricePrecision));
  const fixQty = (q) => parseFloat(Math.min(Math.max(Math.floor(q / stepSize) * stepSize, minQty), maxQty).toFixed(qtyPrecision));

  const action = decision.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';

  // compute entry price
  if (!strongSupport || !strongResistance) {
    const mm = await getAdvancedMarketMakers(symbol, 1000, exType, cfg.snapshots, cfg.snapshotIntervalMs);
    strongSupport = strongSupport ?? (mm.strongSupport?.price ?? lastPrice);
    strongResistance = strongResistance ?? (mm.strongResistance?.price ?? lastPrice);
  }

  let entryPrice = parseFloat(action === 'BUY' ? strongSupport : strongResistance);
  entryPrice = fixPrice(entryPrice);

  // compute quantity
  let quantity = ((availableUSDT * 0.98) / entryPrice);
  if (entryPrice * quantity < minNotional) quantity = Math.ceil(minNotional / entryPrice);
  quantity = fixQty(quantity);
  if (quantity <= 0) throw new Error('Invalid quantity computed');

  log('Placing LIMIT entry order', { action, entryPrice, quantity });

  // place LIMIT order
  const entryParams = { symbol, side: action, type: 'LIMIT', timeInForce: 'GTC', quantity, price: entryPrice };
  const entryOrder = await retry(() => placeOrderSigned(apiKey, apiSecretKey, exType, entryParams));

  log('LIMIT order placed, monitoring until filled...', entryOrder);

  // monitor until filled
  const filledOrder = await waitForOrderFill(apiKey, apiSecretKey, exType, symbol, entryOrder.orderId);
  const executedQty = +filledOrder.executedQty;
  const avgPrice = +filledOrder.avgPrice || entryPrice;

  log('Entry order filled', { executedQty, avgPrice });

  // compute ATR for protections
  const kl = await fetchKlines(symbol, exType, cfg.klinesIntervalForAtr, cfg.klinesLimitForAtr);
  const atr = computeATR(kl);

  let stopPrice, tpPrice, trailingCallbackRate;
  if (atr) {
    stopPrice = action === 'BUY' ? avgPrice - atr * cfg.stopAtrMultiplier : avgPrice + atr * cfg.stopAtrMultiplier;
    tpPrice = action === 'BUY' ? avgPrice + atr * cfg.tpAtrMultiplier : avgPrice - atr * cfg.tpAtrMultiplier;
    trailingCallbackRate = Math.min(5, Math.max(0.1, ((atr * cfg.trailingAtrMultiplier) / avgPrice) * 100));
  } else {
    stopPrice = action === 'BUY' ? avgPrice * (1 - cfg.fallbackStopPct) : avgPrice * (1 + cfg.fallbackStopPct);
    tpPrice = action === 'BUY' ? avgPrice * (1 + cfg.fallbackStopPct * 2) : avgPrice * (1 - cfg.fallbackStopPct * 2);
    trailingCallbackRate = cfg.trailingCallbackRatePct;
  }

  stopPrice = fixPrice(stopPrice);
  tpPrice = fixPrice(tpPrice);
  const qty = fixQty(executedQty);
  const callbackRate = parseFloat(trailingCallbackRate.toFixed(1));

  // place TAKE_PROFIT
  const tpOrderParams = { symbol, side: action === 'BUY' ? 'SELL' : 'BUY', type: 'LIMIT', quantity: qty, price: tpPrice, timeInForce: 'GTC', reduceOnly: true, workingType: 'MARK_PRICE' };
  const tpOrder = await retry(() => placeOrderSigned(apiKey, apiSecretKey, exType, tpOrderParams));

  // place STOP_MARKET
  const stopOrderParams = { symbol, side: action === 'BUY' ? 'SELL' : 'BUY', type: 'STOP_MARKET', quantity: qty, stopPrice, reduceOnly: true, workingType: 'MARK_PRICE' };
  const stopOrder = await retry(() => placeOrderSigned(apiKey, apiSecretKey, exType, stopOrderParams));

  // place TRAILING_STOP_MARKET
  const trailActivation = action === 'BUY' ? fixPrice(avgPrice * 1.01) : fixPrice(avgPrice * 0.99);
  const trailOrderParams = { symbol, side: action === 'BUY' ? 'SELL' : 'BUY', type: 'TRAILING_STOP_MARKET', quantity: qty, reduceOnly: true, callbackRate, activationPrice: trailActivation, workingType: 'MARK_PRICE' };
  const trailOrder = await retry(() => placeOrderSigned(apiKey, apiSecretKey, exType, trailOrderParams));

  log('Protection orders placed', { tpOrderId: tpOrder.orderId, stopOrderId: stopOrder.orderId, trailOrderId: trailOrder.orderId });

  return { entryOrder: filledOrder, executedQty, avgPrice, tpOrder, stopOrder, trailOrder, atrUsed: atr };
}

module.exports = { executeTrade };
