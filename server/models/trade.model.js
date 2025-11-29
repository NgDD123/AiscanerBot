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
 * executeTrade - Fully Testnet/Mainnet compatible
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
  const defaultCfg = {
    monitorIntervalMs: 3000,
    monitorTimeoutMs: 120000,
    snapshots: 3,
    snapshotIntervalMs: 1200,
    stopAtrMultiplier: 1.0,
    tpAtrMultiplier: 2.0,
    trailingAtrMultiplier: 0.5,
    fallbackStopPct: 0.015,
    trailingCallbackRatePct: 1.5,
    klinesIntervalForAtr: '5m',
    klinesLimitForAtr: 14,
    useMarketOnBreakout: false,
    log: null
  };
  const cfg = { ...defaultCfg, ...options };
  const log = (msg, data = {}) => {
    if (typeof cfg.log === 'function') cfg.log(msg, data);
    console.log(msg, data);
  };

  const retry = async (fn, retries = maxRetries, delay = 500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt > 1) log(`[retry] attempt ${attempt}`);
        return await fn();
      } catch (err) {
        log(`[retry] attempt ${attempt} failed: ${err.message}`);
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  };

  const sign = (paramsObj) => {
    const qs = new URLSearchParams(paramsObj).toString();
    const sig = crypto.createHmac('sha256', apiSecretKey).update(qs).digest('hex');
    return { qs, sig };
  };

  const getServerTime = async () => {
    const r = await fetch(`${getBinanceBaseUrl(exchangeType)}/fapi/v1/time`);
    if (!r.ok) throw new Error('Failed to fetch server time');
    return (await r.json()).serverTime;
  };

  const placeOrderSigned = async (params) => {
    try {
      params.timestamp = await getServerTime(); // ✅ valid timestamp for all orders
      const { qs, sig } = sign(params);
      const url = `${getBinanceBaseUrl(exchangeType)}/fapi/v1/order?${qs}&signature=${sig}`;
      const r = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': apiKey } });
      const d = await r.json();
      log('[Binance Order Response]', d);
      if (!r.ok || d?.code) throw new Error(d.msg || JSON.stringify(d));
      return d;
    } catch (err) {
      log('Order failed', { message: err.message, params });
      return null;
    }
  };

  const safePlaceOrder = async (params) => {
    const res = await retry(() => placeOrderSigned(params));
    if (!res) {
      return {
        executedQty: params.quantity,
        avgPrice: params.price ?? 0,
        orderId: null,
        status: 'FAILED'
      };
    }
    const executedQty = +res.executedQty || res.fills?.reduce((acc, f) => acc + +f.qty, 0) || params.quantity;
    const avgPrice = +res.avgPrice || (res.fills?.reduce((acc, f) => acc + (+f.qty * +f.price), 0) / executedQty) || params.price || 0;
    const orderId = res.orderId ?? null;
    const status = res.status ?? 'UNKNOWN';
    return { ...res, executedQty, avgPrice, orderId, status };
  };

  const fetchKlines = async (interval = cfg.klinesIntervalForAtr, limit = cfg.klinesLimitForAtr) => {
    const r = await fetch(`${getBinanceBaseUrl(exchangeType)}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!r.ok) throw new Error('Failed to fetch klines');
    return await r.json();
  };

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

  try {
    // Fetch USDT dynamically
    let availableUSDT = await getUSDTBalance(apiKey, apiSecretKey, exchangeType);
    log('Fetched available USDT', { availableUSDT });

    const baseUrl = getBinanceBaseUrl(exchangeType);
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
    const minNotional = parseFloat(symbolInfo.filters.find(f => f.filterType === 'MIN_NOTIONAL')?.notional || symbolInfo.filters.find(f => f.filterType === 'MIN_NOTIONAL')?.minNotional || '10');

    log('precision & filters', { qtyPrecision, pricePrecision, stepSize, tickSize, minNotional });

    // helpers to fix price & qty to tick/step rules
    const fixPrice = (p) => {
      if (!isFinite(p)) return p;
      const rounded = Math.round(p / tickSize) * tickSize;
      return parseFloat(rounded.toFixed(pricePrecision));
    };

    const fixQty = (q) => {
      if (!isFinite(q)) return q;
      const floored = Math.floor(q / stepSize) * stepSize;
      const safe = floored <= 0 ? stepSize : floored;
      const capped = Math.min(safe, maxQty);
      const finalQty = capped < minQty ? minQty : capped;
      return parseFloat(finalQty.toFixed(qtyPrecision));
    };

    const clampCallbackRate = (r) => {
      if (!isFinite(r)) r = cfg.trailingCallbackRatePct;
      const clamped = Math.max(0.1, Math.min(r, 5));
      return parseFloat(clamped.toFixed(1));
    };

    const action = decision.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';

    if (strongSupport == null || strongResistance == null) {
      const mm = await getAdvancedMarketMakers(symbol, 1000, exchangeType, cfg.snapshots, cfg.snapshotIntervalMs);
      strongSupport = strongSupport ?? (mm.strongSupport?.price ?? mm.strongSupport ?? lastPrice);
      strongResistance = strongResistance ?? (mm.strongResistance?.price ?? mm.strongResistance ?? lastPrice);
    }

    // compute entry price using pricePrecision and tickSize
    let entryPrice = parseFloat(action === 'BUY' ? strongSupport : strongResistance);
    entryPrice = fixPrice(entryPrice);

    // compute raw quantity
    let quantity = ((availableUSDT * 0.98) / entryPrice);
    if (entryPrice * quantity < minNotional) quantity = Math.ceil(minNotional / entryPrice);
    quantity = fixQty(quantity);

    if (quantity <= 0) throw new Error('Invalid order quantity computed');

    log('calculated quantity', { quantity });
    log('entry price (adjusted)', { entryPrice });

    await retry(async () => {
      const params = { symbol, leverage: 1, timestamp: await getServerTime() };
      const q = new URLSearchParams(params).toString();
      const sig = crypto.createHmac('sha256', apiSecretKey).update(q).digest('hex');
      const r = await fetch(`${baseUrl}/fapi/v1/leverage?${q}&signature=${sig}`, { method: 'POST', headers: { 'X-MBX-APIKEY': apiKey } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.msg || JSON.stringify(d));
      log('leverage set', d);
    });

    // ✅ FORCE LIMIT ENTRY ORDER ONLY
    const entryParams = {
      symbol,
      side: action,
      type: 'LIMIT',
      quantity,
      price: entryPrice,
      timeInForce: 'GTC'
    };

    const entryOrder = await safePlaceOrder(entryParams);
    const executedQty = +entryOrder.executedQty;
    const avgPrice = +entryOrder.avgPrice || entryPrice;

    log('placed entry order', { entryOrderId: entryOrder.orderId, status: entryOrder.status, price: entryPrice });

    const protections = async (executedQtyLocal, avgPriceLocal) => {
      const kl = await fetchKlines(cfg.klinesIntervalForAtr, cfg.klinesLimitForAtr);
      const atr = computeATR(kl);

      let stopPrice, tpPrice, trailingCallbackRate;
      if (atr) {
        stopPrice = action === 'BUY' ? avgPriceLocal - atr * cfg.stopAtrMultiplier : avgPriceLocal + atr * cfg.stopAtrMultiplier;
        tpPrice = action === 'BUY' ? avgPriceLocal + atr * cfg.tpAtrMultiplier : avgPriceLocal - atr * cfg.tpAtrMultiplier;
        trailingCallbackRate = Math.min(5, Math.max(0.1, ((atr * cfg.trailingAtrMultiplier) / avgPriceLocal) * 100));
      } else {
        stopPrice = action === 'BUY' ? avgPriceLocal * (1 - cfg.fallbackStopPct) : avgPriceLocal * (1 + cfg.fallbackStopPct);
        tpPrice = action === 'BUY' ? avgPriceLocal * (1 + cfg.fallbackStopPct * 2) : avgPriceLocal * (1 - cfg.fallbackStopPct * 2);
        trailingCallbackRate = cfg.trailingCallbackRatePct;
      }

      stopPrice = fixPrice(stopPrice);
      tpPrice = fixPrice(tpPrice);

      const activationGapPct = 0.01;
      const trailActivation = action === 'BUY'
        ? fixPrice(avgPriceLocal * (1 + activationGapPct))
        : fixPrice(avgPriceLocal * (1 - activationGapPct));

      const qty = fixQty(executedQtyLocal);
      const callbackRate = clampCallbackRate(trailingCallbackRate);

      // TAKE-PROFIT LIMIT order
      const tpOrderParams = {
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'LIMIT',
        quantity: qty,
        price: tpPrice,
        timeInForce: 'GTC',
        reduceOnly: true,
        workingType: 'MARK_PRICE'
      };
      const tpOrder = await safePlaceOrder(tpOrderParams);

      // STOP_MARKET order
      const stopOrderParams = {
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        quantity: qty,
        reduceOnly: true,
        stopPrice: stopPrice,
        workingType: 'MARK_PRICE'
      };
      const stopOrder = await safePlaceOrder(stopOrderParams);

      // TRAILING STOP MARKET
      const trailOrderParams = {
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'TRAILING_STOP_MARKET',
        quantity: qty,
        reduceOnly: true,
        callbackRate: callbackRate,
        activationPrice: trailActivation,
        workingType: 'MARK_PRICE'
      };
      const trailOrder = await safePlaceOrder(trailOrderParams);

      log('placed protections', { tpOrderId: tpOrder.orderId, stopOrderId: stopOrder.orderId, trailOrderId: trailOrder.orderId });
      return { tpOrder, stopOrder, trailOrder, atrUsed: atr };
    };

    const protectionOrders = await protections(executedQty, avgPrice);

    return {
      mode: 'entry_with_protections',
      entryOrder,
      executedQty,
      avgPrice,
      ...protectionOrders
    };

  } catch (err) {
    log('executeTrade ERROR', { message: err.message });
    throw err;
  }
}

module.exports = { executeTrade };
