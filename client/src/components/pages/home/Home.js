// Home.jsx
import React, { useState } from "react";
import "./Home.css";

import botImage from "../../../assets/freedom ui2-01.png";
import Faq from "../../Faq";
import ContactSection from "../ContactusForm";

import { motion, AnimatePresence } from "framer-motion";

/* -----------------------------------------------------------
   FULL BTC TRADING CARD COMPONENT (LIKE SCREENSHOT)
------------------------------------------------------------ */
const BTCMarketCard = () => {
  const [tab, setTab] = useState("orderbook");

  return (
    <div className="bg-black border border-gray-800 rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-6 text-white mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img
            src="https://cryptologos.cc/logos/bitcoin-btc-logo.png"
            alt="BTC"
            className="w-9 h-9"
          />
          <span className="font-semibold text-lg">BTC-USD</span>
        </div>

        <button className="text-gray-300 text-lg">☆</button>
      </div>

      {/* Price Section */}
      <div>
        <p className="text-4xl font-bold">$28,888.69</p>
        <p className="text-green-500 font-semibold text-sm mt-1">+1.21%</p>

        <div className="grid grid-cols-3 gap-4 text-sm mt-5">
          <div>
            <p className="text-gray-400">High</p>
            <p className="font-semibold">$29,105.94</p>
          </div>
          <div>
            <p className="text-gray-400">Low</p>
            <p className="font-semibold">$26,304.02</p>
          </div>
          <div>
            <p className="text-gray-400">Vol</p>
            <p className="font-semibold">19,050.00</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="text-gray-400">Bid</p>
            <p className="font-semibold text-green-500">$28,880.03</p>
          </div>
          <div>
            <p className="text-gray-400">Ask</p>
            <p className="font-semibold text-red-500">$28,890.03</p>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="w-full h-60 bg-gray-900 rounded-xl border border-gray-700 mt-6 flex items-center justify-center text-gray-400">
        📊 Candle Chart Coming Soon
      </div>

      {/* Tabs */}
      <div className="flex mt-5 text-sm border-b border-gray-700">
        <button
          onClick={() => setTab("orderbook")}
          className={`px-4 py-2 ${tab === "orderbook"
            ? "border-b-2 border-purple-500 font-semibold"
            : "text-gray-400"
            }`}
        >
          Order book
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 ${tab === "history"
            ? "border-b-2 border-purple-500 font-semibold"
            : "text-gray-400"
            }`}
        >
          Trade history
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 ${tab === "orders"
            ? "border-b-2 border-purple-500 font-semibold"
            : "text-gray-400"
            }`}
        >
          Orders
        </button>
      </div>

      {/* ORDER BOOK TABLE */}
      {tab === "orderbook" && (
        <div className="mt-5 text-sm">
          <div className="grid grid-cols-4 text-gray-400 mb-2">
            <p>Amount (BTC)</p>
            <p>Bid (USD)</p>
            <p>Ask (USD)</p>
            <p>Amount (BTC)</p>
          </div>

          <div className="grid grid-cols-4 py-2 border-b border-gray-800">
            <p>0.0600</p>
            <p className="text-green-400">28,330.03</p>
            <p className="text-red-400">28,331.03</p>
            <p>0.0600</p>
          </div>

          <div className="grid grid-cols-4 py-2 border-b border-gray-800">
            <p>0.0600</p>
            <p className="text-green-400">28,329.01</p>
            <p className="text-red-400">28,331.41</p>
            <p>0.0600</p>
          </div>
        </div>
      )}

      {/* BUY / SELL BUTTONS */}
      <div className="flex gap-4 mt-6">
        <button className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold">
          Buy
        </button>
        <button className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold">
          Sell
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mt-3">
        AVAILABLE BALANCE: <span className="text-white">3.44678 BTC</span> —{" "}
        <span className="text-white">$99,572.96</span>
      </p>
    </div>
  );
};


/* -----------------------------------------------------------
   PRICING PLANS COMPONENT
------------------------------------------------------------ */
const PricingPlans = () => {
  const plans = [
    {
      id: "monthly",
      title: "Monthly",
      price: "$50",
      subtitle: "/month",
      description: "Flexible month-to-month subscription",
      bullets: [
        "Access to all trading strategies",
        "Real-time market analysis",
        "Up to 10 simultaneous trades",
        "Email support",
        "Mobile app access",
        "Daily market reports",
      ],
      highlight: false,
    },
    {
      id: "yearly",
      title: "Yearly",
      price: "$450",
      subtitle: "/year",
      description: "Our best value plan with annual billing",
      bullets: [
        "Access to all trading strategies",
        "Real-time market analysis",
        "Unlimited simultaneous trades",
        "Priority email support",
        "Mobile app access",
        "Daily market reports",
        "Advanced trading algorithms",
        "API access",
      ],
      highlight: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ scale: 1.02, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-2xl p-8 border ${p.highlight ? "border-purple-600" : "border-purple-700"
              } bg-gradient-to-b from-gray-900 to-black shadow-lg`}
          >
            {p.highlight && (
              <div className="absolute top-3 right-3 bg-purple-700 text-xs px-3 py-1 rounded-full">
                Save 25%
              </div>
            )}

            <div className="flex items-baseline gap-x-4">
              <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                {p.price}
              </h3>
              <span className="text-md text-gray-300">{p.subtitle}</span>
            </div>

            <p className="text-gray-300 mt-2 mb-6">{p.description}</p>

            <ul className="text-gray-300 space-y-3 mb-6">
              {p.bullets.map((b, idx) => (
                <li key={idx} className="flex items-start gap-x-3">
                  <svg
                    className="w-5 h-5 mt-1 text-green-400 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M16.7 5.3a1 1 0 00-1.4 0L8 12.6 4.7 9.3a1 1 0 00-1.4 1.4l4 4a1 1 0 001.4 0l8-8a1 1 0 000-1.4z" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold text-white"
            >
              Get Started
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/* -----------------------------------------------------------
   HOME PAGE
------------------------------------------------------------ */
const Home = () => {
  const [billing, setBilling] = useState("monthly");

  const handleBookDemo = () => {
    window.location.replace("/login");
  };

  return (
    <div className="flex flex-col min-h-[20rem] w-full text-white">
      {/* HERO */}
      <div className="flex flex-col gap-y-8 md:flex-row justify-between py-10 px-4 bg-gray-900 rounded-xl">
        <div className="flex flex-col basis-1/2 gap-y-6">
          <p className="bg-gradient-to-r from-white via-purple-600 to-major-text-style bg-clip-text text-4xl md:text-5xl font-bold text-transparent">
            Freedom Trading Bot
          </p>

          <div className="md:w-[85%] text-lg text-white font-medium">
            Unlock your financial freedom with our Freedom trading bot and move
            to the moon of success, maximizing profits effortlessly while you
            focus on what matters.
          </div>

          <button
            onClick={handleBookDemo}
            className="p-2 rounded-2xl bg-white text-purple-600 w-[90%] mx-auto md:mx-0 md:w-40 font-bold"
          >
            BOOK A DEMO
          </button>
          <BTCMarketCard />
        </div>

        <div className="basis-1/2 flex justify-center">
          {/* <img src={botImage} alt="Bot" className="max-w-xs md:max-w-md" /> */}
        </div>
      </div>

      {/* -------------------------------------------------------
         CHOOSE YOUR TRADING PLAN
      -------------------------------------------------------- */}
      <section className="w-full py-16 bg-black px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-transparent">
              Choose Your Trading Plan
            </span>
          </h2>

          <p className="text-gray-300 mt-3">
            Select the perfect plan for your trading needs.
          </p>
        </div>

        <PricingPlans />
      </section>

      {/* -------------------------------------------------------
         LIVE CRYPTO MARKET CARDS (NEW SECTION ADDED)
      -------------------------------------------------------- */}
      <section className="w-full py-16 bg-gray-900 px-4">
        <div className="text-center mb-10">
          <h3 className="text-sm tracking-wide text-purple-400 font-semibold mb-2">
            Live Market Overview
          </h3>

          <h2 className="text-3xl md:text-4xl font-extrabold">
            Cryptocurrency Prices
          </h2>

          <p className="text-gray-300 mt-2">
            Track real-time crypto prices based on global market movements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Bitcoin */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/bitcoin-btc-logo.png"
                  className="w-10 h-10"
                  alt="BTC"
                />
                <div>
                  <p className="font-bold text-lg">Bitcoin</p>
                  <p className="text-gray-400 text-sm">RWF 127,284,087.21</p>
                </div>
              </div>
              <p className="text-green-400 font-bold">↑ 1.08%</p>
            </div>
          </div>

          {/* Ethereum */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                  className="w-10 h-10"
                  alt="ETH"
                />
                <div>
                  <p className="font-bold text-lg">Ethereum</p>
                  <p className="text-gray-400 text-sm">RWF 4,117,249.54</p>
                </div>
              </div>
              <p className="text-red-400 font-bold">↓ 0.83%</p>
            </div>
          </div>

          {/* USDT */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                  className="w-10 h-10"
                  alt="USDT"
                />
                <div>
                  <p className="font-bold text-lg">Tether</p>
                  <p className="text-gray-400 text-sm">RWF 1,456.82</p>
                </div>
              </div>
              <p className="text-green-400 font-bold">↑ 0.02%</p>
            </div>
          </div>

          {/* XRP */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/xrp-xrp-logo.png"
                  className="w-10 h-10"
                  alt="XRP"
                />
                <div>
                  <p className="font-bold text-lg">XRP</p>
                  <p className="text-gray-400 text-sm">RWF 2,967.76</p>
                </div>
              </div>
              <p className="text-red-400 font-bold">↓ 0.22%</p>
            </div>
          </div>

          {/* BNB */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/bnb-bnb-logo.png"
                  className="w-10 h-10"
                  alt="BNB"
                />
                <div>
                  <p className="font-bold text-lg">BNB</p>
                  <p className="text-gray-400 text-sm">RWF 1,230,041.77</p>
                </div>
              </div>
              <p className="text-green-400 font-bold">↑ 2.28%</p>
            </div>
          </div>

          {/* USDC */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
                  className="w-10 h-10"
                  alt="USDC"
                />
                <div>
                  <p className="font-bold text-lg">USDC</p>
                  <p className="text-gray-400 text-sm">RWF 1,456.82</p>
                </div>
              </div>
              <p className="text-gray-400 font-bold">○ 0.00%</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------
         POWERFUL FEATURES — ADVANCED TRADING TOOLS
      -------------------------------------------------------- */}
      <section className="w-full py-20 bg-[#0b0b0e] px-4">
        <div className="text-center mb-14">
          <h3 className="text-sm tracking-wide text-purple-400 font-semibold mb-3">
            Powerful Features
          </h3>

          <h2 className="text-4xl md:text-5xl font-extrabold mb-3">
            Advanced Trading Tools
          </h2>

          <p className="text-gray-300 max-w-2xl mx-auto">
            Our bot comes equipped with everything you need to succeed in
            today’s volatile markets.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {/* Card 1 */}
          <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-700 mb-5">
              <span className="text-xl">📈</span>
            </div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-400 text-sm mb-4">
              Advanced algorithms that analyze market trends in real-time.
            </p>
            <p className="text-gray-400 text-sm">
              Our AI continuously monitors markets, identifies patterns, and
              predicts profitable trades with remarkable accuracy.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-700 mb-5">
              <span className="text-xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Advanced Security</h3>
            <p className="text-gray-400 text-sm mb-4">
              Enterprise-grade protection for your investments.
            </p>
            <p className="text-gray-400 text-sm">
              Multi-layer encryption, two-factor authentication, and strict
              access controls keep your funds secure.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-700 mb-5">
              <span className="text-xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              Customizable Strategies
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tailor the bot to your trading preferences.
            </p>
            <p className="text-gray-400 text-sm">
              Configure risk levels, trading pairs, and strategies to match your
              goals and risk tolerance.
            </p>
          </div>
        </motion.div>
      </section>

      {/* REST OF PAGE */}
      <Faq />
      <ContactSection />
    </div>
  );
};

export default Home;
