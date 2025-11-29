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

// ---------------- Main function ----------------
async function getAdvancedMarketMakers(symbol, limit = 1000, exchangeType = 'binancefutures', snapshots = 3, intervalMs = 5000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const allSnapshots = [];

    for (let i = 0; i < snapshots; i++) {
        const res = await fetch(endpoint);
        const data = await res.json();

        const bids = data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));
        const asks = data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));

        allSnapshots.push({ bids, asks });

        if (i < snapshots - 1) await new Promise(r => setTimeout(r, intervalMs));
    }

    const priceRes = await fetch(priceEndpoint);
    const priceData = await priceRes.json();
    const ltp = parseFloat(priceData.price);

    // Dynamic threshold for large walls
    const avgBidSize = allSnapshots.flatMap(s => s.bids).reduce((sum, o) => sum + o.qty, 0) /
        (allSnapshots.flatMap(s => s.bids).length || 1);
    const avgAskSize = allSnapshots.flatMap(s => s.asks).reduce((sum, o) => sum + o.qty, 0) /
        (allSnapshots.flatMap(s => s.asks).length || 1);

    const wallThresholdBid = avgBidSize * 10;
    const wallThresholdAsk = avgAskSize * 10;

    const persistentLargeBidWalls = [];
    const persistentLargeAskWalls = [];

    const lastSnapshot = allSnapshots[allSnapshots.length - 1];

    lastSnapshot.bids.forEach(bid => {
        const count = allSnapshots.filter(s => s.bids.some(o => o.price === bid.price && o.qty >= wallThresholdBid)).length;
        if (count === snapshots) persistentLargeBidWalls.push(bid);
    });

    lastSnapshot.asks.forEach(ask => {
        const count = allSnapshots.filter(s => s.asks.some(o => o.price === ask.price && o.qty >= wallThresholdAsk)).length;
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

    let strongSupport = null;
    let strongResistance = null;

    if (cumBidWalls.length > 0) {
        strongSupport = cumBidWalls.reduce((max, w) => w.cumulativeQty > max.cumulativeQty ? w : max);
    }

    if (cumAskWalls.length > 0) {
        strongResistance = cumAskWalls.reduce((max, w) => w.cumulativeQty > max.cumulativeQty ? w : max);
    }

    if (strongSupport) console.log("\x1b[33m%s\x1b[0m", `🟢 STRONG Support @ ${strongSupport.price} (CumQty=${strongSupport.cumulativeQty})`);
    if (strongResistance) console.log("\x1b[33m%s\x1b[0m", `🔴 STRONG Resistance @ ${strongResistance.price} (CumQty=${strongResistance.cumulativeQty})`);

    // ------------------------- Dynamic Pip & Profit Calculation -------------------------
    let pipDistance = null;
    let profitPercent = null;
    let stopLoss = null;
    let stopLossPips = null;
    let riskRewardRatio = null;
    let suggestedLeverage = null;

    if (strongSupport && strongResistance) {
        const tickSize = await getTickSize(symbol, exchangeType);
        const diff = Math.abs(strongResistance.price - strongSupport.price);

        pipDistance = diff / tickSize;
        profitPercent = (diff / strongSupport.price) * 100;

        stopLoss = strongSupport.price - diff / 3;
        stopLossPips = (strongSupport.price - stopLoss) / tickSize;

        riskRewardRatio = (strongResistance.price - strongSupport.price) / (strongSupport.price - stopLoss);
        suggestedLeverage = riskRewardRatio / 0.02;

        console.log("\x1b[33m%s\x1b[0m", `📏 Pip Distance: ${pipDistance.toFixed(2)} pips`);
        console.log("\x1b[33m%s\x1b[0m", `💰 Potential Profit: ${profitPercent.toFixed(2)}%`);
        console.log("\x1b[33m%s\x1b[0m", `🛡 Stop-Loss: ${stopLoss.toFixed(5)} (${stopLossPips.toFixed(2)} pips)`);
        console.log("\x1b[33m%s\x1b[0m", `⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
        console.log("\x1b[33m%s\x1b[0m", `🚀 Suggested Leverage: ${suggestedLeverage.toFixed(2)}x`);
    }

    // ✅ Correct null/undefined check
    return {
        bids: lastSnapshot.bids,
        asks: lastSnapshot.asks,
        strongSupport,
        strongResistance,
        ltp,

        pipDistance: pipDistance !== undefined && pipDistance !== null ? Number(pipDistance.toFixed(2)) : null,
        profitPercent: profitPercent !== undefined && profitPercent !== null ? Number(profitPercent.toFixed(2)) : null,
        stopLoss: stopLoss !== undefined && stopLoss !== null ? Number(stopLoss.toFixed(5)) : null,
        stopLossPips: stopLossPips !== undefined && stopLossPips !== null ? Number(stopLossPips.toFixed(2)) : null,
        riskRewardRatio: riskRewardRatio !== undefined && riskRewardRatio !== null ? Number(riskRewardRatio.toFixed(2)) : null,
        suggestedLeverage: suggestedLeverage !== undefined && suggestedLeverage !== null ? Number(suggestedLeverage.toFixed(2)) : null,

        largeBidWalls: persistentLargeBidWalls,
        largeAskWalls: persistentLargeAskWalls
    };
}

module.exports = { getAdvancedMarketMakers };
