const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

async function getAdvancedMarketMakers(symbol, limit = 1000, exchangeType = 'binancefutures', snapshots = 3, intervalMs = 5000) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const allSnapshots = [];

    // Take multiple snapshots for multi-timeframe wall check
    for (let i = 0; i < snapshots; i++) {
        const res = await fetch(endpoint);
        const data = await res.json();

        const bids = data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));
        const asks = data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) }));

        allSnapshots.push({ bids, asks });

        if (i < snapshots - 1) await new Promise(r => setTimeout(r, intervalMs));
    }

    // Get current price (ltp)
    const priceRes = await fetch(priceEndpoint);
    const priceData = await priceRes.json();
    const ltp = parseFloat(priceData.price);

    // Aggregate average order size for dynamic wall threshold
    const avgBidSize = allSnapshots.flatMap(s => s.bids).reduce((sum, o) => sum + o.qty, 0) / (allSnapshots.flatMap(s => s.bids).length || 1);
    const avgAskSize = allSnapshots.flatMap(s => s.asks).reduce((sum, o) => sum + o.qty, 0) / (allSnapshots.flatMap(s => s.asks).length || 1);

    const wallThresholdBid = avgBidSize * 5; // 5x average size
    const wallThresholdAsk = avgAskSize * 5;

    // Find persistent walls across snapshots
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

    // Strongest Support/Resistance
    let strongSupport = null;
    let strongResistance = null;

    const validSupports = persistentLargeBidWalls.filter(w => w.price <= ltp);
    if (validSupports.length > 0) {
        strongSupport = validSupports.reduce((max, w) => w.qty > max.qty ? w : max);
    }

    const validResistances = persistentLargeAskWalls.filter(w => w.price >= ltp);
    if (validResistances.length > 0) {
        strongResistance = validResistances.reduce((max, w) => w.qty > max.qty ? w : max);
    }

    // Console output only strongest levels
    if (strongSupport) {
        console.log(`🟢 STRONG Support @ ${strongSupport.price} (Qty=${strongSupport.qty})`);
    }
    if (strongResistance) {
        console.log(`🔴 STRONG Resistance @ ${strongResistance.price} (Qty=${strongResistance.qty})`);
    }

    return {
        bids: lastSnapshot.bids,
        asks: lastSnapshot.asks,
        strongSupport,
        strongResistance,
        ltp,
         largeBidWalls: persistentLargeBidWalls,   // ✅ Add this
         largeAskWalls: persistentLargeAskWalls    // ✅ Add this
    };
}

module.exports = { getAdvancedMarketMakers };
