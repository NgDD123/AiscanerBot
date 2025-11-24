const { fetchAutomaticTradingPairs } = require('./topPairsFetcher');
const { evaluateStrategy } = require('./strategyEvaluator');
const { getAdvancedMarketMakers } = require('./marketMakers'); // import your file

// Global cache to store recently qualified pairs
const qualifiedCache = {}; // { 'BTCUSDT': timestamp }

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: check if a pair qualified in the last hour
function isRecentlyQualified(pair) {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  return qualifiedCache[pair] && (now - qualifiedCache[pair] < ONE_HOUR);
}

// Helper: store the pair as qualified now
function markAsQualified(pair) {
  qualifiedCache[pair] = Date.now();
}

// Main selector function
async function findBestTradingPair(exchangeType = 'binancefutures') {
  const { topVolatilePairs, topGainerPairs, topVolumePairs } = await fetchAutomaticTradingPairs(exchangeType);

  const combinedPairs = [...new Set([
    ...topVolatilePairs,
    ...topGainerPairs,
    ...topVolumePairs,
  ])];

  console.log(`🔍 Evaluating ${combinedPairs.length} top pairs...`);

  let bestPick = null;

  for (const pair of combinedPairs) {
    if (isRecentlyQualified(pair)) {
      console.log(`⏭️ Skipping ${pair}, already qualified within the last hour.`);
      continue;
    }

    console.log(`\n📊 Evaluating pair: ${pair}`);

    try {
      const strategyResult = await evaluateStrategy(pair);

      // Get strong support/resistance from order book
      const marketData = await getAdvancedMarketMakers(pair, 1000, exchangeType, 3, 500);
      const strongSupport = marketData.strongSupport;
      const strongResistance = marketData.strongResistance;

      const qualifies = strategyResult.buyScore >= 4 || strategyResult.sellScore >= 4;

      if (qualifies) {
        console.log(`✅ Qualified Pair: ${pair} (Signal: ${strategyResult.signal})`);
        markAsQualified(pair);

        bestPick = {
          pair,
          signal: strategyResult.signal,
          score: strategyResult.buyScore >= 4 ? strategyResult.buyScore : strategyResult.sellScore,
          strongSupport,
          strongResistance
        };
        break; // exit after first qualified pair
      } else {
        console.log(`❌ Pair ${pair} did not meet score threshold (Buy: ${strategyResult.buyScore}, Sell: ${strategyResult.sellScore})`);
      }
    } catch (err) {
      console.error(`⚠️ Error evaluating ${pair}:`, err.message);
    }

    console.log(`⏳ Waiting 5 seconds before next evaluation...`);
    await delay(5000);
  }

  if (bestPick) {
    console.log(`\n🚀 Selected Pair to Trade: ${bestPick.pair}`);
    console.log(`   Signal: ${bestPick.signal} | Score: ${bestPick.score}`);
    console.log(`   🟢 Strong Support: ${bestPick.strongSupport ? `${bestPick.strongSupport.price} (Qty=${bestPick.strongSupport.qty})` : 'N/A'}`);
    console.log(`   🔴 Strong Resistance: ${bestPick.strongResistance ? `${bestPick.strongResistance.price} (Qty=${bestPick.strongResistance.qty})` : 'N/A'}`);
    return bestPick;
  } else {
    console.log(`⛔ No pair qualified for trading (score >=5).`);
    return null;
  }
}

module.exports = {
  findBestTradingPair,
};
