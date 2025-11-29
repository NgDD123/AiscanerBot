// bestPairFinder.js
const { fetchAutomaticTradingPairs } = require('./topPairsFetcher');
const { evaluateStrategy } = require('./strategyEvaluator');
const { getAdvancedMarketMakers } = require('./marketMakers'); // your market makers file

// Global cache to prevent repeated picks
const qualifiedCache = {}; // { pair: timestamp }

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ---------------- Helper functions ----------------
function isRecentlyQualified(pair) {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  return qualifiedCache[pair] && (now - qualifiedCache[pair] < ONE_HOUR);
}

function markAsQualified(pair) {
  qualifiedCache[pair] = Date.now();
}

// ANSI Green for logs
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

// ---------------- Main function ----------------
async function findBestTradingPair(exchangeType = 'binancefutures') {
  try {
    const { topVolatilePairs, topGainerPairs, topVolumePairs } =
      await fetchAutomaticTradingPairs(exchangeType);

    const combinedPairs = [...new Set([
      ...topVolatilePairs,
      ...topGainerPairs,
      ...topVolumePairs,
    ])];

    console.log(`${GREEN}🔍 Evaluating ${combinedPairs.length} top pairs...${RESET}`);

    for (const pair of combinedPairs) {
      if (isRecentlyQualified(pair)) {
        console.log(`${GREEN}⏭️ Skipping ${pair}, already qualified in last hour${RESET}`);
        continue;
      }

      console.log(`${GREEN}📊 Evaluating pair: ${pair}${RESET}`);

      try {
        const strategyResult = await evaluateStrategy(pair);
        const marketData = await getAdvancedMarketMakers(pair, 1000, exchangeType, 3, 500);

        // ---------------- Safe numeric defaults ----------------
        const safeNumber = (value, fallback = 0) =>
          value != null && !isNaN(Number(value)) ? Number(value) : fallback;

        const strongSupport = marketData.strongSupport || { price: 0, qty: 0 };
        const strongResistance = marketData.strongResistance || { price: 0, qty: 0 };

        const bestPick = {
          pair,
          signal: strategyResult.signal || 'N/A',
          score: Math.max(safeNumber(strategyResult.buyScore, 0), safeNumber(strategyResult.sellScore, 0)),
          strongSupport,
          strongResistance,
          ltp: safeNumber(marketData.ltp),
          pipDistance: safeNumber(marketData.pipDistance),
          profitPercent: safeNumber(marketData.profitPercent),
          stopLoss: safeNumber(marketData.stopLoss),
          stopLossPips: safeNumber(marketData.stopLossPips),
          riskRewardRatio: safeNumber(marketData.riskRewardRatio, 1),
          suggestedLeverage: safeNumber(marketData.suggestedLeverage, 1),
          largeBidWalls: Array.isArray(marketData.persistentLargeBidWalls) ? marketData.persistentLargeBidWalls : [],
          largeAskWalls: Array.isArray(marketData.persistentLargeAskWalls) ? marketData.persistentLargeAskWalls : [],
        };

        const qualifies = bestPick.score >= 7;

        if (qualifies) {
          console.log(`${GREEN}✅ Qualified Pair: ${pair} (Signal: ${bestPick.signal})${RESET}`);
          markAsQualified(pair);

          console.log(`${GREEN}🚀 Selected Pair Metrics:
Pair: ${bestPick.pair}
Signal: ${bestPick.signal}
Score: ${bestPick.score}
🟢 Strong Support: ${bestPick.strongSupport.price} (Qty=${bestPick.strongSupport.qty})
🔴 Strong Resistance: ${bestPick.strongResistance.price} (Qty=${bestPick.strongResistance.qty})
LTP: ${bestPick.ltp}
Pip Distance: ${bestPick.pipDistance}
Profit %: ${bestPick.profitPercent}
Stop Loss: ${bestPick.stopLoss}
SL Pips: ${bestPick.stopLossPips}
R/R Ratio: ${bestPick.riskRewardRatio}
Leverage: ${bestPick.suggestedLeverage}${RESET}`);

          return bestPick; // return first qualified pair
        } else {
          console.log(`${GREEN}❌ Pair ${pair} did not meet score threshold (Buy: ${strategyResult.buyScore}, Sell: ${strategyResult.sellScore})${RESET}`);
        }
      } catch (err) {
        console.error(`${GREEN}⚠️ Error evaluating ${pair}: ${err.message}${RESET}`);
      }

      console.log(`${GREEN}⏳ Waiting 2 seconds before next evaluation...${RESET}`);
      await delay(2000);
    }

    console.log(`${GREEN}⛔ No pair qualified for trading (score >=7).${RESET}`);
    return null;

  } catch (err) {
    console.error(`${GREEN}❌ Error fetching top pairs or evaluating: ${err.message}${RESET}`);
    return null;
  }
}

module.exports = {
  findBestTradingPair,
};
