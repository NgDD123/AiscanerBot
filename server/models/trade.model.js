// controllers/trade.controller.js
const crypto = require('crypto');
const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');
const { getAdvancedMarketMakers } = require('./marketMakers');

/**
 * executeTrade
 *
 * - ENTRY price strictly = strongSupport (BUY) or strongResistance (SELL)
 * - SL / TP / Trailing Stop based on ATR (Option B)
 * - Options:
 *    - options.log: function(msg, data) => used for streaming logs (optional)
 *    - options.monitorIntervalMs, monitorTimeoutMs, stopAtrMultiplier, tpAtrMultiplier, trailingAtrMultiplier...
 */
async function executeTrade(
  apiKey,
  apiSecretKey,
  symbol,
  decision,
  lastPrice,           // kept for optional info only; NOT used for determining entry
  exchangeType,
  availableUSDT,
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
    fallbackStopPct: 0.015,          // 1.5% fallback if ATR unavailable
    trailingCallbackRatePct: 1.5,    // fallback trailing callback %
    klinesIntervalForAtr: '5m',
    klinesLimitForAtr: 14,
    useMarketOnBreakout: true,
    log: null
  };
  const cfg = { ...defaultCfg, ...options };
  const log = (msg, data = {}) => {
    if (typeof cfg.log === 'function') cfg.log(msg, data);
    console.log(msg, data);
  };

  // retry helper
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

  if (!apiKey || !apiSecretKey || !symbol || !decision || !availableUSDT) {
    throw new Error('Missing required parameters for executeTrade');
  }

  const baseUrl = getBinanceBaseUrl(exchangeType);
  const action = decision.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
  log('executeTrade START', { symbol, action, exchangeType, userEmail });

  // Signing helper
  const sign = (paramsObj) => {
    const qs = new URLSearchParams(paramsObj).toString();
    const sig = crypto.createHmac('sha256', apiSecretKey).update(qs).digest('hex');
    return { qs, sig };
  };

  const getServerTime = async () => {
    const r = await fetch(`${baseUrl}/fapi/v1/time`);
    if (!r.ok) throw new Error('Failed to fetch server time');
    const d = await r.json();
    return d.serverTime;
  };

  const placeOrderSigned = async (params) => {
    params.timestamp = await retry(getServerTime);
    const { qs, sig } = sign(params);
    const url = `${baseUrl}/fapi/v1/order?${qs}&signature=${sig}`;
    const r = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': apiKey } });
    const d = await r.json();
    log('[placeOrderSigned]', { params, response: d });
    if (!r.ok) throw new Error(d.msg || JSON.stringify(d));
    return d;
  };

  const cancelOrderSigned = async (params) => {
    params.timestamp = await retry(getServerTime);
    const { qs, sig } = sign(params);
    const url = `${baseUrl}/fapi/v1/order?${qs}&signature=${sig}`;
    const r = await fetch(url, { method: 'DELETE', headers: { 'X-MBX-APIKEY': apiKey } });
    const d = await r.json();
    log('[cancelOrderSigned]', { params, response: d });
    if (!r.ok) throw new Error(d.msg || JSON.stringify(d));
    return d;
  };

  const getOrderSigned = async (params) => {
    params.timestamp = await retry(getServerTime);
    const { qs, sig } = sign(params);
    const url = `${baseUrl}/fapi/v1/order?${qs}&signature=${sig}`;
    const r = await fetch(url, { method: 'GET', headers: { 'X-MBX-APIKEY': apiKey } });
    const d = await r.json();
    // do not throw here — caller will inspect response
    return d;
  };

  const fetchDepth = async (limit = 500) => {
    const r = await fetch(`${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`);
    if (!r.ok) throw new Error('Failed to fetch depth');
    const d = await r.json();
    return {
      bids: (d.bids || []).map(([p, q]) => ({ price: +p, qty: +q })),
      asks: (d.asks || []).map(([p, q]) => ({ price: +p, qty: +q }))
    };
  };

  const fetchKlines = async (interval = cfg.klinesIntervalForAtr, limit = cfg.klinesLimitForAtr) => {
    const r = await fetch(`${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!r.ok) throw new Error('Failed to fetch klines for ATR');
    return await r.json();
  };

  const computeATR = (klines) => {
    if (!klines || klines.length < 2) return null;
    const trs = [];
    for (let i = 1; i < klines.length; i++) {
      const prevClose = +klines[i - 1][4];
      const high = +klines[i][2];
      const low = +klines[i][3];
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);
    }
    return trs.reduce((a, b) => a + b, 0) / trs.length;
  };

  try {
    // fetch exchangeInfo for precisions
    const infoRes = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
    if (!infoRes.ok) throw new Error('Failed to fetch exchangeInfo');
    const info = await infoRes.json();
    const symbolInfo = info.symbols.find(s => s.symbol === symbol);
    if (!symbolInfo) throw new Error(`Symbol ${symbol} not found`);
    const qtyPrecision = symbolInfo.quantityPrecision ?? 8;
    const pricePrecision = symbolInfo.pricePrecision ?? 8;
    log('precision', { qtyPrecision, pricePrecision });

    // ensure levels exist; fallback to market-makers if missing
    if (strongSupport == null || strongResistance == null) {
      try {
        const mm = await getAdvancedMarketMakers(symbol, 1000, exchangeType, cfg.snapshots, cfg.snapshotIntervalMs);
        strongSupport = strongSupport ?? (mm.strongSupport?.price ?? mm.strongSupport ?? null);
        strongResistance = strongResistance ?? (mm.strongResistance?.price ?? mm.strongResistance ?? null);
        log('fetched market maker levels', { strongSupport, strongResistance, ltp: mm.ltp });
      } catch (e) {
        log('getAdvancedMarketMakers error', { message: e.message });
      }
    }

    // convert to numbers if provided
    strongSupport = strongSupport != null ? +strongSupport : null;
    strongResistance = strongResistance != null ? +strongResistance : null;

    if (action === 'BUY' && (strongSupport == null || isNaN(strongSupport))) {
      throw new Error('strongSupport required for BUY');
    }
    if (action === 'SELL' && (strongResistance == null || isNaN(strongResistance))) {
      throw new Error('strongResistance required for SELL');
    }

    // compute quantity using entry price (use the level for qty calc)
    const entryPriceForQty = action === 'BUY' ? strongSupport : strongResistance;
    let quantity = parseFloat(((availableUSDT * 0.98) / entryPriceForQty).toFixed(qtyPrecision));
    if (quantity <= 0) throw new Error('Invalid order quantity computed');
    log('calculated quantity', { quantity });

    // set leverage to 1x (safety)
    await retry(async () => {
      const params = { symbol, leverage: 1, timestamp: await getServerTime() };
      const q = new URLSearchParams(params).toString();
      const sig = crypto.createHmac('sha256', apiSecretKey).update(q).digest('hex');
      const r = await fetch(`${baseUrl}/fapi/v1/leverage?${q}&signature=${sig}`, {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.msg || JSON.stringify(d));
      log('leverage set', d);
      return d;
    });

    // ENTRY price = strict level
    let entryPrice = action === 'BUY' ? strongSupport : strongResistance;
    entryPrice = parseFloat(entryPrice.toFixed(pricePrecision));
    log('entry price (from level)', { entryPrice });

    // place the initial LIMIT order at the level
    const limitParams = {
      symbol,
      side: action,
      type: 'LIMIT',
      quantity,
      price: entryPrice,
      timeInForce: 'GTC'
    };

    let entryOrder = await retry(() => placeOrderSigned(limitParams));
    log('placed limit entry order', { entryOrderId: entryOrder.orderId, status: entryOrder.status, price: entryPrice });

    // helper: compute protections and place them
    const placeProtections = async (executedQty, avgPrice) => {
      executedQty = +executedQty;
      avgPrice = +avgPrice;
      if (executedQty <= 0 || !avgPrice) throw new Error('executedQty or avgPrice invalid for protections');

      log('placing protections', { executedQty, avgPrice });

      // compute ATR
      let atr = null;
      try {
        const kl = await fetchKlines(cfg.klinesIntervalForAtr, cfg.klinesLimitForAtr);
        atr = computeATR(kl);
      } catch (e) {
        log('klines fetch for ATR failed', { message: e.message });
      }
      log('atr value', { atr });

      // compute stop, tp, trailingCallbackRate
      let stopPrice, tpPrice, trailingCallbackRate;
      if (atr && atr > 0) {
        stopPrice = action === 'BUY'
          ? parseFloat((avgPrice - atr * cfg.stopAtrMultiplier).toFixed(pricePrecision))
          : parseFloat((avgPrice + atr * cfg.stopAtrMultiplier).toFixed(pricePrecision));

        tpPrice = action === 'BUY'
          ? parseFloat((avgPrice + atr * cfg.tpAtrMultiplier).toFixed(pricePrecision))
          : parseFloat((avgPrice - atr * cfg.tpAtrMultiplier).toFixed(pricePrecision));

        // convert ATR multiple to approximate percent callback rate
        trailingCallbackRate = Math.max(
          0.1,
          parseFloat(((atr * cfg.trailingAtrMultiplier) / avgPrice * 100).toFixed(2))
        ); // minimum 0.1%
      } else {
        // fallback percent distances
        stopPrice = action === 'BUY'
          ? parseFloat((avgPrice * (1 - cfg.fallbackStopPct)).toFixed(pricePrecision))
          : parseFloat((avgPrice * (1 + cfg.fallbackStopPct)).toFixed(pricePrecision));

        tpPrice = action === 'BUY'
          ? parseFloat((avgPrice * (1 + cfg.fallbackStopPct * 2)).toFixed(pricePrecision))
          : parseFloat((avgPrice * (1 - cfg.fallbackStopPct * 2)).toFixed(pricePrecision));

        trailingCallbackRate = cfg.trailingCallbackRatePct;
      }

      log('computed protection prices', { stopPrice, tpPrice, trailingCallbackRate });

      // place TP (reduceOnly LIMIT)
      const tpOrder = await retry(() => placeOrderSigned({
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'LIMIT',
        quantity: executedQty,
        price: tpPrice,
        timeInForce: 'GTC',
        reduceOnly: true
      }));

      // place STOP_MARKET (reduceOnly)
      const stopOrder = await retry(() => placeOrderSigned({
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        quantity: executedQty,
        reduceOnly: true,
        stopPrice
      }));

      // place TRAILING_STOP_MARKET
      const trailOrder = await retry(() => placeOrderSigned({
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY',
        type: 'TRAILING_STOP_MARKET',
        quantity: executedQty,
        reduceOnly: true,
        callbackRate: trailingCallbackRate,
        activationPrice: parseFloat((avgPrice * (action === 'BUY' ? 1.01 : 0.99)).toFixed(pricePrecision))
      }));

      log('placed protections', { tpOrderId: tpOrder.orderId, stopOrderId: stopOrder.orderId, trailOrderId: trailOrder.orderId });
      return { tpOrder, stopOrder, trailOrder, atrUsed: atr };
    };

    // if entry order was filled immediately
    if (entryOrder && (entryOrder.status === 'FILLED' || (+entryOrder.executedQty > 0))) {
      log('entry filled immediately', { entryOrder });
      const executedQty = +entryOrder.executedQty || quantity;
      const avgPrice = +entryOrder.avgPrice || entryPrice;
      const protections = await placeProtections(executedQty, avgPrice);
      return {
        mode: 'filled_limit_entry_immediate',
        entryOrder,
        ...protections
      };
    }

    // monitor loop for fills or breakout
    const monitorStart = Date.now();
    let currentOrderId = entryOrder.orderId;

    while (Date.now() - monitorStart < cfg.monitorTimeoutMs) {
      // get order status
      let ord;
      try {
        ord = await getOrderSigned({ symbol, orderId: currentOrderId });
      } catch (e) {
        log('getOrderSigned error', { message: e.message });
      }

      if (ord && (ord.status === 'FILLED' || (+ord.executedQty > 0))) {
        log('entry filled in monitor', { ord });
        const executedQty = +ord.executedQty || quantity;
        const avgPrice = +ord.avgPrice || entryPrice;
        const protections = await placeProtections(executedQty, avgPrice);
        return {
          mode: 'filled_limit_entry',
          entryOrder: ord,
          ...protections
        };
      }

      // breakout detection - if opposite wall exists
      const oppositeWall = action === 'BUY' ? strongResistance : strongSupport;
      if (oppositeWall != null && cfg.useMarketOnBreakout) {
        try {
          // volume spike detection using 1m klines
          const kls = await fetchKlines('1m', 8);
          const vols = kls.map(k => +k[5]);
          const avgVol = vols.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, vols.length - 1);
          const lastVol = vols[vols.length - 1];
          const volSpike = lastVol >= Math.max(1, avgVol * 2.0);

          const ticker = await fetch(`${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`).then(r => r.json());
          const curPrice = +ticker.price;
          const crossed = (action === 'BUY' && curPrice > oppositeWall) || (action === 'SELL' && curPrice < oppositeWall);

          if (crossed && volSpike) {
            log('breakout detected -> cancel limit and enter market', { curPrice, oppositeWall, avgVol, lastVol });
            try { await cancelOrderSigned({ symbol, orderId: currentOrderId }); } catch (e) { log('cancel error', { message: e.message }); }

            const marketOrder = await retry(() => placeOrderSigned({ symbol, side: action, type: 'MARKET', quantity }));
            log('market order placed', { marketOrder });

            const executedQty = +marketOrder.executedQty || quantity;
            const avgPrice = +marketOrder.avgPrice || +marketOrder.fills?.[0]?.price || curPrice;
            const protections = await placeProtections(executedQty, avgPrice);
            return {
              mode: 'breakout_market_follow',
              marketOrder,
              ...protections
            };
          }
        } catch (e) {
          log('breakout detection error', { message: e.message });
        }
      }

      await new Promise(r => setTimeout(r, cfg.monitorIntervalMs));
    }

    // timeout -> cancel outstanding limit
    try {
      await cancelOrderSigned({ symbol, orderId: currentOrderId });
      log('monitor timeout -> canceled limit', { orderId: currentOrderId });
    } catch (e) {
      log('cancel after timeout failed', { message: e.message });
    }

    return { status: 'timeout_cancelled', entryOrder };

  } catch (err) {
    log('executeTrade ERROR', { message: err.message });
    throw err;
  }
}

module.exports = { executeTrade };
