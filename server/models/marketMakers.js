const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

async function getAdvancedMarketMakers(symbol, limit = 1000, exchangeType = 'binancefutures', snapshots = 3, intervalMs = 5000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const allSnapshots = [];

    // Take multiple snapshots
    for (let i = 0; i < snapshots; i++) {
        const res = await fetch(endpoint);
        const data = await res.json();

        const bids = data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));
        const asks = data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));

        allSnapshots.push({ bids, asks });

        if (i < snapshots - 1) await new Promise(r => setTimeout(r, intervalMs));
    }

    // Get LTP
    const priceRes = await fetch(priceEndpoint);
    const priceData = await priceRes.json();
    const ltp = parseFloat(priceData.price);

    // Dynamic threshold
    const avgBidSize = allSnapshots.flatMap(s => s.bids).reduce((sum, o) => sum + o.qty, 0) /
                       (allSnapshots.flatMap(s => s.bids).length || 1);
    const avgAskSize = allSnapshots.flatMap(s => s.asks).reduce((sum, o) => sum + o.qty, 0) /
                       (allSnapshots.flatMap(s => s.asks).length || 1);

    const wallThresholdBid = avgBidSize * 10;
    const wallThresholdAsk = avgAskSize * 10;

    // Find persistent walls
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

    // Cumulative volume
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
        strongSupport = cumBidWalls.reduce((max, w) =>
            w.cumulativeQty > max.cumulativeQty ? w : max
        );
    }

    if (cumAskWalls.length > 0) {
        strongResistance = cumAskWalls.reduce((max, w) =>
            w.cumulativeQty > max.cumulativeQty ? w : max
        );
    }

    if (strongSupport) console.log(`🟢 STRONG Support @ ${strongSupport.price} (CumQty=${strongSupport.cumulativeQty})`);
    if (strongResistance) console.log(`🔴 STRONG Resistance @ ${strongResistance.price} (CumQty=${strongResistance.cumulativeQty})`);

    // -------------------------
    // PIP & Profit Calculation
    // -------------------------
    let pipDistance = null;
    let profitPercent = null;
    let stopLoss = null;
    let stopLossPips = null;
    let riskRewardRatio = null;
    let suggestedLeverage = null;

    if (strongSupport && strongResistance) {
        const diff = Math.abs(strongResistance.price - strongSupport.price);
        pipDistance = diff / 0.0001; // 1 pip = 0.0001
        profitPercent = (diff / strongSupport.price) * 100;

        // Stop-Loss example: 1/3 of distance below support
        stopLoss = strongSupport.price - diff / 3;
        stopLossPips = (strongSupport.price - stopLoss) / 0.0001;

        // Risk-Reward Ratio
        riskRewardRatio = (strongResistance.price - strongSupport.price) / (strongSupport.price - stopLoss);

        // Suggested leverage (simplified):
        // Assume max 2% risk per trade, leverage = RRR * (1 / 0.02)
        suggestedLeverage = riskRewardRatio / 0.02;

        console.log(`📏 Pip Distance: ${pipDistance.toFixed(2)} pips`);
        console.log(`💰 Potential Profit: ${profitPercent.toFixed(2)}%`);
        console.log(`🛡 Stop-Loss: ${stopLoss.toFixed(5)} (${stopLossPips.toFixed(2)} pips)`);
        console.log(`⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
        console.log(`🚀 Suggested Leverage: ${suggestedLeverage.toFixed(2)}x`);
    }

    return {
        bids: lastSnapshot.bids,
        asks: lastSnapshot.asks,
        strongSupport,
        strongResistance,
        ltp,

        pipDistance: pipDistance ? Number(pipDistance.toFixed(2)) : null,
        profitPercent: profitPercent ? Number(profitPercent.toFixed(2)) : null,
        stopLoss: stopLoss ? Number(stopLoss.toFixed(5)) : null,
        stopLossPips: stopLossPips ? Number(stopLossPips.toFixed(2)) : null,
        riskRewardRatio: riskRewardRatio ? Number(riskRewardRatio.toFixed(2)) : null,
        suggestedLeverage: suggestedLeverage ? Number(suggestedLeverage.toFixed(2)) : null,

        largeBidWalls: persistentLargeBidWalls,
        largeAskWalls: persistentLargeAskWalls
    };
}

module.exports = { getAdvancedMarketMakers };
