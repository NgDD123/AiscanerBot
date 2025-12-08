const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

// ---------------- Helper: get dynamic tick size ----------------
async function getTickSize(symbol, exchangeType) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const res = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
    const data = await res.json();
    const info = data.symbols.find(s => s.symbol === symbol);
    if (!info) throw new Error(`Symbol ${symbol} not found in exchange info`);
    const tickSize = parseFloat(info.filters.find(f => f.filterType === "PRICE_FILTER").tickSize);
    return tickSize;
}

// ---------------- Helper: get ATR ----------------
async function getATR(symbol, interval = '1h', limit = 14, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const res = await fetch(`${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length < 2) return 0;

    const trs = [];
    for (let i = 1; i < data.length; i++) {
        const prevClose = parseFloat(data[i - 1][4]);
        const high = parseFloat(data[i][2]);
        const low = parseFloat(data[i][3]);
        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        trs.push(tr);
    }

    const atr = trs.reduce((sum, t) => sum + t, 0) / trs.length;
    return parseFloat(atr);
}

// ---------------- Main function ----------------
async function getAdvancedMarketMakers(
    symbol,
    limit = 500,
    exchangeType = 'binancefutures',
    snapshots = 1,
    intervalMs = 1000,
    riskReward = 2,
    maxSLPercent = 8,
    minTPPercent = 5
) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const allSnapshots = [];

    for (let i = 0; i < snapshots; i++) {
        const res = await fetch(endpoint);
        const data = await res.json();

        const bids = (data.bids || []).map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));
        const asks = (data.asks || []).map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));

        allSnapshots.push({ bids, asks });

        if (i < snapshots - 1) await new Promise(r => setTimeout(r, intervalMs));
    }

    const priceRes = await fetch(priceEndpoint);
    const priceData = await priceRes.json();
    const ltp = parseFloat(priceData.price);

    const allBids = allSnapshots.flatMap(s => s.bids || []);
    const allAsks = allSnapshots.flatMap(s => s.asks || []);

    const avgBidSize = allBids.length ? allBids.reduce((sum, o) => sum + o.qty, 0) / allBids.length : 0;
    const avgAskSize = allAsks.length ? allAsks.reduce((sum, o) => sum + o.qty, 0) / allAsks.length : 0;

    const wallThresholdBid = avgBidSize * 10;
    const wallThresholdAsk = avgAskSize * 10;

    const persistentLargeBidWalls = [];
    const persistentLargeAskWalls = [];

    const lastSnapshot = allSnapshots[allSnapshots.length - 1] || { bids: [], asks: [] };

    lastSnapshot.bids.forEach(bid => {
        const count = allSnapshots.filter(s => (s.bids || []).some(o => o.price === bid.price && o.qty >= wallThresholdBid)).length;
        if (count === snapshots) persistentLargeBidWalls.push(bid);
    });

    lastSnapshot.asks.forEach(ask => {
        const count = allSnapshots.filter(s => (s.asks || []).some(o => o.price === ask.price && o.qty >= wallThresholdAsk)).length;
        if (count === snapshots) persistentLargeAskWalls.push(ask);
    });

    const getCumulativeVolume = (walls, range = 0.001) => {
        return walls.map(wall => {
            const nearbyQty = walls
                .filter(o => Math.abs(o.price - wall.price) <= range)
                .reduce((sum, o) => sum + o.qty, 0);
            return { ...wall, cumulativeQty: nearbyQty };
        });
    };

    const cumBidWalls = getCumulativeVolume(persistentLargeBidWalls);
    const cumAskWalls = getCumulativeVolume(persistentLargeAskWalls);

    let strongSupport = cumBidWalls.length > 0 ? cumBidWalls.reduce((max, w) => w.cumulativeQty > max.cumulativeQty ? w : max) : null;
    let strongResistance = cumAskWalls.length > 0 ? cumAskWalls.reduce((max, w) => w.cumulativeQty > max.cumulativeQty ? w : max) : null;

    if (strongSupport) console.log("\x1b[33m%s\x1b[0m", `🟢 STRONG Support @ ${strongSupport.price} (CumQty=${strongSupport.cumulativeQty})`);
    if (strongResistance) console.log("\x1b[33m%s\x1b[0m", `🔴 STRONG Resistance @ ${strongResistance.price} (CumQty=${strongResistance.cumulativeQty})`);

    const atr = await getATR(symbol, '1h', 14, exchangeType);

    let stopLossPrice = null;
    let takeProfitPrice = null;
    let stopLossPercent = null;
    let takeProfitPercent = null;
    let riskRewardRatio = null;
    let suggestedLeverage = null;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    if (ltp > 0) {
        if (strongSupport) {
            const candidateSLPrice = Math.max(strongSupport.price - atr, 0);
            let candidateSLPercent = ((ltp - candidateSLPrice) / ltp) * 100;
            if (!isFinite(candidateSLPercent) || candidateSLPercent < 0) candidateSLPercent = 0.1;

            const atrPercent = (atr / ltp) * 100;
            const factorMultiplier = 1.5;
            let dynamicSLPercent = clamp(Math.max(candidateSLPercent, atrPercent * factorMultiplier), 0.1, maxSLPercent);

            stopLossPercent = Number(dynamicSLPercent.toFixed(2));
            stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);

            takeProfitPercent = Number((stopLossPercent * riskReward).toFixed(2));
            if (takeProfitPercent < minTPPercent) {
                takeProfitPercent = Number(minTPPercent.toFixed(2));
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            }

            if (strongResistance && (ltp * (1 + takeProfitPercent / 100) > strongResistance.price)) {
                takeProfitPrice = strongResistance.price;
                takeProfitPercent = Number(((takeProfitPrice - ltp) / ltp * 100).toFixed(2));
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            } else {
                takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
            }

            if (stopLossPercent >= takeProfitPercent) {
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
                takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
            }

            riskRewardRatio = Number((takeProfitPercent / (stopLossPercent || 0.0001)).toFixed(2));
            suggestedLeverage = Number(Math.min(Math.max((riskRewardRatio / 0.02), 1), 150).toFixed(2));

            console.log("\x1b[33m%s\x1b[0m", `💰 Take Profit: ${takeProfitPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `🛡 Stop-Loss: ${stopLossPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
            console.log("\x1b[33m%s\x1b[0m", `🚀 Suggested Leverage: ${suggestedLeverage.toFixed(2)}x`);
        } else {
            const fallbackSLPercent = Math.min(5, maxSLPercent);
            const fallbackTPPercent = Math.max(fallbackSLPercent * riskReward, minTPPercent);
            stopLossPercent = Number(fallbackSLPercent.toFixed(2));
            takeProfitPercent = Number(fallbackTPPercent.toFixed(2));
            stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
            riskRewardRatio = Number((takeProfitPercent / (stopLossPercent || 0.0001)).toFixed(2));
            suggestedLeverage = Number(Math.min(Math.max((riskRewardRatio / 0.02), 1), 150).toFixed(2));

            console.log("\x1b[33m%s\x1b[0m", `ℹ️ No persistent support found; using fallback SL/TP`);
            console.log("\x1b[33m%s\x1b[0m", `💰 Take Profit: ${takeProfitPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `🛡 Stop-Loss: ${stopLossPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
        }
    }

    return {
        bids: lastSnapshot.bids,
        asks: lastSnapshot.asks,
        strongSupport,
        strongResistance,
        ltp,
        atr: atr !== undefined && atr !== null ? Number(atr.toFixed(8)) : null,
        stopLossPrice: stopLossPrice !== undefined && stopLossPrice !== null ? Number(stopLossPrice.toFixed(8)) : null,
        takeProfitPrice: takeProfitPrice !== undefined && takeProfitPrice !== null ? Number(takeProfitPrice.toFixed(8)) : null,
        stopLossPercent: stopLossPercent !== undefined && stopLossPercent !== null ? Number(stopLossPercent.toFixed(2)) : null,
        takeProfitPercent: takeProfitPercent !== undefined && takeProfitPercent !== null ? Number(takeProfitPercent.toFixed(2)) : null,
        riskRewardRatio: riskRewardRatio !== undefined && riskRewardRatio !== null ? Number(riskRewardRatio.toFixed(2)) : null,
        suggestedLeverage: suggestedLeverage !== undefined && suggestedLeverage !== null ? Number(suggestedLeverage.toFixed(2)) : null,
        largeBidWalls: persistentLargeBidWalls,
        largeAskWalls: persistentLargeAskWalls
    };
}

module.exports = { getAdvancedMarketMakers };
