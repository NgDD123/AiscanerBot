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
// Uses Binance klines (fapi/v1/klines). Returns ATR in price units (same currency as symbol price)
async function getATR(symbol, interval = '1h', limit = 14, exchangeType = 'binancefutures') {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const res = await fetch(`${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length < 2) return 0;

    const trs = [];
    for (let i = 1; i < data.length; i++) {
        // Kline array format: [openTime, open, high, low, close, ...]
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
// Preserves your structure and console outputs. Calculates SL/TP as percentages, with dynamic SL (ATR + support gap),
// TP = SL * riskReward, enforces SL < TP, clamps SL by maxSLPercent, clamps TP by resistance and minTPPercent.
async function getAdvancedMarketMakers(
    symbol,
    limit = 1000,
    exchangeType = 'binancefutures',
    snapshots = 3,
    intervalMs = 5000,
    // Trading params (defaults: R/R = 1:2, max SL cap = 8%, min TP% = 5%)
    riskReward = 2,
    maxSLPercent = 8,
    minTPPercent = 5
) {
    const baseUrl = getBinanceBaseUrl(exchangeType);
    const endpoint = `${baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
    const priceEndpoint = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

    const allSnapshots = [];

    // ---------------- Fetch order book snapshots ----------------
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

    // ---------------- Calculate average bid/ask sizes ----------------
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

    // ---------------- Cumulative volume ----------------
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

    // ---------------- ATR for dynamic volatility measure ----------------
    const atr = await getATR(symbol, '1h', 14, exchangeType);

    // Defaults for outputs
    let stopLossPrice = null;
    let takeProfitPrice = null;
    let stopLossPercent = null;
    let takeProfitPercent = null;
    let riskRewardRatio = null;
    let suggestedLeverage = null;

    // Helper: clamp
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    if (ltp > 0) {
        if (strongSupport && strongResistance) {
            // ---------------- DYNAMIC SL calculation (Option B) ----------------
            // 1) Candidate SL price: support minus ATR (volatility buffer)
            const candidateSLPrice = Math.max(strongSupport.price - atr, 0);

            // 2) Convert candidate SL to percent of LTP
            let candidateSLPercent = ((ltp - candidateSLPrice) / ltp) * 100;
            if (!isFinite(candidateSLPercent) || candidateSLPercent < 0) candidateSLPercent = 0.01;

            // 3) ATR as percent (volatility-normalized)
            const atrPercent = (atr / ltp) * 100;

            // 4) Volatility factor: use ATR percent as baseline but ensure we respect the support gap as well.
            //    We take the average of candidateSLPercent and a multiple of atrPercent to balance support gap and volatility.
            //    factorMultiplier adjusts sensitivity; 1.5 is a reasonable balance (can be tuned).
            const factorMultiplier = 1.5;
            let volatilityBaselinePercent = atrPercent * factorMultiplier;

            // 5) Final dynamic SL percent is the max of a small floor (0.1%), the candidateSLPercent and a portion of volatilityBaseline,
            //    but never exceed maxSLPercent.
            let dynamicSLPercent = Math.max(0.1, Math.min(maxSLPercent, Math.max(candidateSLPercent, volatilityBaselinePercent)));

            // 6) If dynamic SL is extremely large (e.g., caused by huge ATR for very low LTP), clamp to maxSLPercent
            dynamicSLPercent = clamp(dynamicSLPercent, 0.1, maxSLPercent);

            // 7) Derive SL price from percent
            stopLossPercent = Number(dynamicSLPercent.toFixed(2));
            stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);

            // 8) Compute TP percent (TP = SL * riskReward)
            takeProfitPercent = Number((stopLossPercent * riskReward).toFixed(2));

            // 9) Enforce minimum TP percent
            if (takeProfitPercent < minTPPercent) {
                takeProfitPercent = Number(minTPPercent.toFixed(2));
                // Recompute SL to keep R/R = riskReward
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                // Ensure SL doesn't exceed max cap
                if (stopLossPercent > maxSLPercent) {
                    stopLossPercent = Number(maxSLPercent.toFixed(2));
                    takeProfitPercent = Number((stopLossPercent * riskReward).toFixed(2));
                }
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            }

            // 10) If resistance is closer than percent-based TP, clamp TP to resistance, but maintain minTPPercent and R/R
            const percentTPPrice = ltp * (1 + takeProfitPercent / 100);
            if (strongResistance.price <= percentTPPrice) {
                // If resistance is already below the percent TP, use resistance as TP
                const clampedTPPrice = strongResistance.price;
                let clampedTPPercent = ((clampedTPPrice - ltp) / ltp) * 100;

                // If clampedTPPercent is negative or too small, enforce minTPPercent
                if (!isFinite(clampedTPPercent) || clampedTPPercent < minTPPercent) {
                    clampedTPPercent = minTPPercent;
                    // recompute TP price from minTPPercent
                    takeProfitPrice = ltp * (1 + clampedTPPercent / 100);
                } else {
                    takeProfitPrice = clampedTPPrice;
                }

                takeProfitPercent = Number(clampedTPPercent.toFixed(2));

                // Recompute SL to preserve R/R (SL = TP / riskReward), then ensure SL <= maxSLPercent
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                if (stopLossPercent > maxSLPercent) {
                    stopLossPercent = Number(maxSLPercent.toFixed(2));
                    // Recompute TP from SL cap
                    takeProfitPercent = Number((stopLossPercent * riskReward).toFixed(2));
                    takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
                }
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            } else {
                // percent TP price is fine and resistance is not limiting
                takeProfitPrice = percentTPPrice;
            }

            // 11) Final safety: ensure SL always < TP (in percent terms)
            if (stopLossPercent >= takeProfitPercent) {
                // enforce relationship: SL = TP / riskReward
                stopLossPercent = Number((takeProfitPercent / riskReward).toFixed(2));
                if (stopLossPercent > maxSLPercent) stopLossPercent = Number(maxSLPercent.toFixed(2));
                stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
                takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
            }

            // 12) Compute R/R ratio and suggested leverage (heuristic)
            riskRewardRatio = Number((takeProfitPercent / (stopLossPercent || 0.0001)).toFixed(2));
            suggestedLeverage = Number(Math.min(Math.max((riskRewardRatio / 0.02), 1), 150).toFixed(2)); // bound 1..150

            // Logging (kept similar to your previous logs)
            console.log("\x1b[33m%s\x1b[0m", `📏 Pip Distance (approx): ${(Math.abs(strongResistance.price - strongSupport.price)).toFixed(8)}`);
            console.log("\x1b[33m%s\x1b[0m", `💰 Take Profit: ${takeProfitPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `🛡 Stop-Loss: ${stopLossPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
            console.log("\x1b[33m%s\x1b[0m", `🚀 Suggested Leverage: ${suggestedLeverage.toFixed(2)}x`);
        } else {
            // ---------------- Fallback conservative values when no clear walls ----------------
            const fallbackSLPercent = Math.min(5, maxSLPercent); // prefer a conservative 5% SL or max cap
            const fallbackTPPercent = Math.max(fallbackSLPercent * riskReward, minTPPercent);

            stopLossPercent = Number(fallbackSLPercent.toFixed(2));
            takeProfitPercent = Number(fallbackTPPercent.toFixed(2));
            stopLossPrice = Math.max(ltp * (1 - stopLossPercent / 100), 0);
            takeProfitPrice = ltp * (1 + takeProfitPercent / 100);
            riskRewardRatio = Number((takeProfitPercent / (stopLossPercent || 0.0001)).toFixed(2));
            suggestedLeverage = Number(Math.min(Math.max((riskRewardRatio / 0.02), 1), 150).toFixed(2));

            console.log("\x1b[33m%s\x1b[0m", `ℹ️ No persistent walls found; using conservative fallback SL/TP`);
            console.log("\x1b[33m%s\x1b[0m", `💰 Take Profit: ${takeProfitPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `🛡 Stop-Loss: ${stopLossPercent.toFixed(2)}%`);
            console.log("\x1b[33m%s\x1b[0m", `⚖️ Risk-Reward Ratio: ${riskRewardRatio.toFixed(2)}`);
        }
    }

    // ✅ Return structure kept like your original format plus additional useful fields (percent & prices)
    return {
        bids: lastSnapshot.bids,
        asks: lastSnapshot.asks,
        strongSupport,
        strongResistance,
        ltp,

        atr: atr !== undefined && atr !== null ? Number(atr.toFixed(8)) : null,

        // Prices
        stopLossPrice: stopLossPrice !== undefined && stopLossPrice !== null ? Number(stopLossPrice.toFixed(8)) : null,
        takeProfitPrice: takeProfitPrice !== undefined && takeProfitPrice !== null ? Number(takeProfitPrice.toFixed(8)) : null,

        // Percents (relative to LTP)
        stopLossPercent: stopLossPercent !== undefined && stopLossPercent !== null ? Number(stopLossPercent.toFixed(2)) : null,
        takeProfitPercent: takeProfitPercent !== undefined && takeProfitPercent !== null ? Number(takeProfitPercent.toFixed(2)) : null,

        riskRewardRatio: riskRewardRatio !== undefined && riskRewardRatio !== null ? Number(riskRewardRatio.toFixed(2)) : null,
        suggestedLeverage: suggestedLeverage !== undefined && suggestedLeverage !== null ? Number(suggestedLeverage.toFixed(2)) : null,

        largeBidWalls: persistentLargeBidWalls,
        largeAskWalls: persistentLargeAskWalls
    };
}

module.exports = { getAdvancedMarketMakers };
