import React from "react";
import { motion } from "framer-motion";
import { FaBitcoin, FaChartLine, FaUniversity, FaBuilding } from "react-icons/fa";

// Fade-in helper
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

// Updated Course data with detailed summaries and icons
const courses = [
  {
    title: "Cryptocurrency Trading",
    description:
      "Master digital currencies like Bitcoin, Ethereum, and altcoins. Learn technical analysis, wallets, DeFi, smart contracts, and trading strategies to confidently navigate crypto markets.",
    topics: [
      { icon: <FaBitcoin />, text: "Crypto Fundamentals" },
      { icon: <FaBitcoin />, text: "Blockchain & Wallets" },
      { icon: <FaChartLine />, text: "Trading Strategies" },
      { icon: <FaChartLine />, text: "Technical Analysis" },
      { icon: <FaBitcoin />, text: "DeFi & Smart Contracts" },
      { icon: <FaChartLine />, text: "Risk Management" },
    ],
  },
  {
    title: "Forex Trading",
    description:
      "Unlock the secrets of global currency trading. Learn chart patterns, technical indicators, leverage, and automated systems to trade Forex like a professional.",
    topics: [
      { icon: <FaChartLine />, text: "Forex Basics" },
      { icon: <FaChartLine />, text: "Currency Pairs & Spreads" },
      { icon: <FaChartLine />, text: "Chart Patterns & Trends" },
      { icon: <FaChartLine />, text: "Technical Indicators" },
      { icon: <FaChartLine />, text: "Automated Trading" },
      { icon: <FaChartLine />, text: "Risk & Money Management" },
    ],
  },
  {
    title: "Stock Market Investing",
    description:
      "Invest like a pro! Learn company analysis, portfolio building, ETFs, dividends, and both long-term and short-term strategies for sustainable wealth creation.",
    topics: [
      { icon: <FaUniversity />, text: "Stock Fundamentals" },
      { icon: <FaUniversity />, text: "Company Analysis" },
      { icon: <FaUniversity />, text: "Financial Statements" },
      { icon: <FaChartLine />, text: "Technical Analysis" },
      { icon: <FaUniversity />, text: "Portfolio Management" },
      { icon: <FaUniversity />, text: "Long-term vs Short-term Investing" },
    ],
  },
  {
    title: "Capital Markets & Companies",
    description:
      "Understand how companies raise capital, IPOs, bonds, and corporate strategies. Learn equity vs debt, market dynamics, valuation methods, and regulations to make informed financial decisions.",
    topics: [
      { icon: <FaBuilding />, text: "Capital Market Basics" },
      { icon: <FaBuilding />, text: "Equity & Debt Financing" },
      { icon: <FaBuilding />, text: "IPO Analysis" },
      { icon: <FaBuilding />, text: "Bond Markets" },
      { icon: <FaBuilding />, text: "Regulations & Compliance" },
      { icon: <FaBuilding />, text: "Corporate Financial Strategy" },
    ],
  },
];

const FinancialCourses = () => {
  return (
    <div className="w-full text-white bg-gray-900 overflow-hidden relative">

      {/* Floating Neon Shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 20, -20, 0], rotate: [0, 45, -45, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-40 h-40 rounded-full bg-purple-600 opacity-20 blur-3xl top-20 left-10 z-0"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -30, 30, 0], rotate: [0, 90, -90, 0] }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-60 h-60 rounded-full bg-pink-500 opacity-10 blur-2xl top-96 right-0 z-0"
      />
      <motion.div
        animate={{ y: [0, -40, 0], x: [0, 40, -40, 0], rotate: [0, 180, -180, 0] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl bottom-0 left-20 z-0"
      />

      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] flex flex-col justify-center items-center text-center bg-gradient-to-b from-gray-900 via-gray-800 to-black px-6 overflow-hidden z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4 tracking-wide"
        >
          Financial Mastery Courses
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl text-gray-300 text-lg md:text-xl"
        >
          Learn cryptocurrency, forex, stock market, companies, and capital markets with professional guidance, practical exercises, and AI-powered tools.
        </motion.p>
        <motion.a
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          href="/signup"
          className="mt-8 px-12 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
        >
          Enroll Now
        </motion.a>
      </section>

      {/* COURSES SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Explore Our Courses
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 hover:bg-gray-700 transition relative z-10"
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-2">{course.title}</h3>
              <p className="text-gray-300 mb-4">{course.description}</p>
              <ul className="text-gray-400 list-disc list-inside space-y-2">
                {course.topics.map((topic, i) => (
                  <li key={i} className="flex items-center gap-2 hover:text-purple-300 transition">
                    <span className="text-purple-400">{topic.icon}</span> {topic.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Remaining Sections (Learning Path, Benefits, Testimonials, Statistics, CTA) */}
      {/* Keep all original sections as-is */}
      {/* You can copy all the sections from the previous file after the Courses Section */}
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ value }) => {
  const motionProps = {
    initial: { count: 0 },
    animate: { count: value },
    transition: { duration: 2, ease: "easeOut" },
  };

  return (
    <motion.h3
      {...motionProps}
      className="text-5xl font-extrabold text-purple-400"
    >
      {Math.floor(value)}
    </motion.h3>
  );
};

export default FinancialCourses;
