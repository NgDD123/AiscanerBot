const fetch = require('node-fetch');
const { getBinanceBaseUrl } = require('../Routes/binanceConfig');

// ---------------- Helper: tick size ----------------
async function getTickSize(symbol, exchangeType) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const res = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
    const data = await res.json();
    const info = data.symbols.find(s => s.symbol === symbol);
    if (!info) throw new Error(`Symbol ${symbol} not found`);
    return parseFloat(info.filters.find(f => f.filterType === "PRICE_FILTER").tickSize);
}

const roundToTick = (price, tick) =>
    Math.round(price / tick) * tick;

// ---------------- Helper: ATR ----------------
async function getATR(symbol, interval = '2h', limit = 14, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const res = await fetch(
        `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return 0;

    let trSum = 0;
    for (let i = 1; i < data.length; i++) {
        const prevClose = +data[i - 1][4];
        const high = +data[i][2];
        const low = +data[i][3];
        trSum += Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
    }
    return trSum / (data.length - 1);
}

// ---------------- Strength & Fake-wall scoring ----------------
function computeStrength(wall, ltp, atr, snapshots, avgQty) {
    const volumeScore = Math.log(wall.cumulativeQty + 1);
    const persistenceScore = wall.persistence / snapshots;

    const distance = Math.abs(wall.price - ltp);
    const distanceScore = Math.max(0, 1 - (distance / (atr * 2)));

    // ---- Fake-wall penalties ----
    let fakePenalty = 1;

    // Appears too briefly (spoofing)
    if (wall.persistence <= 1) fakePenalty *= 0.2;

    // Big size but low zone support
    if (wall.cumulativeQty < avgQty * 3) fakePenalty *= 0.5;

    // Too far from price
    if (distance > atr * 2) fakePenalty *= 0;

    return volumeScore * persistenceScore * distanceScore * fakePenalty;
}

// ---------------- Main ----------------
async function getAdvancedMarketMakers(
    symbol,
    limit = 500,
    exchangeType = 'binancefutures',
    snapshots = 3,
    intervalMs = 1000,
    riskReward = 2,
    maxSLPercent = 8,
    minTPPercent = 5
) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const depthUrl = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceUrl = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const tickSize = await getTickSize(symbol, exchangeType);
    const atr = await getATR(symbol, '2h', 14, exchangeType);

    const snapshotsData = [];

    for (let i = 0; i < snapshots; i++) {
        const res = await fetch(depthUrl);
        const data = await res.json();

        snapshotsData.push({
            bids: (data.bids || []).map(([p, q]) => ({
                price: roundToTick(+p, tickSize),
                qty: +q
            })),
            asks: (data.asks || []).map(([p, q]) => ({
                price: roundToTick(+p, tickSize),
                qty: +q
            }))
        });

        if (i < snapshots - 1) await new Promise(r => setTimeout(r, intervalMs));
    }

    const ltp = +((await (await fetch(priceUrl)).json()).price);

    const allBids = snapshotsData.flatMap(s => s.bids);
    const allAsks = snapshotsData.flatMap(s => s.asks);

    const avgBidQty = allBids.reduce((s, o) => s + o.qty, 0) / (allBids.length || 1);
    const avgAskQty = allAsks.reduce((s, o) => s + o.qty, 0) / (allAsks.length || 1);

    const bidThreshold = avgBidQty * 8;
    const askThreshold = avgAskQty * 8;

    // -------- Map & persist walls --------
    function mapWalls(side, threshold) {
        const map = new Map();

        snapshotsData.forEach(snapshot => {
            snapshot[side].forEach(o => {
                if (o.qty < threshold) return;

                if (!map.has(o.price)) {
                    map.set(o.price, {
                        price: o.price,
                        cumulativeQty: 0,
                        persistence: 0
                    });
                }

                const w = map.get(o.price);
                w.cumulativeQty += o.qty;
                w.persistence += 1;
            });
        });

        return [...map.values()];
    }

    const bidWalls = mapWalls('bids', bidThreshold)
        .filter(w => w.price < ltp && ltp - w.price <= atr * 2 && w.persistence >= 2);

    const askWalls = mapWalls('asks', askThreshold)
        .filter(w => w.price > ltp && w.price - ltp <= atr * 2 && w.persistence >= 2);

    // -------- Strongest levels --------
    const strongSupport = bidWalls
        .map(w => ({
            ...w,
            strength: computeStrength(w, ltp, atr, snapshots, avgBidQty)
        }))
        .sort((a, b) => b.strength - a.strength)[0] || null;

    const strongResistance = askWalls
        .map(w => ({
            ...w,
            strength: computeStrength(w, ltp, atr, snapshots, avgAskQty)
        }))
        .sort((a, b) => b.strength - a.strength)[0] || null;

    // -------- SL / TP --------
    let stopLossPercent, takeProfitPercent;

    if (strongSupport) {
        stopLossPercent = Math.min(
            Math.max(((ltp - strongSupport.price) / ltp) * 100, 0.3),
            maxSLPercent
        );
        takeProfitPercent = Math.max(stopLossPercent * riskReward, minTPPercent);
    } else {
        stopLossPercent = 5;
        takeProfitPercent = Math.max(5 * riskReward, minTPPercent);
    }

    const stopLossPrice = ltp * (1 - stopLossPercent / 100);
    const takeProfitPrice = strongResistance
        ? Math.min(ltp * (1 + takeProfitPercent / 100), strongResistance.price)
        : ltp * (1 + takeProfitPercent / 100);

    return {
        ltp,
        atr: +atr.toFixed(6),
        strongSupport,
        strongResistance,
        stopLossPrice: +stopLossPrice.toFixed(6),
        takeProfitPrice: +takeProfitPrice.toFixed(6),
        stopLossPercent: +stopLossPercent.toFixed(2),
        takeProfitPercent: +takeProfitPercent.toFixed(2),
        largeBidWalls: bidWalls,
        largeAskWalls: askWalls
    };
}

module.exports = { getAdvancedMarketMakers };
