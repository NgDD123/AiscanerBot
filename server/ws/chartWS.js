// server/ws/chartWS.js
// WebSocket server which accepts frontend subscriptions and streams processed candles + indicators.
// Exports startChartWSServer(server)

const WebSocket = require("ws");
const { computeChart } = require("../models/chartModel");
const { getQualifiedPairForChart } = require("../services/chartPairSelector");

// <-- Adjust if fetchKlines is in a different path
const { fetchKlines } = require("../services/binance");

const validIntervals = new Set([
    "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"
]);

function startChartWSServer(server) {
    const wss = new WebSocket.Server({ server, path: "/ws/chart" });

    wss.on("connection", (ws) => {
        ws.isAlive = true;
        ws.on("pong", () => (ws.isAlive = true));

        let binanceSocket = null;
        let candlesCache = [];
        let subscribed = { symbol: null, interval: null };

        const cleanupBinance = () => {
            try {
                if (binanceSocket) {
                    binanceSocket.close();
                    binanceSocket = null;
                }
            } catch (e) { }
        };

        ws.on("message", async (message) => {
            // client should send JSON commands:
            // { action: "subscribe", symbol?: "BTCUSDT", interval?: "1m", limit?: 500 }
            // or { action: "unsubscribe" }
            let msg;
            try {
                msg = JSON.parse(message.toString());
            } catch (err) {
                ws.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
                return;
            }

            if (msg.action === "unsubscribe") {
                cleanupBinance();
                subscribed = { symbol: null, interval: null };
                ws.send(JSON.stringify({ type: "unsubscribed" }));
                return;
            }

            if (msg.action === "subscribe") {
                // determine pair: client-provided or auto-qualified
                const interval = msg.interval || "1m";
                const limit = Number(msg.limit) || 500;
                let symbol = msg.symbol;

                if (!symbol) {
                    const q = await getQualifiedPairForChart();
                    symbol = q.pair;
                }

                if (!validIntervals.has(interval)) {
                    ws.send(JSON.stringify({ type: "error", message: "invalid interval" }));
                    return;
                }

                subscribed = { symbol, interval };

                // fetch initial candles snapshot via fetchKlines
                try {
                    candlesCache = await fetchKlines(symbol, interval, limit);
                } catch (err) {
                    ws.send(JSON.stringify({ type: "error", message: "failed fetching initial klines: " + (err.message || err) }));
                    return;
                }

                // send snapshot (processed)
                const processed = computeChart(candlesCache);
                ws.send(JSON.stringify({
                    type: "snapshot",
                    symbol,
                    interval,
                    data: processed
                }));

                // connect to Binance kline stream for real-time updates
                cleanupBinance();
                const streamUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
                binanceSocket = new WebSocket(streamUrl);

                binanceSocket.on("message", (data) => {
                    try {
                        const msg = JSON.parse(data.toString());
                        if (!msg.k) return;
                        const k = msg.k;
                        const candle = {
                            time: k.t,
                            open: Number(k.o),
                            high: Number(k.h),
                            low: Number(k.l),
                            close: Number(k.c),
                            volume: Number(k.v),
                        };

                        const last = candlesCache[candlesCache.length - 1];
                        // align by millisecond; Binance gives same openTime for updates; keep last element updated while k.x === false
                        if (last && last.time === candle.time) {
                            candlesCache[candlesCache.length - 1] = candle;
                        } else {
                            candlesCache.push(candle);
                            if (candlesCache.length > 1500) candlesCache.shift();
                        }

                        const processed = computeChart(candlesCache);

                        ws.send(JSON.stringify({
                            type: "update",
                            symbol,
                            interval,
                            klineClosed: !!k.x,
                            latestCandle: candle,
                            data: processed
                        }));
                    } catch (err) {
                        // ignore per-message parse errors
                    }
                });

                binanceSocket.on("error", (e) => {
                    // optionally notify client
                });

                binanceSocket.on("close", () => {
                    // stream closed
                });

                // done subscribe
                return;
            }

            ws.send(JSON.stringify({ type: "error", message: "unknown action" }));
        });

        ws.on("close", () => {
            cleanupBinance();
        });

        // heartbeat
        const intervalId = setInterval(() => {
            if (!ws.isAlive) {
                ws.terminate();
                clearInterval(intervalId);
                cleanupBinance();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        }, 30000);
    });

    // server-level ping
    const pingInterval = setInterval(() => {
        wss.clients.forEach((c) => {
            if (c.isAlive === false) return c.terminate();
            c.isAlive = false;
            c.ping(() => { });
        });
    }, 30000);

    wss.on("close", () => clearInterval(pingInterval));

    console.log("Chart WSS running at /ws/chart");
    return wss;
}

module.exports = { startChartWSServer };
