import React, { useState, useEffect, useRef } from "react";
import "./Home.css";

import botImage from "../../../assets/freedom ui2-01.png";
import Faq from "../../Faq";
import ContactSection from "../ContactusForm";

import { motion } from "framer-motion";

/* -----------------------------------------------------------
   BTC MARKET CARD
------------------------------------------------------------ */
const BTCMarketCard = () => {
  const [tab, setTab] = useState("orderbook");

  useEffect(() => {
    if (!window.TradingView) return;

    new window.TradingView.widget({
      autosize: true,
      symbol: "BTCUSD",
      interval: "60",
      container_id: "btc-mini-chart",
      theme: "dark",
      style: "1",
      hide_top_toolbar: true,
      hide_legend: true,
      withdateranges: false,
      details: false,
      toolbar_bg: "rgba(0,0,0,0)",
    });
  }, []);

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

      {/* LIVE TradingView Chart */}
      <div className="w-full h-60 mt-6 rounded-xl overflow-hidden border border-gray-700">
        <div id="btc-mini-chart" style={{ width: "100%", height: "100%" }}></div>
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
   LIVE CRYPTO MARKET CARDS WITH TRADINGVIEW WIDGETS
------------------------------------------------------------ */
const LiveCryptoCards = () => {
  const cryptoList = [
    {
      name: "Bitcoin",
      symbol: "BTCUSDT",
      tvSymbol: "BINANCE:BTCUSDT",
      logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    },
    {
      name: "Ethereum",
      symbol: "ETHUSDT",
      tvSymbol: "BINANCE:ETHUSDT",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    },
    {
      name: "Tether",
      symbol: "USDTUSDT",
      tvSymbol: "BINANCE:USDTUSDT",
      logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    },
  ];

  const [prices, setPrices] = useState({});
  const [usdToRwf, setUsdToRwf] = useState(1300);
  const [selectedSymbol, setSelectedSymbol] = useState(cryptoList[0].tvSymbol);

  const mainChartRef = useRef(null);
  const miniChartRefs = useRef({});

  /* ------------------------------ FX RATE ------------------------------ */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data?.rates?.RWF) setUsdToRwf(data.rates.RWF);
      } catch (err) {
        console.error("Failed to fetch FX rate:", err);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 600000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------------------ LIVE PRICE STREAM ------------------------------ */
  useEffect(() => {
    const streamNames = cryptoList
      .map((c) => `${c.symbol.toLowerCase()}@ticker`)
      .join("/");
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streamNames}`
    );

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const d = msg?.data;
      if (!d) return;

      setPrices((prev) => ({
        ...prev,
        [d.s]: {
          price: parseFloat(d.c),
          change: parseFloat(d.P).toFixed(2),
        },
      }));
    };

    return () => ws.close();
  }, []);

  /* ------------------------------ MAIN TRADINGVIEW WIDGET ------------------------------ */
  useEffect(() => {
    if (!window.TradingView || !mainChartRef.current) return;

    mainChartRef.current.innerHTML = ""; // Clear previous chart

    new window.TradingView.widget({
      autosize: true,
      symbol: selectedSymbol,
      interval: "60",
      container_id: "main-tradingview-chart",
      theme: "light",
      style: 3,
      hide_top_toolbar: true,
      hide_legend: true,
      hide_volume: true,
      withdateranges: false,
      details: false,
      toolbar_bg: "rgba(0,0,0,0)",
    });
  }, [selectedSymbol]);

  /* ------------------------------ MINI WIDGETS ------------------------------ */
  useEffect(() => {
    cryptoList.forEach((c) => {
      if (!window.TradingView || !miniChartRefs.current[c.symbol]) return;

      // Clear previous widget if exists
      miniChartRefs.current[c.symbol].innerHTML = "";

      new window.TradingView.widget({
        autosize: true,
        symbol: c.tvSymbol,
        interval: "60",
        container_id: `mini-chart-${c.symbol}`,
        theme: "light",
        style: 1,
        hide_top_toolbar: true,
        hide_legend: true,
        withdateranges: false,
        details: false,
        toolbar_bg: "rgba(0,0,0,0)",
      });
    });
  }, [cryptoList]);

  return (
    <section className="w-full px-4 py-10 bg-white md:flex md:gap-10">
      {/* LEFT — PRICE + MAIN CHART */}
      <div className="w-full md:w-2/3">
        {/* Time Tabs */}
        <div className="flex gap-4 mb-4">
          <button className="bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-lg">
            1H
          </button>
          <button className="text-gray-500">1D</button>
          <button className="text-gray-500">1W</button>
          <button className="text-gray-500">1M</button>
        </div>

        {/* MAIN DISPLAY PRICE */}
        <h1 className="text-4xl font-bold">
          RWF{" "}
          {prices["BTCUSDT"]
            ? (prices["BTCUSDT"].price * usdToRwf).toLocaleString()
            : "0"}
        </h1>

        <p className="text-red-500 text-lg mt-1">↓ 0.22%</p>

        {/* MAIN TRADINGVIEW CHART */}
        <div
          ref={mainChartRef}
          id="main-tradingview-chart"
          style={{ width: "100%", height: "300px" }}
          className="mt-6 rounded-xl overflow-hidden border border-gray-200"
        ></div>
      </div>

      {/* RIGHT — TOP ASSETS LIST WITH MINI CHARTS */}
      <div className="w-full md:w-1/3 mt-10 md:mt-0 space-y-6">
        <h2 className="text-xl font-bold mb-4">Top Assets</h2>

        {cryptoList.map((c) => {
          const p = prices[c.symbol] || { price: 0, change: 0 };
          const priceRwf = (p.price * usdToRwf).toLocaleString();

          return (
            <div
              key={c.symbol}
              className="bg-gray-50 rounded-xl p-4 cursor-pointer shadow hover:shadow-md"
              onClick={() => setSelectedSymbol(c.tvSymbol)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img src={c.logo} className="w-8 h-8" alt={c.name} />
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-gray-500 text-sm">RWF {priceRwf}</p>
                  </div>
                </div>
                <p
                  className={
                    p.change >= 0
                      ? "text-green-500 font-bold"
                      : "text-red-500 font-bold"
                  }
                >
                  {p.change >= 0 ? `↑ ${p.change}%` : `↓ ${p.change}%`}
                </p>
              </div>

              {/* MINI TRADINGVIEW CHART */}
              <div
                id={`mini-chart-${c.symbol}`}
                ref={(el) => (miniChartRefs.current[c.symbol] = el)}
                style={{ width: "100%", height: "80px" }}
                className="rounded-lg overflow-hidden border border-gray-200"
              ></div>
            </div>
          );
        })}
      </div>
    </section>
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
   LIVE CRYPTO MARKET CARDS
------------------------------------------------------------ */
const LiveCryptoCard = () => {
  const cryptoList = [
    { name: "Bitcoin", symbol: "BTCUSDT", logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    { name: "Ethereum", symbol: "ETHUSDT", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { name: "Tether", symbol: "USDTUSDT", logo: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    { name: "XRP", symbol: "XRPUSDT", logo: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
    { name: "BNB", symbol: "BNBUSDT", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
    { name: "USDC", symbol: "USDCUSDT", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
  ];

  const [prices, setPrices] = useState({});
  const [usdToRwf, setUsdToRwf] = useState(1300);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data && data.rates && data.rates.RWF) setUsdToRwf(data.rates.RWF);
      } catch (err) {
        console.error("Failed to fetch USD → RWF rate:", err);
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const streams = cryptoList.map((c) => `${c.symbol.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message && message.data) {
        const data = message.data;
        setPrices((prev) => ({
          ...prev,
          [data.s]: { price: parseFloat(data.c), change: parseFloat(data.P).toFixed(2) },
        }));
      }
    };
    return () => ws.close();
  }, []);

  return (
    <section className="w-full py-16 bg-gray-900 px-4">
      <div className="text-center mb-10">
        <h3 className="text-sm tracking-wide text-purple-400 font-semibold mb-2">Live Market Overview</h3>
        <h2 className="text-3xl md:text-4xl font-extrabold">Cryptocurrency Prices</h2>
        <p className="text-gray-300 mt-2">Track real-time crypto prices in Rwandan Francs (RWF).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {cryptoList.map((crypto) => {
          const priceData = prices[crypto.symbol] || { price: 0, change: 0 };
          const priceRwf = (priceData.price * usdToRwf).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return (
            <div key={crypto.symbol} className="bg-black border border-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={crypto.logo} className="w-10 h-10" alt={crypto.name} />
                  <div>
                    <p className="font-bold text-lg">{crypto.name}</p>
                    <p className="text-gray-400 text-sm">RWF {priceRwf}</p>
                  </div>
                </div>
                <p className={`font-bold ${parseFloat(priceData.change) > 0 ? "text-green-400" :
                    parseFloat(priceData.change) < 0 ? "text-red-400" :
                      "text-gray-400"
                  }`}>
                  {parseFloat(priceData.change) > 0 ? `↑ ${priceData.change}%` :
                    parseFloat(priceData.change) < 0 ? `↓ ${Math.abs(priceData.change)}%` :
                      `○ ${priceData.change}%`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
      <div className="flex flex-col gap-y-8 py-10 px-4 bg-gray-900 rounded-xl">
        {/* Top content */}
        <div className="flex flex-col gap-y-6">
          <p className="bg-gradient-to-r from-white via-purple-600 to-purple-400 bg-clip-text text-4xl md:text-5xl font-bold text-transparent">
            Freedom Trading Bot
          </p>

          <div className="text-lg text-white font-medium">
            Unlock your financial freedom with our Freedom trading bot and move
            to the moon of success, maximizing profits effortlessly while you
            focus on what matters.
          </div>

          {/* Demo Button */}
          <button
            onClick={handleBookDemo}
            className="p-2 rounded-2xl bg-white text-purple-600 w-full md:w-40 font-bold"
          >
            BOOK A DEMO
          </button>
        </div>

        {/* Cards Section */}
        <div className="flex flex-col md:flex-row gap-6 mt-6 w-full">
          {/* Left card: full width, independent height */}
          <div className="flex-1 w-120 rounded-2xl overflow-hidden">
            <BTCMarketCard />
          </div>

          {/* Right card: full width on mobile, fixed width on desktop, independent height */}
          <div className="w-full md:w-3/5 h-100 mt-24 rounded-2xl overflow-hidden">
            <LiveCryptoCards />
          </div>
        </div>
      </div>





      {/* TRADING PLANS */}
      <section className="w-full py-16 bg-black px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-transparent">
              Choose Your Trading Plan
            </span>
          </h2>

          <p className="text-gray-300 mt-3">Select the perfect plan for your trading needs.</p>
        </div>

        <PricingPlans />
      </section>
      {/* FIRST LIVE CRYPTO CARDS */}
      <LiveCryptoCard />




      {/* POWERFUL FEATURES */}
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
          {/* Feature Cards */}
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

          <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-700 mb-5">
              <span className="text-xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Customizable Strategies</h3>
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
