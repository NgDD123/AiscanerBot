const { SMA, EMA, WMA, RSI, MACD, BollingerBands, Stochastic, ATR, ADX, CCI, OBV, MFI } = require("technicalindicators");

// ---------------- Helper functions ----------------
const padArray = (arr, targetLength) => {
  const padding = Array(targetLength - arr.length).fill(null);
  return padding.concat(arr);
};

const calcVWAP = (candles) => {
  try {
    const out = [];
    let cumPV = 0, cumVol = 0;
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const typical = (c.high + c.low + c.close) / 3;
      const pv = typical * (c.volume || 0);
      cumPV += pv;
      cumVol += c.volume || 0;
      out.push(cumVol === 0 ? null : cumPV / cumVol);
    }
    return out;
  } catch (err) {
    console.error("VWAP calculation error:", err);
    return Array(candles.length).fill(null);
  }
};

const calcDonchian = (closes, period) => {
  try {
    if (!closes || closes.length < period) return Array(closes.length).fill(null);
    const upper = [], lower = [];
    for (let i = 0; i < closes.length; i++) {
      if (i - period + 1 < 0) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      const window = closes.slice(i - period + 1, i + 1);
      upper.push(Math.max(...window));
      lower.push(Math.min(...window));
    }
    return { upper, lower };
  } catch (err) {
    console.error("Donchian calculation error:", err);
    return { upper: Array(closes.length).fill(null), lower: Array(closes.length).fill(null) };
  }
};

const calcIchimoku = (candles, conv = 9, base = 26, spanPeriodB = 52, displacement = 26) => {
  try {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const len = candles.length;

    const highest = (arr, period, idx) => Math.max(...arr.slice(Math.max(0, idx - period + 1), idx + 1));
    const lowest = (arr, period, idx) => Math.min(...arr.slice(Math.max(0, idx - period + 1), idx + 1));

    const conversion = Array(len).fill(null);
    const baseLine = Array(len).fill(null);
    const spanA = Array(len).fill(null);
    const spanB = Array(len).fill(null);
    const lagging = Array(len).fill(null);

    for (let i = 0; i < len; i++) {
      if (i >= conv - 1) conversion[i] = (highest(highs, conv, i) + lowest(lows, conv, i)) / 2;
      if (i >= base - 1) baseLine[i] = (highest(highs, base, i) + lowest(lows, base, i)) / 2;
      if (conversion[i] !== null && baseLine[i] !== null) spanA[i] = (conversion[i] + baseLine[i]) / 2;
      if (i >= spanPeriodB - 1) spanB[i] = (highest(highs, spanPeriodB, i) + lowest(lows, spanPeriodB, i)) / 2;
      if (i - displacement >= 0) lagging[i] = closes[i - displacement];
    }

    const spanAForward = Array(len).fill(null);
    const spanBForward = Array(len).fill(null);
    for (let i = 0; i < len; i++) {
      const targetIdx = i + displacement;
      if (targetIdx < len) {
        spanAForward[targetIdx] = spanA[i];
        spanBForward[targetIdx] = spanB[i];
      }
    }

    return { conversion, baseLine, spanA, spanB, spanAForward, spanBForward, lagging };
  } catch (err) {
    console.error("Ichimoku calculation error:", err);
    const len = candles.length;
    return {
      conversion: Array(len).fill(null),
      baseLine: Array(len).fill(null),
      spanA: Array(len).fill(null),
      spanB: Array(len).fill(null),
      spanAForward: Array(len).fill(null),
      spanBForward: Array(len).fill(null),
      lagging: Array(len).fill(null),
    };
  }
};

const calcSupertrend = (candles, period = 10, multiplier = 3) => {
  try {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const atrValues = ATR.calculate({ period, high: highs, low: lows, close: closes });
    const len = candles.length;
    const result = Array(len).fill(null);
    if (!atrValues || atrValues.length === 0) return result;

    let prevFinalUpper = null, prevFinalLower = null, prevTrend = null;
    for (let i = 0; i < len; i++) {
      const atrIdx = i - (period - 1);
      if (atrIdx < 0) continue;
      const atr = atrValues[atrIdx];
      const hl2 = (highs[i] + lows[i]) / 2;
      const basicUpper = hl2 + multiplier * atr;
      const basicLower = hl2 - multiplier * atr;
      let finalUpper = basicUpper;
      let finalLower = basicLower;
      if (prevFinalUpper !== null) {
        finalUpper = basicUpper < prevFinalUpper || closes[i - 1] > prevFinalUpper ? basicUpper : prevFinalUpper;
        finalLower = basicLower > prevFinalLower || closes[i - 1] < prevFinalLower ? basicLower : prevFinalLower;
      }
      let trend = prevTrend;
      if (prevTrend === null) trend = closes[i] > finalUpper ? -1 : 1;
      else {
        if (prevTrend === 1 && closes[i] < finalUpper) trend = 1;
        else if (prevTrend === 1 && closes[i] > finalUpper) trend = -1;
        else if (prevTrend === -1 && closes[i] > finalLower) trend = -1;
        else if (prevTrend === -1 && closes[i] < finalLower) trend = 1;
      }
      result[i] = trend === 1 ? finalLower : finalUpper;
      prevFinalUpper = finalUpper;
      prevFinalLower = finalLower;
      prevTrend = trend;
    }
    return result;
  } catch (err) {
    console.error("Supertrend calculation error:", err);
    return Array(candles.length).fill(null);
  }
};

const calcKeltner = (candles, emaPeriod = 20, atrPeriod = 10, multiplier = 1.5) => {
  try {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const emaValues = EMA.calculate({ period: emaPeriod, values: closes });
    const atrValues = ATR.calculate({ period: atrPeriod, high: highs, low: lows, close: closes });
    const len = candles.length;
    const upper = Array(len).fill(null);
    const lower = Array(len).fill(null);
    for (let i = 0; i < len; i++) {
      const emaIdx = i - (emaPeriod - 1);
      const atrIdx = i - (atrPeriod - 1);
      if (emaIdx < 0 || atrIdx < 0) continue;
      const ema = emaValues[emaIdx];
      const atr = atrValues[atrIdx];
      upper[i] = ema + multiplier * atr;
      lower[i] = ema - multiplier * atr;
    }
    return { upper, lower };
  } catch (err) {
    console.error("Keltner calculation error:", err);
    return { upper: Array(candles.length).fill(null), lower: Array(candles.length).fill(null) };
  }
};

// ---------------- Main export ----------------
const computeChartMultiTimeframe = (candles) => {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  const len = candles.length;

  try { var sma20 = padArray(SMA.calculate({ period: 20, values: closes }), len); } 
  catch (err) { console.error("SMA20 calculation error:", err); var sma20 = Array(len).fill(null); }

  try { var ema20 = padArray(EMA.calculate({ period: 20, values: closes }), len); } 
  catch (err) { console.error("EMA20 calculation error:", err); var ema20 = Array(len).fill(null); }

  try { var ema50 = padArray(EMA.calculate({ period: 50, values: closes }), len); } 
  catch (err) { console.error("EMA50 calculation error:", err); var ema50 = Array(len).fill(null); }

  try { var wma20 = padArray(WMA.calculate({ period: 20, values: closes }), len); } 
  catch (err) { console.error("WMA20 calculation error:", err); var wma20 = Array(len).fill(null); }

  try { var rsi14 = padArray(RSI.calculate({ period: 14, values: closes }), len); } 
  catch (err) { console.error("RSI14 calculation error:", err); var rsi14 = Array(len).fill(null); }

  try { var macdRaw = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }); var macd = padArray(macdRaw, len); } 
  catch (err) { console.error("MACD calculation error:", err); var macd = Array(len).fill(null); }

  try { var bollinger20 = padArray(BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 }), len); } 
  catch (err) { console.error("Bollinger20 calculation error:", err); var bollinger20 = Array(len).fill(null); }

  try { var stoch = padArray(Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3, smooth: 3 }), len); } 
  catch (err) { console.error("STOCH calculation error:", err); var stoch = Array(len).fill(null); }

  try { var atr14 = padArray(ATR.calculate({ period: 14, high: highs, low: lows, close: closes }), len); } 
  catch (err) { console.error("ATR14 calculation error:", err); var atr14 = Array(len).fill(null); }

  try { var adx14 = padArray(ADX.calculate({ period: 14, high: highs, low: lows, close: closes }), len); } 
  catch (err) { console.error("ADX14 calculation error:", err); var adx14 = Array(len).fill(null); }

  try { var cci20 = padArray(CCI.calculate({ period: 20, high: highs, low: lows, close: closes }), len); } 
  catch (err) { console.error("CCI20 calculation error:", err); var cci20 = Array(len).fill(null); }

  try { var obv = padArray(OBV.calculate({ close: closes, volume: volumes }), len); } 
  catch (err) { console.error("OBV calculation error:", err); var obv = Array(len).fill(null); }

  try { var mfi14 = padArray(MFI.calculate({ period: 14, high: highs, low: lows, close: closes, volume: volumes }), len); } 
  catch (err) { console.error("MFI14 calculation error:", err); var mfi14 = Array(len).fill(null); }

  let vwap, supertrend, keltner, donchian20, ichimoku;

  try { vwap = calcVWAP(candles); } 
  catch (err) { console.error("VWAP calculation error:", err); vwap = Array(len).fill(null); }

  try { supertrend = calcSupertrend(candles); } 
  catch (err) { console.error("Supertrend calculation error:", err); supertrend = Array(len).fill(null); }

  try { keltner = calcKeltner(candles); } 
  catch (err) { console.error("Keltner calculation error:", err); keltner = { upper: Array(len).fill(null), lower: Array(len).fill(null) }; }

  try { donchian20 = calcDonchian(closes, 20); } 
  catch (err) { console.error("Donchian20 calculation error:", err); donchian20 = { upper: Array(len).fill(null), lower: Array(len).fill(null) }; }

  try { ichimoku = calcIchimoku(candles); } 
  catch (err) { console.error("Ichimoku calculation error:", err); ichimoku = { conversion: Array(len).fill(null), baseLine: Array(len).fill(null), spanA: Array(len).fill(null), spanB: Array(len).fill(null), spanAForward: Array(len).fill(null), spanBForward: Array(len).fill(null), lagging: Array(len).fill(null) }; }

  return {
    SMA20: sma20,
    EMA20: ema20,
    EMA50: ema50,
    WMA20: wma20,
    RSI14: rsi14,
    MACD: macd,
    Bollinger20: bollinger20,
    STOCH: stoch,
    ATR14: atr14,
    ADX14: adx14,
    CCI20: cci20,
    OBV: obv,
    MFI14: mfi14,
    VWAP: vwap,
    Supertrend: supertrend,
    Keltner: keltner,
    Donchian20: donchian20,
    Ichimoku: ichimoku,
  };
};

module.exports = { computeChartMultiTimeframe };
