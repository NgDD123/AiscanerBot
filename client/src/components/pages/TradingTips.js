import React from "react";
import { motion } from "framer-motion";
import { FaChartLine, FaBitcoin, FaDollarSign, FaLightbulb, FaShieldAlt } from "react-icons/fa";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

// Sample trading tips data
const dailyTips = [
  {
    title: "Follow the Trend",
    icon: <FaChartLine />,
    text: "Always identify the market trend before entering a trade. Use EMA, SMA, or trendlines to guide your decisions.",
  },
  {
    title: "Manage Risk",
    icon: <FaShieldAlt />,
    text: "Never risk more than 1-2% of your capital per trade. Set stop-loss orders to protect your portfolio.",
  },
  {
    title: "Diversify Portfolio",
    icon: <FaDollarSign />,
    text: "Avoid putting all your funds into a single asset. Spread investments across markets for balanced risk.",
  },
  {
    title: "Crypto Insights",
    icon: <FaBitcoin />,
    text: "Stay updated with cryptocurrency news and on-chain data. Analyze top coins like BTC, ETH for entry signals.",
  },
  {
    title: "Continuous Learning",
    icon: <FaLightbulb />,
    text: "Study charts, candlestick patterns, and market psychology daily. Knowledge compounds into profitable trades.",
  },
];

const marketTips = [
  {
    market: "Forex",
    tips: [
      "Check economic calendar for news events.",
      "Focus on major currency pairs like EUR/USD or GBP/USD.",
      "Use leverage cautiously and follow strict money management.",
    ],
  },
  {
    market: "Stocks",
    tips: [
      "Analyze company fundamentals and earnings reports.",
      "Use technical indicators like RSI, MACD for entry points.",
      "Diversify sectors to reduce market-specific risk.",
    ],
  },
  {
    market: "Crypto",
    tips: [
      "Monitor blockchain activity and social sentiment.",
      "Use stop-losses to avoid high volatility losses.",
      "Follow market cycles and historical price patterns.",
    ],
  },
  {
    market: "Capital Markets",
    tips: [
      "Understand IPOs, bonds, and equities before investing.",
      "Evaluate macroeconomic trends affecting markets.",
      "Use professional reports and analyses for guidance.",
    ],
  },
];

const TradingTips = () => {
  return (
    <div className="w-full text-white bg-gray-900 overflow-hidden relative">

      {/* Floating Neon Shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 20, -20, 0], rotate: [0, 45, -45, 0] }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-40 h-40 rounded-full bg-purple-600 opacity-20 blur-3xl top-20 left-10 z-0"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -30, 30, 0], rotate: [0, 90, -90, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-60 h-60 rounded-full bg-pink-500 opacity-10 blur-2xl top-96 right-0 z-0"
      />

      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] flex flex-col justify-center items-center text-center bg-gradient-to-b from-gray-900 via-gray-800 to-black px-6 z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4 tracking-wide"
        >
          Trading Tips & Strategies
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl text-gray-300 text-lg md:text-xl"
        >
          Daily trading tips, strategies, and insights for cryptocurrencies, forex, stocks, ETFs, and capital markets. Become a smarter, more confident trader today.
        </motion.p>
      </section>

      {/* DAILY TIPS SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Daily Trading Tips
        </motion.h2>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-10">
          {dailyTips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 text-center cursor-pointer"
            >
              <div className="text-purple-400 text-5xl mb-4 flex justify-center">{tip.icon}</div>
              <h3 className="text-2xl font-bold text-purple-300 mb-2">{tip.title}</h3>
              <p className="text-gray-300">{tip.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MARKET-SPECIFIC TIPS SECTION */}
      <section className="py-20 px-6 bg-gray-800 relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Market-Specific Tips
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {marketTips.map((market, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-4">{market.market}</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {market.tips.map((tip, j) => (
                  <li key={j}>{tip}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STRATEGY & RISK MANAGEMENT SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Strategy & Risk Management
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Trading Strategies</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Follow trends, use breakouts, reversals, and scalping techniques.</li>
              <li>Combine technical indicators like EMA, MACD, RSI, and Bollinger Bands.</li>
              <li>Backtest strategies before applying to live trades.</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Risk Management</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Use stop-losses to limit losses and take-profits to secure gains.</li>
              <li>Never risk more than 1-2% of your capital per trade.</li>
              <li>Diversify across markets and asset types.</li>
              <li>Keep an emotional journal to track mistakes and successes.</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* RESOURCES & TOOLS SECTION */}
      <section className="py-20 px-6 bg-gray-900 relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Resources & Tools
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { title: "Live Charts", description: "Access real-time crypto, forex, and stock charts.", link: "#" },
            { title: "Trading Indicators", description: "Use EMA, RSI, MACD, Bollinger Bands, and more.", link: "#" },
            { title: "Market News", description: "Stay updated with daily news and insights.", link: "#" },
          ].map((res, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-2">{res.title}</h3>
              <p className="text-gray-300 mb-4">{res.description}</p>
              <a href={res.link} className="text-purple-400 font-bold hover:underline">
                Access Now
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 text-center bg-gray-900 px-6 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-purple-300 mb-4 tracking-wide"
        >
          Ready to Level Up Your Trading?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Join thousands of students mastering financial markets and profitable trading. Get actionable tips, strategies, and tools daily.
        </motion.p>

        <motion.a
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          href="/signup"
          className="px-12 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
        >
          Get Started
        </motion.a>
      </section>
    </div>
  );
};

export default TradingTips;
